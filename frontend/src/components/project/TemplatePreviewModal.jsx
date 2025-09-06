import React from "react";

function DocView({ item }) {
  return (
    <div className="prose max-w-none text-sm">
      <h3 className="font-semibold mb-1">{item.title}</h3>
      <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded border">{item.content}</pre>
    </div>
  );
}
function ChecklistView({ item }) {
  return (
    <div>
      <h3 className="font-semibold mb-1">{item.title}</h3>
      <ul className="space-y-1 text-sm">
        {(item.items || []).map((it, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <input type="checkbox" disabled />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
function TableView({ item }) {
  const cols = item.columns || [];
  const rows = item.rows || [];
  return (
    <div>
      <h3 className="font-semibold mb-1">{item.title || "표"}</h3>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{cols.map((c) => <th key={c} className="px-3 py-2 text-left border-b">{c}</th>)}</tr>
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
              <tr><td className="px-3 py-3 text-gray-400" colSpan={cols.length || 1}>샘플 데이터 없음</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function KanbanView({ item }) {
  const cols = item.columns || [];
  const cards = item.seedCards || [];
  return (
    <div>
      <h3 className="font-semibold mb-2">{item.title || "칸반"}</h3>
      <div className="grid grid-cols-3 gap-3">
        {cols.map((col) => (
          <div key={col} className="border rounded-lg p-2">
            <div className="font-medium mb-2">{col}</div>
            <div className="space-y-2">
              {cards.filter(c => c.column === col).map((c, idx) => (
                <div key={idx} className="border rounded p-2 text-sm bg-white shadow-sm">
                  {c.title}
                </div>
              ))}
              {cards.filter(c => c.column === col).length === 0 && (
                <div className="text-xs text-gray-400">카드 없음</div>
              )}
            </div>
          </div>
        ))}
        {cols.length === 0 && <div className="text-sm text-gray-400">컬럼 없음</div>}
      </div>
    </div>
  );
}

function renderBlock(item) {
  switch (item.type) {
    case "doc": return <DocView item={item} />;
    case "checklist": return <ChecklistView item={item} />;
    case "table": return <TableView item={item} />;
    case "kanban": return <KanbanView item={item} />;
    default:
      return (
        <div className="text-sm text-gray-500">
          알 수 없는 블록 타입 <code>{item.type}</code>
        </div>
      );
  }
}

export default function TemplatePreviewModal({ template, onClose }) {
  const applied = template?.applied_blocks; // 라이브러리에서 적용한 경우 존재
  const widgets = template?.widgets || [];  // 간단 템플릿(현재 구조)
  // applied_blocks 구조 가이드:
  // { layout: ["doc:intro","kanban:tasks"], items: { "doc:intro": {...}, "kanban:tasks": {...} } }

  const layout = applied?.layout || [];
  const items = applied?.items || {};

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999]">
      <div className="w-[900px] max-h-[80vh] overflow-auto bg-white rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-lg font-semibold">{template.title}</div>
            {template.description && (
              <div className="text-sm text-gray-600">{template.description}</div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">닫기</button>
        </div>

        {applied ? (
          <div className="space-y-6">
            {layout.length > 0
              ? layout.map((k) => {
                  const item = items[k];
                  return (
                    <div key={k} className="border rounded-xl p-4 bg-gray-50">
                      {item ? renderBlock(item) : (
                        <div className="text-sm text-gray-400">블록 데이터 없음: {k}</div>
                      )}
                    </div>
                  );
                })
              : <div className="text-sm text-gray-500">레이아웃 정보가 없습니다.</div>
            }
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            <div className="mb-2">아직 상세 블록(applied_blocks)이 없습니다.</div>
            {widgets?.length ? (
              <div>
                <div className="font-medium mb-2">위젯 구성</div>
                <ul className="list-disc pl-5">
                  {widgets.map((w) => <li key={w}>{w}</li>)}
                </ul>
              </div>
            ) : (
              <div className="text-gray-400">표시할 내용이 없습니다.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
