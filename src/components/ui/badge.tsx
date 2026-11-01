import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border-0 px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-ring/40 focus-visible:ring-[3px] transition-all duration-300 overflow-hidden backdrop-blur-md",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900/85 text-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.35)] dark:bg-white/90 dark:text-zinc-950 dark:shadow-[0_2px_10px_-2px_rgba(255,255,255,0.15),inset_0_1px_0.5px_rgba(255,255,255,0.9)] [a&]:hover:opacity-90",
        secondary:
          "bg-zinc-200/55 text-zinc-700 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:bg-white/[0.08] dark:text-zinc-300 dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] [a&]:hover:bg-zinc-200/80 dark:[a&]:hover:bg-white/[0.12]",
        destructive:
          "bg-rose-500/15 text-rose-600 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:bg-rose-500/20 dark:text-rose-300 dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)]",
        outline:
          "bg-white/65 text-zinc-700 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:bg-white/[0.06] dark:text-zinc-300 dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)] [a&]:hover:bg-white/90 dark:[a&]:hover:bg-white/[0.1]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
