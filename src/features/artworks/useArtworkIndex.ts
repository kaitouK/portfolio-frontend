import { useState, useEffect, useCallback } from "react";
import { getArtworkIndex } from "./artworkService";
import type { ArtworkIndexItem } from "./types";

// 左側縮圖欄用的作品索引（一次拿全部，排序與中間分頁相同）
export const useArtworkIndex = () => {
  const [items, setItems] = useState<ArtworkIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 改變這個數字就會讓下面的 useEffect 重新抓一次
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false; // 元件卸載或重新抓取時，丟掉舊請求的結果
    const fetch = async () => {
      try {
        const response = await getArtworkIndex();
        if (cancelled) return;
        if (response.success && response.data) {
          setItems(response.data);
          setError(null);
        } else setError(response.message || "取得作品索引失敗");
      } catch (err) {
        if (cancelled) return;
        console.error("載入作品索引失敗", err);
        setError("系統錯誤，請稍後再試");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const removeItem = useCallback((artworkId: number) => {
    setItems((prev) => prev.filter((item) => item.artworkId !== artworkId));
  }, []);

  const updateItemTitle = useCallback((artworkId: number, title: string) => {
    setItems((prev) =>
      prev.map((item) => (item.artworkId === artworkId ? { ...item, title } : item)),
    );
  }, []);

  return { items, loading, error, removeItem, updateItemTitle, reload };
};
