import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import ResizeImage from "tiptap-extension-resize-image";
import { useRef, useState } from "react";
import apiService from "../../api/interceptor";

interface PostItem {
  id: string | number;
  title: string;
}
// 1. 定義 Props 介面，解決傳入 onPublish 的報錯
interface ArtEditorProps {
  onPublish: (htmlContent: string, images: string[]) => void;
  posts?: PostItem[];
  onDelete?: (postId: string | number) => void;
}

const ArtEditor = ({ onPublish, posts = [], onDelete }: ArtEditorProps) => {
  // 記錄使用者上傳的圖片 (用於 Twitter 風格的圖片網格)
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [selectedPostId, setSelectedPostId] = useState<string | number>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      ResizeImage,
    ],
    content: "", // 初始內容設為空或提示字
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[200px] p-4 border rounded border-gray-400 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold",
      },
    },
  });

  // 模擬圖片選擇與上傳
  const uploadImageFile = async (
    file: File,
    journalId: string,
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 呼叫後端 JournalController.UploadImage
      const res = await apiService.post<any, any>(
        `/journal/image?journalId=${journalId}`,
        formData,
      );
      if (res && res.success && res.data) {
        return res.data.imageUrl; // 回傳相對路徑，如 /uploads/journal/xxx.webp
      }
    } catch (error) {
      console.error("圖片上傳失敗", error);
    }
    return null;
  };
  const handleImageUploadClick = () => {
    fileInputRef.current?.click(); // 觸發點擊隱藏的 input
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    // 這裡的 journalId 先假設為 "temp"（或從 Props/Context 取得實際的 ID）
    const journalId = "temp"; // 產生一個 GUID 作為 journalId
    const uploadedUrl = await uploadImageFile(file, journalId);

    if (uploadedUrl) {
      // 3a. 將圖片插入 Tiptap 編輯器游標所在位置
      editor.chain().focus().setImage({ src: uploadedUrl }).run();

      // 3b. 同時同步到你的 Twitter 風格圖片狀態中（如果你需要的話）
      setImageUrls((prev) => [...prev, uploadedUrl]);
    }

    // 清空 input 讓同一張圖可以重複選取觸發 change
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  // 處理發佈
  const handleInternalPublish = () => {
    if (!editor) return;

    const html = editor.getHTML();
    // 檢查是否內容為空 (Tiptap 預設空內容會帶有 <p></p>)
    if (html === "<p></p>" && imageUrls.length === 0) return;

    // 呼叫父組件傳進來的函數
    onPublish(html, imageUrls);

    // 清空編輯器
    editor.commands.clearContent();
    setImageUrls([]);
  };

  // 刪除既有貼文
  const handleInternalDelete = () => {
    if (!selectedPostId) {
      alert("選擇要刪除的貼文");
      return;
    }

    if (onDelete) {
      onDelete(selectedPostId);
      setSelectedPostId(""); //刪除後重置篩選器
    }
  };

  return (
    <div className="w-full">
      {/*選擇既有貼文與刪除的區塊*/}
      {posts.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <label
            htmlFor="post-select"
            className="text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            管理既有貼文：
          </label>
          <select
            id="post-select"
            className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={selectedPostId}
            onChange={(e) => setSelectedPostId(e.target.value)}
          >
            <option value="">-- 請選擇貼文 --</option>
            {posts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleInternalDelete}
            disabled={!selectedPostId}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition disabled:opacity-40"
          >
            刪除貼文
          </button>
        </div>
      )}
      {/* 編輯器本體 */}
      <EditorContent editor={editor} />

      {/* 已選擇圖片預覽 (簡單呈現) */}
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {imageUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              className="w-20 h-20 object-cover rounded-lg border"
              alt="preview"
            />
          ))}
        </div>
      )}

      {/* 工具欄與發佈按鈕 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive("bold") ? "text-blue-500" : "text-gray-500"}`}
            title="粗體"
          >
            <span className="font-bold">B</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={handleImageUploadClick}
            className="p-2 text-gray-500 rounded hover:bg-gray-100"
            title="加入圖片"
          >
            ＋
          </button>
        </div>

        <button
          onClick={handleInternalPublish}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-bold transition disabled:opacity-50"
          disabled={!editor || (editor.isEmpty && imageUrls.length === 0)}
        >
          發佈
        </button>
      </div>
    </div>
  );
};

export default ArtEditor;
