import { useState, useEffect } from "react";
import { getCategories } from "./categoryService";
import type { CategoryDto } from "./types";

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) setCategories(response.data);
        else setError(response.message || "獲取分類失敗");
      } catch (err) {
        setError("系統錯誤，無法獲取分類");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { categories, loading, error };
};