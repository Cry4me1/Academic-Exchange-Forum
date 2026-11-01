"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { LayoutGroup, motion, useReducedMotion } from "framer-motion"

import { MOTION_SPRINGS, trackPointer120fps } from "@/lib/motion-tokens"
import { cn } from "@/lib/utils"

interface TabsRootContextValue {
  activeValue: string | undefined
}

const TabsRootContext = React.createContext<TabsRootContextValue>({
  activeValue: undefined,
})

interface TabsListContextValue {
  pillLayoutId: string
  indicatorClassName?: string
  pillRadius: number
}

const TabsListContext = React.createContext<TabsListContextValue | null>(null)

function Tabs({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    string | undefined
  >(defaultValue)

  const isControlled = value !== undefined
  const activeValue = isControlled ? value : uncontrolledValue

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue)
      }
      onValueChange?.(nextValue)
    },
    [isControlled, onValueChange]
  )

  const contextValue = React.useMemo(() => ({ activeValue }), [activeValue])

  return (
    <TabsRootContext.Provider value={contextValue}>
      <TabsPrimitive.Root
        data-slot="tabs"
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        className={cn("flex flex-col gap-2", className)}
        {...props}
      />
    </TabsRootContext.Provider>
  )
}

interface TabsListProps
  extends React.ComponentProps<typeof TabsPrimitive.List> {
  /** 自定义液态流体滑块的光学材质类名（例如琥珀金微光晕） */
  indicatorClassName?: string
  /** 流体胶囊物理圆角半径（默认 9999 水滴全圆角，供 Framer Motion 投影逆向防畸变校正） */
  pillRadius?: number
}

function TabsList({
  className,
  indicatorClassName,
  pillRadius = 9999,
  onMouseMove,
  children,
  ...props
}: TabsListProps) {
  const listId = React.useId()
  const pillLayoutId = `${listId}-fluid-pill`

  const listContextValue = React.useMemo(
    () => ({
      pillLayoutId,
      indicatorClassName,
      pillRadius,
    }),
    [pillLayoutId, indicatorClassName, pillRadius]
  )

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      trackPointer120fps(e)
      onMouseMove?.(e)
    },
    [onMouseMove]
  )

  return (
    <TabsListContext.Provider value={listContextValue}>
      <LayoutGroup id={listId}>
        <TabsPrimitive.List
          data-slot="tabs-list"
          onMouseMove={handleMouseMove}
          className={cn(
            "group/tabs-list relative isolate inline-flex h-10 w-fit items-center justify-center rounded-full border-0 p-1 text-zinc-500 dark:text-zinc-400 backdrop-blur-2xl",
            "bg-zinc-200/55 dark:bg-white/[0.06]",
            "shadow-[inset_0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.8)]",
            "dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.1)]",
            "[--tabs-reflex:rgba(255,255,255,0.48)] dark:[--tabs-reflex:rgba(255,255,255,0.07)]",
            className
          )}
          {...props}
        >
          {/* 120fps 光随鼠动纯白环境漫反射层（仅精细指针设备激活，直接写 DOM 变量零重绘） */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 hidden rounded-[inherit] opacity-0 transition-opacity duration-200 ease-[var(--ease-out-snappy)] group-hover/tabs-list:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:block"
            style={{
              background:
                "radial-gradient(120px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--tabs-reflex), transparent 80%)",
            }}
          />
          {children}
        </TabsPrimitive.List>
      </LayoutGroup>
    </TabsListContext.Provider>
  )
}

interface TabsTriggerProps
  extends React.ComponentProps<typeof TabsPrimitive.Trigger> {
  /** 单独覆写当前分段激活时的液态滑块光学样式 */
  indicatorClassName?: string
}

function TabsTrigger({
  className,
  indicatorClassName,
  children,
  value,
  asChild = false,
  ...props
}: TabsTriggerProps) {
  const { activeValue } = React.useContext(TabsRootContext)
  const listContext = React.useContext(TabsListContext)
  const shouldReduceMotion = useReducedMotion()

  const isActive = activeValue !== undefined && activeValue === value
  const pillLayoutId = listContext?.pillLayoutId

  const mergedIndicatorClass = cn(
    "bg-white/95 dark:bg-zinc-800/92",
    "shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0.5px_rgba(255,255,255,1)]",
    "dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.2)]",
    listContext?.indicatorClassName,
    indicatorClassName
  )

  if (asChild) {
    return (
      <TabsPrimitive.Trigger
        data-slot="tabs-trigger"
        value={value}
        asChild
        className={cn(
          "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-full border-0 px-3.5 py-1 text-sm font-medium whitespace-nowrap select-none cursor-pointer",
          "text-zinc-600 dark:text-zinc-400 [@media(hover:hover)_and_(pointer:fine)]:hover:text-zinc-900 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:text-zinc-200",
          "data-[state=active]:text-zinc-950 dark:data-[state=active]:text-white",
          "transition-colors duration-150 ease-[var(--ease-out-snappy)]",
          "focus-visible:ring-ring/40 focus-visible:ring-[3px] outline-none disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.Trigger>
    )
  }

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        "group/tab relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-3.5 py-1 text-sm font-medium whitespace-nowrap select-none cursor-pointer",
        "text-zinc-600 dark:text-zinc-400 [@media(hover:hover)_and_(pointer:fine)]:hover:text-zinc-900 dark:[@media(hover:hover)_and_(pointer:fine)]:hover:text-zinc-200",
        "data-[state=active]:text-zinc-950 dark:data-[state=active]:text-white",
        "transition-colors duration-150 ease-[var(--ease-out-snappy)]",
        "focus-visible:ring-ring/40 focus-visible:ring-[3px] outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {isActive && pillLayoutId && (
        <motion.span
          data-slot="tabs-indicator"
          aria-hidden="true"
          layoutId={shouldReduceMotion ? undefined : pillLayoutId}
          initial={false}
          transition={
            shouldReduceMotion ? { duration: 0.12 } : MOTION_SPRINGS.fluidPill
          }
          style={{ borderRadius: listContext?.pillRadius ?? 9999 }}
          className={cn(
            "pointer-events-none absolute inset-0 z-[1] border-0 will-change-transform",
            mergedIndicatorClass
          )}
        />
      )}
      <span
        data-slot="tabs-trigger-content"
        className="relative z-10 inline-flex items-center justify-center gap-[inherit] transition-transform duration-140 ease-[var(--ease-out-snappy)] group-active/tab:scale-[0.97] group-disabled/tab:opacity-50 motion-reduce:transition-none motion-reduce:group-active/tab:scale-100"
      >
        {children}
      </span>
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
