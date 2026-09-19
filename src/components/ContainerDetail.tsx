"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ContainerDTO,
  ContainerWithMetaDTO,
  ItemDTO,
} from "@/lib/types";
import { BreadcrumbEntry, ShareInfo } from "@/lib/containers";
import ItemRow from "./ItemRow";
import AddItemForm from "./AddItemForm";
import ChildContainers from "./ChildContainers";
import SharePanel from "./SharePanel";
import MoveContainerControl from "./MoveContainerControl";

const POLL_INTERVAL_MS = 5000;

export default function ContainerDetail({
  container,
  items: initialItems,
  children: initialChildren,
  breadcrumbs,
  isOwner,
  shares: initialShares,
}: {
  container: ContainerDTO;
  items: ItemDTO[];
  children: ContainerWithMetaDTO[];
  breadcrumbs: BreadcrumbEntry[];
  isOwner: boolean;
  shares: ShareInfo[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [children, setChildren] = useState(initialChildren);
  const [name, setName] = useState(container.name);
  const [editingName, setEditingName] = useState(false);
  const [photoPath, setPhotoPath] = useState(container.photo_path);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll for changes made by other users/devices viewing the same
  // container, so everyone stays in sync without a manual refresh.
  const editingNameRef = useRef(editingName);
  editingNameRef.current = editingName;
  const uploadingRef = useRef(uploading);
  uploadingRef.current = uploading;

  const pollForUpdates = useCallback(async () => {
    if (document.hidden) return;
    try {
      const res = await fetch(`/api/containers/${container.id}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items);
      setChildren(data.children);
      if (!editingNameRef.current) setName(data.container.name);
      if (!uploadingRef.current) setPhotoPath(data.container.photo_path);
    } catch {
      // Transient network errors are ignored; the next tick will retry.
    }
  }, [container.id]);

  useEffect(() => {
    const interval = setInterval(pollForUpdates, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pollForUpdates]);

  async function handleSaveName() {
    setEditingName(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === container.name) {
      setName(container.name);
      return;
    }
    await fetch(`/api/containers/${container.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    router.refresh();
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/containers/${container.id}/photo`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      setPhotoPath(data.photo_path);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAddItem(input: {
    name: string;
    description: string;
    quantity: string;
  }) {
    const res = await fetch(`/api/containers/${container.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => [...prev, data.item].sort((a, b) => a.name.localeCompare(b.name)));
    }
    return res.ok;
  }

  async function handleUpdateItem(
    itemId: number,
    fields: Partial<Pick<ItemDTO, "name" | "description" | "quantity">>
  ) {
    const res = await fetch(`/api/containers/${container.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => prev.map((it) => (it.id === itemId ? data.item : it)));
    }
  }

  async function handleDeleteItem(itemId: number) {
    const res = await fetch(`/api/containers/${container.id}/items/${itemId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    }
  }

  async function handleDeleteContainer() {
    if (
      !confirm(
        `Delete container "${container.name}" and all its items/nested containers? This cannot be undone.`
      )
    )
      return;
    const res = await fetch(`/api/containers/${container.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push(container.parent_container_id ? `/c/${container.parent_container_id}` : "/");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 flex flex-col gap-6">
      <nav className="text-sm text-black/50 dark:text-white/50 flex flex-wrap items-center gap-1">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        {breadcrumbs.map((b) => (
          <span key={b.id} className="flex items-center gap-1">
            <span>/</span>
            {b.id === container.id ? (
              <span className="text-black dark:text-white">{b.name}</span>
            ) : (
              <Link href={`/c/${b.id}`} className="hover:underline">
                {b.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex gap-4 items-start">
        <div
          className="h-28 w-28 shrink-0 rounded-lg bg-black/5 dark:bg-white/10 overflow-hidden flex items-center justify-center cursor-pointer relative"
          onClick={() => fileInputRef.current?.click()}
        >
          {photoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/uploads/${photoPath}`}
              alt={container.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-medium text-black/40 dark:text-white/40 uppercase">
              {container.name.slice(0, 2)}
            </span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
              Uploading...
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-0.5">
            change photo
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              className="text-2xl font-semibold w-full bg-transparent border-b border-black/20 dark:border-white/20 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") {
                  setName(container.name);
                  setEditingName(false);
                }
              }}
            />
          ) : (
            <h1
              className="text-2xl font-semibold cursor-text"
              onClick={() => setEditingName(true)}
              title="Click to rename"
            >
              {name}
            </h1>
          )}
          <p className="text-sm text-black/50 dark:text-white/50 mt-1">
            ID {container.id}
          </p>
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

          <div className="flex flex-wrap gap-2 mt-3">
            <a
              href={`/api/containers/${container.id}/label`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm rounded-md border border-black/15 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Print label
            </a>
            <a
              href={`/api/containers/${container.id}/label`}
              download={`container-${container.id}-label.png`}
              className="text-sm rounded-md border border-black/15 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Download label
            </a>
            <a
              href={`/api/containers/${container.id}/qr`}
              download={`container-${container.id}-qr.png`}
              className="text-sm rounded-md border border-black/15 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
            >
              QR only
            </a>
            {isOwner && (
              <button
                onClick={handleDeleteContainer}
                className="text-sm rounded-md border border-red-300 text-red-600 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {isOwner && (
        <MoveContainerControl
          containerId={container.id}
          currentParentId={container.parent_container_id}
        />
      )}

      <ChildContainers
        parentId={container.id}
        children={children}
      />

      <div>
        <h2 className="text-sm font-medium text-black/50 dark:text-white/50 mb-2">
          Items ({items.length})
        </h2>
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onUpdate={(fields) => handleUpdateItem(item.id, fields)}
              onDelete={() => handleDeleteItem(item.id)}
            />
          ))}
          {items.length === 0 && (
            <p className="text-sm text-black/50">No items yet.</p>
          )}
        </div>
        <div className="mt-3">
          <AddItemForm onAdd={handleAddItem} />
        </div>
      </div>

      {isOwner && <SharePanel containerId={container.id} initialShares={initialShares} />}
    </div>
  );
}
