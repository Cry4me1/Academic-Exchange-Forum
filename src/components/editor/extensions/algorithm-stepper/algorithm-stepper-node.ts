import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AlgorithmStepperComponent } from "./AlgorithmStepperComponent";
import { STEPPER_PRESETS } from "./presets";

export const AlgorithmStepperNode = Node.create({
    name: "algorithmStepper",
    group: "block",
    atom: true,

    addAttributes() {
        return {
            title: {
                default: STEPPER_PRESETS["cpp-quicksort"].title,
                parseHTML: (element) => element.getAttribute("data-title") || "",
                renderHTML: (attributes) => ({
                    "data-title": attributes.title,
                }),
            },
            subtitle: {
                default: STEPPER_PRESETS["cpp-quicksort"].subtitle,
                parseHTML: (element) => element.getAttribute("data-subtitle") || "",
                renderHTML: (attributes) => ({
                    "data-subtitle": attributes.subtitle,
                }),
            },
            presetKey: {
                default: "cpp-quicksort",
                parseHTML: (element) => element.getAttribute("data-preset-key") || "cpp-quicksort",
                renderHTML: (attributes) => ({
                    "data-preset-key": attributes.presetKey,
                }),
            },
            steps: {
                default: STEPPER_PRESETS["cpp-quicksort"].steps,
                parseHTML: (element) => {
                    const raw = element.getAttribute("data-steps");
                    if (!raw) return STEPPER_PRESETS["cpp-quicksort"].steps;
                    try {
                        return JSON.parse(decodeURIComponent(raw));
                    } catch {
                        return STEPPER_PRESETS["transformer-mha"].steps;
                    }
                },
                renderHTML: (attributes) => ({
                    "data-steps": encodeURIComponent(JSON.stringify(attributes.steps || [])),
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="algorithm-stepper"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, { "data-type": "algorithm-stepper" }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(AlgorithmStepperComponent);
    },
});

export default AlgorithmStepperNode;
