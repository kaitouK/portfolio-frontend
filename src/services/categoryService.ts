import apiService from "../api/interceptor";
import type { ApiResponseWithData, CategoryDto } from "../types/Interface";

export const getCategories = async (): Promise<ApiResponseWithData<CategoryDto[]>> => {
  const response = await apiService.get<any,ApiResponseWithData<CategoryDto[]>>("/category");
  return response;
};