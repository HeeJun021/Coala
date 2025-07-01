import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Editor } from "@toast-ui/react-editor";
import { useAuth } from "../../context/AuthContext";
import { createBoard } from "../../api/boardApi";
import "@toast-ui/editor/dist/toastui-editor.css";

const BoardWritePage = () => {
  const { user } = useAuth();
  const { boardType } = useParams();
  const navigate = useNavigate();
  const [recruitLimit, setRecruitLimit] = useState(""); // ✅ 모집 인원 수
  const location = useLocation();
  const [title, setTitle] = useState(location.state?.codeTitle || "");
  const [content, setContent] = useState("");
  const [codeFilename, setCodeFilename] = useState(location.state?.codeTitle || "");
  const codeEditorRef = useRef();

  useEffect(() => {
    if (!user) {
      alert("로그인 후 이용해주세요.");
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (boardType === "code" && location.state?.codeContent && codeEditorRef.current) {
      codeEditorRef.current.getInstance().setMarkdown(location.state.codeContent);
    }
  }, [boardType, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const textContent = content.trim();
    const codeContent =
      boardType === "code"
        ? codeEditorRef.current.getInstance().getMarkdown().trim()
        : "";
    const filename = codeFilename.trim() || "code.js";

    if (!title.trim()) {
      alert("제목을 입력하세요.");
      return;
    }
    if (boardType === "code" && !codeContent) {
      alert("코드를 입력하세요.");
      return;
    }

    const extMap = {
      ".js": "javascript",
      ".py": "python",
      ".html": "html",
      ".css": "css",
    };
    const ext = filename.includes(".") ? filename.split(".").pop() : "js";
    const codeLanguage = extMap[`.${ext}`] || "javascript";

    // ✅ 숫자 변환 및 기본값 처리
    const recruitLimitNumber =
      boardType === "project" && recruitLimit !== ""
        ? parseInt(recruitLimit, 10)
        : 1;

    const payload = {
      boardType: boardType,
      title,
      content: textContent,
      code: codeContent,
      user_id: user.user_id,
      code_filename: filename,
      code_language: codeLanguage,
      recruit_limit: recruitLimitNumber, // ✅ 추가됨
    };

    console.log("✅ 보내는 payload:", payload);

    try {
      await createBoard(payload);
      navigate(`/board/${boardType}`);
    } catch (error) {
      console.error("❌ 게시글 작성 실패:", error);
      alert("게시글 작성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      <button
        className="mb-4 px-4 py-2 bg-gray-300 text-black rounded-md"
        onClick={() => navigate(-1)}
      >
        ← 뒤로가기
      </button>

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

        {/* ✅ 프로젝트 게시판일 때 모집 인원 수 입력 필드 표시 */}
        {boardType === "project" && (
          <input
            type="number"
            placeholder="모집 인원 수"
            value={recruitLimit}
            onChange={(e) => setRecruitLimit(e.target.value)}
            min={1}
            className="w-full border p-2"
          />
        )}


        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="본문을 입력하세요"
          className="w-full border p-2 h-60"
        />

        {boardType === "code" && (
          <>
            <input
              type="text"
              placeholder="코드 파일 이름 (예: main.js)"
              value={codeFilename}
              onChange={(e) => setCodeFilename(e.target.value)}
              className="w-full border p-2"
            />
            <Editor
              ref={codeEditorRef}
              initialValue=""
              previewStyle="vertical"
              height="400px"
              initialEditType="markdown"
              useCommandShortcut={true}
              placeholder="코드를 입력하세요"
            />
          </>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md"
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
