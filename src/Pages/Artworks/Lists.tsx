import { useState, useRef, useCallback } from "react";
import { useArtworks } from "../../hooks/useArtworks";
import { getFullImageUrl } from "./getArtworkInfo";
import type { ArtworkDto } from "../../types/Interface";
import { useCategories } from "../../hooks/useCategories";
import ArtworkCard from "./ArtworkCard";
import EditArtworkModal from "./EditAndDelete";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Captions, Thumbnails } from "yet-another-react-lightbox/plugins";

const ArtworkGallery = () => {
  const {
    artworks,
    loading,
    error,
    removeArtwork,
    updateLocalArtwork,
    hasNextPage,
    loadMore,
  } = useArtworks(10);
  const { categories, loading: categoriesLoading } = useCategories(); // 獲取類別列表

  const [index, setIndex] = useState<number>(-1); // Lightbox 的當前圖片索引，初始值為 -1 表示 Lightbox 關閉
  const [editingArt, setEditingArt] = useState<ArtworkDto | null>(null); // 用於編輯的作品資料
  const observer = useRef<IntersectionObserver | null>(null); //建立 Intersection Observer 的無限滾動邏輯
  const lastArtworkRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return; // 如果正在載入，先不要監聽
      if (observer.current) observer.current.disconnect(); // 取消前一次的監聽

      observer.current = new IntersectionObserver((entries) => {
        // 當目標元素進入畫面（isIntersecting），且還有下一頁時，觸發載入
        if (entries[0].isIntersecting && hasNextPage) {
          loadMore();
        }
      });

      if (node) observer.current.observe(node); // 開始監聽當前節點
    },
    [loading, hasNextPage, loadMore],
  );

  //  修改過渡狀態：只有在「第一次完全沒資料且載入中」才顯示全螢幕載入
  if (loading && artworks.length === 0)
    return <div className="text-center p-10 text-gray-500">載入中...</div>;
  if (error)
    return <div className="text-center p-10 text-red-500">錯誤：{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">作品展示牆</h1>

      {/* 響應式網格 */}
      <div className="flex flex-col items-center gap-12 mt-8 max-w-2xl mx-auto">
        {artworks.map((art, i) => {
          // 計算是否為倒數第 2 張圖
          const isSecondFromLast = artworks.length - 2 === i;

          return (
            // 用一個 div 包裹卡片，並把 ref 綁定在倒數第 2 張圖上
            <div
              key={art.artworkId}
              ref={isSecondFromLast ? lastArtworkRef : null}
              className="w-full"
            >
              <ArtworkCard
                art={art}
                index={i}
                categories={categories}
                onPreview={setIndex}
                onEdit={(e, item) => {
                  e.stopPropagation();
                  setEditingArt(item);
                }}
                onDelete={(e, id) => {
                  e.stopPropagation();
                  removeArtwork(id);
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 底部載入狀態提示 */}
      {loading && (
        <div className="text-center py-6 text-gray-500 animate-pulse">
          正在加載更多作品...
        </div>
      )}
      {!hasNextPage && artworks.length > 0 && (
        <div className="text-center py-6 text-gray-400 text-sm">
          已經到底部囉！
        </div>
      )}

      {/* --- 編輯 Modal --- */}
      {editingArt && (
        <EditArtworkModal
          artwork={editingArt}
          categories={categories}
          categoriesLoading={categoriesLoading}
          onClose={() => setEditingArt(null)}
          onUpdateSuccess={(data) =>
            updateLocalArtwork(editingArt.artworkId, data)
          }
        />
      )}
      {/* --- Lightbox (展示 imageUrl) --- */}
      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        plugins={[Thumbnails, Captions]}
        slides={artworks.map((art) => ({
          src: getFullImageUrl(art.imageUrl), // Lightbox 使用完整圖
          title: art.title,
          description: art.description,
          thumbnail: getFullImageUrl(art.thumbnailUrl || art.imageUrl), // 預覽圖
        }))}
      />
    </div>
  );
};

export default ArtworkGallery;
