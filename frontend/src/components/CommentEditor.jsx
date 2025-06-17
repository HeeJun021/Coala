import React, { useRef } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";

const CommentEditor = ({ onSubmit }) => {
  const editorRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = editorRef.current.getInstance().getMarkdown();
    if (!content.trim()) return alert("댓글 내용을 입력하세요.");
    onSubmit(content);
    editorRef.current.getInstance().setMarkdown(""); // 작성 후 초기화
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <Editor
        ref={editorRef}
        initialValue=""
        previewStyle="tab"
        height="200px"
        initialEditType="markdown"
        useCommandShortcut={true}
      />
      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-green-700 text-white rounded-md"
        >
          댓글 등록
        </button>
      </div>
    </form>
  );
};

export default CommentEditor;
