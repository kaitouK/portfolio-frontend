import { useState, useEffect, useCallback, useRef } from "react";
import { getArtworks, deleteArtwork } from "./artworkService";
import type { ArtworkDto } from "./types";
import { appendUniqueById } from "../../utils/artworkHelpers";

// loadUntil 最多補幾輪（後端每輪最多 300 筆），避免目標不存在時無限載入
const MAX_LOAD_UNTIL_ROUNDS = 10;

interface PagingState {
  artworks: ArtworkDto[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export const useArtworks = (limit: number = 10) => {
  const [artworks, setArtworks] = useState<ArtworkDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  //分頁控制狀態
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);

  // stateRef：loadUntil 在 await 之後要讀「最新」的清單與游標，
  // 但閉包裡的 state 是當初那次 render 的舊值，所以用 ref 同步保存一份
  const stateRef = useRef<PagingState>({
    artworks: [],
    nextCursor: null,
    hasNextPage: true,
  });
  // inFlightRef：進行中的請求；有值代表載入中。
  // 原本的 loadingRef 只能「載入中就放棄」，改存 Promise 後 loadUntil 可以等它結束再接著載
  const inFlightRef = useRef<Promise<void> | null>(null);

  // 同時更新 state 與 stateRef，兩邊才不會不同步
  const commit = useCallback((next: PagingState) => {
    stateRef.current = next;
    setArtworks(next.artworks);
    setNextCursor(next.nextCursor);
    setHasNextPage(next.hasNextPage);
  }, []);

  // 發一次請求並登記為 inFlight；cursor 為 null 代表從第一頁重新載入
  const runFetch = useCallback(
    (cursor: string | null, untilId: number | null = null): Promise<void> => {
      const task = (async () => {
        setLoading(true);
        try {
          const result = await getArtworks(limit, cursor, untilId);
          if (result.success && result.data) {
            const { data, nextCursor: newCursor, hasNextPage: hasNext } = result.data;
            // 如果是第一頁(或重新整理)就直接覆蓋；否則就去重後累加到陣列後方
            commit({
              artworks: cursor ? appendUniqueById(stateRef.current.artworks, data) : data,
              nextCursor: newCursor || null,
              hasNextPage: hasNext ?? false,
            });
            setError(null);
          } else {
            setError(result.message || "載入失敗");
          }
        } catch (err) {
          console.error("載入作品失敗", err);
          setError("系統錯誤，請稍後再試");
        } finally {
          setLoading(false);
        }
      })();
      inFlightRef.current = task;
      // 請求結束後清掉登記（先註冊，所以會比呼叫方的 await 先執行）
      void task.finally(() => {
        if (inFlightRef.current === task) inFlightRef.current = null;
      });
      return task;
    },
    [limit, commit],
  );

  //取得資料
  // 使用 useCallback 避免不必要的重新渲染
  const fetchArtworks = useCallback(
    async (cursor: string | null = null, isRefresh = false) => {
      // 正在載入就直接回傳（跳轉要等待請改用 loadUntil）
      if (inFlightRef.current) return;
      await runFetch(isRefresh ? null : cursor);
    },
    [runFetch],
  );

  /**
   * 一路載入到指定作品為止（左側縮圖跳轉用）
   * @returns 清單裡有這張作品就回傳 true；作品不存在或載入失敗回傳 false
   */
  const loadUntil = useCallback(
    async (artworkId: number): Promise<boolean> => {
      for (let round = 0; round < MAX_LOAD_UNTIL_ROUNDS; round++) {
        // 先等進行中的請求（例如無限捲動）結束，跳轉才不會被丟掉
        while (inFlightRef.current) await inFlightRef.current;

        const current = stateRef.current;
        if (current.artworks.some((a) => a.artworkId === artworkId)) return true;
        if (!current.hasNextPage) return false;

        const countBefore = current.artworks.length;
        await runFetch(current.nextCursor, artworkId);
        // 沒有任何進展（請求失敗）就停止，不要一直重打
        if (stateRef.current.artworks.length === countBefore) return false;
      }
      return stateRef.current.artworks.some((a) => a.artworkId === artworkId);
    },
    [runFetch],
  );

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
        commit({
          ...stateRef.current,
          artworks: stateRef.current.artworks.filter((art) => art.artworkId !== artworkId),
        });
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
    commit({
      ...stateRef.current,
      artworks: stateRef.current.artworks.map((a) =>
        a.artworkId === artworkId ? { ...a, ...updatedFields } : a,
      ),
    });
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
    loadUntil,
    removeArtwork,
    updateLocalArtwork,
    refresh,
  };
};
