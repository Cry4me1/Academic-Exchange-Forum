"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 border-0",
        "data-[orientation=horizontal]:h-[1px] data-[orientation=horizontal]:w-full data-[orientation=horizontal]:bg-gradient-to-r data-[orientation=horizontal]:from-transparent data-[orientation=horizontal]:via-zinc-200/80 dark:data-[orientation=horizontal]:via-zinc-800/80 data-[orientation=horizontal]:to-transparent",
        "data-[orientation=vertical]:w-[1px] data-[orientation=vertical]:h-full data-[orientation=vertical]:bg-gradient-to-b data-[orientation=vertical]:from-transparent data-[orientation=vertical]:via-zinc-300/80 dark:data-[orientation=vertical]:via-zinc-700/60 data-[orientation=vertical]:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
