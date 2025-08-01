import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getBoardDetail, updateBoard } from "../../api/boardApi";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";

const CodeBoardEditForm = ({ postId }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [codeFilename, setCodeFilename] = useState("");
  const editorRef = useRef();

  // 게시글 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getBoardDetail(postId);
        setTitle(data.title);
        setContent(data.content);
        setCodeFilename(data.code_filename || "");

        if (data.code && editorRef.current) {
          editorRef.current.getInstance().setMarkdown(data.code);
        }
      } catch (err) {
        alert("게시글 정보를 불러오지 못했습니다.");
      }
    };
    fetchPost();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      return alert("제목을 입력하세요.");
    }

    const codeContent = editorRef.current.getInstance().getMarkdown().trim();
    const filename = codeFilename.trim() || "main.js";

    const extMap = {
      ".js": "javascript",
      ".py": "python",
      ".html": "html",
      ".css": "css",
    };

    const ext = filename.includes(".") ? filename.split(".").pop() : "js";
    const codeLanguage = extMap[`.${ext}`] || "javascript";

    const payload = {
      title,
      content: content.trim(),
      code: codeContent,
      code_filename: filename,
      code_language: codeLanguage,
    };

    try {
      await updateBoard(postId, payload, "code");
      alert("게시글이 수정되었습니다.");
      navigate(`/board/code/${postId}`);
    } catch (err) {
      alert("수정 실패: " + err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white min-h-screen">
      <h2 className="text-2xl font-semibold mb-6">코드 게시글 수정</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full border p-2"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="본문을 입력하세요"
          className="w-full border p-2 h-40"
        />

        <input
          type="text"
          value={codeFilename}
          onChange={(e) => setCodeFilename(e.target.value)}
          placeholder="코드 파일 이름 (예: main.js)"
          className="w-full border p-2"
        />
        <Editor
          ref={editorRef}
          initialValue=""
          previewStyle="vertical"
          height="400px"
          initialEditType="markdown"
          useCommandShortcut={true}
          placeholder="코드를 입력하세요"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-300 text-black rounded-md"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default CodeBoardEditForm;
