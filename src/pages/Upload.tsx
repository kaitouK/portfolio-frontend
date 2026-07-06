import React, {
  useState,
  useEffect,
  type ChangeEvent,
  type DragEvent,
} from "react"; //using type ChangeEvent to
import axios from "axios";
import { Link } from "react-router-dom";
import { useCategories } from "../features/categories/useCategories";
import { uploadArtwork } from "../features/artworks/artworkService";

const ImageUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false); // 新增：拖曳狀態
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories(); // 使用自定義 Hook 獲取類別列表
  const [categoryId, setCategoryId] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [completionDate, setCompletionDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  ); // 新增：完成日期，預設為今天
  const fileInputRef = React.useRef<HTMLInputElement>(null); // 新增：用於操作檔案輸入框的DOM

  useEffect(() => {
    if (categories.length > 0 && categoryId === 0) {
      setCategoryId(categories[0].categoryId);
    }
  }, [categories, categoryId]);

  // 監控selectedFile 變化產生預覽圖
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    // 建立暫時性 URL
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // 元件卸載或檔案改變時釋放記憶體
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  //統一的檔案驗證邏輯
  const validateAndSetFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
    } else {
      alert("請選取圖片檔案！");
      clearFile();
    }
  };

  // 清除檔案選取狀態的函式
  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // 強制清空 input 欄位
    }
  };
  // 拖曳事件處理函式
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // 處理檔案選取事件，確保 TypeScript 知道 selectedFile 不會是 null
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile) {
      alert("請先選取檔案！");
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      alert("請選取圖片檔案！");
      setSelectedFile(null);
      return;
    }

    const formData = new FormData();

    formData.append("File", selectedFile);
    formData.append("Title", title.trim() === "" ? "Untitled" : title);
    formData.append("CategoryId", categoryId.toString()); // 預設類別 ID 為 0
    formData.append("Description", description);
    formData.append("CompletionDate", completionDate); // 完成日期

    try {
      const response = await uploadArtwork(formData);

      const { success, data, message } = response;
      if (success && data) {
        alert(`上傳成功！\n標題：${data.title}`);
        clearFile(); // 上傳成功後清除選取的檔案
      } else {
        alert(`上傳失敗：${message}`);
      }
    } catch (error) {
      // 在 TS 中，error 預設是 unknown，需做處理
      if (axios.isAxiosError(error)) {
        console.error("上傳失敗:", error.response?.data || error.message);
      } else {
        console.error("發生意外錯誤:", error);
      }
    }
  };

  //顯示出網頁架構的部分，CSS寫在這裡
  return (
    <div className="flex flex-col gap-6 p-10 bg-white rounded-2xl shadow-2xl transition-all duration-300 max-w-lg mx-auto mt-10">
      <h2 className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-emerald-400">
        圖片上傳
      </h2>
      <div className="flex flex-col gap-4 text-lg font-semibold text-gray-700">
        {/* 拖曳與預覽區域 */}

        <div
          className={`relative w-full min-h-64 border-4 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
            ${isDragging ? "border-emerald-400 bg-emerald-50 scale-[1.01]" : "border-blue-100 bg-gray-50"}
            ${previewUrl ? "border-solid" : "h-64"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !previewUrl && fileInputRef.current?.click()} // 點擊區域也能觸發選取
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Preview"
                className="object-contain w-full h-auto max-h-150 rounded-lg"
              />
              {/* 圖片上方的遮罩，只有在有預覽圖時才顯示，提供更換圖片的提示 */}
              <div
                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-white text-sm font-bold">更換圖片</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 shadow-md"
              >
                ✕
              </button>
            </>
          ) : (
            <div className="text-center pointer-events-none">
              <div className="text-4xl mb-2">+</div>
              <p className="text-gray-400 text-sm">點擊或拖曳圖片到此處上傳</p>
            </div>
          )}
        </div>

        {/* 輸入區域 */}
        <div>
          <label className="block mb-1">標題 (Title)</label>
          <input
            type="text"
            placeholder="預設為 Untitled"
            className="w-full p-2 border-2 border-blue-100 rounded-lg focus:outline-none focus:border-blue-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1">完成日期 (Completion Date)</label>
          <input
            type="date"
            className="w-full p-2 border-2 border-blue-100 rounded-lg focus:outline-none focus:border-blue-400"
            value={completionDate}
            onChange={(e) => setCompletionDate(e.target.value)}
          />
        </div>
        {/* 類別選擇區域 */}
        <div>
          <label className="block mb-1 text-gray-700">分類標籤</label>
          <select
            className="w-full p-2 border-2 border-blue-100 rounded-lg text-base"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))} // 轉回數字送給後端
            disabled={categoriesLoading || categoriesError !== null} // 載入中或有錯誤時禁用選單
          >
            {categoriesLoading ? (
              <option value={0}>載入中...</option>
            ) : (
              categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </option>
              ))
            )}
          </select>
        </div>
        {/* 描述輸入區域 */}
        <div>
          <label className="block mb-1">描述 (Description)</label>
          <textarea
            placeholder="請輸入圖片描述"
            className="w-full p-2 border-2 border-blue-100 rounded-lg focus:outline-none focus:border-blue-400"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {/* 檔案選取與清除資訊 */}
        <div>
          <label className="block mb-1">選擇檔案</label>
          <input
            ref={fileInputRef} // 綁定 ref
            type="file"
            accept="image/*"
            className="hidden" // 隱藏原生檔案輸入框，改由拖曳區域觸發
            onChange={handleFileChange}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => fileInputRef.current?.click()} // 點擊按鈕觸發選取
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold hover:bg-blue-100 transition-colors"
            >
              +
            </button>
            {selectedFile && (
              <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                <span className="text-xs text-gray-500 truncate max-w-37.5">
                  {selectedFile.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="text-red-500 hover:text-red-700 font-bold ml-1 text-lg"
                  title="清除檔案"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 控制按鈕 */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleUpload}
          className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform active:scale-95"
        >
          上傳到伺服器
        </button>

        {selectedFile && (
          <p className="text-sm text-center text-gray-400 italic">
            準備上傳：{selectedFile.name}
          </p>
        )}

        <Link
          to="/"
          className="text-center text-blue-400 hover:text-blue-600 font-bold transition-colors"
        >
          ← 返回首頁
        </Link>
      </div>
    </div>
  );
};

export default ImageUploader;
