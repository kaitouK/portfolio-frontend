//作品模組的型別，對應後端 ArtworkDtos
export interface ArtworkResponse {
  id: number;
  title: string;
  fileUrl: string;
  thumbnailUrl: string;
}
export interface ArtworkDto {
  artworkId: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  displayUrl: string | null; // 寬度 ≤ 1400 的顯示圖；原圖本來就小時為 null
  imageWidth: number | null; // 原圖寬高，用來先佔位；舊作品補資料前為 null
  imageHeight: number | null;
  categoryId: number;
  tags: string[];
  pixivViews: number | null;
  createdAt: string; // ISO 8601 格式的日期字串
  completionDate: string; // ISO 8601 格式的日期字串
}
// 左側縮圖索引，對應後端 ArtworkIndexItemDto（排序與分頁相同）
export interface ArtworkIndexItem {
  artworkId: number;
  title: string;
  thumbnailUrl: string | null;
}
// 舊作品補資料的批次結果，對應後端 ImageBackfillResult
export interface ImageBackfillResult {
  processed: number;
  failed: number;
  lastId: number; // 下一批的 afterId
  hasMore: boolean;
}
