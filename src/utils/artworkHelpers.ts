import type { CategoryDto } from "../features/categories/types";

export const getFullImageUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path; // 如果已經是完整 URL 就直接返回
  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api", ""); // 從環境變數讀取 API URL，並去掉 /api 部分;
  return `${baseUrl}${path}`;
};

export const getCategoryName = (
  categories: CategoryDto[],
  categoryId: number,
) => {
  if (categories.length === 0) return "類別載入中";
  const category = categories.find((cat) => cat.categoryId === categoryId);
  return category ? category.name : `類別(${categoryId})`;
};
// 中間卡片顯示用的高畫質圖：優先用顯示圖，沒有就用原圖
export const getDisplayImageUrl = (art: {
  displayUrl: string | null;
  imageUrl: string | null;
}): string => getFullImageUrl(art.displayUrl ?? art.imageUrl);

// 有效寬高時回傳 CSS aspect-ratio 字串，否則 undefined（交給圖片自己撐開）
export const getAspectRatio = (
  width: number | null | undefined,
  height: number | null | undefined,
): string | undefined => {
  if (!width || !height || width <= 0 || height <= 0) return undefined;
  return `${width} / ${height}`;
};

// 依 artworkId 去重後串接：跳轉補齊和無限捲動同時進來時，避免重複的卡片
export const appendUniqueById = <T extends { artworkId: number }>(
  prev: T[],
  next: T[],
): T[] => {
  const seen = new Set(prev.map((item) => item.artworkId));
  return [...prev, ...next.filter((item) => !seen.has(item.artworkId))];
};

//日期格式化工具
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "尚未標記";
  return new Date(dateString).toLocaleDateString();
};

// 後端日期字串轉成 <input type="date"> 要的 YYYY-MM-DD
// 後端回傳的字串沒有時區（例如 "2026-01-05T00:00:00"），若用 new Date(...).toISOString()
// 會先當成本地時間、再換算成 UTC，在台灣（UTC+8）就變成前一天，所以直接取 "T" 前面的日期部分
export const toDateInputValue = (
  dateString: string | null | undefined,
): string => {
  if (!dateString) return "";
  return dateString.split("T")[0];
};

// 本地的今天（YYYY-MM-DD）：toISOString 是 UTC 的日期，台灣早上 8 點前會拿到昨天，所以用本地年月日自己組
export const todayInputValue = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // getMonth 從 0 開始算
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};
