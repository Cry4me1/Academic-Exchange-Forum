/**
 * ==============================================================================
 * Scholarly 论坛统一运动学令牌 (Motion Tokens)
 * 深度整合 Emil Kowalski 设计工程体系与 Apple 物理弹簧模型
 * ==============================================================================
 */

/**
 * 物理弹簧参数库 (Spring Configurations)
 * 适用于 Framer Motion, Motion (v11+) 以及可打断交互 (Interruptible Gestures)
 */
export const MOTION_SPRINGS = {
  /** 胶囊流体滑块 (Tabs, Segmented Controls, 浮动指示器) */
  fluidPill: {
    type: "spring" as const,
    stiffness: 450,
    damping: 35,
    mass: 0.8,
  },

  /** 弹窗与核心面板弹出 (Modal, Dialog, Card Expansion) */
  panelPop: {
    type: "spring" as const,
    stiffness: 380,
    damping: 28,
    mass: 1,
  },

  /** 按钮与按压触觉响应 (Tap Feedback) */
  hapticTap: {
    type: "spring" as const,
    stiffness: 600,
    damping: 30,
  },

  /** 抽屉与浮层滑动手势 (Sheet, Drawer, Drag-to-dismiss) */
  sheetGesture: {
    type: "spring" as const,
    damping: 32,
    stiffness: 320,
    mass: 0.85,
  },

  /** 边界阻尼回弹 (Rubber-banding / Boundary Damping) */
  boundaryDamp: {
    type: "spring" as const,
    stiffness: 260,
    damping: 22,
  },

  /** 3D 晶体翻转面板 (Duel 3D Crystal Arena Flip) */
  crystalFlip: {
    type: "spring" as const,
    stiffness: 260,
    damping: 28,
    mass: 0.9,
  },
} as const;

/**
 * 强劲三次贝塞尔曲线常数 (Strong Custom Cubic Bezier)
 * 拒绝浏览器默认弱缓动，为 UI 交互注入坚决且优雅的动态特征
 */
export const MOTION_EASINGS = {
  /** 强劲易出（UI 首选：入场起步极快，柔和沉降） */
  snappy: [0.23, 1, 0.32, 1] as const,

  /** 原位位置移动与形变（加减速自然过渡） */
  fluidInOut: [0.77, 0, 0.175, 1] as const,

  /** Apple iOS 抽屉展开曲线 (Ionic / WWDC Fluid) */
  drawer: [0.32, 0.72, 0, 1] as const,

  /** Apple 仿弹簧缓动 */
  appleSpringEase: [0.16, 1, 0.3, 1] as const,
} as const;

/**
 * 交互时间常量 (毫秒)
 * 规则：UI 交互尽量控制在 250ms 内，杜绝拖沓粘滞感
 */
export const MOTION_DURATIONS = {
  press: 0.14,
  morph: 0.16,
  popover: 0.18,
  modalEnter: 0.22,
  modalExit: 0.12,
  drawer: 0.32,
} as const;

/**
 * Emil Kowalski 速度阈值手势判断
 * 用户拖拽时即便位移未达临界线，只要瞬间速度超过阈值即可触发 Dismiss / 动作
 */
export function shouldDismissByVelocity(distance: number, elapsedTimeMs: number, minDistance = 60, velocityThreshold = 0.11): boolean {
  if (Math.abs(distance) >= minDistance) return true;
  if (elapsedTimeMs <= 0) return false;
  const velocity = Math.abs(distance) / elapsedTimeMs;
  return velocity > velocityThreshold;
}

/**
 * 120fps 物理漫射光斑光随鼠动
 * 直接写入当前 DOM 节点的 CSS 变量，完全跳过 React 状态重绘管道
 */
export function trackPointer120fps(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
  el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
}
