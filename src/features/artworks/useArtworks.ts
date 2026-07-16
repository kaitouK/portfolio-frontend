import { useState, useEffect, useCallback, useRef } from "react";
import { getArtworks, deleteArtwork } from "./artworkService";
import type { ArtworkDto } from "./types";
export const useArtworks = (limit: number = 10, tags: string[] = []) => {
  const tagsKey = tags.join(",");
  const [artworks, setArtworks] = useState<ArtworkDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  //分頁控制狀態
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);


  //取得資料
  // 使用 useCallback 避免不必要的重新渲染
  const loadingRef = useRef(false);
  const fetchArtworks = useCallback(async (cursor: string | null = null, isRefresh = false) => {
    // 如果不是重新整理，且正在載入或已經沒有下一頁，就直接回傳
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const currentCursor = isRefresh ? null : cursor;
      const result = await getArtworks(limit, currentCursor, tagsKey ? tagsKey.split(",") : []);
      if (result.success && result.data) {
        const { data, nextCursor: newCursor, hasNextPage: hasNext } = result.data;
        // 如果是第一頁(或重新整理)就直接覆蓋；否則就累加到陣列後方
        setArtworks((prev) => (currentCursor ? [...prev, ...data] : data));
        setNextCursor(newCursor || null);
        setHasNextPage(hasNext ?? false);
        setError(null);
      } else {
        setError(result.message || "載入失敗");
      }
    } catch (err) {
      console.error("載入作品失敗", err);
      setError("系統錯誤，請稍後再試");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [limit, tagsKey]);
  // 提供給外部的主動重新整理函式
  const refresh = () => {
    fetchArtworks(null, true);
  };
  // 載入下一頁的便捷函式
  const loadMore = () => {
    if (hasNextPage && !loading) {
      fetchArtworks(nextCursor);
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
      console.error("載入作品失敗", err);
      setError("系統錯誤，請稍後再試");
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
  //初始載入第一頁
  useEffect(() => {
    fetchArtworks(null);
  }, [fetchArtworks]);
  return {
    artworks,
    loading,
    error,
    hasNextPage,
    loadMore,
    removeArtwork,
    updateLocalArtwork,
    refresh,
  };
};
