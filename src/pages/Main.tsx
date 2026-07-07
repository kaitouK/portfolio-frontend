import { XIcon, PixivIcon } from "../components/SocialIcons";
import { SOCIAL_LINKS } from "../config/SocialLink";
const Main = () => {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] p-10 bg-slate-50/50">
      <div className="max-w-md p-10 bg-white rounded-2xl shadow-xl border border-slate-50 text-center hover:shadow-2xl transition-shadow duration-300">
        <h1 className="text-4xl font-black text-slate-800">怪盜K</h1>
        <p className="mt-4 text-slate-500 leading-relaxed">
          <br />
          業餘插畫家
        </p>

        {/* ─── 新增：分隔線與社群連結 ─── */}
        <hr className="my-6 border-slate-100" />

        <div className="flex justify-center items-center gap-6">
          {/* X (Twitter) */}
          <a
            href={SOCIAL_LINKS.x}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
            className="text-slate-400 hover:text-black transition-all duration-300 transform hover:scale-110"
          >
            <XIcon size={26} />
          </a>

          {/* Pixiv */}
          <a
            href={SOCIAL_LINKS.pixiv}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pixiv"
            className="text-slate-400 hover:text-[#0096FF] transition-all duration-300 transform hover:scale-110"
          >
            <PixivIcon size={26} />
          </a>
        </div>
      </div>
    </div>
  );
};
export default Main;
