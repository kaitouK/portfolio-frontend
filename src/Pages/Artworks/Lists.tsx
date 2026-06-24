import { useState } from "react";
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
  const { artworks, loading, error, removeArtwork, updateLocalArtwork } =
    useArtworks();
  const { categories, loading: categoriesLoading } = useCategories(); // 獲取類別列表

  const [index, setIndex] = useState<number>(-1); // Lightbox 的當前圖片索引，初始值為 -1 表示 Lightbox 關閉
  const [editingArt, setEditingArt] = useState<ArtworkDto | null>(null); // 用於編輯的作品資料

  if (loading)
    return <div className="text-center p-10 text-gray-500">載入中...</div>;
  if (error)
    return <div className="text-center p-10 text-red-500">錯誤：{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">作品展示牆</h1>

      {/* 響應式網格 */}
      <div className="flex flex-col items-center gap-12 mt-8 max-w-2xl mx-auto">
        {artworks.map((art, i) => (
          <ArtworkCard
            key={art.artworkId}
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
        ))}
      </div>

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
