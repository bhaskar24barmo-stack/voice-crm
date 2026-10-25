import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import { getPosts, renderMarkdown } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => getPosts().map((p) => ({ slug: p.slug }));

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getPosts().find((x) => x.slug === params.slug);
  if (!p) return {};
  return { title: `${p.title} — Voice CRM`, description: p.description, alternates: { canonical: `/blog/${p.slug}` }, openGraph: { title: p.title, description: p.description, type: "article", publishedTime: p.date } };
}

export default function Post({ params }: { params: { slug: string } }) {
  const p = getPosts().find((x) => x.slug === params.slug);
  if (!p) notFound();
  const ld = { "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.description, datePublished: p.date, mainEntityOfPage: `${SITE_URL}/blog/${p.slug}`, publisher: { "@type": "Organization", name: "Voice CRM" } };
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-5 py-14">
        <a href="/blog" className="text-sm text-accent">← All posts</a>
        <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">{p.title}</h1>
        <p className="mt-2 text-sm text-ink/50">{p.date}</p>
        <article className="prose-post mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
        <div className="mt-12 rounded-2xl bg-ink p-6 text-paper"><p className="font-serif text-xl">Speak it. CRM gets it done.</p><p className="mt-1 text-paper/70">Create an account and tell Voice CRM about your day.</p><a href="/signup" className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-white">Create your account</a></div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </main>
    </>
  );
}
