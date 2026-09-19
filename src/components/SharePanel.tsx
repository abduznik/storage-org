"use client";

import { useState, useEffect, useRef } from "react";
import { ShareInfo } from "@/lib/containers";

interface UserOption {
  id: number;
  username: string;
}

export default function SharePanel({
  containerId,
  initialShares,
}: {
  containerId: string;
  initialShares: ShareInfo[];
}) {
  const [shares, setShares] = useState(initialShares);
  const [username, setUsername] = useState("");
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setAllUsers(data.users || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sharedIds = new Set(shares.map((s) => s.user_id));
  const suggestions = allUsers.filter(
    (u) =>
      !sharedIds.has(u.id) &&
      u.username.toLowerCase().includes(username.trim().toLowerCase())
  );

  async function shareWith(targetUsername: string) {
    if (!targetUsername.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/containers/${containerId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not share.");
        return;
      }
      setShares((prev) => [...prev, { user_id: data.user_id, username: targetUsername.trim() }]);
      setUsername("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleUnshare(userId: number) {
    await fetch(`/api/containers/${containerId}/share`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    setShares((prev) => prev.filter((s) => s.user_id !== userId));
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
      <h2 className="text-sm font-medium text-black/50 dark:text-white/50 mb-2">
        Shared with
      </h2>
      {shares.length > 0 ? (
        <ul className="flex flex-col gap-1 mb-3">
          {shares.map((s) => (
            <li key={s.user_id} className="flex items-center justify-between text-sm">
              <span>{s.username}</span>
              <button
                onClick={() => handleUnshare(s.user_id)}
                className="text-red-600 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-black/50 mb-3">Not shared with anyone yet.</p>
      )}
      <div ref={containerRef} className="relative flex gap-2">
        <div className="flex-1 relative">
          <input
            className="w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm"
            placeholder="Username to share with"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                shareWith(username);
              }
            }}
          />
          {open && username.trim() && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black shadow-lg">
              {suggestions.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => shareWith(u.username)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {u.username}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={saving || !username.trim()}
          onClick={() => shareWith(username)}
          className="text-sm rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2 font-medium disabled:opacity-50"
        >
          Share
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
