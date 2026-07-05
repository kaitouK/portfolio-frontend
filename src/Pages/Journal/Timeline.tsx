import { useEffect, useState } from "react";
import { JournalEditorContainer } from "./JournalEditorContainer";
import DOMPurify from "dompurify";
import apiService from "../../api/interceptor";
import { useAuth } from "../../context/AuthContext";

interface Post {
  id: string; //  journalId
  title: string;
  content: string; // 儲存 HTML 字串以利渲染
  jsonContent?: string; // 選擇性儲存：TiPTAP 的 JSON 結構格式
  imageUrls: string[];
  tags: string[];
  status: number;
  createdAt: Date;
}

const Timeline2 = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);
  const { auth } = useAuth();
  const isAdmin = auth.isAuthenticated && auth.role === "admin";
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsTimelineLoading(true);

        const res = await apiService.get<any, any>("/journal");
        if (res.success && Array.isArray(res.data)) {
          // 2. 完美的欄位對齊轉換
          const formattedPosts: Post[] = res.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            content: item.contentHtml, // 將後端的 contentHtml 帶入前端渲染欄位
            jsonContent: item.contentJson,
            imageUrls: item.imageUrls || [], // 直接使用後端給的圖片陣列
            tags: item.tags || [],
            status: item.status,
            // 將後端的 DateTimeOffset 字串轉回前端 Date 物件
            createdAt: new Date(item.createdAt),
          }));
          setPosts(formattedPosts);
        }
      } catch (err) {
        console.error("撈取時間軸貼文失敗:", err);
      } finally {
        setIsTimelineLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handlePublishSuccess = (newJournal: {
    id: string;
    title: string;
    contentHtml: string;
    contentJson: string;
    tags: string[];
  }) => {
    const imgTags =
      newJournal.contentHtml.match(/<img[^>]+src="([^">]+)"/g) || [];
    const images = imgTags
      .map((tag) => {
        const match = tag.match(/src="([^">]+)"/);
        return match ? match[1] : "";
      })
      .filter(Boolean);
    const newPost: Post = {
      id: newJournal.id,
      title: newJournal.title,
      content: newJournal.contentHtml,
      jsonContent: newJournal.contentJson,
      imageUrls: images,
      tags: newJournal.tags,
      status: 1, // 既然觸發 PublishSuccess，狀態一定是已發布 (1)
      createdAt: new Date(),
    };

    setPosts([newPost, ...posts]);
  };

  // 處理刪除貼文的邏輯
  const handleDelete = async (id: string | number) => {
    if (window.confirm("確定要刪除這篇貼文嗎？")) {
      try {
        const res = await apiService.delete<any, any>(`/journal/${id}`);
        if (res.success) {
          setPosts((prev) => prev.filter((post) => post.id !== id));
        } else {
          alert("刪除失敗：" + (res.message || "未知錯誤"));
        }
      } catch (err) {
        console.error("刪除失敗", err);
        alert("刪除失敗，請稍後再試");
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-100 min-h-screen bg-white">
      {/* 頂部標題 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md p-4 border-b border-gray-100 z-10">
        <h1 className="text-xl font-bold">繪畫歷程日誌</h1>
      </div>

      {/* 發佈區 */}
      {isAdmin && (
        <div className="p-4 border-b-8 border-gray-50">
          <JournalEditorContainer onPublishSuccess={handlePublishSuccess} />
        </div>
      )}

      {/* 貼文串流區 */}
      <div className="divide-y divide-gray-100">
        {isTimelineLoading ? (
          // 載入中的骨架屏或文字
          <div className="p-8 text-center text-gray-400 text-sm">
            正在載入歷程日誌...
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            目前還沒有任何歷程日誌，晚點再來！
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
                    <h2 className="font-bold text-gray-800">{post.title}</h2>
                    <span className="text-gray-400 text-xs">·</span>
                    <span className="text-gray-500 text-sm">
                      {post.createdAt.toLocaleDateString()}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-gray-400 hover:text-red-500 text-xs transition"
                      title="刪除此貼文"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {/* 顯示標籤 */}
                {post.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs text-blue-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 顯示富文本內容 */}
                <article
                  className="prose prose-slate mt-2 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(post.content),
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Timeline2;
