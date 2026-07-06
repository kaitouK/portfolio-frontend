import { useEffect, useState, useCallback, useMemo } from "react";
import { RichTextEditor } from "./RichTextEditor";
import { getActiveDraft, saveDraft, publishJournal } from "./journalService";
import { debounce } from "lodash-es";
import { useAuth } from "../../hooks/useAuth";
const navigateTo = (path: string) => {
  // BASE_URL 來自 vite.config 的 base（/portfolio-frontend/），避免硬編路徑
  window.location.assign(
    `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`,
  );
};

interface JournalEditorContainerProps {
  onPublishSuccess?: (newPost: {
    id: string;
    title: string;
    contentHtml: string;
    contentJson: string;
    tags: string[];
  }) => void;
}

export const JournalEditorContainer = ({
  onPublishSuccess,
}: JournalEditorContainerProps) => {
  const [journalId, setJournalId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [contentJson, setContentJson] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true); //先跟後端確認有沒有草稿再顯示編輯器
  const [editorKey, setEditorKey] = useState<number>(0);
  const { checkStatus } = useAuth();

  const EMPTY_DOC = '{"type":"doc","content":[{"type":"paragraph"}]}';
  const performSave = useCallback(
    async (
      currentId: string,
      currentTitle: string,
      json: string,
      html: string,
      currentTags: string[],
    ) => {
      if (!json || json === EMPTY_DOC) return;
      const isTokenValid = await checkStatus();
      if (!isTokenValid) {
        alert("登入連線已逾時，為保護您的資料，請重新登入後再儲存。");
        return;
      }
      setSaveStatus("saving");
      try {
        const res = await saveDraft({
          id: currentId || null,
          title: currentTitle || "未命名草稿",
          contentJson: json,
          contentHtml: html,
          tags: currentTags,
        });
        if (res.success) {
          setSaveStatus("saved");
          setLastSavedTime(new Date().toLocaleTimeString());
          if (res.data?.id) setJournalId(res.data.id);
        }
      } catch {
        setSaveStatus("error");
      }
    },
    [checkStatus],
  );
  const debouncedSave = useMemo(
    () => debounce(performSave, 5000),
    [performSave],
  );
  useEffect(() => {
    return () => {
      debouncedSave.flush();
    };
  }, [debouncedSave]);
  const saveDraftImmediately = (
    currentId: string,
    currentTitle: string,
    json: string,
    html: string,
    currentTags: string[],
  ) => {
    debouncedSave.cancel();
    return performSave(currentId, currentTitle, json, html, currentTags);
  };

  // 1. 進入頁面時，檢查是否有未完成的草稿
  useEffect(() => {
    let isCurrent = true; //避免觸發兩次詢問視窗
    const checkDraft = async () => {
      try {
        const res = await getActiveDraft();
        if (!isCurrent) return;
        if (res.success && res.data) {
          if (window.confirm("偵測到您有未完成的草稿，是否還原？")) {
            setJournalId(res.data.id);
            setTitle(res.data.title);
            setContentJson(res.data.contentJson);
            setContentHtml(res.data.contentHtml);
            setTags(res.data.tags || []);
          } else {
            setJournalId("");
          }
        }
      } catch (err) {
        console.error("檢查草稿失敗", err);
        setJournalId("");
      } finally {
        setIsLoading(false); //無論有無草稿都解除載入狀態
      }
    };
    checkDraft();
    return () => {
      isCurrent = false;
    };
  }, []);

  // 3. 監聽內容變更，觸發自動儲存
  const handleContentChange = (json: string, html: string) => {
    setContentJson(json);
    setContentHtml(html);
    debouncedSave(journalId, title, json, html, tags);
  };
  //新增：專門給「圖片上傳/刪除成功」觸發的即時同步通知
  const handleImageEventSync = (
    json: string,
    html: string,
    forcedJournalId?: string,
  ) => {
    setContentJson(json);
    setContentHtml(html);

    // 圖片事件觸發時，由於 journalId 狀態在 React 中可能還是空字串（State 異步更新延遲），
    // RichTextEditor 有給剛申請好的新 Guid(forcedJournalId)，優先採用！
    const finalId = forcedJournalId || journalId;

    saveDraftImmediately(finalId, title, json, html, tags);
  };

  // 4. 手動正式發布
  const handlePublish = async () => {
    if (!title.trim()) {
      alert("請輸入標題");
      return;
    }
    debouncedSave.cancel(); // 立刻取消尚未執行的自動儲存，防止它在發布後又跑去儲存草稿

    //避免發布時因token過期而失敗
    const isTokenValid = await checkStatus();
    if (!isTokenValid) {
      alert("登入連線已逾時，請重新登入後再發布。");
      return;
    }

    try {
      const res = await publishJournal({
        id: journalId || null,
        title,
        contentJson,
        contentHtml,
        tags,
      });
      if (res.success) {
        alert("正式發布成功！");
        if (onPublishSuccess) {
          onPublishSuccess({
            id: journalId || "temp-id-" + Date.now(),
            title,
            contentHtml,
            contentJson,
            tags,
          });
          // 重置表單狀態
          setTitle("");
          setContentJson("");
          setContentHtml("");
          setTags([]);
          setJournalId("");
          setSaveStatus("idle");
          setEditorKey((prev) => prev + 1); // 改變 key 來清空富文本編輯器
        } else {
          navigateTo("/timeline");
        }
      }
    } catch (err) {
      alert("發布失敗，請稍後再試");
      console.error("發布日誌失敗", err);
    }
  };

  //處理標籤變更
  /*const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    debouncedSave(journalId, title, contentJson, contentHtml, newTags);
  };*/
  // 如果還在檢查後端有沒有舊草稿，先顯示載入中
  if (isLoading) {
    return (
      <div className="text-center p-12 text-gray-500">正在檢查草稿狀態...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">撰寫歷程日誌</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {saveStatus === "saving" && "正在自動儲存草稿..."}
            {saveStatus === "saved" && `草稿已於 ${lastSavedTime} 自動儲存`}
            {saveStatus === "error" && "草稿儲存失敗，請檢查網路"}
          </span>
          <button
            onClick={handlePublish}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full font-bold transition"
          >
            正式發布
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="請輸入日誌標題..."
        className="w-full text-3xl font-bold border-b border-gray-200 pb-2 focus:outline-none focus:border-blue-500"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          debouncedSave(
            journalId,
            e.target.value,
            contentJson,
            contentHtml,
            tags,
          );
        }}
      />

      <RichTextEditor
        key={editorKey} // 結合 journalId 與 editorKey，確保還原與發佈後都能正確重新整理
        content={contentJson}
        onChange={handleContentChange}
        onImageEventSync={handleImageEventSync} // 傳入這個即時同步的 callback
        journalId={journalId}
        onJournalIdChange={(newId) => setJournalId(newId)}
      />
    </div>
  );
};
