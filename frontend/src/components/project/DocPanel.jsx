import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { fetchProjectDocument, saveProjectDocument } from "../../api/projectApi";

const DocPanel = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>불러오는 중...</p>",
  });

  useEffect(() => {
    const loadDoc = async () => {
      try {
        const doc = await fetchProjectDocument(projectId);
        editor?.commands.setContent(doc.content || "<p>문서를 작성하세요.</p>");
      } catch (err) {
        console.warn("문서 없음 → 새로 작성 시작");
        editor?.commands.setContent("<p>문서를 작성하세요.</p>");
      } finally {
        setLoading(false);
      }
    };
    if (editor) loadDoc();
  }, [editor, projectId]);

  const handleSave = async () => {
    const html = editor.getHTML();
    try {
      await saveProjectDocument(projectId, html);
      alert("✅ 문서가 저장되었습니다.");
    } catch (err) {
      alert("❌ 저장 실패");
      console.error("문서 저장 실패:", err);
    }
  };

  if (loading) return <p className="p-4 text-sm text-gray-500">문서를 불러오는 중입니다...</p>;

  return (
    <div className="p-4 space-y-4">
      <div className="border rounded bg-white p-4 shadow">
        <EditorContent editor={editor} />
      </div>
      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        저장
      </button>
    </div>
  );
};

export default DocPanel;
