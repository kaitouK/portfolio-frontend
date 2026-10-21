import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useArtworks } from "../features/artworks/useArtworks";
import { useArtworkIndex } from "../features/artworks/useArtworkIndex";
import { getFullImageUrl, toDateInputValue } from "../utils/artworkHelpers";
import type { ArtworkDto } from "../features/artworks/types";
import { useCategories } from "../features/categories/useCategories";
import ArtworkCard from "../features/artworks/ArtworkCard";
import ArtworkThumbnailGrid from "../features/artworks/ArtworkThumbnailGrid";
import EditArtworkModal from "../features/artworks/EditArtworkModal";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Captions, Thumbnails } from "yet-another-react-lightbox/plugins";

// 捲動同步高亮：畫面上方 30%～40% 這條帶狀區裡的卡片就是「目前在看的作品」
const SCROLL_SPY_MARGIN = "-30% 0px -60% 0px";
const URL_SYNC_DELAY_MS = 300;

const parseArtParam = (value: string | null): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const ArtworkGallery = () => {
  const {
    artworks,
    loading,
    error,
    removeArtwork,
    updateLocalArtwork,
    hasNextPage,
    loadMore,
    loadUntil,
    refresh,
  } = useArtworks(10);
  const {
    items: indexItems,
    loading: indexLoading,
    removeItem,
    updateItemTitle,
    reload: reloadIndex,
  } = useArtworkIndex();
  const { categories, loading: categoriesLoading } = useCategories(); // 獲取類別列表
  const [searchParams, setSearchParams] = useSearchParams();

  const [index, setIndex] = useState<number>(-1); // Lightbox 的當前圖片索引，初始值為 -1 表示 Lightbox 關閉
  const [editingArt, setEditingArt] = useState<ArtworkDto | null>(null); // 用於編輯的作品資料
  const [activeId, setActiveId] = useState<number | null>(null); // 目前在看的作品（左側高亮）
  const [drawerOpen, setDrawerOpen] = useState(false); // 小螢幕縮圖抽屜
  // 進頁面時網址帶的 ?art=，只在第一次 render 讀取
  const [initialArtId] = useState(() => parseArtParam(searchParams.get("art")));

  const listRef = useRef<HTMLDivElement>(null); // 中間卡片清單，用 data-artwork-id 找卡片
  // pendingScrollRef：要捲到的作品還沒渲染出來時先記在這裡，等卡片出現後由 effect 捲過去
  const pendingScrollRef = useRef<number | null>(null);
  // 帶 ?art= 進來時，跳轉完成前不要把網址同步回去（不然會被第一張作品覆蓋）
  const deepLinkPendingRef = useRef(initialArtId !== null);
  const deepLinkStartedRef = useRef(false);

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

  const findCard = useCallback(
    (artworkId: number) =>
      listRef.current?.querySelector<HTMLElement>(
        `[data-artwork-id="${artworkId}"]`,
      ) ?? null,
    [],
  );

  // 捲到指定作品；還沒載入就先用 loadUntil 一次補齊到那張
  const scrollToArtwork = useCallback(
    async (artworkId: number): Promise<boolean> => {
      const element = findCard(artworkId);
      if (element) {
        // 近的用平滑捲動；太遠就直接跳（長距離平滑捲動途中圖片陸續載入，落點會不準）
        const far =
          Math.abs(element.getBoundingClientRect().top) > window.innerHeight * 2;
        element.scrollIntoView({ behavior: far ? "auto" : "smooth", block: "start" });
        return true;
      }

      pendingScrollRef.current = artworkId;
      const found = await loadUntil(artworkId);
      if (pendingScrollRef.current !== artworkId) return found; // 期間又點了別張
      if (!found) {
        pendingScrollRef.current = null;
        return false;
      }
      // 卡片可能已經渲染出來了（effect 還沒輪到），那就直接捲
      const loaded = findCard(artworkId);
      if (loaded) {
        pendingScrollRef.current = null;
        loaded.scrollIntoView({ behavior: "auto", block: "start" });
      }
      return true;
    },
    [findCard, loadUntil],
  );

  // 清單更新後，如果有等著捲過去的作品而且卡片已經出現，就捲過去
  useEffect(() => {
    const pendingId = pendingScrollRef.current;
    if (pendingId === null) return;
    const element = findCard(pendingId);
    if (!element) return;
    pendingScrollRef.current = null;
    element.scrollIntoView({ behavior: "auto", block: "start" });
  }, [artworks, findCard]);

  // 捲動同步高亮：觀察所有卡片，進入帶狀區的就是 activeId
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = Number((entry.target as HTMLElement).dataset.artworkId);
          if (id) setActiveId(id);
        }
      },
      { rootMargin: SCROLL_SPY_MARGIN },
    );
    list
      .querySelectorAll<HTMLElement>("[data-artwork-id]")
      .forEach((card) => spy.observe(card));
    return () => spy.disconnect();
  }, [artworks]);

  // 網址記住位置：activeId 穩定 300ms 後寫回 ?art=（replace，不會塞爆瀏覽紀錄）
  useEffect(() => {
    if (activeId === null || deepLinkPendingRef.current) return;
    const timer = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("art", String(activeId));
          return next;
        },
        { replace: true },
      );
    }, URL_SYNC_DELAY_MS);
    return () => clearTimeout(timer);
  }, [activeId, setSearchParams]);

  // 帶 ?art= 進來：等第一頁和縮圖索引都載好，再跳到那張作品
  useEffect(() => {
    if (initialArtId === null || deepLinkStartedRef.current) return;
    if (artworks.length === 0 || indexLoading) return;
    deepLinkStartedRef.current = true;

    // 索引裡沒有（已刪除或隱藏）就不用白跑 loadUntil
    if (!indexItems.some((item) => item.artworkId === initialArtId)) {
      deepLinkPendingRef.current = false;
      return;
    }
    void scrollToArtwork(initialArtId).finally(() => {
      deepLinkPendingRef.current = false;
    });
  }, [initialArtId, artworks.length, indexLoading, indexItems, scrollToArtwork]);

  // 抽屜開著時按 Esc 關閉
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  const handleSelect = (artworkId: number) => {
    setDrawerOpen(false);
    void scrollToArtwork(artworkId);
  };

  //  修改過渡狀態：只有在「第一次完全沒資料且載入中」才顯示全螢幕載入
  if (loading && (!artworks || artworks.length === 0))
    return <div className="text-center p-10 text-gray-500">載入中...</div>;
  if (error)
    return <div className="text-center p-10 text-red-500">錯誤：{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">作品展示牆</h1>

      <div className="xl:grid xl:grid-cols-[auto_1fr] xl:gap-8">
        {/* 左側縮圖欄（寬螢幕） */}
        <aside className="hidden xl:block sticky top-20 self-start mt-8">
          <ArtworkThumbnailGrid
            variant="sidebar"
            items={indexItems}
            activeId={activeId}
            onSelect={handleSelect}
          />
        </aside>

        {/* 中間卡片清單（cursor 分頁 + 無限捲動） */}
        <div
          ref={listRef}
          className="flex flex-col items-center gap-12 mt-8 max-w-2xl mx-auto w-full"
        >
          {artworks?.map((art, i) => {
            // 計算是否為倒數第 2 張圖
            const isSecondFromLast = artworks.length - 2 === i;

            return (
              // 用一個 div 包裹卡片，並把 ref 綁定在倒數第 2 張圖上
              <div
                key={art.artworkId}
                ref={isSecondFromLast ? lastArtworkRef : null}
                data-artwork-id={art.artworkId}
                className="w-full scroll-mt-20" // 跳轉時不要被 sticky header 蓋住
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
                  onDelete={async (e, id) => {
                    e.stopPropagation();
                    if (await removeArtwork(id)) removeItem(id);
                  }}
                />
              </div>
            );
          })}

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
        </div>
      </div>

      {/* 小螢幕：右下角按鈕打開縮圖抽屜 */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="xl:hidden fixed bottom-6 right-6 z-40 px-4 py-3 bg-white/90 backdrop-blur-md border border-slate-100 rounded-full shadow-lg text-sm font-medium text-slate-700 hover:text-blue-600"
        aria-label="開啟縮圖導覽"
      >
        縮圖
      </button>
      {drawerOpen && (
        <div
          className="xl:hidden fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-label="縮圖導覽"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex flex-col w-[min(85vw,420px)] bg-white shadow-xl">
            <div className="flex items-center justify-between h-14 px-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">縮圖導覽</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="size-9 rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="關閉縮圖導覽"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ArtworkThumbnailGrid
                variant="drawer"
                items={indexItems}
                activeId={activeId}
                onSelect={handleSelect}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- 編輯 Modal --- */}
      {editingArt && (
        <EditArtworkModal
          key={editingArt.artworkId} // ← 換作品 = 換 key = 卸載舊 Modal、掛載新 Modal
          artwork={editingArt}
          categories={categories}
          categoriesLoading={categoriesLoading}
          onClose={() => setEditingArt(null)}
          onUpdateSuccess={(data) => {
            updateLocalArtwork(editingArt.artworkId, data);
            // 與 Modal 初始值相同的轉換方式比較，判斷完成日期有沒有被改
            const originalDate = toDateInputValue(editingArt.completionDate);
            if (data.completionDate && data.completionDate !== originalDate) {
              // 排序依完成日期，改了就重新載入，左右兩邊的順序才會一致
              refresh();
              reloadIndex();
            } else if (data.title) {
              updateItemTitle(editingArt.artworkId, data.title);
            }
          }}
        />
      )}
      {/* --- Lightbox (展示 imageUrl) --- */}
      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        plugins={[Thumbnails, Captions]}
        slides={(artworks || []).map((art) => ({
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
