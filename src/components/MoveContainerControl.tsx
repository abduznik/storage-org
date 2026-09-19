"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/lib/containers";
import ContainerPicker from "./ContainerPicker";

export default function MoveContainerControl({
  containerId,
  currentParentId,
}: {
  containerId: string;
  currentParentId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMove(newParentId: string | null) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/containers/${containerId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_container_id: newParentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not move container.");
        return;
      }
      setOpen(false);
      router.push(newParentId ? `/c/${newParentId}` : "/");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-black/60 dark:text-white/60 hover:underline"
        >
          Move this container...
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-black/60 dark:text-white/60">
            Move this container (with all its contents) into another container, or move it to the
            top level.
          </p>
          <ContainerPicker
            excludeContainerId={containerId}
            placeholder="Search containers by name or ID..."
            onSelect={(c: Container) => handleMove(c.id)}
          />
          <div className="flex gap-2">
            {currentParentId && (
              <button
                disabled={saving}
                onClick={() => handleMove(null)}
                className="text-sm text-black/60 dark:text-white/60 hover:underline"
              >
                Move to top level
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-black/60 dark:text-white/60 hover:underline ml-auto"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
