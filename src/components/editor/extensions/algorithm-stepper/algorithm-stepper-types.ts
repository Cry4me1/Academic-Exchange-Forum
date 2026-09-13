/**
 * Algorithm Pipeline Stepper Types
 * 算法与数学时序推演步进器类型定义
 */

export interface VariableWatchItem {
    name: string;
    value: string | number;
    changed?: boolean;
}

export interface AlgorithmStep {
    id: string;
    title: string;                       // 阶段标题，例如 "双指针相向扫描并发现逆序对"
    badge: string;                       // 简短徽标，例如 "Partition Scan"
    formula?: string;                    // LaTeX 数学公式（纯数学推导或算法数学模型）
    codeSnippet?: {
        language: string;                // 编程语言，例如 "cpp", "python"
        code: string;
        highlightLines?: number[];        // 需聚焦高亮的行号（从 1 开始）
    };
    variables?: VariableWatchItem[];     // 算法变量监视池（C++ 算法指针、索引、计数器）
    arrayState?: {                       // 可选的数组切片状态可视化
        label?: string;
        items: (number | string)[];
        highlightIndices?: number[];     // 高亮聚焦的数组索引
        pointerLabels?: Record<number, string>; // 数组指针标签，如 { 0: "low, i", 5: "high, j" }
    };
    explanation: string;                 // 核心学术原理、推演逻辑或变换依据
}

export interface AlgorithmStepperAttrs {
    title: string;                       // 推演总标题，例如 "C++ 快速排序双指针划分 (Hoare Partition) 推演"
    subtitle?: string;                   // 副标题或学术说明
    presetKey?: string;                  // 预设模板标识符
    activeStepIndex?: number;            // 默认初始步骤索引
    steps: AlgorithmStep[];              // 步骤序列
}
