import React, { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css"; // ✅ 반드시 추가

const BoardWritePage = () => {
  const { boardType } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const editorRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    const content =
      boardType === "code"
        ? editorRef.current.getInstance().getMarkdown()
        : editorRef.current.value;

    console.log("작성된 게시글:", { title, content });
    navigate(`/board/${boardType}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      <h2 className="text-2xl font-semibold mb-6">
        {boardType === "free"
          ? "자유게시판 글쓰기"
          : boardType === "project"
          ? "프로젝트 게시판 글쓰기"
          : "코드 공유 게시판 글쓰기"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2"
          required
        />

        {/* 코드 게시판 전용 에디터 */}
        {boardType === "code" ? (
          <Editor
            ref={editorRef}
            initialValue=""
            previewStyle="vertical"
            height="400px"
            initialEditType="markdown"
            useCommandShortcut={true}
          />
        ) : (
          <textarea
            ref={editorRef}
            placeholder="내용을 입력하세요"
            className="w-full border p-2 h-60"
            required
          />
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded-md"
          >
            등록하기
          </button>
          <button
            type="button"
            onClick={() => navigate(`/board/${boardType}`)}
            className="px-4 py-2 bg-gray-300 text-black rounded-md"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default BoardWritePage;
