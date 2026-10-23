import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getFullImageUrl,
  getCategoryName,
  formatDate,
  getDisplayImageUrl,
  getAspectRatio,
  appendUniqueById,
  toDateInputValue,
  todayInputValue,
} from "./artworkHelpers";
import type { CategoryDto } from "../../features/categories/types";

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

describe("getDisplayImageUrl", () => {
  const blob = "https://kaitoukpic.blob.core.windows.net/images";

  it("有顯示圖時優先使用顯示圖", () => {
    expect(
      getDisplayImageUrl({
        displayUrl: `${blob}/a_display.webp`,
        imageUrl: `${blob}/a.webp`,
      }),
    ).toBe(`${blob}/a_display.webp`);
  });

  it("沒有顯示圖時改用原圖", () => {
    expect(
      getDisplayImageUrl({ displayUrl: null, imageUrl: `${blob}/a.webp` }),
    ).toBe(`${blob}/a.webp`);
  });

  it("兩者都沒有時回傳空字串", () => {
    expect(getDisplayImageUrl({ displayUrl: null, imageUrl: null })).toBe("");
  });
});

describe("getAspectRatio", () => {
  it("寬高都有效時回傳 CSS aspect-ratio 字串", () => {
    expect(getAspectRatio(2800, 4000)).toBe("2800 / 4000");
  });

  it("缺少寬高或不是正數時回傳 undefined", () => {
    expect(getAspectRatio(null, 4000)).toBeUndefined();
    expect(getAspectRatio(2800, undefined)).toBeUndefined();
    expect(getAspectRatio(0, 100)).toBeUndefined();
    expect(getAspectRatio(100, -1)).toBeUndefined();
  });
});

describe("appendUniqueById", () => {
  it("串接時略過已經存在的作品，並保持原本順序", () => {
    const prev = [{ artworkId: 3 }, { artworkId: 2 }];
    const next = [{ artworkId: 2 }, { artworkId: 1 }, { artworkId: 0 }];

    expect(appendUniqueById(prev, next).map((a) => a.artworkId)).toEqual([
      3, 2, 1, 0,
    ]);
  });

  it("不會修改傳入的陣列", () => {
    const prev = [{ artworkId: 1 }];
    appendUniqueById(prev, [{ artworkId: 2 }]);
    expect(prev).toEqual([{ artworkId: 1 }]);
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

describe("toDateInputValue", () => {
  it("有時間部分時只取日期，不受時區影響", () => {
    expect(toDateInputValue("2026-01-05T00:00:00")).toBe("2026-01-05");
    expect(toDateInputValue("2026-01-05T23:59:59.1234567")).toBe("2026-01-05");
  });

  it("沒有時間部分時原樣回傳", () => {
    expect(toDateInputValue("2026-01-05")).toBe("2026-01-05");
  });

  it("帶 Z 的字串也直接取日期部分，不換算時區", () => {
    expect(toDateInputValue("2026-01-05T00:00:00Z")).toBe("2026-01-05");
  });

  it("空值時回傳空字串", () => {
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue(undefined)).toBe("");
    expect(toDateInputValue("")).toBe("");
  });
});

describe("todayInputValue", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("回傳本地的今天，月和日補零成 YYYY-MM-DD", () => {
    vi.useFakeTimers();
    // new Date(年, 月, 日, ...) 是本地時間；月份從 0 開始，8 = 9 月
    vi.setSystemTime(new Date(2026, 8, 3, 12, 0, 0));
    expect(todayInputValue()).toBe("2026-09-03");
  });

  it("本地清晨（UTC 還是前一天）時仍回傳本地日期", () => {
    vi.useFakeTimers();
    // 台灣早上 7 點 = UTC 前一天 23 點，舊寫法 toISOString 會得到 2026-01-04
    vi.setSystemTime(new Date(2026, 0, 5, 7, 0, 0));
    expect(todayInputValue()).toBe("2026-01-05");
  });
});
