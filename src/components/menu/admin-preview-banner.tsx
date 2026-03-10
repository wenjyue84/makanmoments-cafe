"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface AdminPreviewBannerProps {
  currentTime: string;
  previewTime: string | null;
}

function formatPreviewTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function AdminPreviewBanner({ currentTime, previewTime }: AdminPreviewBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleTimeChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("previewTime", value);
    } else {
      params.delete("previewTime");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
      <span className="text-base">✎</span>
      <span className="flex-1 min-w-0">
        <strong>Edit mode</strong>
        {previewTime
          ? ` — Previewing menu at ${formatPreviewTime(previewTime)}`
          : ` — Showing customer view at current time (${currentTime})`}
        . Hover any item to edit its image, description, or price.
      </span>
      <label className="flex items-center gap-2 text-xs font-medium shrink-0">
        Preview as time:
        <input
          type="time"
          value={previewTime ?? ""}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="rounded border border-amber-300 bg-white px-2 py-0.5 text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-200"
        />
      </label>
      {previewTime && (
        <button
          type="button"
          onClick={() => handleTimeChange("")}
          className="shrink-0 rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-200 dark:hover:bg-amber-700"
        >
          Reset
        </button>
      )}
    </div>
  );
}
