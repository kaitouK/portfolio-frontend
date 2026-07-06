import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import React, { useRef, useState } from "react";
import { deleteJournalImage } from "../journalService";

export const JournalImageNodeView = (props: NodeViewProps) => {
  // 從 props 中解構出節點屬性與刪除節點的方法
  const { src, alt, width, dbId } = props.node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免觸發編輯器的選取事件

    if (dbId) {
      try {
        await deleteJournalImage(dbId);
        console.log("後端圖片刪除成功");
      } catch (error) {
        console.error("刪除後端圖片失敗", error);
      }
    }

    // 呼叫 Tiptap 內建的方法，將此圖片節點從編輯器中拔除
    props.deleteNode();
    // 連鎖即時儲存：從 options 中撈出同步方法
    const syncCallback = props.extension.options.onImageEventSync;

    if (props.editor && typeof syncCallback === "function") {
      // 由於 deleteNode() 之後編輯器的 State 需要一個微小的 Tick 更新，
      // 我們用 setTimeout(..., 0) 確保拿到的 JSON 是「已經沒有那張圖片」的最新狀態！
      setTimeout(() => {
        const latestJson = JSON.stringify(props.editor.getJSON());
        const latestHtml = props.editor.getHTML();

        console.log("🔴 圖片已刪除，正在觸發後端即時草稿儲存...");
        // 呼叫父組件的 saveDraftImmediately 路線！
        syncCallback(latestJson, latestHtml);
      }, 0);
    }
  };
  const handleResizeMouseDown = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    mouseDownEvent.stopPropagation(); // 阻止觸發 Tiptap 的拖拽移動

    if (!containerRef.current || !props.editor) return;

    setIsResizing(true);

    // 取得圖片容器當前的像素寬度
    const startWidth = containerRef.current.offsetWidth;
    // 取得編輯器本體的總像素寬度（作為分母來算百分比）
    const editorWidth = props.editor.view.dom.clientWidth;
    const startX = mouseDownEvent.clientX;

    // 滑鼠移動時的動態計算
    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      const currentX = mouseMoveEvent.clientX;
      // 計算滑鼠水平位移量
      const deltaX = currentX - startX;

      // 算出新的像素寬度，並限制最小與最大範圍 (例如 15% ~ 100%)
      let newWidthPx = startWidth + deltaX;
      let newPercentage = (newWidthPx / editorWidth) * 100;

      if (newPercentage < 15) newPercentage = 15;
      if (newPercentage > 100) newPercentage = 100;

      // 💡 即時將新的寬度百分比寫入 Tiptap 節點屬性中
      props.updateAttributes({
        width: `${Math.round(newPercentage)}%`,
      });
    };

    // 滑鼠放開時放鎖，並移除全域監聽器
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // 💡 縮放結束後，觸發一次即時草稿儲存，把最新的 width JSON 送回後端！
      const syncCallback = props.extension.options.onImageEventSync;
      if (props.editor && typeof syncCallback === "function") {
        syncCallback(
          JSON.stringify(props.editor.getJSON()),
          props.editor.getHTML(),
        );
      }
    };

    // 因為滑鼠可能會滑出圖片外面，所以必須把監聽器掛在 document 全域
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <NodeViewWrapper className="w-full inline-block my-2">
      <div
        ref={containerRef}
        className={`relative inline-block group border-2 transition-colors duration-200 ${
          isResizing
            ? "border-blue-500"
            : "border-transparent hover:border-gray-300"
        }`}
        style={{ width: width || "50%" }}
        draggable={!isResizing} // 當正在縮放時，關閉 data-drag-handle，避免移動與縮放衝突
        data-drag-handle //  告訴 Tiptap 抓起這裡等於移動整個圖片節點！
      >
        {/* 圖片本體 */}
        <img
          src={src}
          alt={alt || "日誌圖片"}
          draggable={false}
          data-db-id={dbId}
          className="rounded-lg border border-gray-200 w-full object-cover transition group-hover:shadow-md"
        />

        {/* 🔴 黏在圖片右上角的刪除按鈕 (預設隱藏，滑鼠 hover 時顯示) */}
        <button
          type="button"
          onClick={handleDelete}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100 flex items-center justify-center z-10"
          title="刪除圖片"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
        {/* 📐 ✨ 隱藏的右側邊緣縮放手把線 */}
        <div
          onMouseDown={handleResizeMouseDown}
          className={`absolute top-0 right-0 h-full w-2 cursor-col-resize z-20 transition-colors ${
            isResizing ? "bg-blue-500/50" : "hover:bg-blue-400/30"
          }`}
          title="按住左右拖動可調整大小"
        />
      </div>
    </NodeViewWrapper>
  );
};
