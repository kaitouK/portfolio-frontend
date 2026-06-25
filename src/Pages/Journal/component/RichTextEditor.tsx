import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import apiService from "../../../api/interceptor";
import { useEffect } from "react";
import { JournalImageExtension } from "../plugins/JournalImageExtension";
import React from "react";
interface RichTextEditorProps {
  content: string;
  onChange: (json: string, html: string) => void;
  onImageEventSync: (
    json: string,
    html: string,
    forcedJournalId?: string,
  ) => void; //  新增宣告
  journalId: string | null | undefined; // 允許傳入空值，代表尚未建立日誌
  onJournalIdChange: (newId: string) => void; // 建立草稿後，用來通知父組件更新 ID
}

export const RichTextEditor = ({
  content,
  onChange,
  onImageEventSync,
  journalId,
  onJournalIdChange,
}: RichTextEditorProps) => {
  //宣告ref紀錄正在建立草稿的非同步Promise
  const draftCreatingRef = React.useRef<Promise<string> | null>(null);

  // 處理圖片上傳並插入編輯器
  const uploadAndInsertImage = async (view: any, file: File, pos: number) => {
    let currentJournalId = journalId;
    const formData = new FormData();
    formData.append("file", file);

    try {
      if (!currentJournalId) {
        //檢查是否有"同伴"建立草稿{
        if (!draftCreatingRef.current) {
          console.log("偵測到尚未建立日誌，正在自動建立草稿...");
          draftCreatingRef.current = (async () => {
            // 呼叫你的後端 POST /journal/draft API
            const draftRes = await apiService.post<
              any,
              { success: boolean; data: { id: string } } // 假設你的 ApiResponse 返回建立成功的實體或 ID
            >("/journal/draft", {
              title: "無標題草稿", // 預設標題
              contentJson: JSON.stringify(view.state.doc.toJSON()), // 順便把當前編輯器內容帶過去
              contentHtml: "<p></p>",
              tags: [],
            });

            if (draftRes.success && draftRes.data?.id) {
              currentJournalId = draftRes.data.id;
              // 重要：通知父組件更新 journalId 狀態，防止下次拖放圖片時重複建立草稿
              onJournalIdChange(currentJournalId);
              return draftRes.data.id;
            } else {
              throw new Error("建立草稿失敗，無法上傳圖片");
            }
          })();
        } else {
          console.log(
            "後續圖片觸發：偵測到草稿正在建立中，進入排隊等待狀態...",
          );
        }
      }
      if (!currentJournalId || currentJournalId.trim() === "") {
        console.error("錯誤：journalId 依舊為空，取消圖片上傳。");
        return;
      }
      //雙重防呆
      if (!currentJournalId || currentJournalId.trim() === "") return;

      // 呼叫後端上傳 API
      const res = await apiService.post<
        any,
        { success: boolean; data: { id: string; imageUrl: string } }
      >(`/journal/image?journalId=${currentJournalId}`, formData);

      if (res.success && res.data.imageUrl && editor) {
        const fullUrl = res.data.imageUrl;
        console.log("圖片上傳成功，正在插入編輯器:", fullUrl);
        // 使用 Tiptap 的 command 鏈式操作，這會安全地在「當前游標位置」或「指定位置」插入
        // 如果你的 resizableImage 擴充套件有註冊 insertHtml 或特定的 command，可以直接用。
        // 這裡最保險的做法是利用 Tiptap 的 insertContentAt
        // 檢查節點是否存在
        editor
          .chain()
          .focus()
          .insertContentAt(pos, {
            type: "image",
            attrs: {
              src: fullUrl,
              alt: file.name,
              width: "50%",
              dbId: res.data.id,
            },
          })
          .run();

        // 插入後，立刻手動把最新狀態同步給父組件，防止被父組件舊的 contentJson 覆蓋
        const jsonStr = JSON.stringify(editor.getJSON());

        const htmlStr = editor.getHTML();
        onImageEventSync(jsonStr, htmlStr, currentJournalId);
      }
    } catch (err) {
      console.error("圖片上傳失敗", err);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      JournalImageExtension.configure({
        onImageEventSync: onImageEventSync,
      } as any),
    ],
    content: content ? JSON.parse(content) : "",
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[400px] p-6 border rounded-xl bg-white shadow-inner",
      },
      // 1. 攔截拖放事件
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFiles = files.filter((file) =>
          file.type.startsWith("image/"),
        );

        if (imageFiles.length > 0) {
          event.preventDefault(); // 阻止默認的拖放行為
          (async () => {
            // 用當前游標當作起始點
            let currentPos = view.state.selection.anchor;

            // 使用 for...of 確保順序性
            for (const file of imageFiles) {
              await uploadAndInsertImage(view, file, currentPos);
              // 每插入一張圖，游標位置往後移動 1 個節點長度，防止下一張圖跟它重疊
              currentPos += 1;
            }
          })();
          return true;
        }
        return false;
      },
      // 2. 攔截剪貼簿貼上事件
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files || []);
        const imageFiles = files.filter((file) =>
          file.type.startsWith("image/"),
        );
        const pos = view.state.selection.anchor;

        if (imageFiles.length > 0) {
          event.preventDefault(); // 阻止默認的貼上行為
          imageFiles.forEach((file, index) => {
            uploadAndInsertImage(view, file, pos + index);
          });
          return true;
        }

        return false;
      },
    },
    onUpdate({ editor }) {
      const jsonStr = JSON.stringify(editor.getJSON());
      const htmlStr = editor.getHTML();
      onChange(jsonStr, htmlStr);
    },
  });

  //當父組件因為「還原草稿」或「發布成功重置」改變 content 時，才主動更新編輯器
  useEffect(() => {
    if (!editor) return;

    const currentEditorJson = JSON.stringify(editor.getJSON());
    // 只有當傳進來的 content 與編輯器當前內容不一致時（代表是外部強行改變），才做 commands.setContent
    if (content && content !== currentEditorJson) {
      editor.commands.setContent(JSON.parse(content), { emitUpdate: false });
    } else if (
      !content &&
      currentEditorJson !== '{"type":"doc","content":[{"type":"paragraph"}]}'
    ) {
      // 如果父組件清空了內容（正式發布成功重置），編輯器也跟著清空
      editor.commands.clearContent();
    }
  }, [content, editor]);
  return <EditorContent editor={editor} />;
};
