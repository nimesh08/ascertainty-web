import { cn } from "@/lib/utils/cn";

/**
 * Sticky footer action bar for mobile forms — fixed at the bottom of the
 * viewport on small screens, inline on `md` and up. Pair with page content
 * containing a matching `pb-24 md:pb-0` to avoid overlap.
 */
export function StickyActionBar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg-1/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-2 md:justify-end">
        {children}
      </div>
    </div>
  );
}
