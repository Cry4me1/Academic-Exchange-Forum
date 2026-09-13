import { AlgorithmStepperAttrs } from "./algorithm-stepper-types";

export const STEPPER_PRESETS: Record<string, AlgorithmStepperAttrs> = {
    "cpp-quicksort": {
        title: "C++ 快速排序双指针分区 (Hoare Partition) 单步推演",
        subtitle: "经典分治算法：基准选取、双指针相向扫描与原地元素交换",
        presetKey: "cpp-quicksort",
        activeStepIndex: 0,
        steps: [
            {
                id: "qs-1",
                title: "初始化基准元素 (Pivot) 与左右指针",
                badge: "Pivot Selection",
                codeSnippet: {
                    language: "cpp",
                    code: "// 1. 选取首元素为基准，设置双向探测指针\nint pivot = arr[low];\nint i = low - 1;\nint j = high + 1;",
                    highlightLines: [2, 3, 4],
                },
                variables: [
                    { name: "pivot", value: 45, changed: true },
                    { name: "low", value: 0 },
                    { name: "high", value: 5 },
                    { name: "i", value: -1, changed: true },
                    { name: "j", value: 6, changed: true },
                ],
                arrayState: {
                    label: "当前待排序数组切片",
                    items: [45, 12, 89, 30, 77, 24],
                    highlightIndices: [0],
                    pointerLabels: { 0: "pivot (45)" },
                },
                explanation: "将区间首元素 45 选为基准（Pivot），指针 i 和 j 分别置于数组左右边界外侧，准备以 O(N) 时间复杂度相向聚拢扫描。",
            },
            {
                id: "qs-2",
                title: "右指针向左扫描，定位小于基准的逆序元素",
                badge: "Scan Right",
                codeSnippet: {
                    language: "cpp",
                    code: "// 2. 右侧指针 j 不断左移，直到找到小于等于 pivot 的元素\ndo {\n    j--;\n} while (arr[j] > pivot);",
                    highlightLines: [2, 3, 4],
                },
                variables: [
                    { name: "pivot", value: 45 },
                    { name: "i", value: -1 },
                    { name: "j", value: 5, changed: true },
                    { name: "arr[j]", value: 24, changed: true },
                ],
                arrayState: {
                    label: "j 指针向左扫描并在索引 5 处停下 (24 < 45)",
                    items: [45, 12, 89, 30, 77, 24],
                    highlightIndices: [0, 5],
                    pointerLabels: { 0: "pivot", 5: "j (24 < 45)" },
                },
                explanation: "右指针 j 从右向左倒序扫描，跳过大于基准的 77，在遇到 24 时停下，因为 24 应被划分到基准的左半侧。",
            },
            {
                id: "qs-3",
                title: "左指针向右扫描，定位大于基准的逆序元素",
                badge: "Scan Left",
                codeSnippet: {
                    language: "cpp",
                    code: "// 3. 左侧指针 i 不断右移，直到找到大于等于 pivot 的元素\ndo {\n    i++;\n} while (arr[i] < pivot);",
                    highlightLines: [2, 3, 4],
                },
                variables: [
                    { name: "pivot", value: 45 },
                    { name: "i", value: 2, changed: true },
                    { name: "j", value: 5 },
                    { name: "arr[i]", value: 89, changed: true },
                ],
                arrayState: {
                    label: "i 指针向右推进并在索引 2 处停下 (89 > 45)",
                    items: [45, 12, 89, 30, 77, 24],
                    highlightIndices: [2, 5],
                    pointerLabels: { 2: "i (89 > 45)", 5: "j (24 < 45)" },
                },
                explanation: "左指针 i 从左向右步进，跳过 12，在索引 2 处发现 89 > 45，双指针均锁定了破坏有序划分的逆序元素对。",
            },
            {
                id: "qs-4",
                title: "双指针未相遇，原地交换逆序元素对",
                badge: "In-place Swap",
                codeSnippet: {
                    language: "cpp",
                    code: "// 4. 双指针尚未相交，执行就地交换\nif (i >= j) return j;\nstd::swap(arr[i], arr[j]);",
                    highlightLines: [2, 3],
                },
                variables: [
                    { name: "pivot", value: 45 },
                    { name: "i", value: 2 },
                    { name: "j", value: 5 },
                    { name: "swap", value: "arr[2] ↔ arr[5]", changed: true },
                ],
                arrayState: {
                    label: "元素 89 与 24 完成交换，各自归入正确分治区间",
                    items: [45, 12, 24, 30, 77, 89],
                    highlightIndices: [2, 5],
                    pointerLabels: { 2: "已换入 24", 5: "已换入 89" },
                },
                explanation: "执行 `std::swap(arr[2], arr[5])`，较小的 24 归位至左侧，较大的 89 沉降至右侧，继续循环直至双指针交叉完成单趟划分。",
            },
        ],
    },

    "cpp-binary-search": {
        title: "C++ 有序数组二分查找 (Binary Search) 区间折半推演",
        subtitle: "经典对数时间复杂度 O(log N) 搜索：闭区间 [left, right] 状态演化",
        presetKey: "cpp-binary-search",
        activeStepIndex: 0,
        steps: [
            {
                id: "bs-1",
                title: "初始化查找闭区间 [left, right] 与目标值",
                badge: "Init Range",
                codeSnippet: {
                    language: "cpp",
                    code: "// 1. 定义有序搜索数组与两端闭区间边界\nconst int target = 47;\nint left = 0;\nint right = arr.size() - 1;",
                    highlightLines: [2, 3, 4],
                },
                variables: [
                    { name: "target", value: 47, changed: true },
                    { name: "left", value: 0, changed: true },
                    { name: "right", value: 6, changed: true },
                    { name: "mid", value: "未计算" },
                ],
                arrayState: {
                    label: "递增有序数组 (目标 target = 47)",
                    items: [11, 23, 35, 47, 59, 71, 88],
                    highlightIndices: [0, 6],
                    pointerLabels: { 0: "left (0)", 6: "right (6)" },
                },
                explanation: "初始搜索空间覆盖整个数组（长度为 7），双指针分别锚定首尾两端，遵循左闭右闭区间不变量。",
            },
            {
                id: "bs-2",
                title: "计算防溢出折半中点，与目标值比较",
                badge: "Compute Mid",
                codeSnippet: {
                    language: "cpp",
                    code: "// 2. 防止 (left + right) 整型溢出的标准位运算折半\nint mid = left + ((right - left) >> 1);\nif (arr[mid] == target) return mid;",
                    highlightLines: [2, 3],
                },
                variables: [
                    { name: "target", value: 47 },
                    { name: "left", value: 0 },
                    { name: "right", value: 6 },
                    { name: "mid", value: 3, changed: true },
                    { name: "arr[mid]", value: 47, changed: true },
                ],
                arrayState: {
                    label: "计算得中点 mid = 3，命中目标元素 arr[3] == 47！",
                    items: [11, 23, 35, 47, 59, 71, 88],
                    highlightIndices: [3],
                    pointerLabels: { 3: "mid (47 == target)" },
                },
                explanation: "计算得出中点索引 mid = 3，直接比对命中 `arr[3] == 47`，在 1 次探测中直接锁定目标索引并返回。",
            },
            {
                id: "bs-3",
                title: "区间收缩原理展示 (若目标为 59)",
                badge: "Interval Shrink",
                codeSnippet: {
                    language: "cpp",
                    code: "// 3. 若 arr[mid] < target，说明目标必定在右半部分\nif (arr[mid] < target) {\n    left = mid + 1; // 舍弃左半区间\n} else {\n    right = mid - 1;\n}",
                    highlightLines: [3],
                },
                variables: [
                    { name: "target", value: 59, changed: true },
                    { name: "left", value: 4, changed: true },
                    { name: "right", value: 6 },
                    { name: "searchSize", value: 3, changed: true },
                ],
                arrayState: {
                    label: "左半区间被安全剔除，搜索空间缩减至 [4, 6]",
                    items: [11, 23, 35, 47, 59, 71, 88],
                    highlightIndices: [4, 5, 6],
                    pointerLabels: { 4: "新 left (4)", 6: "right (6)" },
                },
                explanation: "因为数组严格单调递增，中点左侧所有元素均小于中点，因此直接将 left 右移至 mid + 1，搜索规模呈指数衰减。",
            },
        ],
    },

    "math-euler": {
        title: "欧拉公式与上帝恒等式 (Euler's Formula) 泰勒级数推导",
        subtitle: "纯数学推演：从复指数展开到 e^(iπ) + 1 = 0 的严格证明",
        presetKey: "math-euler",
        activeStepIndex: 0,
        steps: [
            {
                id: "eu-1",
                title: "复指数函数 e^z 的泰勒级数定义式",
                badge: "Taylor Series",
                formula: "e^z = \\sum_{n=0}^{\\infty} \\frac{z^n}{n!} = 1 + z + \\frac{z^2}{2!} + \\frac{z^3}{3!} + \\frac{z^4}{4!} + \\dots",
                explanation: "在复分析中，指数函数通过在收敛半径为无穷大的全平面上的柯西幂级数严格定义。",
            },
            {
                id: "eu-2",
                title: "将纯虚数变量 z = ix 代入级数展开",
                badge: "Substitute z = ix",
                formula: "e^{ix} = 1 + ix + \\frac{(ix)^2}{2!} + \\frac{(ix)^3}{3!} + \\frac{(ix)^4}{4!} + \\frac{(ix)^5}{5!} + \\dots",
                explanation: "将自变量替换为纯虚数 ix，此时每一项中的虚数单位 i 的幂次展现出以 4 为周期的代数性质。",
            },
            {
                id: "eu-3",
                title: "利用虚数单位幂次周期律展开并化简",
                badge: "Powers of i",
                formula: "e^{ix} = 1 + ix - \\frac{x^2}{2!} - i\\frac{x^3}{3!} + \\frac{x^4}{4!} + i\\frac{x^5}{5!} - \\frac{x^6}{6!} - \\dots",
                explanation: "根据虚数定义：i^1 = i，i^2 = -1，i^3 = -i，i^4 = 1，正负符号交替涌现，呈现周期性旋转。",
            },
            {
                id: "eu-4",
                title: "分离实部偶次项与虚部奇次项",
                badge: "Real & Imag Split",
                formula: "e^{ix} = \\underbrace{\\left(1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} - \\dots\\right)}_{\\cos(x)} + i \\underbrace{\\left(x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\dots\\right)}_{\\sin(x)}",
                explanation: "由于级数绝对收敛，可以根据项的奇偶次幂无条件重排：偶数次项构成了余弦的麦克劳林展开，奇数次项构成了正弦的麦克劳林展开。",
            },
            {
                id: "eu-5",
                title: "得出欧拉公式，并推导欧拉恒等式 (Q.E.D.)",
                badge: "Euler's Identity",
                formula: "e^{ix} = \\cos x + i \\sin x \\quad \\xrightarrow{x = \\pi} \\quad e^{i\\pi} + 1 = 0",
                explanation: "将 x = π 代入公式，因 cos(π) = -1 且 sin(π) = 0，立即导出将数学中五个最重要常数 (e, i, π, 1, 0) 融为一体的欧拉恒等式，证毕。",
            },
        ],
    },
};
