import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-zinc-400 dark:placeholder:text-zinc-500 flex field-sizing-content min-h-20 w-full rounded-2xl border-0 px-4 py-3 text-base md:text-sm outline-none transition-all duration-300 backdrop-blur-md",
        "bg-zinc-200/45 hover:bg-zinc-200/60 focus-visible:bg-white/90 text-zinc-900",
        "dark:bg-white/[0.05] dark:hover:bg-white/[0.08] dark:focus-visible:bg-zinc-900/80 dark:text-zinc-100",
        "shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.1)]",
        "focus-visible:shadow-[0_4px_20px_-4px_rgba(14,165,233,0.16),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:focus-visible:shadow-[0_4px_20px_-4px_rgba(14,165,233,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.2)]",
        "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:shadow-[0_0_0_2px_rgba(244,63,94,0.25)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
