import React, { useEffect, useState } from "react";
import { getDocument, updateDocument } from "../../api/documentApi";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import FontSize from "../extensions/FontSize";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import html2pdf from "html2pdf.js";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
} from "lucide-react";

const DocEditorPanel = ({ docId, projectId, onBack }) => {
  const [title, setTitle] = useState("");
  const [initialContent, setInitialContent] = useState("");

  const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Underline,
    TextStyle,
    FontSize,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Color,
    Highlight,
  ],
    content: initialContent,
  });

const handleExportPDF = () => {
  if (!editor) return;

  const element = document.getElementById("pdf-content");

  html2pdf()
    .set({
      margin: 10,
      filename: `${title || "문서"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(element)
    .save();
};
  

  // 문서 불러오기
  useEffect(() => {
    const load = async () => {
      const doc = await getDocument(projectId, docId);
      setTitle(doc.title);
      setInitialContent(doc.content);
    };
    load();
  }, [docId, projectId]);

  // 초기 콘텐츠 설정
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent || "");
    }
  }, [editor, initialContent]);

  // 저장
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
      {/* 제목 입력 */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-xl font-semibold mb-4 border-b w-full pb-1"
        placeholder="문서 제목"
      />

      {/* 툴바 */}
      {editor && (
        <div className="flex items-center gap-2 border px-3 py-2 rounded bg-gray-50 mb-4">
          {/* 🔽 제목 드롭다운 */}
          <select
            value={
              editor.isActive("heading", { level: 1 }) ? "h1" :
              editor.isActive("heading", { level: 2 }) ? "h2" :
              editor.isActive("heading", { level: 3 }) ? "h3" :
              editor.isActive("heading", { level: 4 }) ? "h4" :
              editor.isActive("heading", { level: 5 }) ? "h5" :
              editor.isActive("heading", { level: 6 }) ? "h6" :
              "paragraph"
            }
            onChange={(e) => {
              const value = e.target.value;
              editor.chain().focus();
              if (value === "paragraph") {
                editor.chain().focus().setParagraph().run();
              } else {
                const level = parseInt(value.replace("h", ""));
                editor.chain().focus().setHeading({ level }).run(); // ✅ 이 부분이 핵심
              }
            }}
            className="text-sm px-2 py-1 border rounded bg-white text-gray-700"
          >
            <option value="paragraph">본문</option>
            <option value="h1">제목 1</option>
            <option value="h2">제목 2</option>
            <option value="h3">제목 3</option>
            <option value="h4">제목 4</option>
            <option value="h5">제목 5</option>
            <option value="h6">제목 6</option>
          </select>
          
              <select
                onChange={(e) => {
                  const size = e.target.value;
                  editor.chain().focus().setFontSize(size).run();
                }}
                defaultValue=""
                className="text-sm px-2 py-1 border rounded bg-white text-gray-700"
              >
                <option value="">크기</option>
                <option value="10px">10px</option>
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
                <option value="32px">32px</option>
              </select>
              
              {/* 🎨 글자 색상 */}
              <select
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                defaultValue=""
                className="text-sm px-2 py-1 border rounded bg-white text-gray-700"
              >
                <option value="">글자 색</option>
                <option value="black">검정</option>
                <option value="red">빨강</option>
                <option value="blue">파랑</option>
                <option value="green">초록</option>
                <option value="purple">보라</option>
              </select>

              {/* 🌟 강조 배경 */}
              <select
                onChange={(e) => {
                  const isHighlight = e.target.value !== "";
                  editor.chain().focus().unsetHighlight().run(); // 기존 강조 제거
                  if (isHighlight) {
                    editor.chain().focus().setHighlight({ color: e.target.value }).run();
                  }
                }}
                defaultValue=""
                className="text-sm px-2 py-1 border rounded bg-white text-gray-700"
              >
                <option value="">강조 없음</option>
                <option value="yellow">노랑</option>
                <option value="gray">회색</option>
                <option value="orange">주황</option>
                <option value="pink">핑크</option>
              </select>


          {/* 🔤 서식 버튼 */}
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-1 ${editor.isActive({ textAlign: "left" }) ? "text-blue-600" : "text-gray-600"}`}
          >
            왼쪽
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-1 ${editor.isActive({ textAlign: "center" }) ? "text-blue-600" : "text-gray-600"}`}
          >
            가운데
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-1 ${editor.isActive({ textAlign: "right" }) ? "text-blue-600" : "text-gray-600"}`}
          >
            오른쪽
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={`p-1 ${editor.isActive({ textAlign: "justify" }) ? "text-blue-600" : "text-gray-600"}`}
          >
            양쪽
          </button>
        </div>
      )}

      {/* 에디터 */}
      {editor ? (
        <EditorContent
        id="pdf-content"
        editor={editor} 
        className="border rounded p-4 min-h-[300px]" />
      ) : (
        <p className="text-gray-400">에디터 로딩 중...</p>
      )}

      {/* 저장/목록 버튼 */}
      <div className="mt-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        >
          저장
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2 border rounded text-gray-700"
        >
          목록으로
        </button>
      </div>
    </div>
  );
};

export default DocEditorPanel;
