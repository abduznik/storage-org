"use client";

import { useState } from "react";

export default function AddItemForm({
  onAdd,
}: {
  onAdd: (input: { name: string; description: string; quantity: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const ok = await onAdd({ name, description, quantity });
      if (ok) {
        setName("");
        setDescription("");
        setQuantity("");
        setExpanded(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          placeholder="Add item (e.g. Bolt 3M)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setExpanded(true)}
        />
        {expanded && (
          <input
            className="w-20 rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="numeric"
          />
        )}
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 font-medium disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {expanded && (
        <input
          className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      )}
    </form>
  );
}
