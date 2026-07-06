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
  categoryId: number;
  tags: string[];
  pixivViews: number | null;
  createdAt: string; // ISO 8601 格式的日期字串
  completionDate: string; // ISO 8601 格式的日期字串
}
