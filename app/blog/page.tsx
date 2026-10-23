import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { getPosts } from "@/lib/blog";

export const metadata: Metadata = { title: "Blog — Voice CRM", description: "Practical guides on CRM habits, follow-ups, and capturing customer conversations faster.", alternates: { canonical: "/blog" } };

export default function Blog() {
  const posts = getPosts();
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="font-serif text-4xl font-semibold sm:text-5xl">The Voice CRM blog</h1>
        <p className="mt-3 text-lg text-ink/70">Practical ways to keep customer records up to date without the busywork.</p>
        <ul className="mt-10 space-y-5">
          {posts.map((p) => (
            <li key={p.slug}><a href={`/blog/${p.slug}`} className="spot block rounded-2xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-0.5">
              <p className="text-xs text-ink/50">{p.date}</p>
              <h2 className="mt-1 text-xl font-semibold">{p.title}</h2>
              <p className="mt-2 text-ink/70">{p.description}</p>
            </a></li>
          ))}
        </ul>
      </main>
    </>
  );
}
