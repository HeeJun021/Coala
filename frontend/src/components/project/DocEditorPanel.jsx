import React, { useEffect, useState } from "react";
import { getDocument, updateDocument } from "../../api/documentApi";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const DocEditorPanel = ({ docId, projectId, onBack }) => {
  const [title, setTitle] = useState("");
  const [initialContent, setInitialContent] = useState("");

  // ✅ editor 훅은 컴포넌트 최상단에서 호출
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // 실시간 업데이트 로직이 필요하면 여기에 추가 가능
    },
  });

  useEffect(() => {
    const load = async () => {
      const doc = await getDocument(projectId, docId);
      setTitle(doc.title);
      setInitialContent(doc.content); // ✅ 초기 콘텐츠 설정
    };
    load();
  }, [docId, projectId]);

  useEffect(() => {
    // ✅ initialContent 변경 시 editor 내용도 갱신
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent || "");
    }
  }, [editor, initialContent]);

  const handleSave = async () => {
    if (!editor) return;
    await updateDocument(projectId, docId, {
      title,
      content: editor.getHTML(),
    });
    alert("저장 완료");
  };

  return (
    <div className="p-6">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-xl font-semibold mb-4 border-b w-full pb-1"
        placeholder="문서 제목"
      />
      {editor ? (
        <EditorContent editor={editor} className="border rounded p-4 min-h-[300px]" />
      ) : (
        <p className="text-gray-400">에디터 로딩 중...</p>
      )}
      <div className="mt-4">
        <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded mr-2">
          저장
        </button>
        <button onClick={onBack} className="px-4 py-2 border rounded text-gray-700">
          목록으로
        </button>
      </div>
    </div>
  );
};

export default DocEditorPanel;
