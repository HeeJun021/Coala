// 파일: src/components/project/TiptapEditorWithPagination.jsx

import React, { useEffect, useState } from "react";
import { Editor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CustomHighlight from "../extensions/CustomHighlight";
import { AlignLeft, AlignCenter, AlignRight, Save } from "lucide-react";
import { updateDocument } from "../../api/documentApi";
import "../../styles/A4EditorLayout.css";

const highlightColors = [
  "#e5e7eb", "#facc15", "#fda4af", "#86efac",
  "#93c5fd", "#d8b4fe", "#f87171", "#fdba74",
];

const TiptapEditorWithPagination = ({ projectId, docId, title, content }) => {
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    if (content && content !== "<p>불러오는 중...</p>") {
      const newEditor = new Editor({
        extensions: [
          StarterKit.configure({ highlight: false }),
          Underline,
          TextStyle,
          Color,
          CustomHighlight.configure({ multicolor: true }),
          TextAlign.configure({ types: ["heading", "paragraph"] }),
        ],
        content,
      });
      setEditor(newEditor);
    }
  }, [content]);

  const handleSaveDocument = async () => {
    try {
      if (!editor) return;
      const fullHTML = editor.getHTML();

      if (!fullHTML || fullHTML === "<p>불러오는 중...</p>") {
        console.log("내용을 입력해주세요.")
        return;
      }

      console.log("💾 저장 데이터:", { title, content: fullHTML });

      await updateDocument(projectId, docId, {
        title: title || "",
        content: fullHTML,
      });

    } catch (error) {
      console.error("문서 저장 실패:", error.response?.data || error);
    }
  };

  if (!editor) {
    return <div className="text-center py-10 text-gray-400">에디터 로딩 중...</div>;
  }

  return (
    <div className="editor-container">
      {/* 툴바 */}
      <div className="editor-toolbar mb-6 flex justify-between items-center">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 px-2 rounded hover:bg-gray-200 ${editor.isActive("bold") ? "bg-green-100 text-green-600 font-bold" : ""}`}>B</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 px-2 rounded hover:bg-gray-200 ${editor.isActive("italic") ? "bg-green-100 text-green-600 italic" : ""}`}>I</button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 px-2 rounded hover:bg-gray-200 ${editor.isActive("underline") ? "bg-green-100 text-green-600 underline" : ""}`}>U</button>

          <button onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: "left" }) ? "bg-green-100 text-green-600" : ""}`}><AlignLeft size={18} /></button>
          <button onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: "center" }) ? "bg-green-100 text-green-600" : ""}`}><AlignCenter size={18} /></button>
          <button onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: "right" }) ? "bg-green-100 text-green-600" : ""}`}><AlignRight size={18} /></button>

          <select
            onChange={(e) => editor.chain().focus().setMark("textStyle", { fontSize: e.target.value }).run()}
            defaultValue=""
            className="border text-sm rounded px-1 py-0.5"
          >
            <option value="">크기</option>
            <option value="12px">12px</option>
            <option value="16px">16px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
          </select>

          <div className="flex items-center gap-4 ml-2">
            <label className="flex items-center gap-1">
              <span className="text-gray-600 text-xs">글자색</span>
              <input type="color" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                className="w-6 h-6 cursor-pointer border rounded" />
            </label>
            <div className="flex items-center gap-1">
              <span className="text-gray-600 text-xs">배경색</span>
              <div className="flex gap-1">
                {highlightColors.map((color) => (
                  <button key={color}
                    onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                    className="w-5 h-5 rounded border hover:scale-110 transition"
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveDocument}
          className="flex items-center gap-2 bg-green-600 ml-12 text-white text-sm px-4 py-1.5 rounded hover:bg-green-700 transition"
        >
          <Save size={16} />
          저장하기
        </button>
      </div>

      {/* 에디터 영역 */}
      <div className="editor-page">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditorWithPagination;
