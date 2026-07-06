import apiService from "../../api/interceptor";
import type { ApiResponseWithData } from "../../types/api";
import type { CategoryDto } from "./types";

export const getCategories = async (): Promise<ApiResponseWithData<CategoryDto[]>> => {
  const response = await apiService.get<unknown, ApiResponseWithData<CategoryDto[]>>("/category");
  return response;
};