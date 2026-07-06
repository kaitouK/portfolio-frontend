import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getFullImageUrl,
  getCategoryName,
  formatDate,
} from "./artworkHelpers";
import type { CategoryDto } from "../features/categories/types";

describe("getFullImageUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("path 為空時回傳空字串", () => {
    expect(getFullImageUrl(null)).toBe("");
    expect(getFullImageUrl(undefined)).toBe("");
    expect(getFullImageUrl("")).toBe("");
  });

  it("已是完整 URL 時直接回傳", () => {
    const url = "https://kaitoukpic.blob.core.windows.net/images/a.webp";
    expect(getFullImageUrl(url)).toBe(url);
  });

  it("相對路徑時串上去掉 /api 的 baseURL", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://localhost:7098/api");
    expect(getFullImageUrl("/uploads/a.webp")).toBe(
      "https://localhost:7098/uploads/a.webp",
    );
  });
});

describe("getCategoryName", () => {
  const categories: CategoryDto[] = [
    { categoryId: 1, name: "未分類" },
    { categoryId: 4, name: "成圖" },
  ];

  it("類別列表為空時顯示載入中", () => {
    expect(getCategoryName([], 1)).toBe("類別載入中");
  });

  it("找得到類別時回傳名稱", () => {
    expect(getCategoryName(categories, 4)).toBe("成圖");
  });

  it("找不到類別時回傳含 id 的備援文字", () => {
    expect(getCategoryName(categories, 99)).toBe("類別(99)");
  });
});

describe("formatDate", () => {
  it("空值時回傳尚未標記", () => {
    expect(formatDate(null)).toBe("尚未標記");
    expect(formatDate(undefined)).toBe("尚未標記");
    expect(formatDate("")).toBe("尚未標記");
  });

  it("有日期時回傳本地化格式（與執行環境 locale 一致）", () => {
    const input = "2026-01-15T00:00:00";
    // toLocaleDateString 依執行環境 locale 而異，直接比對同一份輸入的轉換結果
    expect(formatDate(input)).toBe(new Date(input).toLocaleDateString());
  });
});
