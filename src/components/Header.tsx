import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          📦 Storage Organizer
        </Link>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-black/60 dark:text-white/60">{user.username}</span>
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  );
}
