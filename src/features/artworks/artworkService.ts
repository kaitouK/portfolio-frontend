import apiService from "../../api/interceptor";
import type {
  ApiResponse,
  ApiResponseWithData,
  CursorPagedResult,
} from "../../types/api";
import type {
  ArtworkDto,
  ArtworkIndexItem,
  ArtworkResponse,
  ImageBackfillResult,
} from "./types";

// 對應後端 ArtworkUpdateRequest
export interface ArtworkUpdatePayload {
  artworkId: number;
  title?: string;
  description?: string;
  categoryId?: number;
  completionDate?: string;
}

// untilId：跳轉用，一次載到這張作品為止（後端單次上限 300 筆）
export const getArtworks = async (
  limit: number = 10,
  cursor: string | null = null,
  untilId: number | null = null,
): Promise<ApiResponseWithData<CursorPagedResult<ArtworkDto>>> => {
  let url = `/artworks?limit=${limit}`;
  if (cursor) {
    url += `&cursor=${encodeURIComponent(cursor)}`;
  }
  if (untilId !== null) {
    url += `&untilId=${untilId}`;
  }
  const response = await apiService.get<
    unknown,
    ApiResponseWithData<CursorPagedResult<ArtworkDto>>
  >(url);
  return response;
};

// 左側縮圖欄：一次拿到全部公開作品的 id、標題、縮圖
export const getArtworkIndex = async (): Promise<
  ApiResponseWithData<ArtworkIndexItem[]>
> => {
  const response = await apiService.get<
    unknown,
    ApiResponseWithData<ArtworkIndexItem[]>
  >("/artworks/index");
  return response;
};

// admin：補齊舊作品的寬高與顯示圖，afterId 為上一批回傳的 lastId
export const backfillArtworkImages = async (
  afterId: number,
  batchSize: number = 5,
): Promise<ApiResponseWithData<ImageBackfillResult>> => {
  const response = await apiService.post<
    unknown,
    ApiResponseWithData<ImageBackfillResult>
  >(`/artworks/backfill-images?afterId=${afterId}&batchSize=${batchSize}`);
  return response;
};

export const deleteArtwork = async (
  artworkId: number,
): Promise<ApiResponseWithData<null>> => {
  const response = await apiService.delete<
    unknown,
    ApiResponseWithData<null>
  >(`/artworks/${artworkId}`);
  return response;
};

export const updateArtwork = async (
  artworkId: number,
  data: ArtworkUpdatePayload,
): Promise<ApiResponse> => {
  const response = await apiService.put<unknown, ApiResponse>(
    `/artworks/${artworkId}`,
    data,
  );
  return response;
};

export const uploadArtwork = async (
  formData: FormData,
): Promise<ApiResponseWithData<ArtworkResponse>> => {
  const response = await apiService.post<
    unknown,
    ApiResponseWithData<ArtworkResponse>
  >("/Artworks", formData);
  return response;
};
