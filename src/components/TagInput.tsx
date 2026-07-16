import { useState } from "react";
interface Props {
  tags: string[];
  onChange: (tags: string[]) => void; //呼叫時輸入字串陣列，不回傳任何內容
}

export default function TagInput({ tags, onChange }: Props) {
  const [input, setInput] = useState("");
  const commit = () => {
    const name = input.trim();
    if (name && !tags.includes(name)) onChange([...tags, name]);
    setInput("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1 border rounded p-2">
      {tags.map((t) => (
        <span
          key={t}
          className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
        >
          #{t}
          <button
            type="button"
            className="ml-1"
            onClick={() => onChange(tags.filter((x) => x !== t))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-24 outline-none"
        value={input}
        placeholder="輸入標籤後按空白或 Enter"
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return; // 關鍵：中文輸入法組字中按空白是選字，不能當成結算
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !input && tags.length) {
            onChange(tags.slice(0, -1)); // 空輸入時退格 → 刪最後一顆 chip
          }
        }}
        onBlur={commit}
      />
    </div>
  );
}
