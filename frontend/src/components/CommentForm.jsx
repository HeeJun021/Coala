import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],
  ["link", "image"],
  ["clean"],
];

const CommentForm = ({ onSubmit, placeholder = "댓글을 입력하세요", initialValue = "" }) => {
  const [content, setContent] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim() === "") return;
    onSubmit(content);
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <ReactQuill
        value={content}
        onChange={setContent}
        modules={{ toolbar: toolbarOptions }}
        placeholder={placeholder}
        className="bg-white mb-2"
      />
      <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md mt-2">
        작성
      </button>
    </form>
  );
};

export default CommentForm;
