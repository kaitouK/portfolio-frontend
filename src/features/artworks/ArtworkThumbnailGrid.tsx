import { useEffect, useRef } from "react";
import type { ArtworkIndexItem } from "./types";
import { getFullImageUrl } from "../../utils/artworkHelpers";

interface ArtworkThumbnailGridProps {
  items: ArtworkIndexItem[];
  activeId: number | null;
  onSelect: (artworkId: number) => void;
  // sidebar：寬螢幕左欄（120px 方格 × 4 欄、高度放得下 6 列）；drawer：小螢幕抽屜（3 欄自適應）
  variant: "sidebar" | "drawer";
}

const ArtworkThumbnailGrid = ({
  items,
  activeId,
  onSelect,
  variant,
}: ArtworkThumbnailGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 高亮的那格跑出可視範圍時，只捲動這個容器本身。
  // 不用 element.scrollIntoView：它會連整個頁面一起捲，跟中間欄的捲動打架
  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeId === null) return;
    const button = container.querySelector<HTMLElement>(
      `[data-thumb-id="${activeId}"]`,
    );
    if (!button) return;

    const top = button.offsetTop; // 容器是 relative，offsetTop 就是相對容器的位置
    const bottom = top + button.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    if (top >= visibleTop && bottom <= visibleBottom) return;

    container.scrollTo({
      top: top - (container.clientHeight - button.offsetHeight) / 2,
      behavior: "smooth",
    });
  }, [activeId, items]);

  const isSidebar = variant === "sidebar";

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-auto overscroll-contain p-1.5 ${
        // 6 列 × 120 + 5 × 8 間距 = 760，再加上下 padding 12；視窗太矮就縮短
        isSidebar ? "h-[772px] max-h-[calc(100vh-6rem)]" : "h-full"
      }`}
    >
      <div
        className={
          isSidebar ? "grid grid-cols-[repeat(4,120px)] gap-2" : "grid grid-cols-3 gap-2"
        }
      >
        {items.map((item) => {
          const active = item.artworkId === activeId;
          return (
            <button
              key={item.artworkId}
              type="button"
              data-thumb-id={item.artworkId}
              onClick={() => onSelect(item.artworkId)}
              aria-label={item.title}
              aria-current={active ? "true" : undefined}
              title={item.title}
              className={`relative overflow-hidden rounded-md bg-gray-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isSidebar ? "size-[120px]" : "aspect-square w-full"
              } ${active ? "ring-2 ring-blue-500 ring-offset-2" : "hover:opacity-80"}`}
            >
              {item.thumbnailUrl ? (
                <img
                  src={getFullImageUrl(item.thumbnailUrl)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="flex items-center justify-center h-full p-1 text-xs text-gray-400 line-clamp-3">
                  {item.title}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ArtworkThumbnailGrid;
