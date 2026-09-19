"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ContainerWithMetaDTO, ItemDTO } from "@/lib/types";
import ContainerCard from "./ContainerCard";

export default function Dashboard({
  initialContainers,
}: {
  initialContainers: ContainerWithMetaDTO[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    containers: ContainerWithMetaDTO[];
    items: (ItemDTO & { container_name: string })[];
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create container.");
        return;
      }
      router.push(`/c/${data.container.id}`);
    } finally {
      setCreating(false);
    }
  }

  const isSearchMode = query.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 flex flex-col gap-6">
      <div>
        <input
          type="text"
          placeholder="Search by name or ID (e.g. &quot;bolt 3m&quot; or &quot;11111&quot;)"
          className="w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-4 py-2.5"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isSearchMode ? (
        <div className="flex flex-col gap-4">
          {searching && <p className="text-sm text-black/50">Searching...</p>}
          {searchResults && (
            <>
              {searchResults.containers.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-black/50 dark:text-white/50 mb-2">
                    Containers
                  </h2>
                  <div className="flex flex-col gap-2">
                    {searchResults.containers.map((c) => (
                      <ContainerCard key={c.id} container={c} />
                    ))}
                  </div>
                </div>
              )}
              {searchResults.items.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-black/50 dark:text-white/50 mb-2">
                    Items
                  </h2>
                  <div className="flex flex-col gap-2">
                    {searchResults.items.map((item) => (
                      <a
                        key={item.id}
                        href={`/c/${item.container_id}`}
                        className="flex items-center justify-between rounded-lg border border-black/10 dark:border-white/10 p-3 hover:border-black/30 dark:hover:border-white/30 transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            {item.name}
                            {item.quantity != null && (
                              <span className="text-black/50 dark:text-white/50 font-normal">
                                {" "}
                                × {item.quantity}
                              </span>
                            )}
                          </p>
                          {item.description && (
                            <p className="text-sm text-black/50 dark:text-white/50">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-black/40 dark:text-white/40">
                          in {item.container_name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.containers.length === 0 &&
                searchResults.items.length === 0 &&
                !searching && (
                  <p className="text-sm text-black/50">No matches found.</p>
                )}
            </>
          )}
        </div>
      ) : (
        <>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              placeholder="New container name (e.g. Garage shelf A)"
              className="flex-1 rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-medium disabled:opacity-50"
            >
              {creating ? "Creating..." : "+ New"}
            </button>
          </form>
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <h2 className="text-sm font-medium text-black/50 dark:text-white/50 mb-2">
              Your containers
            </h2>
            {initialContainers.length === 0 ? (
              <p className="text-sm text-black/50">
                No containers yet. Create one above to get started.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {initialContainers.map((c) => (
                  <ContainerCard key={c.id} container={c} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
