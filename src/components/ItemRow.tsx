"use client";

import { useState, useRef } from "react";
import { ItemDTO } from "@/lib/types";
import PhotoViewer from "./PhotoViewer";

export default function ItemRow({
  item,
  containerId,
  onUpdate,
  onDelete,
  onPhotoChange,
}: {
  item: ItemDTO;
  containerId: string;
  onUpdate: (fields: Partial<Pick<ItemDTO, "name" | "description" | "quantity">>) => void;
  onDelete: () => void;
  onPhotoChange: (photoPath: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || "");
  const [quantity, setQuantity] = useState(
    item.quantity != null ? String(item.quantity) : ""
  );
  const [uploading, setUploading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function save() {
    setEditing(false);
    onUpdate({
      name: name.trim() || item.name,
      description: description.trim() || null,
      quantity: quantity.trim() === "" ? null : Number(quantity),
    });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/containers/${containerId}/items/${item.id}/photo`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) onPhotoChange(data.photo_path);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const thumbnail = (
    <div className="relative w-12 h-12 shrink-0 rounded-md bg-black/5 dark:bg-white/10 overflow-hidden flex items-center justify-center">
      {item.photo_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/uploads/${item.photo_path}`}
          alt={item.name}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setViewingPhoto(true)}
        />
      ) : (
        <span className="text-[10px] text-black/30 dark:text-white/30">no photo</span>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[9px]">
          ...
        </div>
      )}
      <button
        onClick={() => fileInputRef.current?.click()}
        aria-label="Change item photo"
        title="Change item photo"
        className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
      >
        <svg viewBox="0 0 20 20" fill="none" className="w-2 h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13.5 3.5a1.5 1.5 0 0 1 2 2l-8 8-3 1 1-3 8-8Z" />
        </svg>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoChange}
      />
    </div>
  );

  if (editing) {
    return (
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 flex flex-col gap-2">
        <div className="flex gap-2">
          {thumbnail}
          <div className="flex-1 flex flex-col gap-2">
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
          </div>
        </div>
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
        {viewingPhoto && item.photo_path && (
          <PhotoViewer
            src={`/api/uploads/${item.photo_path}`}
            alt={item.name}
            onClose={() => setViewingPhoto(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        {thumbnail}
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
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-sm px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          aria-label="Remove item"
          title="Remove item"
          className="flex items-center justify-center w-7 h-7 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      </div>
      {viewingPhoto && item.photo_path && (
        <PhotoViewer
          src={`/api/uploads/${item.photo_path}`}
          alt={item.name}
          onClose={() => setViewingPhoto(false)}
        />
      )}
    </div>
  );
}
