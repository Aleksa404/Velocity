import { cn } from "@/lib/utils";

export function VideoShell({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10 dark:ring-white/5 z-10",
                className
            )}
        >
            {children}
        </div>
    );
}