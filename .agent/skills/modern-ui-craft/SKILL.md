---
name: modern-ui-craft
description: Specializes in generating and styling high-aesthetic dark-mode UI components, Bento grids, and animated widgets using shadcn/ui, Magic UI patterns, and Framer Motion.
---

# Modern UI Crafting Skill

When tasked with building or refactoring UI components:
1. Sourcing: Check `@/components/ui/` for existing shadcn primitives. Install missing primitives via CLI (`npx shadcn@latest add <component>`).
2. Surface & Depth: Apply `bg-zinc-950` base, `bg-zinc-900/50` cards, and `border border-white/10`.
3. Typography & Spacing: Apply strict `tracking-tight` on headings and `gap-4 sm:gap-6` on grids.
4. Micro-interactions: Implement spring physics via Framer Motion for enter animations and hover feedback.
