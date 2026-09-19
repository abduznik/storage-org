import Link from "next/link";
import { ContainerWithMetaDTO } from "@/lib/types";

export default function ContainerCard({ container }: { container: ContainerWithMetaDTO }) {
  return (
    <Link
      href={`/c/${container.id}`}
      className="flex gap-3 rounded-lg border border-black/10 dark:border-white/10 p-3 hover:border-black/30 dark:hover:border-white/30 transition-colors"
    >
      <div className="h-16 w-16 shrink-0 rounded-md bg-black/5 dark:bg-white/10 overflow-hidden flex items-center justify-center">
        {container.photo_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/uploads/${container.photo_path}`}
            alt={container.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs font-medium text-black/40 dark:text-white/40 uppercase">
            {container.name.slice(0, 2)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{container.name}</h3>
          {!container.is_owner && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60">
              shared
            </span>
          )}
        </div>
        <p className="text-sm text-black/50 dark:text-white/50">
          ID {container.id} · {container.item_count} item{container.item_count === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}
