import Link from "next/link";
import { notFound } from "next/navigation";

import { policyDocuments, type PolicyId } from "@/lib/flipbot-copy";

const publicPolicies = new Set<PolicyId>(["privacy", "cookies", "terms", "acceptable-use", "subscriptions"]);

export default async function LegalPolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  if (!publicPolicies.has(policy as PolicyId)) notFound();
  const document = policyDocuments[policy as PolicyId];

  return (
    <main className="min-h-screen bg-[#020308] px-4 py-10 text-white sm:py-16">
      <article className="mx-auto max-w-4xl rounded-[28px] border border-white/[0.08] bg-[#060912] p-6 shadow-2xl sm:p-10">
        <Link href="/" className="text-sm font-semibold text-blue-300 hover:text-white">← Back to Flipbot</Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{document.title}</h1>
        <p className="mt-4 leading-7 text-slate-400">{document.description}</p>
        <p className="mt-3 text-xs text-slate-500">{document.updated}</p>
        {document.draftNote ? <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/[0.07] p-4 text-sm leading-6 text-amber-50/80"><strong className="block text-amber-100">Draft—details still required</strong>{document.draftNote}</div> : null}
        <div className="mt-10 space-y-9">
          {document.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="mt-3 space-y-3">{section.paragraphs.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-slate-400">{paragraph}</p>)}</div>
              {section.bullets ? <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-400">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
