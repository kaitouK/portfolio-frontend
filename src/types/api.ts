//後端統一的 ApiResponse 信封格式（跨功能共用）
export interface ApiResponse {
  success: boolean;
  message: string | null;
  statusCode: number;
}
export interface ApiResponseWithData<T> extends ApiResponse {
  data: T | null; // 這裡的 T 是一個泛型，代表資料的具體類型，可以在使用時指定
}
export interface CursorPagedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}
