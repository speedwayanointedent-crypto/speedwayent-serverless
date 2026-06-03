import React from "react";

type SearchOpts = {
  fields: string[];
  caseSensitive?: boolean;
};

export type SearchResult<T> = { item: T; score: number; indices: [number, number][] };

function get(obj: any, path: string): any {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function scoreText(text: string, query: string, indices: [number, number][]) {
  if (!text || !query) return 0;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 1;
  if (t.startsWith(q)) return 0.9;
  const words = t.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    if (words[i].startsWith(q)) {
      const start = words.slice(0, i).join(" ").length + (i ? 1 : 0);
      indices.push([start, start + q.length]);
      return 0.8;
    }
  }
  const idx = t.indexOf(q);
  if (idx >= 0) {
    indices.push([idx, idx + q.length]);
    return 0.6;
  }
  return 0;
}

export function search<T>(data: T[], query: string, opts: SearchOpts): SearchResult<T>[] {
  if (!query || !data?.length) return [];
  const { fields, caseSensitive } = opts;
  const q = caseSensitive ? query : query.toLowerCase();
  const results: SearchResult<T>[] = [];
  for (const item of data) {
    let bestScore = 0;
    const indices: [number, number][] = [];
    for (const f of fields) {
      const raw = get(item, f);
      if (raw == null) continue;
      const indicesForField: [number, number][] = [];
      const sc = scoreText(String(raw), q, indicesForField);
      if (sc > bestScore) bestScore = sc;
      indices.push(...indicesForField);
    }
    if (bestScore > 0) results.push({ item, score: bestScore, indices });
  }
  return results.sort((a, b) => b.score - a.score);
}

export function searchProducts<T>(data: T[], q: string) {
  return search(data, q, { fields: ["name", "categories.name", "brands.name", "models.name", "description"] });
}
export function searchSales<T>(data: T[], q: string) {
  return search(data, q, { fields: ["product_name", "note"] });
}
export function searchInventory<T>(data: T[], q: string) {
  return search(data, q, { fields: ["name", "categories.name", "brands.name"] });
}

export function highlightMatch(text: string, query: string, className = "bg-primary/20 text-primary rounded px-0.5"): React.ReactNode {
  if (!text || !query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className={className}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
