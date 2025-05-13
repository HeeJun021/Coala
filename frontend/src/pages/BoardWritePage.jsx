import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Editor } from "@toast-ui/react-editor";
import { useAuth } from "../context/AuthContext";
import { createBoard } from "../api/boardApi";
import "@toast-ui/editor/dist/toastui-editor.css";

const BoardWritePage = () => {
  const { user } = useAuth();
  const { boardType } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [recruitLimit, setRecruitLimit] = useState(""); // 사용자 입력 (문자열)
  const editorRef = useRef();

  useEffect(() => {
    if (!user) {
      alert("로그인 후 이용해주세요.");
      navigate("/login");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const content =
      boardType === "code"
        ? editorRef.current.getInstance().getMarkdown()
        : editorRef.current.value;

    // 숫자 변환 및 유효성 처리
    const recruitLimitNumber =
      boardType === "project" && recruitLimit !== ""
        ? parseInt(recruitLimit, 10)
        : 1;

    const payload = {
      boardType: boardType, // ✅ 여기서 수정됨
      title,
      content,
      user_id: user.user_id,
      code: "",
      image_url: "",
      recruit_limit: boardType === "project" ? recruitLimitNumber : 1,
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

        {boardType === "project" && (
          <div>
            <label className="block mb-1 text-sm font-medium">모집 인원 수</label>
            <input
              type="number"
              min="1"
              placeholder="예: 3"
              value={recruitLimit}
              onChange={(e) => setRecruitLimit(e.target.value)}
              className="w-full border p-2"
              required
            />
          </div>
        )}

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
