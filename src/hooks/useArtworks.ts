import { useState, useEffect } from "react";
import { getArtworks, deleteArtwork } from "../Pages/Artworks/artworkService";
import type { ArtworkDto } from "../types/Interface";
export const useArtworks = () => {
  const [artworks, setArtworks] = useState<ArtworkDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  //取得資料
  const fetchArtworks = async () => {
    setLoading(true);
    try {
      const result = await getArtworks();
      if (result.success && result.data) {
        // --- 排序邏輯：新到舊 ---
        const sortedData = [...result.data].sort((a, b) => {
          const dateA = a.completionDate
            ? new Date(a.completionDate).getTime()
            : 0;
          const dateB = b.completionDate
            ? new Date(b.completionDate).getTime()
            : 0;
          return dateB - dateA; // 後者減前者 = 降序排序 (新到舊)
        });
        setArtworks(sortedData);
      } else {
        setError(result.message || "載入失敗");
      }
    } catch (err) {
      setError("系統錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  //刪除邏輯
  const removeArtwork = async (artworkId: number) => {
    if (!window.confirm("確定要刪除這件作品嗎？")) return;
    try {
      const result = await deleteArtwork(artworkId);
      if (result.success) {
        setArtworks(artworks.filter((art) => art.artworkId !== artworkId));
        return true;
      } else {
        alert(result.message || "刪除失敗");
        return false;
      }
    } catch (err) {
      alert("系統錯誤，請稍後再試");
      return false;
    }
  };

  //更新本地狀態 (同步Modal成功後的UI)
  const updateLocalArtwork = (
    artworkId: number,
    updatedFields: Partial<ArtworkDto>,
  ) => {
    setArtworks((prev) =>
      prev.map((a) =>
        a.artworkId === artworkId ? { ...a, ...updatedFields } : a,
      ),
    );
  };
  useEffect(() => {
    fetchArtworks();
  }, []);
  return {
    artworks,
    loading,
    error,
    removeArtwork,
    updateLocalArtwork,
    refresh: fetchArtworks,
  };
};
