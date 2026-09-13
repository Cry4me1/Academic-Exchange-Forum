import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * TrailingNode 扩展：
 * 保证当文档末尾是表格 (table)、代码块 (codeBlock) 或流程图 (mermaidBlock) 等块节点时，
 * 自动在末尾追加一个空段落，彻底避免光标被卡在块内无法在下方继续输入文字。
 */
export const TrailingNode = Extension.create({
    name: "trailingNode",

    addProseMirrorPlugins() {
        const pluginKey = new PluginKey("trailingNode");

        return [
            new Plugin({
                key: pluginKey,
                appendTransaction(_, __, state) {
                    const { doc, tr, schema } = state;
                    const lastNode = doc.lastChild;

                    if (!lastNode) return null;

                    const nonParagraphBlocks = ["table", "codeBlock", "mermaidBlock", "academicBlock"];
                    if (nonParagraphBlocks.includes(lastNode.type.name)) {
                        return tr.insert(doc.content.size, schema.nodes.paragraph.create());
                    }

                    return null;
                },
            }),
        ];
    },
});

export default TrailingNode;
