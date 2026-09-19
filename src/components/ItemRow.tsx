"use client";

import { useState } from "react";
import { ItemDTO } from "@/lib/types";

export default function ItemRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: ItemDTO;
  onUpdate: (fields: Partial<Pick<ItemDTO, "name" | "description" | "quantity">>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || "");
  const [quantity, setQuantity] = useState(
    item.quantity != null ? String(item.quantity) : ""
  );

  function save() {
    setEditing(false);
    onUpdate({
      name: name.trim() || item.name,
      description: description.trim() || null,
      quantity: quantity.trim() === "" ? null : Number(quantity),
    });
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            autoFocus
          />
          <input
            className="w-20 rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
            inputMode="numeric"
          />
        </div>
        <input
          className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setEditing(false)}
            className="text-sm px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="text-sm px-2 py-1 rounded-md bg-black text-white dark:bg-white dark:text-black"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 flex items-center justify-between gap-2 group">
      <div className="min-w-0">
        <p className="font-medium truncate">
          {item.name}
          {item.quantity != null && (
            <span className="text-black/50 dark:text-white/50 font-normal"> × {item.quantity}</span>
          )}
        </p>
        {item.description && (
          <p className="text-sm text-black/50 dark:text-white/50 truncate">{item.description}</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="text-sm px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-sm px-2 py-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
