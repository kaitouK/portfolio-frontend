import type { CategoryDto } from "../features/categories/types";

export const getFullImageUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path; // 如果已經是完整 URL 就直接返回
  const baseUrl = import.meta.env.VITE_API_BASE_URL.replace("/api", ""); // 從環境變數讀取 API URL，並去掉 /api 部分;
  return `${baseUrl}${path}`;
};

export const getCategoryName = (
  categories: CategoryDto[],
  categoryId: number,
) => {
  if (categories.length === 0) return "類別載入中";
  const category = categories.find((cat) => cat.categoryId === categoryId);
  return category ? category.name : `類別(${categoryId})`;
};
//日期格式化工具
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "尚未標記";
  return new Date(dateString).toLocaleDateString();
};
