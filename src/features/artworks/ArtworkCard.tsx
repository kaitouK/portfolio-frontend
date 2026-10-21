import React, { useState } from "react";
import type { ArtworkDto } from "./types";
import {
  getFullImageUrl,
  getDisplayImageUrl,
  getAspectRatio,
  getCategoryName,
  formatDate,
} from "../../utils/artworkHelpers";
import { useAuth } from "../../hooks/useAuth";
import type { CategoryDto } from "../categories/types";

interface ArtworkCardProps {
  art: ArtworkDto;
  index: number;
  categories: CategoryDto[];
  onPreview: (index: number) => void;
  onEdit: (e: React.MouseEvent, art: ArtworkDto) => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
}

const ArtworkCard = ({
  art,
  index,
  categories,
  onPreview,
  onEdit,
  onDelete,
}: ArtworkCardProps) => {
  const { auth } = useAuth();
  const isAdmin = auth.isAuthenticated && auth.role === "admin";
  const [displayLoaded, setDisplayLoaded] = useState(false);

  const thumbSrc = getFullImageUrl(art.thumbnailUrl);
  const displaySrc = getDisplayImageUrl(art);
  // 有寬高就先用 aspect-ratio 佔好位置，圖片載入前後版面都不會跳動（跳轉才準）
  const aspectRatio = getAspectRatio(art.imageWidth, art.imageHeight);
  // 底下有縮圖（或已佔位）時，高畫質圖疊在上面淡入；否則讓高畫質圖自己撐開高度
  const overlayDisplay = Boolean(thumbSrc || aspectRatio);
  const layerClass = "absolute inset-0 w-full h-full object-contain";
  return (
    <div
      className="break-inside-avoid group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 relative cursor-pointer border border-gray-100"
      onClick={() => onPreview(index)}
    >
      {/* 圖片區塊 */}
      <div className="relative bg-gray-50 border-b border-gray-50">
        {/* 操作按鈕 */}
        {isAdmin && (
          <div className="absolute top-2 left-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => onDelete(e, art.artworkId)}
              className="bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full shadow-md"
              title="刪除作品"
            >
              {/* 刪除 SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            <button
              onClick={(e) => onEdit(e, art)}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md"
              title="編輯訊息"
            >
              {/* 編輯 SVG  */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </div>
        )}

        {/* 圖片預覽：先顯示縮圖，高畫質圖載完後淡入蓋上 */}
        {thumbSrc || displaySrc ? (
          <div
            className="relative"
            style={aspectRatio ? { aspectRatio } : undefined}
          >
            {thumbSrc && (
              <img
                src={thumbSrc}
                alt=""
                aria-hidden="true"
                className={aspectRatio ? layerClass : "w-full h-auto block"}
                loading="lazy"
                decoding="async"
              />
            )}
            {displaySrc && (
              <img
                src={displaySrc}
                alt={art.title}
                className={`${overlayDisplay ? layerClass : "w-full h-auto block"} transition-opacity duration-500 ${
                  displayLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setDisplayLoaded(true)}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400">
            無預覽圖
          </div>
        )}

        {art.categoryId !== undefined && (
          <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {getCategoryName(categories, art.categoryId)}
          </span>
        )}
      </div>

      {/* 內容區塊 */}
      <div className="p-8">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold text-gray-900 leading-tight">
            {art.title}
          </h3>
          <span className="text-sm text-gray-400">
            {formatDate(art.completionDate)}
          </span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-3">
          {art.description || "暫無描述"}
        </p>

        {/* 標籤與數據 */}
        <div className="flex flex-wrap gap-1 mb-4">
          {art.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
        {/*<div className="flex justify-between items-center text-xs text-gray-400 border-t pt-3">
          <span>👁️ {art.pixivViews?.toLocaleString() ?? 0}</span>
          <span>上傳日期：{formatDate(art.createdAt)}</span>
        </div>*/}
      </div>
    </div>
  );
};
export default ArtworkCard;
