import { useSearchParams } from "react-router-dom";
export const useTagFilter = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedTags = searchParams.getAll("tag");//?tag=a&tag=b
    const toggleTag = (name: string) => {
        const current = searchParams.getAll("tag");
        const nextTags = current.includes(name)
            ? current.filter((t) => t !== name) //已選 點擊刪除
            : [...current, name];             //未選 加入篩選
        const next = new URLSearchParams(searchParams);
        next.delete("tag");
        nextTags.forEach((t) => next.append("tag", t));
        setSearchParams(next);
    };
    return { selectedTags, toggleTag };
}