"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContainerWithMetaDTO } from "@/lib/types";
import { Container } from "@/lib/containers";
import ContainerCard from "./ContainerCard";
import ContainerPicker from "./ContainerPicker";

type Mode = null | "create" | "import";

export default function ChildContainers({
  parentId,
  children,
}: {
  parentId: string;
  children: ContainerWithMetaDTO[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/containers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), parent_container_id: parentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create container.");
        return;
      }
      setName("");
      setMode(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleImport(container: Container) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/containers/${container.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_container_id: parentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not import container.");
        return;
      }
      setMode(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-sm font-medium text-black/50 dark:text-white/50">
          Nested containers ({children.length})
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setMode(mode === "create" ? null : "create")}
            className="text-sm text-black/60 dark:text-white/60 hover:underline"
          >
            {mode === "create" ? "Cancel" : "+ Add nested container"}
          </button>
          <button
            onClick={() => setMode(mode === "import" ? null : "import")}
            className="text-sm text-black/60 dark:text-white/60 hover:underline"
          >
            {mode === "import" ? "Cancel" : "Import existing container"}
          </button>
        </div>
      </div>

      {mode === "create" && (
        <form onSubmit={handleCreate} className="flex gap-2 mb-3">
          <input
            autoFocus
            className="flex-1 rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
            placeholder="e.g. Small parts box"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-medium disabled:opacity-50"
          >
            Create
          </button>
        </form>
      )}

      {mode === "import" && (
        <div className="mb-3">
          <p className="text-sm text-black/60 dark:text-white/60 mb-2">
            Attach an existing container as a child here. It brings all of its own items and
            nested containers with it.
          </p>
          <ContainerPicker
            excludeContainerId={parentId}
            placeholder="Search your containers by name or ID..."
            onSelect={handleImport}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {children.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {children.map((c) => (
            <ContainerCard key={c.id} container={c} />
          ))}
        </div>
      ) : (
        !mode && <p className="text-sm text-black/50">No nested containers.</p>
      )}
    </div>
  );
}
