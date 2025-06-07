import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough } from "lucide-react";

const TiptapEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: "<p>여기에 내용을 작성하세요...</p>",
  });

  if (!editor) return <div>⏳ 에디터 로딩 중...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* 🧰 서식 툴바 */}
      <div className="flex items-center gap-2 border px-3 py-2 rounded bg-gray-50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "text-blue-600 font-bold" : "text-gray-600"}
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "text-blue-600 italic" : "text-gray-600"}
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "text-blue-600 underline" : "text-gray-600"}
        >
          <UnderlineIcon size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "text-blue-600 line-through" : "text-gray-600"}
        >
          <Strikethrough size={18} />
        </button>
      </div>

      {/* 📝 에디터 */}
      <EditorContent editor={editor} className="border p-4 min-h-[300px] rounded" />
    </div>
  );
};

export default TiptapEditor;
