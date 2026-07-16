import apiService from "../../api/interceptor";
import type {
  ApiResponse,
  ApiResponseWithData,
  CursorPagedResult,
} from "../../types/api";
import type { ArtworkDto, ArtworkResponse } from "./types";

// 對應後端 ArtworkUpdateRequest
export interface ArtworkUpdatePayload {
  artworkId: number;
  title?: string;
  description?: string;
  categoryId?: number;
  completionDate?: string;
}

export const getArtworks = async (
  limit: number = 10,
  cursor: string | null = null,
  tags: string[] = [],
): Promise<ApiResponseWithData<CursorPagedResult<ArtworkDto>>> => {
  let url = `/artworks?limit=${limit}`;
  if (cursor) {
    url += `&cursor=${encodeURIComponent(cursor)}`;
  }
  if (tags && tags.length > 0) {
    tags.forEach(tag => {
      url += `&tags=${encodeURIComponent(tag)}`;
    })
  }
  const response = await apiService.get<
    unknown,
    ApiResponseWithData<CursorPagedResult<ArtworkDto>>
  >(url);
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
