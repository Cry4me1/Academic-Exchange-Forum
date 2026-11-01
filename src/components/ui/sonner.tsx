"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "!border-0 !rounded-2xl !bg-white/85 dark:!bg-zinc-900/85 !backdrop-blur-2xl !text-foreground !shadow-[0_12px_40px_-4px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:!shadow-[0_12px_40px_-4px_rgba(0,0,0,0.65),inset_0_1px_0.5px_rgba(255,255,255,0.16)] !px-4 !py-3 !font-medium",
          description: "!text-muted-foreground !text-xs",
          actionButton:
            "!rounded-full !border-0 !bg-zinc-950 dark:!bg-white !text-white dark:!text-zinc-950 !font-medium !text-xs !shadow-sm",
          cancelButton:
            "!rounded-full !border-0 !bg-zinc-200/50 dark:!bg-white/[0.08] !text-muted-foreground !font-medium !text-xs",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-500" />,
        info: <InfoIcon className="size-4 text-sky-500" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        error: <OctagonXIcon className="size-4 text-rose-500" />,
        loading: <Loader2Icon className="size-4 animate-spin text-primary" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
