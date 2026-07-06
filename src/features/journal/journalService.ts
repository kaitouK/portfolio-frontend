import apiService from "../../api/interceptor";
import type { ApiResponseWithData } from "../../types/api";

// 對應後端 JournalSaveRequest
export interface JournalSavePayload {
  id: string | null; // null 代表新草稿，由後端產生 Guid
  title: string;
  contentJson: string;
  contentHtml: string;
  tags: string[];
}

// 對應後端 JournalResponseDto
export interface JournalDto {
  id: string;
  title: string;
  contentJson: string;
  contentHtml: string;
  tags: string[];
  status: number; // 0 草稿 / 1 發布 / 2 封存
  createdAt: string;
  updatedAt: string;
  imageUrls: string[];
}

// 對應後端 JournalImageUploadResponse
export interface JournalImageUploadResponse {
  id: string;
  imageUrl: string;
}

export const getPublishedJournals = () =>
  apiService.get<unknown, ApiResponseWithData<JournalDto[]>>("/journal");

export const getActiveDraft = () =>
  apiService.get<unknown, ApiResponseWithData<JournalDto>>("/journal/draft");

export const saveDraft = (payload: JournalSavePayload) =>
  apiService.post<unknown, ApiResponseWithData<JournalDto>>(
    "/journal/draft",
    payload,
  );

export const publishJournal = (payload: JournalSavePayload) =>
  apiService.post<unknown, ApiResponseWithData<JournalDto>>(
    "/journal/publish",
    payload,
  );

export const deleteJournal = (id: string) =>
  apiService.delete<unknown, ApiResponseWithData<null>>(`/journal/${id}`);

export const uploadJournalImage = (journalId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiService.post<unknown, ApiResponseWithData<JournalImageUploadResponse>>(
    `/journal/image?journalId=${encodeURIComponent(journalId)}`,
    formData,
  );
};

export const deleteJournalImage = (id: string) =>
  apiService.delete<unknown, ApiResponseWithData<null>>(`/journal/image/${id}`);
