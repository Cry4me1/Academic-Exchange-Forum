"use client";

import React, {
    useState,
    useMemo,
    useCallback,
    useRef,
    useEffect,
} from "react";
import { useEditor } from "novel";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Sigma,
    Command as CommandIcon,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/ui/math-text";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    MATH_PALETTE_ITEMS,
    QUICK_SYMBOLS,
    PALETTE_TABS,
    type PaletteTab,
    type MathPaletteItem,
    type QuickSymbol,
} from "./math-palette-data";

// ─────────────────────────────────────────────────────────
// 三模态搜索过滤（中文名、拼音关键词、LaTeX 指令）
// ─────────────────────────────────────────────────────────
function filterItems(
    items: MathPaletteItem[],
    query: string,
    activeTab: PaletteTab | "all"
): MathPaletteItem[] {
    return items.filter((item) => {
        if (activeTab !== "all" && item.tab !== activeTab) return false;
        if (!query.trim()) return true;

        const q = query.toLowerCase().trim();
        return (
            item.name.toLowerCase().includes(q) ||
            item.latex.toLowerCase().includes(q) ||
            item.template.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.keywords.some((k) => k.toLowerCase().includes(q))
        );
    });
}

// ─────────────────────────────────────────────────────────
// 键帽按钮组件 (Keycap Token - Liquid Glass 晶体键帽)
// 严守零硬边框，通过菲涅尔内高光、高斯磨砂与触觉微弹构建物理实体感
// ─────────────────────────────────────────────────────────
function KeycapButton({
    symbol,
    onInsert,
}: {
    symbol: QuickSymbol;
    onInsert: (s: QuickSymbol) => void;
}) {
    return (
        <motion.button
            type="button"
            whileHover={{ y: -1.5, scale: 1.04 }}
            whileTap={{ y: 1, scale: 0.94 }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInsert(symbol);
            }}
            title={`插入 ${symbol.label} (${symbol.latex})`}
            className={cn(
                "w-8 h-8 shrink-0 rounded-xl font-serif text-sm",
                "flex items-center justify-center border-0",
                // 第一层：半透明高斯磨砂底
                "bg-white/80 dark:bg-zinc-800/70 backdrop-blur-md",
                // 第二层：菲涅尔表面张力内高光
                "shadow-[inset_0_1px_0.8px_rgba(255,255,255,0.95),0_2px_6px_-1px_rgba(0,0,0,0.06)]",
                "dark:shadow-[inset_0_1px_0.8px_rgba(255,255,255,0.15),0_2px_6px_-1px_rgba(0,0,0,0.3)]",
                // 交互微光晕
                "hover:bg-white dark:hover:bg-zinc-800",
                "hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_4px_12px_-2px_rgba(139,92,246,0.22)]",
                "text-zinc-800 dark:text-zinc-100 cursor-pointer select-none transition-colors"
            )}
        >
            {symbol.label}
        </motion.button>
    );
}

// ─────────────────────────────────────────────────────────
// 扁平透气卡片组件 (PaletteCard - Liquid Glass 晶体面板)
// 零硬线框，KaTeX 衬线体居中放大，Geist 高质感说明文本
// ─────────────────────────────────────────────────────────
function PaletteCard({
    item,
    isKeyboardSelected,
    onInsert,
}: {
    item: MathPaletteItem;
    isKeyboardSelected: boolean;
    onInsert: () => void;
}) {
    return (
        <motion.button
            type="button"
            data-palette-card
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInsert();
            }}
            className={cn(
                "w-full flex flex-col items-center justify-between gap-1.5 p-3 rounded-2xl text-center border-0",
                "transition-all duration-200 cursor-pointer select-none group relative overflow-hidden",
                // 第一层：半透明温润晶体底
                "bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl",
                // 第二层：表面菲涅尔内高光与柔阴影
                isKeyboardSelected
                    ? "bg-violet-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_0_0_1.5px_rgba(139,92,246,0.35),0_6px_20px_-4px_rgba(139,92,246,0.2)]"
                    : "shadow-[inset_0_1px_0.8px_rgba(255,255,255,0.85),0_4px_16px_-4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.08),0_4px_16px_-4px_rgba(0,0,0,0.3)]",
                // 第三层：学术冷峻微光 Hover
                "hover:bg-violet-500/[0.06] dark:hover:bg-violet-500/[0.08]",
                "hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_6px_20px_-4px_rgba(139,92,246,0.16)]"
            )}
        >
            {/* KaTeX 公式真实渲染 —— 严谨数学衬线体，绝对垂直居中 */}
            <div className="w-full min-h-[46px] flex items-center justify-center py-0.5 pointer-events-none group-hover:scale-[1.02] transition-transform">
                <MathText
                    text={`$${item.latex}$`}
                    className="text-sm text-zinc-900 dark:text-zinc-100 select-none"
                />
            </div>
            {/* 底部单行弱化说明 —— 现代无衬线体，字重恒定 font-medium 零跳动 */}
            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 truncate w-full leading-tight font-sans transition-colors">
                {item.name}
            </span>
        </motion.button>
    );
}

// ─────────────────────────────────────────────────────────
// 一体化数学调色板下拉面板 (MathPalette - Apple Liquid Glass)
// ─────────────────────────────────────────────────────────
export function MathPalette() {
    const { editor } = useEditor();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<PaletteTab | "all">("all");
    const [keyboardIndex, setKeyboardIndex] = useState<number>(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // 符号横滑条引用与滚动状态监听
    const symbolsBarRef = useRef<HTMLDivElement>(null);
    const [canScrollSymbolsLeft, setCanScrollSymbolsLeft] = useState(false);
    const [canScrollSymbolsRight, setCanScrollSymbolsRight] = useState(true);

    // 检查符号条横向滚动边界
    const updateSymbolsScrollState = useCallback(() => {
        if (!symbolsBarRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = symbolsBarRef.current;
        setCanScrollSymbolsLeft(scrollLeft > 4);
        setCanScrollSymbolsRight(scrollLeft < scrollWidth - clientWidth - 4);
    }, []);

    // 左右微按钮平滑横滑
    const handleScrollSymbols = useCallback(
        (direction: "left" | "right") => {
            if (!symbolsBarRef.current) return;
            const delta = direction === "left" ? -160 : 160;
            symbolsBarRef.current.scrollBy({ left: delta, behavior: "smooth" });
            setTimeout(updateSymbolsScrollState, 200);
        },
        [updateSymbolsScrollState]
    );

    // 搜索变更
    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        if (value.trim()) {
            setActiveTab("all");
        }
        setKeyboardIndex(-1);
        if (gridRef.current) {
            gridRef.current.scrollTop = 0;
        }
    }, []);

    // 切换 Tab
    const handleTabChange = useCallback((tab: PaletteTab | "all") => {
        setActiveTab(tab);
        setKeyboardIndex(-1);
        if (gridRef.current) {
            gridRef.current.scrollTop = 0;
        }
    }, []);

    // 三模态智能过滤
    const filteredItems = useMemo(
        () => filterItems(MATH_PALETTE_ITEMS, search, activeTab),
        [search, activeTab]
    );

    // 获取编辑器当前选中的纯文本（参数插槽动态感知）
    const getSelectedText = useCallback((): string => {
        if (!editor) return "";
        const { from, to } = editor.state.selection;
        if (from === to) return "";
        return editor.state.doc.textBetween(from, to, " ");
    }, [editor]);

    // 插入公式
    const handleInsertItem = useCallback(
        (item: MathPaletteItem) => {
            if (!editor) return;

            let formula = item.template;
            const selectedText = getSelectedText();

            // 动态参数插槽感知：选中文本替换第一个占位符
            if (selectedText && item.slotTarget) {
                formula = formula.replace(item.slotTarget, selectedText);
            }

            setOpen(false);

            requestAnimationFrame(() => {
                if (!editor) return;
                if (selectedText && item.slotTarget) {
                    editor
                        .chain()
                        .focus()
                        .deleteSelection()
                        .insertContent(`$${formula}$ `)
                        .run();
                } else {
                    editor
                        .chain()
                        .focus()
                        .insertContent(`$${formula}$ `)
                        .run();
                }
                toast.success(`已插入：${item.name}`, { duration: 1500 });
            });
        },
        [editor, getSelectedText]
    );

    // 插入键帽单符号
    const handleInsertSymbol = useCallback(
        (symbol: QuickSymbol) => {
            if (!editor) return;
            setOpen(false);
            requestAnimationFrame(() => {
                if (!editor) return;
                editor
                    .chain()
                    .focus()
                    .insertContent(`$${symbol.latex}$ `)
                    .run();
                toast.success(`已插入符号 ${symbol.label}`, { duration: 1000 });
            });
        },
        [editor]
    );

    // 仅在用户按键盘方向键时滚动可视区域，彻底杜绝与鼠标 hover 冲突
    const scrollCardIntoView = useCallback((index: number) => {
        if (!gridRef.current) return;
        const container = gridRef.current;
        const cards = container.querySelectorAll("[data-palette-card]");
        const target = cards[index] as HTMLElement | undefined;

        if (target) {
            const targetTop = target.offsetTop;
            const targetHeight = target.offsetHeight;
            const containerScrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;

            if (targetTop < containerScrollTop) {
                container.scrollTop = Math.max(0, targetTop - 8);
            } else if (
                targetTop + targetHeight >
                containerScrollTop + containerHeight
            ) {
                container.scrollTop =
                    targetTop + targetHeight - containerHeight + 8;
            }
        }
    }, []);

    // 纯键盘操作流
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
                return;
            }

            const count = filteredItems.length;
            if (count === 0) return;

            const cols = 2;

            switch (e.key) {
                case "ArrowDown": {
                    e.preventDefault();
                    setKeyboardIndex((prev) => {
                        const next = prev < 0 ? 0 : Math.min(count - 1, prev + cols);
                        scrollCardIntoView(next);
                        return next;
                    });
                    break;
                }
                case "ArrowUp": {
                    e.preventDefault();
                    setKeyboardIndex((prev) => {
                        const next = prev - cols >= 0 ? prev - cols : 0;
                        scrollCardIntoView(next);
                        return next;
                    });
                    break;
                }
                case "ArrowRight": {
                    e.preventDefault();
                    setKeyboardIndex((prev) => {
                        const next = Math.min(count - 1, (prev < 0 ? 0 : prev) + 1);
                        scrollCardIntoView(next);
                        return next;
                    });
                    break;
                }
                case "ArrowLeft": {
                    e.preventDefault();
                    setKeyboardIndex((prev) => {
                        const next = Math.max(0, prev - 1);
                        scrollCardIntoView(next);
                        return next;
                    });
                    break;
                }
                case "Enter": {
                    e.preventDefault();
                    if (keyboardIndex >= 0 && filteredItems[keyboardIndex]) {
                        handleInsertItem(filteredItems[keyboardIndex]);
                    } else if (filteredItems.length > 0) {
                        handleInsertItem(filteredItems[0]);
                    }
                    break;
                }
            }
        },
        [filteredItems, keyboardIndex, handleInsertItem, scrollCardIntoView]
    );

    // 面板打开时初始化并聚焦搜索框
    useEffect(() => {
        if (open) {
            setSearch("");
            setActiveTab("all");
            setKeyboardIndex(-1);
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
                if (gridRef.current) {
                    gridRef.current.scrollTop = 0;
                }
                updateSymbolsScrollState();
            }, 30);
            return () => clearTimeout(timer);
        }
    }, [open, updateSymbolsScrollState]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            {/* 触发入口：水滴流体胶囊 rounded-full + 菲涅尔内高光 */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer select-none border-0",
                                open
                                    ? "bg-violet-600/15 text-violet-900 dark:text-violet-200 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.85),0_0_0_1px_rgba(139,92,246,0.3)]"
                                    : "text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-zinc-800/50 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.9),0_2px_6px_-1px_rgba(0,0,0,0.05)] hover:bg-white/90 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white"
                            )}
                        >
                            <Sigma
                                size={14}
                                className="text-violet-600 dark:text-violet-400"
                            />
                            <span>数学面板</span>
                        </motion.button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    一键插入公式、函数、希腊符号、矩阵（支持拼音 / LaTeX / 中文智能搜索）
                </TooltipContent>
            </Tooltip>

            {/* 下拉面板内容：彻底无边框 (border-0) + 大曲率 rounded-3xl + 通透高斯磨砂 + 菲涅尔内高光 */}
            <PopoverContent
                align="start"
                sideOffset={8}
                onKeyDown={handleKeyDown}
                className={cn(
                    "w-[390px] sm:w-[500px] p-0 rounded-3xl overflow-hidden border-0",
                    // 第一层：通透半透明高斯磨砂底 (2xl blur)
                    "bg-white/80 dark:bg-zinc-950/75 backdrop-blur-2xl",
                    // 第二层：表面张力菲涅尔内高光
                    "shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_16px_48px_-8px_rgba(0,0,0,0.14)]",
                    "dark:shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.14),0_16px_48px_-8px_rgba(0,0,0,0.55)]",
                    "flex flex-col gap-0 z-50 select-none outline-none"
                )}
            >
                {/* ═══ 顶部智能搜索框 ═══ */}
                <div className="flex items-center gap-2.5 px-4 py-3 bg-white/40 dark:bg-zinc-900/20 shrink-0">
                    <Search
                        size={15}
                        className="text-zinc-400 dark:text-zinc-500 shrink-0"
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="搜索公式：分数、oula、\frac、\zeta、矩阵..."
                        className={cn(
                            "flex-1 bg-transparent text-xs font-medium outline-none border-none",
                            "text-zinc-900 dark:text-zinc-100",
                            "placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        )}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <kbd className="text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4)]">
                        ESC
                    </kbd>
                </div>

                {/* 渐变消融内部微光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent shrink-0" />

                {/* ═══ 精致微拟物键帽常用符号栏（支持滚轮平滑横滑 + 左右微翻页按钮） ═══ */}
                <div className="relative px-3 py-2.5 bg-black/[0.015] dark:bg-white/[0.01] shrink-0 group">
                    {/* 左侧微翻页按键 */}
                    {canScrollSymbolsLeft && (
                        <motion.button
                            type="button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => handleScrollSymbols("left")}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] border-0 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-violet-600 cursor-pointer transition-colors"
                            title="向左滚动"
                        >
                            <ChevronLeft size={13} />
                        </motion.button>
                    )}

                    {/* 横向符号容器：滚轮监听自动转横滑 */}
                    <div
                        ref={symbolsBarRef}
                        onScroll={updateSymbolsScrollState}
                        onWheel={(e) => {
                            if (symbolsBarRef.current && e.deltaY !== 0) {
                                symbolsBarRef.current.scrollLeft += e.deltaY * 0.8;
                                updateSymbolsScrollState();
                            }
                        }}
                        className={cn(
                            "flex items-center gap-1.5 overflow-x-auto pb-0.5 px-1 scroll-smooth",
                            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        )}
                    >
                        {QUICK_SYMBOLS.map((s) => (
                            <KeycapButton
                                key={s.label}
                                symbol={s}
                                onInsert={handleInsertSymbol}
                            />
                        ))}
                    </div>

                    {/* 右侧微翻页按键 */}
                    {canScrollSymbolsRight && (
                        <motion.button
                            type="button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => handleScrollSymbols("right")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.9)] border-0 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-violet-600 cursor-pointer transition-colors"
                            title="向右滚动查看更多符号"
                        >
                            <ChevronRight size={13} />
                        </motion.button>
                    )}
                </div>

                {/* 渐变消融内部微光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent shrink-0" />

                {/* ═══ 一级导航 Tabs（黑曜石液态玻璃 CTA 激活态 + 水滴胶囊） ═══ */}
                <div className="relative px-3.5 py-2 shrink-0">
                    <div
                        onWheel={(e) => {
                            if (e.deltaY !== 0) {
                                e.currentTarget.scrollLeft += e.deltaY * 0.8;
                            }
                        }}
                        className={cn(
                            "flex items-center gap-1 overflow-x-auto scroll-smooth",
                            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => handleTabChange("all")}
                            className={cn(
                                "px-3 py-1 text-[11px] font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer border-0",
                                activeTab === "all"
                                    // 黑曜石液态玻璃激活态 (Obsidian Liquid Glass)
                                    ? "bg-zinc-950/85 hover:bg-zinc-900/95 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] text-white dark:bg-white/90 dark:text-zinc-950 dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,0.8)]"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/50"
                            )}
                        >
                            全部
                        </button>
                        {PALETTE_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                className={cn(
                                    "px-3 py-1 text-[11px] font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer border-0",
                                    activeTab === tab.id
                                        ? "bg-zinc-950/85 hover:bg-zinc-900/95 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.38)] text-white dark:bg-white/90 dark:text-zinc-950 dark:shadow-[0_4px_16px_-2px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,0.8)]"
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/50"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 渐变消融内部微光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/60 dark:via-zinc-800/60 to-transparent shrink-0" />

                {/* ═══ 扁平透气晶体卡片网格区（KaTeX 实时解析渲染，零原生粗糙滚动条） ═══ */}
                <div
                    ref={gridRef}
                    className={cn(
                        "p-3 overflow-y-auto",
                        "h-[290px] max-h-[290px]",
                        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    )}
                >
                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 gap-2 text-center">
                            <CommandIcon
                                size={24}
                                className="text-zinc-300 dark:text-zinc-600"
                            />
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                                未匹配到公式，可搜索“分数”、“oula”、“\sqrt”等
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                            {filteredItems.map((item, index) => (
                                <PaletteCard
                                    key={item.id}
                                    item={item}
                                    isKeyboardSelected={index === keyboardIndex}
                                    onInsert={() => handleInsertItem(item)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* 渐变消融内部微光缝 */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-zinc-800/80 to-transparent shrink-0" />

                {/* ═══ 底部状态栏 ═══ */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-black/[0.015] dark:bg-white/[0.01] shrink-0">
                    <div className="flex items-center gap-2.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                        <span className="flex items-center gap-1">
                            <kbd className="inline-flex items-center justify-center min-w-[15px] h-4 px-1 rounded-full bg-black/5 dark:bg-white/10 font-mono text-[9px] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4)]">
                                ↑↓
                            </kbd>
                            <span>选卡片</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="inline-flex items-center justify-center min-w-[15px] h-4 px-1 rounded-full bg-black/5 dark:bg-white/10 font-mono text-[9px] shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.4)]">
                                ↵
                            </kbd>
                            <span>插入</span>
                        </span>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-violet-600/90 dark:text-violet-400/90">
                        {filteredItems.length} 项 · KaTeX
                    </span>
                </div>
            </PopoverContent>
        </Popover>
    );
}
