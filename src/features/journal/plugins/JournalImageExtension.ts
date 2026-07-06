import Image, { type ImageOptions } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { JournalImageNodeView } from "./JournalImageNodeView";
interface JournalImageOptions extends ImageOptions {
    onImageEventSync:
    | ((json: string, html: string, forcedJournalId?: string) => void) | null;
}

export const JournalImageExtension = Image.extend<JournalImageOptions>({
    name: "image", // 自訂節點名稱

    // 允許擴充原本 Image 套件的屬性 (例如支援 width, align 等)
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: "50%", parseHTML: element => element.style.width || element.getAttribute('width') || "50%",
                renderHTML: attributes => ({
                    style: `width: ${attributes.width}`,
                })
            },
            align: {
                default: "center",
            },
            dbId: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-db-id"),
                renderHTML: (attributes) => {
                    if (!attributes.dbId) return {};
                    return { "data-db-id": attributes.dbId };
                },
            }
        };
    },
    // 💡 新增 options 宣告，用來承接從外部傳進來的同步函式
    addOptions() {
        return {
            ...(this.parent?.() as JournalImageOptions),
            onImageEventSync: null, // 預設為 null
        };
    },

    // 💡 核心：告訴 Tiptap 渲染這個節點時，改走 React 的 Custom Component
    addNodeView() {
        return ReactNodeViewRenderer(JournalImageNodeView);
    },
});