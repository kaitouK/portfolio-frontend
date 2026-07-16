const rawUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
const formatApiBaseUrl = (url: string): string => {
  if (!url) return "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};
export const API_BASE_URL = formatApiBaseUrl(rawUrl);
