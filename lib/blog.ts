import fs from "fs";
import path from "path";

export type Post = { slug: string; title: string; description: string; date: string; body: string };
const dir = path.join(process.cwd(), "content", "blog");

export function getPosts(): Post[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const meta: Record<string, string> = {};
    (m?.[1] || "").split("\n").forEach((l) => { const i = l.indexOf(":"); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
    return { slug: f.replace(/\.md$/, ""), title: meta.title || f, description: meta.description || "", date: meta.date || "2026-01-01", body: m?.[2] || raw };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, '<a href="$2">$1</a>');

// Tiny, safe markdown renderer: ##/### headings, lists, paragraphs, **bold**, links.
export function renderMarkdown(md: string): string {
  const out: string[] = []; let list = false;
  const close = () => { if (list) { out.push("</ul>"); list = false; } };
  for (const line of md.split("\n")) {
    if (/^### /.test(line)) { close(); out.push(`<h3>${inline(line.slice(4))}</h3>`); }
    else if (/^## /.test(line)) { close(); out.push(`<h2>${inline(line.slice(3))}</h2>`); }
    else if (/^- /.test(line)) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${inline(line.slice(2))}</li>`); }
    else if (line.trim() === "") close();
    else { close(); out.push(`<p>${inline(line)}</p>`); }
  }
  close(); return out.join("\n");
}
