import React, { useState } from "react";
import { Trash2, LayoutTemplate, CalendarDays } from "lucide-react";
import { updateTemplate } from "../../api/templateApi";
import { useNavigate } from "react-router-dom";

const TemplateCard = ({ projectId, template, onDelete, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(template.title);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false); // 인라인 프리뷰 토글
  const navigate = useNavigate();

  const openWorkspace = () => {
    if (editing) return;
    navigate(`/team-project/${projectId}/template/${template.template_id}`);
  };

  const handleUpdateTitle = async () => {
    if (!editing) return;
    const trimmed = (title ?? "").trim();
    if (!trimmed || trimmed === template.title) {
      setEditing(false);
      setTitle(template.title);
      return;
    }
    try {
      setSaving(true);
      const updated = await updateTemplate(projectId, template.template_id, { title: trimmed });
      onUpdated?.(updated);
      setEditing(false);
    } catch (err) {
      alert("제목 수정 실패");
      console.error(err);
      setTitle(template.title);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // ----- 간단 렌더러들 (applied_blocks용) -----
  const DocView = ({ item }) => (
    <div className="prose max-w-none text-sm">
      {item.title && <h3 className="font-semibold mb-1">{item.title}</h3>}
      {item.content ? (
        <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded border">{item.content}</pre>
      ) : (
        <div className="text-gray-400 text-sm">내용 없음</div>
      )}
    </div>
  );
  const ChecklistView = ({ item }) => (
    <div>
      {item.title && <h3 className="font-semibold mb-1">{item.title}</h3>}
      <ul className="space-y-1 text-sm">
        {(item.items || []).map((it, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <input type="checkbox" disabled />
            <span>{it}</span>
          </li>
        ))}
        {(item.items || []).length === 0 && (
          <li className="text-gray-400 text-sm">체크리스트 없음</li>
        )}
      </ul>
    </div>
  );
  const TableView = ({ item }) => {
    const cols = item.columns || [];
    const rows = item.rows || [];
    return (
      <div>
        {item.title && <h3 className="font-semibold mb-1">{item.title}</h3>}
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {cols.map((c) => (
                  <th key={c} className="px-3 py-2 text-left border-b">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  {r.map((cell, j) => (
                    <td key={j} className="px-3 py-2 border-b">{String(cell)}</td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-gray-400" colSpan={cols.length || 1}>
                    샘플 데이터 없음
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  const KanbanView = ({ item }) => {
    const cols = item.columns || [];
    const cards = item.seedCards || [];
    return (
      <div>
        {item.title && <h3 className="font-semibold mb-2">{item.title}</h3>}
        <div className="grid grid-cols-3 gap-3">
          {cols.map((col) => (
            <div key={col} className="border rounded-lg p-2 bg-white">
              <div className="font-medium mb-2">{col}</div>
              <div className="space-y-2">
                {cards.filter((c) => c.column === col).map((c, idx) => (
                  <div key={idx} className="border rounded p-2 text-sm bg-gray-50">
                    {c.title}
                  </div>
                ))}
                {cards.filter((c) => c.column === col).length === 0 && (
                  <div className="text-xs text-gray-400">카드 없음</div>
                )}
              </div>
            </div>
          ))}
          {cols.length === 0 && <div className="text-sm text-gray-400">컬럼 없음</div>}
        </div>
      </div>
    );
  };
  const renderBlock = (item) => {
    switch (item?.type) {
      case "doc": return <DocView item={item} />;
      case "checklist": return <ChecklistView item={item} />;
      case "table": return <TableView item={item} />;
      case "kanban": return <KanbanView item={item} />;
      default:
        return <div className="text-sm text-gray-500">알 수 없는 블록 타입: <code>{item?.type ?? "unknown"}</code></div>;
    }
  };

  const applied = template?.applied_blocks;
  const layout = applied?.layout || [];
  const items = applied?.items || [];
  const widgets = template?.widgets || [];

  return (
    <div
      className="w-[340px] border border-gray-300 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col"
      onDoubleClick={openWorkspace}
      title="더블클릭하면 편집 화면으로 이동"
    >
      {/* 상단 */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 truncate">
          <LayoutTemplate size={18} className="text-blue-500" />
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => e.key === "Enter" && handleUpdateTitle()}
              className="text-sm font-semibold border px-1 py-0.5 rounded w-full"
              autoFocus
              disabled={saving}
            />
          ) : (
            <span
              className="text-base font-semibold text-gray-800 truncate"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              title="더블클릭해서 제목 수정"
            >
              {title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-sm text-gray-700 hover:text-black px-2 py-1 border rounded"
            onClick={(e) => { e.stopPropagation(); openWorkspace(); }}
            title="편집 화면으로 열기"
          >
            열기
          </button>
          <button
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            title="자세히 보기"
          >
            {expanded ? "접기" : "자세히"}
          </button>
          <Trash2
            size={18}
            className="text-gray-400 hover:text-red-500 transition cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            title="삭제"
          />
        </div>
      </div>

      <hr className="my-2 border-gray-200" />

      {/* 메타 정보 */}
      <div className="text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-blue-500" />
          <span>
            <span className="font-medium">추가일:</span>{" "}
            {new Date(template.added_at).toLocaleString()}
          </span>
        </div>
        {template.description && (
          <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 leading-snug line-clamp-3">
            {template.description}
          </div>
        )}
      </div>

      {/* 인라인 프리뷰 */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {applied ? (
            layout.length > 0 ? (
              layout.map((k) => {
                const item = items[k];
                return (
                  <div key={k} className="border rounded-xl p-3 bg-gray-50">
                    {item ? renderBlock(item) : (
                      <div className="text-sm text-gray-400">블록 데이터 없음: {k}</div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-500">레이아웃 정보가 없습니다.</div>
            )
          ) : (
            <div className="text-sm text-gray-600">
              <div className="mb-2">상세 블록(applied_blocks)이 없습니다.</div>
              {widgets.length ? (
                <>
                  <div className="font-medium mb-2">위젯 구성</div>
                  <ul className="list-disc pl-5">
                    {widgets.map((w) => <li key={w}>{w}</li>)}
                  </ul>
                </>
              ) : (
                <div className="text-gray-400">표시할 내용이 없습니다.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateCard;
