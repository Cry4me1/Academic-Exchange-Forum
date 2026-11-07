export interface TutorialModuleConfig {
    step: number;
    moduleId: "editor" | "publication" | "duels" | "messages" | "credits" | "moderation";
    taskIds: string[];
    liveRoute: string;
    liveRouteLabelZh: string;
    liveRouteLabelEn: string;
    estimatedMinutes: number;
}

export const TUTORIAL_MODULES_CONFIG: TutorialModuleConfig[] = [
    {
        step: 1,
        moduleId: "editor",
        taskIds: ["task-slash", "task-math", "task-academic-block", "task-bubble-ai"],
        liveRoute: "/posts/new",
        liveRouteLabelZh: "前往真实创作台写文章",
        liveRouteLabelEn: "Open Live Editor",
        estimatedMinutes: 2,
    },
    {
        step: 2,
        moduleId: "publication",
        taskIds: ["switch-column", "toc-jump", "pdf-dialog"],
        liveRoute: "/dashboard",
        liveRouteLabelZh: "浏览社区精选学术长文",
        liveRouteLabelEn: "Browse Publications",
        estimatedMinutes: 2,
    },
    {
        step: 3,
        moduleId: "duels",
        taskIds: ["task-bet", "task-danmaku", "task-inspect-round"],
        liveRoute: "/duels",
        liveRouteLabelZh: "进入真实学术决斗大厅",
        liveRouteLabelEn: "Enter Duels Arena",
        estimatedMinutes: 2,
    },
    {
        step: 4,
        moduleId: "messages",
        taskIds: ["switch-chat", "send-message", "inspect-7day-file"],
        liveRoute: "/messages",
        liveRouteLabelZh: "打开真实私信中心",
        liveRouteLabelEn: "Open Messages",
        estimatedMinutes: 1,
    },
    {
        step: 5,
        moduleId: "credits",
        taskIds: ["gain-credits", "vip-badges"],
        liveRoute: "/vip",
        liveRouteLabelZh: "查看学者特权与积分中心",
        liveRouteLabelEn: "View VIP & Credits",
        estimatedMinutes: 1,
    },
    {
        step: 6,
        moduleId: "moderation",
        taskIds: ["inspect-reasoning", "inspect-review", "finish-cert"],
        liveRoute: "/posts/new",
        liveRouteLabelZh: "发布首篇论文体验 AI 审稿",
        liveRouteLabelEn: "Publish & Try AI Review",
        estimatedMinutes: 2,
    },
];

export const TUTORIAL_TASKS_STORAGE_KEY = "scholarly_tutorials_tasks_v2";
export const TUTORIAL_STEP_STORAGE_KEY = "scholarly_tutorials_current_step_v2";
export const TUTORIAL_COMPLETED_MODULES_KEY = "scholarly_tutorials_completed_modules_v1";

export type CompletedTasksByStep = Record<number, string[]>;

export function getTotalTasksCount(): number {
    return TUTORIAL_MODULES_CONFIG.reduce((acc, mod) => acc + mod.taskIds.length, 0);
}

export function deriveCompletedModuleIds(tasksByStep: CompletedTasksByStep): string[] {
    return TUTORIAL_MODULES_CONFIG.filter((mod) => {
        const done = tasksByStep[mod.step] || [];
        return mod.taskIds.every((id) => done.includes(id));
    }).map((mod) => mod.moduleId);
}
