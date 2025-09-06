import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getTemplate, updateTemplate } from "../../api/templateApi";

// --- 간단 편집 위젯들 ---
const DocEditor = ({ item, onChange }) => (
  <div className="space-y-2">
    <input
      className="border rounded px-2 py-1 w-full"
      placeholder="문서 제목"
      value={item.title || ""}
      onChange={(e) => onChange({ ...item, title: e.target.value })}
    />
    <textarea
      className="border rounded px-2 py-2 w-full min-h-[120px]"
      placeholder="내용"
      value={item.content || ""}
      onChange={(e) => onChange({ ...item, content: e.target.value })}
    />
  </div>
);

const ChecklistEditor = ({ item, onChange }) => {
  const items = item.items || [];
  const changeItem = (idx, val) => {
    const next = [...items]; next[idx] = val; onChange({ ...item, items: next });
  };
  return (
    <div className="space-y-2">
      <input
        className="border rounded px-2 py-1 w-full"
        placeholder="체크리스트 제목"
        value={item.title || ""}
        onChange={(e) => onChange({ ...item, title: e.target.value })}
      />
      <div className="space-y-1">
        {items.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="border rounded px-2 py-1 flex-1"
              value={v}
              onChange={(e) => changeItem(i, e.target.value)}
            />
            <button className="px-2 border rounded"
              onClick={() => onChange({ ...item, items: items.filter((_, idx) => idx !== i) })}>삭제</button>
          </div>
        ))}
        <button className="px-2 border rounded"
          onClick={() => onChange({ ...item, items: [...items, ""] })}>+ 항목</button>
      </div>
    </div>
  );
};

const TableEditor = ({ item, onChange }) => {
  const cols = item.columns || [];
  const rows = item.rows || [];
  const setCell = (r, c, val) => {
    const next = rows.map((row, i) => i === r ? row.map((cell, j) => j === c ? val : cell) : row);
    onChange({ ...item, rows: next });
  };
  return (
    <div className="space-y-2">
      <input
        className="border rounded px-2 py-1 w-full"
        placeholder="표 제목"
        value={item.title || ""}
        onChange={(e) => onChange({ ...item, title: e.target.value })}
      />
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{cols.map((c, i) => <th key={i} className="px-2 py-1 border-b">{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className="border-b">
                    <input className="px-2 py-1 w-full"
                      value={cell}
                      onChange={(e) => setCell(i, j, e.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button className="px-2 border rounded"
          onClick={() => onChange({ ...item, rows: [...rows, Array(cols.length).fill("")] })}>+ 행</button>
      </div>
    </div>
  );
};

const KanbanEditor = ({ item, onChange }) => {
  const columns = item.columns || [];
  const seedCards = item.seedCards || [];
  return (
    <div className="space-y-2">
      <input
        className="border rounded px-2 py-1 w-full"
        placeholder="칸반 제목"
        value={item.title || ""}
        onChange={(e) => onChange({ ...item, title: e.target.value })}
      />
      <div className="flex gap-2 flex-wrap">
        {columns.map((col, i) => (
          <input key={i} className="border rounded px-2 py-1"
            value={col}
            onChange={(e) => {
              const next = [...columns]; next[i] = e.target.value;
              onChange({ ...item, columns: next });
            }} />
        ))}
        <button className="px-2 border rounded"
          onClick={() => onChange({ ...item, columns: [...columns, "새 컬럼"] })}>+ 컬럼</button>
      </div>
      <div className="space-y-1">
        {seedCards.map((c, i) => (
          <div key={i} className="flex gap-2">
            <input className="border rounded px-2 py-1 flex-1"
              value={c.title} onChange={(e) => {
                const next = [...seedCards]; next[i] = { ...c, title: e.target.value };
                onChange({ ...item, seedCards: next });
              }} />
            <select className="border rounded px-2"
              value={c.column} onChange={(e) => {
                const next = [...seedCards]; next[i] = { ...c, column: e.target.value };
                onChange({ ...item, seedCards: next });
              }}>
              {columns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
            <button className="px-2 border rounded"
              onClick={() => onChange({ ...item, seedCards: seedCards.filter((_, idx) => idx !== i) })}>삭제</button>
          </div>
        ))}
        <button className="px-2 border rounded"
          onClick={() => onChange({ ...item, seedCards: [...seedCards, { title: "새 카드", column: columns[0] || "" }] })}>+ 카드</button>
      </div>
    </div>
  );
};

// --- 렌더러 선택
const BlockEditor = ({ item, onChange }) => {
  switch (item.type) {
    case "doc": return <DocEditor item={item} onChange={onChange} />;
    case "checklist": return <ChecklistEditor item={item} onChange={onChange} />;
    case "table": return <TableEditor item={item} onChange={onChange} />;
    case "kanban": return <KanbanEditor item={item} onChange={onChange} />;
    default: return <div className="text-sm text-gray-500">알 수 없는 타입: {item.type}</div>;
  }
};

export default function TemplateWorkspace() {
  const { projectId, templateId } = useParams();
  const [tpl, setTpl] = useState(null);
  const [blocks, setBlocks] = useState({ layout: [], items: {} });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await getTemplate(projectId, templateId);
      setTpl(t);
      const b = t.applied_blocks || {
        layout: ["doc:intro"],
        items: {
          "doc:intro": { type: "doc", title: "회의 메모", content: "" }
        }
      };
      setBlocks(b);
    })();
  }, [projectId, templateId]);

  const updateItem = (key, next) => {
    setBlocks((prev) => ({ ...prev, items: { ...prev.items, [key]: next } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateTemplate(projectId, templateId, { applied_blocks: blocks });
      setTpl(updated);
      alert("저장됐습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!tpl) return <div className="p-6">불러오는 중…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xl font-semibold">{tpl.title}</div>
          <div className="text-sm text-gray-600">{tpl.description}</div>
        </div>
        <div className="flex gap-2">
          <Link to={`/team-project/${projectId}`} className="px-3 py-2 border rounded">목록으로</Link>
          <button className="px-3 py-2 rounded text-white bg-green-600 disabled:opacity-50"
            disabled={saving} onClick={save}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {blocks.layout.map((k) => {
          const item = blocks.items[k];
          if (!item) return <div key={k} className="text-sm text-gray-400">블록 없음: {k}</div>;
          return (
            <div key={k} className="border rounded-xl p-4 bg-white shadow-sm">
              <div className="mb-2 text-sm text-gray-500">{k}</div>
              <BlockEditor
                item={item}
                onChange={(next) => updateItem(k, next)}
              />
            </div>
          );
        })}
        <div>
          <button className="px-3 py-1 border rounded"
            onClick={() => {
              const key = `doc:new-${Date.now()}`;
              setBlocks((prev) => ({
                layout: [...prev.layout, key],
                items: { ...prev.items, [key]: { type: "doc", title: "새 문서", content: "" } }
              }));
            }}>+ 블록 추가</button>
        </div>
      </div>
    </div>
  );
}
