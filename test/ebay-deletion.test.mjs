import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { challenge, receive, ebayPublicKeys } from '../src/lib/ebay-deletion.ts';

const env = { EBAY_DELETION_VERIFICATION_TOKEN: 'a'.repeat(64),
  EBAY_DELETION_ENDPOINT: 'https://www.flipbot.me/api/ebay/account-deletion',
  EBAY_DELETION_PROCESSOR_READY: 'true' };
const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pem = publicKey.export({ type: 'spki', format: 'pem' });
const message = { metadata: { topic: 'MARKETPLACE_ACCOUNT_DELETION', schemaVersion: '1.0' },
  notification: { notificationId: 'test-event', eventDate: '2026-10-14T12:00:00Z',
    data: { userId: 'ebay-user-123', username: 'test-seller' } } };
function request(body = message, tamper = false) {
  const signature = sign('sha1', Buffer.from(JSON.stringify(body)), privateKey).toString('base64');
  return new Request(env.EBAY_DELETION_ENDPOINT, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ebay-signature': Buffer.from(JSON.stringify({ kid: 'test-key', signature })).toString('base64') },
    body: JSON.stringify(tamper ? { ...body, tampered: true } : body) });
}
test('challenge binds token and exact registered URL, returns noncached JSON', async () => {
  const response = challenge(new Request(`${env.EBAY_DELETION_ENDPOINT}?challenge_code=123`), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { challengeResponse: createHash('sha256').update('123' + env.EBAY_DELETION_VERIFICATION_TOKEN + env.EBAY_DELETION_ENDPOINT).digest('hex') });
});
test('unready processor cannot pass eBay registration', () => {
  assert.equal(challenge(new Request(`${env.EBAY_DELETION_ENDPOINT}?challenge_code=123`), { ...env, EBAY_DELETION_PROCESSOR_READY: undefined }).status, 503);
});
test('missing challenge and invalid configuration fail', () => {
  assert.equal(challenge(new Request(env.EBAY_DELETION_ENDPOINT), env).status, 400);
  assert.equal(challenge(new Request(env.EBAY_DELETION_ENDPOINT), { ...env, EBAY_DELETION_VERIFICATION_TOKEN: 'short' }).status, 503);
});
test('valid eBay-protocol EC signature reaches processor before acknowledgement', async () => {
  let processed = false;
  const response = await receive(request(), { publicKey: async () => pem, process: async notice => {
    assert.equal(notice.userId, 'ebay-user-123'); processed = true;
  } });
  assert.equal(response.status, 204); assert.equal(processed, true);
});
test('tampered notification never reaches deletion processor', async () => {
  const response = await receive(request(message, true), { publicKey: async () => pem, process: async () => assert.fail('must not process') });
  assert.equal(response.status, 412);
});
test('wrong topic is rejected after authentication', async () => {
  const response = await receive(request({ ...message, metadata: { ...message.metadata, topic: 'OTHER' } }), {
    publicKey: async () => pem, process: async () => assert.fail('must not process') });
  assert.equal(response.status, 400);
});
test('processor failure is retryable and never acknowledged as deletion', async () => {
  const response = await receive(request(), { publicKey: async () => pem, process: async () => { throw Error('storage down'); } });
  assert.equal(response.status, 503);
});
test('key lookup outage is retryable', async () => {
  const response = await receive(request(), { publicKey: async () => { throw Error('API down'); }, process: async () => assert.fail() });
  assert.equal(response.status, 503);
});
test('body cap covers chunked requests', async () => {
  const req = request();
  const oversized = new Request(req.url, { method: 'POST', headers: req.headers, body: ' '.repeat(65537) });
  assert.equal((await receive(oversized, { publicKey: async () => assert.fail(), process: async () => assert.fail() })).status, 413);
});
test('public keys and application token are reused within their expiry', async () => {
  const urls = [];
  const lookup = ebayPublicKeys({ EBAY_CLIENT_ID: 'test-id', EBAY_CLIENT_SECRET: 'test-secret' }, async url => {
    urls.push(url);
    return Response.json(String(url).includes('/oauth2/') ? { access_token: 'test-token', expires_in: 7200 } : { key: pem });
  });
  assert.equal(await lookup('key-one'), pem); assert.equal(await lookup('key-one'), pem);
  assert.equal(await lookup('key-two'), pem); assert.equal(urls.length, 3);
});
