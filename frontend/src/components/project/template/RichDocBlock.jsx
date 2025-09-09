import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

export default function RichDocBlock({ value, onChange, readOnly=false, className="" }) {
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({ heading: { levels: [1,2,3,4] } }),
      Placeholder.configure({ placeholder: "여기에 내용을 입력하세요…" }),
      Link.configure({ openOnClick: true }),
      Image,
      TextStyle,
      Color,
      Highlight,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor }) => {
      if (!readOnly && onChange) onChange(editor.getJSON());
    },
  }, [readOnly, JSON.stringify(value)]); // value 변경 시 에디터 재설정

  return (
    <div className={`border rounded-xl p-4 bg-white ${readOnly ? "pointer-events-none" : ""} ${className}`}>
      <div className="prose max-w-none">
        <EditorContent editor={editor} />
      </div>
      {!readOnly && (
        <div className="mt-2 text-xs text-gray-500">
          • 표 셀 경계 드래그 가능 • 색/하이라이트 적용 • 이미지 붙여넣기/URL 삽입 가능
        </div>
      )}
    </div>
  );
}