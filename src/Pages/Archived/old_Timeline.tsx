import { useState } from "react";
import ArtEditor from "./ArtEditor";
import DOMPurify from "dompurify";

interface Post {
  id: string;
  content: string;
  imageUrls: string[];
  createdAt: Date;
}

const Timeline = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  //將HTML轉為純文字並限制字數
  const getPostPreviewText = (htmlContent: string) => {
    if (typeof window === "undefined") return "新貼文";
    const doc = new DOMParser().parseFromString(htmlContent, "text/html");
    const text = doc.body.textContent || doc.body.innerText || "";
    // 取前 20 個字，如果超過就加 ...
    return text.trim().length > 0
      ? text.length > 20
        ? text.substring(0, 20) + "..."
        : text
      : "無文字內容 (僅圖片)";
  };

  // 假設這是從編輯器獲取內容並儲存的邏輯
  const handlePublish = (htmlContent: string, images: string[]) => {
    const newPost: Post = {
      id: Date.now().toString(),
      content: htmlContent,
      imageUrls: images,
      createdAt: new Date(),
    };
    setPosts([newPost, ...posts]); // 新貼文放在最上面
  };

  // 處理刪除貼文的邏輯
  const handleDelete = (id: string | number) => {
    if (window.confirm("確定要刪除這篇貼文嗎？")) {
      setPosts((prev) => prev.filter((post) => post.id !== id));
      alert("刪除成功");
    }
  };

  const editorPostsProps = posts.map((post) => ({
    id: post.id,
    title: `[${post.createdAt.toLocaleDateString()}] ${getPostPreviewText(post.content)}`,
  }));

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-100 min-h-screen bg-white">
      {/* 頂部標題 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md p-4 border-b border-gray-100 z-10">
        <h1 className="text-xl font-bold">繪畫歷程日誌</h1>
      </div>

      {/* 發佈區 */}
      <div className="p-4 border-b-8 border-gray-50">
        <ArtEditor
          onPublish={handlePublish}
          posts={editorPostsProps}
          onDelete={handleDelete}
        />
        {/* 這裡的 ArtEditor 內部應包含上傳圖片的按鈕與發佈按鈕 */}
      </div>

      {/* 貼文串流區 */}
      <div className="divide-y divide-gray-100">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            目前還沒有任何歷程日誌，來發第一篇文吧！
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="p-4 hover:bg-gray-50 transition cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">
                      {post.createdAt.toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-gray-400 hover:text-red-500 text-xs transition"
                    title="刪除此貼文"
                  >
                    ✕
                  </button>
                </div>

                {/* 顯示富文本內容 */}
                <article
                  className="prose prose-slate mt-2 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(post.content),
                  }}
                />

                {/* 顯示圖片網格 (Twitter 風格) */}
                {post.imageUrls.length > 0 && (
                  <div
                    className={`mt-3 grid gap-2 ${post.imageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                  >
                    {post.imageUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        className="rounded-2xl border border-gray-200 w-full h-64 object-cover"
                        alt="畫作內容"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Timeline;
