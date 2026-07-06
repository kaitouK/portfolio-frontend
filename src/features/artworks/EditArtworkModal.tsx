import React, { useState } from "react";
import { updateArtwork } from "./artworkService";
import type { ArtworkDto } from "./types";
import type { CategoryDto } from "../categories/types";

interface EditArtworkModalProps {
  artwork: ArtworkDto;
  categories: CategoryDto[];
  categoriesLoading: boolean;
  onClose: () => void;
  onUpdateSuccess: (updatedData: Partial<ArtworkDto>) => void;
}

const EditArtworkModal = ({
  artwork,
  categories,
  categoriesLoading,
  onClose,
  onUpdateSuccess,
}: EditArtworkModalProps) => {
  // 表單狀態留在 Modal 內部
  const [editForm, setEditForm] = useState({
    title: artwork.title || "",
    description: artwork.description || "",
    categoryId: artwork.categoryId || categories[0]?.categoryId || 1,
    completionDate: artwork.completionDate
      ? new Date(artwork.completionDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        artworkId: artwork.artworkId,
      };
      const result = await updateArtwork(artwork.artworkId, payload);
      if (result.success) {
        // 通知父組件更新成功，並傳回更新後的資料以便同步 UI
        onUpdateSuccess(editForm);
        alert("更新成功！");
        onClose();
      } else {
        alert(result.message || "更新失敗");
      }
    } catch (err) {
      console.error("更新作品失敗", err);
      alert("系統錯誤，請稍後再試");
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">編輯作品訊息</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              作品標題
            </label>
            <input
              type="text"
              className="mt-1 block w-full border rounded-md p-2"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              作品類別
            </label>
            <select
              className="mt-1 block w-full border rounded-md p-2 bg-white"
              value={editForm.categoryId}
              onChange={(e) =>
                setEditForm({ ...editForm, categoryId: Number(e.target.value) })
              }
              disabled={categoriesLoading}
            >
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              描述
            </label>
            <textarea
              className="mt-1 block w-full border rounded-md p-2 h-24"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              完成日期
            </label>
            <input
              type="date"
              className="mt-1 block w-full border rounded-md p-2"
              value={editForm.completionDate}
              onChange={(e) =>
                setEditForm({ ...editForm, completionDate: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              儲存變更
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditArtworkModal;
