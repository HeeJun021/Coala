// src/components/portfolio/NotionTargetPageSelectModal.jsx
import React, { useEffect, useState } from "react";
import { listSharedPages } from "../../api/notionApi";
import { Search, RefreshCw, X, ExternalLink, MapPin } from "lucide-react";

export default function NotionTargetPageSelectModal({ open, onClose, onSelect }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true);
        const res = await listSharedPages(q ? { q } : undefined);
        setItems(Array.isArray(res?.items) ? res.items : []);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
       <div className="flex items-center justify-between mb-4">
  {/* 좌측 그룹: 아이콘 + 제목 */}
  <div className="flex items-center gap-2">
    <MapPin className="w-5 h-5 text-yellow-500" />
    <h3 className="text-lg font-semibold">붙여넣을 대상 페이지 선택</h3>
  </div>

  {/* 우측: 닫기 버튼 */}
  <button
    onClick={onClose}
    className="text-gray-400 hover:text-gray-700"
    aria-label="닫기"
  >
    <X className="w-5 h-5" />
  </button>
</div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 border rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              placeholder="페이지 제목 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 outline-none text-sm"
            />
          </div>
          <button
            onClick={() => setQ((s) => s)}
            title="새로고침"
            className="p-2 rounded-full bg-white border shadow hover:bg-gray-50 text-gray-600"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="border rounded-lg max-h-[420px] overflow-auto">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              결과가 없습니다. 노션에서 페이지를 만든 뒤 통합앱과 공유했는지 확인하세요.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((p) => (
                <li key={p.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-md border">
                      {p.emoji ? <span className="text-xl">{p.emoji}</span> : <span className="text-gray-400">📄</span>}
                    </div>

                    <button
                      className="flex-1 text-left"
                      onClick={() => onSelect(p.id, p.title)}
                      title="이 페이지 선택"
                    >
                      <div className="font-medium text-gray-800">{p.title || "(제목 없음)"}</div>
                      {p.url && <div className="text-xs text-gray-400 truncate">{p.url}</div>}
                    </button>

                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gray-700 border rounded-md px-2 py-1 hover:bg-gray-50"
                        title="노션에서 열기"
                      >
                        미리보기 <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
