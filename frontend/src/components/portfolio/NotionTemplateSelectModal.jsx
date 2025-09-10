// frontend/src/components/portfolio/NotionTemplateSelectModal.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Layers,
  Eye,
  ExternalLink,
  Briefcase,
  FileText,
  RefreshCw,
  X,
  Image as ImageIcon,
} from "lucide-react";

/** Notion 페이지 URL 생성 (하이픈 제거 UUID) */
function buildNotionUrlFromId(id) {
  if (!id) return "";
  const compact = id.replace(/-/g, "");
  return `https://www.notion.so/${compact}`;
}

/** ID 정규화(하이픈 제거 + 소문자) */
const normalizeId = (id) => (id || "").replace(/-/g, "").toLowerCase();

/** 템플릿 ID(정규화) → Lucide 아이콘 매핑 */
const TEMPLATE_ICON_MAP = {
  // 샘플: 필요 시 실제 템플릿 ID(정규화 32자)로 매핑하세요.
  "26a6a27ce65080d399e6ef42af45c9e6": Briefcase, // 개발자 포트폴리오 2
  "26a6a27ce6508058a031f34afaf74bb8": FileText, // 개발자 포트폴리오 1
};

const getTemplateIconComp = (tpl) =>
  TEMPLATE_ICON_MAP[normalizeId(tpl?.id)] || TEMPLATE_ICON_MAP[tpl?.id] || null;

export default function NotionTemplateSelectModal({ open, onClose, onSelect }) {
  const [tplLoading, setTplLoading] = useState(false);
  const [tplList, setTplList] = useState([]);

  const doSearchTemplates = useCallback(async () => {
    try {
      setTplLoading(true);
      const res = await fetch("http://localhost:8000/notion/templates", {
        credentials: "include",
      });
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];

      // 제목 오름차순
      const sorted = [...items].sort((a, b) =>
        String(a?.title || "").localeCompare(String(b?.title || ""), "ko")
      );
      setTplList(sorted);
    } catch (e) {
      console.error("템플릿 검색 실패:", e);
      setTplList([]);
    } finally {
      setTplLoading(false);
    }
  }, []);

  // 모달 열릴 때 1회 로드
  useEffect(() => {
    if (open) doSearchTemplates();
  }, [open, doSearchTemplates]);

  const handlePreview = (e, t) => {
    e.stopPropagation();
    const url = t?.url || buildNotionUrlFromId(t?.id);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold">템플릿 선택</h3>
          </div>
          <button
            className="text-gray-400 hover:text-gray-700"
            onClick={onClose}
            aria-label="모달 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 리스트 */}
        <div className="border rounded-lg max-h-[420px] overflow-auto">
          {tplLoading ? (
            <div className="p-6 text-sm text-gray-500">불러오는 중...</div>
          ) : (tplList || []).length === 0 ? (
            <div className="p-6 text-sm text-gray-500">결과가 없습니다.</div>
          ) : (
            <ul className="divide-y">
              {tplList.map((t) => {
                const IconComp = getTemplateIconComp(t);
                const previewUrl = t?.url || buildNotionUrlFromId(t?.id);
                const previewable = !!previewUrl;

                return (
                  <li key={t.id}>
                    <div className="w-full flex items-center gap-3 p-3 hover:bg-gray-50">
                      {/* 아이콘 */}
                      <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-md border">
                        {IconComp ? (
                          <IconComp className="w-6 h-6 text-emerald-600" />
                        ) : t.emoji ? (
                          <span className="text-xl">{t.emoji}</span>
                        ) : t.icon_url ? (
                          <img src={t.icon_url} alt="" className="w-5 h-5" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* 제목/URL */}
                      <button
                        className="flex-1 text-left"
                        onClick={() => onSelect(t.id, t.title)}
                        title="이 템플릿 선택"
                      >
                        <div className="font-medium text-gray-800">
                          {t.title || "(제목 없음)"}
                        </div>
                        {t.url && (
                          <div className="text-xs text-gray-400 truncate">
                            {t.url}
                          </div>
                        )}
                      </button>

                      {/* 액션: 미리보기 / 선택 */}
                      <div className="flex items-center gap-2">
                        <button
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border ${
                            previewable
                              ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          }`}
                          onClick={(e) => previewable && handlePreview(e, t)}
                          title={
                            previewable
                              ? "새 탭에서 템플릿 미리보기"
                              : "미리보기 URL이 없습니다"
                          }
                        >
                          <Eye className="w-3.5 h-3.5" />
                          미리보기
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
                          className="text-xs text-green-700 border border-green-200 bg-green-50 rounded-full px-2 py-0.5 hover:bg-green-100"
                          onClick={() => onSelect(t.id, t.title)}
                          title="이 템플릿 선택"
                        >
                          선택
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 필터/리프레시 바 (리스트 하단) */}
        <div className="mt-3 pt-2 flex items-center justify-between">
          {/* 왼쪽 안내문 */}
          <span className="text-xs text-gray-500 leading-5">
            * 아이콘 매핑은 <b>하이픈 제거·소문자</b> 기준의 ID로 적용됩니다.
          </span>

          {/* 오른쪽 새로고침 버튼 */}
          <button
            className="p-2 rounded-full bg-white border shadow hover:bg-gray-50 text-gray-600"
            onClick={doSearchTemplates}
            aria-label="새로고침"
            title="템플릿 목록 새로고침"
          >
            <RefreshCw className="w-5 h-5 text-emerald-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
