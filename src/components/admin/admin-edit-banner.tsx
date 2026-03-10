"use client";

import { useRouter, usePathname } from "next/navigation";

interface AdminEditBannerProps {
  previewTime: string | null;
  currentTimeString: string;
}

function formatPreviewTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function AdminEditBanner({ previewTime, currentTimeString }: AdminEditBannerProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    router.push(val ? `${pathname}?previewTime=${encodeURIComponent(val)}` : pathname);
  }

  const displayTime = previewTime ? formatPreviewTime(previewTime) : currentTimeString;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
      <span className="text-base">✎</span>
      <span>
        <strong>Edit mode</strong> — hover any item to edit. Showing customer view at{" "}
        <strong>{displayTime}</strong>.
      </span>
      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs font-medium">
          Preview as:
          <input
            type="time"
            defaultValue={previewTime ?? ""}
            onChange={handleTimeChange}
            className="rounded border border-amber-400/50 bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          />
        </label>
        {previewTime && (
          <button
            onClick={() => router.push(pathname)}
            className="rounded px-1.5 py-0.5 text-xs underline hover:no-underline"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
