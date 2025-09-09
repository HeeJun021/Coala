import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTemplate } from "../../api/templateApi";
import RichDocBlock from "../../components/project/template/RichDocBlock";

export default function TemplateWorkspace() {
  const { projectId, templateId } = useParams();
  const [template, setTemplate] = useState(null);
  const [blocks, setBlocks] = useState({ layout: [], items: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await getTemplate(projectId, templateId);
        if (!alive) return;
        setTemplate(t);
        setBlocks(t?.applied_blocks || { layout: [], items: {} });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [projectId, templateId]);

  const renderBlock = (bId) => {
    const b = blocks.items[bId];
    if (!b) return null;

    switch (b.type) {
      case "doc": {
        const tiptapDoc = (b?.value && b.value.type === "doc")
          ? b.value
          : { type: "doc", content: [{ type: "paragraph" }] };

        return (
          <RichDocBlock
            key={bId}
            value={tiptapDoc}
            onChange={(nextDoc) =>
              setBlocks(prev => {
                const next = { ...prev, items: { ...prev.items } };
                next.items[bId] = { ...b, type: "doc", value: nextDoc };
                return next;
              })
            }
          />
        );
      }
      default:
        return <div key={bId} className="text-sm text-gray-500">알 수 없는 블록: {b.type}</div>;
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-600">불러오는 중…</div>;

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">{template?.title}</h2>

      {(blocks.layout || []).map((bId) => renderBlock(bId))}

      {(!blocks.layout || blocks.layout.length === 0) && (
        <div className="text-sm text-gray-500">표시할 블록이 없습니다.</div>
      )}
    </div>
  );
}