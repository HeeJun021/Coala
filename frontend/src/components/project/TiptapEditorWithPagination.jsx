import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import CustomHighlight from "../extensions/CustomHighlight";

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Superscript as SupIcon, Subscript as SubIcon,
  AlignLeft, AlignCenter, AlignRight,
  ListOrdered, List, Indent, Outdent,
  Quote, Code, Link as LinkIcon, Image as ImageIcon,
  Table as TableIcon, Save
} from "lucide-react";

import { updateDocument } from "../../api/documentApi";
import "../../styles/A4EditorLayout.css";

const FONT_FAMILIES = [
  "Malgun Gothic, sans-serif",
  "Pretendard, sans-serif",
  "Inter, system-ui, sans-serif",
  "Noto Sans KR, sans-serif",
  "Times New Roman, serif",
  "Georgia, serif",
  "Monaco, Menlo, Consolas, monospace",
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

const highlightColors = [
  "#e5e7eb", "#facc15", "#fda4af", "#86efac",
  "#93c5fd", "#d8b4fe", "#f87171", "#fdba74",
];

const TiptapEditorWithPagination = ({ projectId, docId, title, content }) => {
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ highlight: false }),
      Underline,
      Strike,
      Superscript,
      Subscript,
      TextStyle,
      Color,
      FontFamily,
      CustomHighlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: true,
      }),
      Image.configure({
        inline: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: "<p>불러오는 중...</p>",
    editorProps: {
      attributes: {
        class: "tiptap-doc font-[\"Malgun Gothic\",sans-serif] leading-[1.6] text-[16px]",
      },
    },
  });

  // 불러온 문서 내용 반영
  useEffect(() => {
    if (editor && content && content !== "<p>불러오는 중...</p>") {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // 저장
  const handleSave = async () => {
    if (!editor || saving) return;
    try {
      setSaving(true);
      const html = editor.getHTML();
      await updateDocument(projectId, docId, {
        title: title || "제목 없음",
        content: html,
      });
      setSavedAt(new Date());
    } catch (e) {
      console.error("문서 저장 실패:", e.response?.data || e);
      alert("문서 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 링크 추가
  const addLink = () => {
    const url = prompt("링크 URL을 입력하세요:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  // 이미지 추가
  const addImage = () => {
    const url = prompt("이미지 URL을 입력하세요:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // 표 추가
  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  if (!editor) {
    return <div className="text-center py-10 text-gray-400">에디터 로딩 중...</div>;
  }

  const isList = editor.isActive("bulletList") || editor.isActive("orderedList");

  return (
    <div className="editor-container">
      {/* 상단 리본 */}
      <div className="border-b bg-gray-50 w-full max-w-[1100px] mb-6">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">HOME</span>
            <span>· INSERT</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {savedAt ? (
              <span>✔ 저장됨 · {savedAt.toLocaleTimeString()}</span>
            ) : (
              <span>자동저장 꺼짐</span>
            )}
            <button
              onClick={handleSave}
              className={`flex items-center gap-1 rounded px-3 py-1.5 text-white ${saving ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
              disabled={saving}
              title="저장하기"
            >
              <Save size={16} />
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        {/* 리본 툴바 */}
        <div className="flex flex-wrap gap-4 px-4 pb-3">
          {/* 글꼴 */}
          <div className="bg-white rounded-lg border p-2 flex flex-wrap gap-2 items-center">
            <select
              className="border rounded px-2 py-1 text-sm"
              defaultValue={FONT_FAMILIES[0]}
              onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
              title="글꼴"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>{f.split(",")[0]}</option>
              ))}
            </select>

            <select
              className="border rounded px-2 py-1 text-sm"
              defaultValue="16px"
              onChange={(e) => editor.chain().focus().setMark("textStyle", { fontSize: e.target.value }).run()}
              title="글자 크기"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`ribbon-btn ${editor.isActive("bold") ? "is-active" : ""}`}><Bold size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`ribbon-btn ${editor.isActive("italic") ? "is-active" : ""}`}><Italic size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`ribbon-btn ${editor.isActive("underline") ? "is-active" : ""}`}><UnderlineIcon size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`ribbon-btn ${editor.isActive("strike") ? "is-active" : ""}`}><Strikethrough size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleSuperscript().run()} className={`ribbon-btn ${editor.isActive("superscript") ? "is-active" : ""}`}><SupIcon size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleSubscript().run()} className={`ribbon-btn ${editor.isActive("subscript") ? "is-active" : ""}`}><SubIcon size={16} /></button>
          </div>

          {/* 단락 */}
          <div className="bg-white rounded-lg border p-2 flex gap-2 items-center">
            <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`ribbon-btn ${editor.isActive({ textAlign: "left" }) ? "is-active" : ""}`}><AlignLeft size={16} /></button>
            <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`ribbon-btn ${editor.isActive({ textAlign: "center" }) ? "is-active" : ""}`}><AlignCenter size={16} /></button>
            <button onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`ribbon-btn ${editor.isActive({ textAlign: "right" }) ? "is-active" : ""}`}><AlignRight size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`ribbon-btn ${editor.isActive("bulletList") ? "is-active" : ""}`}><List size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`ribbon-btn ${editor.isActive("orderedList") ? "is-active" : ""}`}><ListOrdered size={16} /></button>
            <button onClick={() => isList ? editor.chain().focus().sinkListItem("listItem").run() : null} className="ribbon-btn"><Indent size={16} /></button>
            <button onClick={() => isList ? editor.chain().focus().liftListItem("listItem").run() : null} className="ribbon-btn"><Outdent size={16} /></button>
          </div>

          {/* Insert */}
          <div className="bg-white rounded-lg border p-2 flex gap-2 items-center">
            <button onClick={addLink} className="ribbon-btn" title="링크"><LinkIcon size={16} /></button>
            <button onClick={() => editor.chain().focus().unsetLink().run()} className="ribbon-btn" title="링크 제거">✕</button>
            <button onClick={addImage} className="ribbon-btn" title="이미지"><ImageIcon size={16} /></button>
            <button onClick={addTable} className="ribbon-btn" title="표"><TableIcon size={16} /></button>
          </div>
        </div>
      </div>

      {/* 문서 영역 */}
      <div className="editor-page">
        <EditorContent editor={editor} />
        <div className="page-number">1</div>
      </div>
    </div>
  );
};

export default TiptapEditorWithPagination;
