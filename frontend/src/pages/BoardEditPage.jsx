import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBoardDetail, updateBoard } from "../api/boardApi";

const BoardEditPage = () => {
  const { boardType, postId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // 기존 게시글 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getBoardDetail(postId);
        setTitle(data.title);
        setContent(data.content);
      } catch (err) {
        alert("게시글 정보를 불러오지 못했습니다.");
      }
    };
    fetchPost();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return alert("제목과 내용을 입력하세요.");
    }

    try {
      await updateBoard(postId, { title, content });
      alert("게시글이 수정되었습니다.");
      navigate(`/board/${boardType}/${postId}`);
    } catch (err) {
      alert("수정 실패: " + err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white min-h-screen">
      <h2 className="text-2xl font-semibold mb-6">게시글 수정</h2>

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
          placeholder="내용을 입력하세요"
          className="w-full border p-2 h-60"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded-md"
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

export default BoardEditPage;
