import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SolidGeometryComponent } from "./SolidGeometryComponent";
import { SOLID_GEOMETRY_PRESETS } from "./presets";

export const SolidGeometryNode = Node.create({
    name: "solidGeometry",
    group: "block",
    atom: true,

    addAttributes() {
        const defaultPreset = SOLID_GEOMETRY_PRESETS["cube-diagonal-section"];

        return {
            title: {
                default: defaultPreset.title,
                parseHTML: (element) => element.getAttribute("data-title") || defaultPreset.title,
                renderHTML: (attributes) => ({
                    "data-title": attributes.title,
                }),
            },
            subtitle: {
                default: defaultPreset.subtitle,
                parseHTML: (element) => element.getAttribute("data-subtitle") || defaultPreset.subtitle,
                renderHTML: (attributes) => ({
                    "data-subtitle": attributes.subtitle,
                }),
            },
            presetKey: {
                default: "cube-diagonal-section",
                parseHTML: (element) => element.getAttribute("data-preset-key") || "cube-diagonal-section",
                renderHTML: (attributes) => ({
                    "data-preset-key": attributes.presetKey,
                }),
            },
            geometryData: {
                default: defaultPreset.geometryData,
                parseHTML: (element) => {
                    const raw = element.getAttribute("data-geometry");
                    if (!raw) return defaultPreset.geometryData;
                    try {
                        return JSON.parse(decodeURIComponent(raw));
                    } catch {
                        return defaultPreset.geometryData;
                    }
                },
                renderHTML: (attributes) => ({
                    "data-geometry": encodeURIComponent(JSON.stringify(attributes.geometryData || {})),
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="solid-geometry"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-type": "solid-geometry" }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SolidGeometryComponent, {
            className: "scholarly-solid-geometry-node-container",
            attrs: {
                "data-type": "solid-geometry",
            },
        });
    },
});

export default SolidGeometryNode;
