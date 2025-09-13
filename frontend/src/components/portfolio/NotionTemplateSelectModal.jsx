// src/components/portfolio/NotionTemplateSelectModal.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Layers, Eye, ExternalLink, RefreshCw, X, Image as ImageIcon } from "lucide-react";
import { listTemplates, getTemplate } from "../../api/notionApi";

export default function NotionTemplateSelectModal({ open, onClose, onSelect }) {
  const [loading, setLoading] = useState(false);
  const [tplList, setTplList] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const items = await listTemplates(); // [{id,key,title,version,description}]
      const sorted = [...(items || [])].sort((a, b) =>
        String(a?.title || "").localeCompare(String(b?.title || ""), "ko")
      );
      setTplList(sorted);
    } catch (e) {
      console.error("템플릿 목록 실패:", e);
      setTplList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handlePreview = async (e, t) => {
    e.stopPropagation();
    try {
      const full = await getTemplate(t.id); // { doc_json, ... }
      // 간단 미리보기: 새 탭에 JSON 출력
      const blob = new Blob([JSON.stringify(full, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      alert("미리보기를 열 수 없습니다.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold">템플릿 선택</h3>
          </div>
          <button className="text-gray-400 hover:text-gray-700" onClick={onClose} aria-label="닫기">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border rounded-lg max-h-[420px] overflow-auto">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">불러오는 중...</div>
          ) : tplList.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">결과가 없습니다.</div>
          ) : (
            <ul className="divide-y">
              {tplList.map((t) => (
                <li key={t.id}>
                  <div className="w-full flex items-center gap-3 p-3 hover:bg-gray-50">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-md border">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>

                    <button
                      className="flex-1 text-left"
                      onClick={() => onSelect(t.id, t.title)}
                      title="이 템플릿 선택"
                    >
                      <div className="font-medium text-gray-800">{t.title || "(제목 없음)"}</div>
                      {t.description && (
                        <div className="text-xs text-gray-500 truncate">{t.description}</div>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                        onClick={(e) => handlePreview(e, t)}
                        title="템플릿 JSON 미리보기"
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
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 pt-2 flex items-center justify-end">
          <button
            className="p-2 rounded-full bg-white border shadow hover:bg-gray-50 text-gray-600"
            onClick={load}
            aria-label="새로고침"
            title="새로고침"
          >
            <RefreshCw className="w-5 h-5 text-emerald-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
