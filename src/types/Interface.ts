//用於對接後端API的資料結構
export interface ApiResponse {
  success: boolean;
  message: string | null;
  statusCode: number;
}
export interface ApiResponseWithData<T> extends ApiResponse {
  data: T | null; // 這裡的 T 是一個泛型，代表資料的具體類型，可以在使用時指定
}
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
  categoryId: number;
  tags: string[];
  pixivViews: number | null;
  createdAt: string;// ISO 8601 格式的日期字串
  completionDate: string; // ISO 8601 格式的日期字串
}
export interface CategoryDto {
  categoryId: number;
  name: string;
}
export interface CursorPagedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}