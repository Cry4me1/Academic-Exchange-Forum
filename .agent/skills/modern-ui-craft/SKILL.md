---
name: modern-ui-craft
description: Specializes in generating and styling high-aesthetic dark-mode UI components, Bento grids, and animated widgets using shadcn/ui, Magic UI patterns, and Framer Motion.
---

# Modern UI Crafting Skill

When tasked with building or refactoring UI components:
1. Sourcing: Check `@/components/ui/` for existing shadcn primitives. Install missing primitives via CLI (`npx shadcn@latest add <component>`).
2. Surface & Depth: Strictly obey `UI-DESIGN-RULES` (Apple Liquid Glass). Eliminate explicit borders (`border-0`), applying `bg-white/70 dark:bg-zinc-900/50 backdrop-blur-2xl` with Fresnel inset micro-highlights (`shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85)]`) and soft ambient shadows.
3. Geometry & Typography: Use `rounded-full` for all buttons, tags, and pills; `rounded-2xl`/`rounded-3xl` for cards and panels. Apply strict `font-medium` and `tracking-tight` without font-weight jumps.
4. Micro-interactions: Implement 120fps mouse-tracking physical reflections via direct CSS variable mutations, subtle monochromatic aura glows, and spring physics via Framer Motion (`whileTap={{ scale: 0.97 }}`).
