import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-0 text-sm font-medium transition-[transform,background-color,color,box-shadow,opacity] duration-140 ease-[var(--ease-out-snappy)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/40 focus-visible:ring-[3px] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-950/85 hover:bg-zinc-900/95 text-white backdrop-blur-xl shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] dark:bg-white/90 dark:hover:bg-white dark:text-zinc-950 dark:shadow-[0_4px_20px_-2px_rgba(255,255,255,0.18),inset_0_1px_1.5px_rgba(255,255,255,1)]",
        destructive:
          "bg-rose-600/90 hover:bg-rose-600 text-white backdrop-blur-xl shadow-[0_4px_16px_-2px_rgba(225,29,72,0.32),inset_0_1px_1px_rgba(255,255,255,0.35)] dark:bg-rose-500/85 dark:hover:bg-rose-500",
        outline:
          "bg-white/70 hover:bg-white/90 text-zinc-700 hover:text-zinc-950 backdrop-blur-xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.85)] dark:bg-white/[0.06] dark:hover:bg-white/[0.11] dark:text-zinc-200 dark:hover:text-white dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.14)]",
        secondary:
          "bg-zinc-200/45 hover:bg-zinc-200/70 text-zinc-800 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:bg-white/[0.07] dark:hover:bg-white/[0.12] dark:text-zinc-200 dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14)]",
        ghost:
          "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/45 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.07]",
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3.5",
        sm: "h-8 rounded-full gap-1.5 px-3.5 text-xs has-[>svg]:px-2.5",
        lg: "h-10 rounded-full px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-full",
        "icon-sm": "size-8 rounded-full",
        "icon-lg": "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
