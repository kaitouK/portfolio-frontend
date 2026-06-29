import apiService from '../../api/interceptor';
//import axios from 'axios';
import type { ApiResponseWithData, ArtworkDto, CursorPagedResult } from '../../types/Interface';

export const getArtworks = async (limit: number = 10,
  cursor: string | null = null): Promise<ApiResponseWithData<CursorPagedResult<ArtworkDto>>> => {
  let url = `/artworks?limit=${limit}`;
  if (cursor) {
    url += `&cursor=${encodeURIComponent(cursor)}`;
  }
  const response = await apiService.get<any, ApiResponseWithData<CursorPagedResult<ArtworkDto>>>(url);
  return response;
};
export const deleteArtwork = async (artworkId: number): Promise<ApiResponseWithData<null>> => {
  const response = await apiService.delete<any, ApiResponseWithData<null>>(`/artworks/${artworkId}`);
  return response;
};
export const updateArtwork = async (artworkId: number, data: any) => {
  const response = await apiService.put<any, any>(`/artworks/${artworkId}`, data);
  return response;
};