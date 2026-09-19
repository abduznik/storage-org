"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-3 py-1.5 rounded-md border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
    >
      Sign out
    </button>
  );
}
