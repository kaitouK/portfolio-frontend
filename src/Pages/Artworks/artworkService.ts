import apiService from '../../api/interceptor';
//import axios from 'axios';
import type { ApiResponseWithData, ArtworkDto } from '../../types/Interface';

export const getArtworks = async (): Promise<ApiResponseWithData<ArtworkDto[]>> => {
  const response = await apiService.get<any, ApiResponseWithData<ArtworkDto[]>>('/artworks');
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