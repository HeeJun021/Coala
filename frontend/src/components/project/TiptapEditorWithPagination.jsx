import React, { useEffect, useState, useCallback, useRef } from "react";
import { EditorContent } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CustomHighlight from "../extensions/CustomHighlight";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import "../../styles/A4EditorLayout.css";

const PAGE_HEIGHT_PX = 1122;

const extensions = [
  StarterKit.configure({ highlight: false }),
  Underline,
  TextStyle,
  Color,
  CustomHighlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
];

const TiptapEditorWithPagination = () => {
  const [pageContents, setPageContents] = useState(["<p>내용을 입력해보세요...</p>"]);
  const editorRefs = useRef([]);

  // ✅ 줄 기반 + 높이 기준 분할
  const splitContentIntoPages = useCallback((html) => {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.visibility = "hidden";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.width = "794px";
    container.style.padding = "40px";
    container.style.boxSizing = "border-box";
    container.style.lineHeight = "1.8";
    container.style.fontSize = "16px";
    container.style.fontFamily = "sans-serif";
    document.body.appendChild(container);

    const lines = html
      .replace(/<\/p>|<br>|<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .split("\n")
      .filter((line) => line.trim() !== "");

    const pages = [];
    let currentPage = [];

    container.innerHTML = "";

    lines.forEach((line) => {
      const div = document.createElement("div");
      div.textContent = line;
      div.style.marginBottom = "8px";
      div.style.lineHeight = "1.8";
      div.style.fontSize = "16px";
      div.style.fontFamily = "sans-serif";

      container.appendChild(div);

      if (container.offsetHeight > PAGE_HEIGHT_PX) {
        pages.push(currentPage.join(""));
        currentPage = [`<div>${line}</div>`];
        container.innerHTML = div.outerHTML;
      } else {
        currentPage.push(`<div>${line}</div>`);
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage.join(""));
    }

    document.body.removeChild(container);
    return pages;
  }, []);

  // ✅ 페이지 내용 변경 → editor 전부 재생성
  useEffect(() => {
    editorRefs.current = pageContents.map((content) => {
      return new Editor({
        extensions,
        content,
        onUpdate: () => {
          const allHTML = editorRefs.current.map((e) => e.getHTML()).join("");
          const newPages = splitContentIntoPages(allHTML);
          if (JSON.stringify(newPages) !== JSON.stringify(pageContents)) {
            setPageContents(newPages);
          }
        },
      });
    });
  }, [pageContents, splitContentIntoPages]);

  const highlightColors = [
    "#e5e7eb", "#facc15", "#fda4af", "#86efac",
    "#93c5fd", "#d8b4fe", "#f87171", "#fdba74",
  ];

  const activeEditor = editorRefs.current[0] || null;
  if (!activeEditor) return <div className="text-center py-10 text-gray-400">에디터 로딩 중...</div>;

  return (
    <div className="editor-container">
      {/* 툴바 */}
      <div className="editor-toolbar mb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button onClick={() => activeEditor.chain().focus().toggleBold().run()}
            className={`p-1 px-2 rounded hover:bg-gray-200 ${activeEditor.isActive("bold") ? "bg-green-100 text-green-600 font-bold" : ""}`}
            title="굵게">B</button>
          <button onClick={() => activeEditor.chain().focus().toggleItalic().run()}
            className={`p-1 px-2 rounded hover:bg-gray-200 ${activeEditor.isActive("italic") ? "bg-green-100 text-green-600 italic" : ""}`}
            title="기울임">I</button>
          <button onClick={() => activeEditor.chain().focus().toggleUnderline().run()}
            className={`p-1 px-2 rounded hover:bg-gray-200 ${activeEditor.isActive("underline") ? "bg-green-100 text-green-600 underline" : ""}`}
            title="밑줄">U</button>

          <button onClick={() => activeEditor.chain().focus().setTextAlign("left").run()}
            className={`p-1 rounded hover:bg-gray-200 ${activeEditor.isActive({ textAlign: "left" }) ? "bg-green-100 text-green-600" : ""}`}
            title="왼쪽 정렬"><AlignLeft size={18} /></button>
          <button onClick={() => activeEditor.chain().focus().setTextAlign("center").run()}
            className={`p-1 rounded hover:bg-gray-200 ${activeEditor.isActive({ textAlign: "center" }) ? "bg-green-100 text-green-600" : ""}`}
            title="가운데 정렬"><AlignCenter size={18} /></button>
          <button onClick={() => activeEditor.chain().focus().setTextAlign("right").run()}
            className={`p-1 rounded hover:bg-gray-200 ${activeEditor.isActive({ textAlign: "right" }) ? "bg-green-100 text-green-600" : ""}`}
            title="오른쪽 정렬"><AlignRight size={18} /></button>

          <select
            onChange={(e) => activeEditor.chain().focus().setMark("textStyle", { fontSize: e.target.value }).run()}
            defaultValue=""
            className="border text-sm rounded px-1 py-0.5"
            title="글자 크기"
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
              <input type="color" onChange={(e) => activeEditor.chain().focus().setColor(e.target.value).run()}
                className="w-6 h-6 cursor-pointer border rounded" title="글자 색상" />
            </label>
            <div className="flex items-center gap-1">
              <span className="text-gray-600 text-xs">배경색</span>
              <div className="flex gap-1">
                {highlightColors.map((color) => (
                  <button key={color}
                    onClick={() => activeEditor.chain().focus().toggleHighlight({ color }).run()}
                    className="w-5 h-5 rounded border hover:scale-110 transition"
                    style={{ backgroundColor: color }}
                    title={color} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 페이지 출력 */}
      {editorRefs.current.map((editor, i) => (
        <div key={i} className="editor-page">
          <EditorContent editor={editor} />
          <div className="text-sm text-center text-gray-400 mt-4">- {i + 1} 페이지 -</div>
        </div>
      ))}
    </div>
  );
};

export default TiptapEditorWithPagination;
