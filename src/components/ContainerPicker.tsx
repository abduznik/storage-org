"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Container } from "@/lib/containers";

export default function ContainerPicker({
  excludeContainerId,
  placeholder,
  onSelect,
}: {
  excludeContainerId?: string;
  placeholder: string;
  onSelect: (container: Container) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Container[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(
    async (q: string) => {
      const params = new URLSearchParams({ q });
      if (excludeContainerId) params.set("exclude", excludeContainerId);
      const res = await fetch(`/api/containers/picker?${params.toString()}`);
      const data = await res.json();
      setResults(data.containers || []);
    },
    [excludeContainerId]
  );

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => runSearch(query), 200);
    return () => clearTimeout(t);
  }, [query, open, runSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          setOpen(true);
          runSearch(query);
        }}
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black shadow-lg">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelect(c);
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between gap-2"
            >
              <span className="truncate">{c.name}</span>
              <span className="text-xs text-black/50 dark:text-white/50 shrink-0">
                ID {c.id}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black shadow-lg px-3 py-2 text-sm text-black/50 dark:text-white/50">
          No matches.
        </div>
      )}
    </div>
  );
}
