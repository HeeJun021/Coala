import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBoardDetail, updateBoard } from "../../api/boardApi";

const ProjectBoardEditForm = ({ postId }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recruitLimit, setRecruitLimit] = useState(1); // 모집 인원 필드 추가
  const navigate = useNavigate();

  // 게시글 정보 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getBoardDetail(postId);
        setTitle(data.title);
        setContent(data.content);
        setRecruitLimit(data.recruit_limit || 1); // 기본값 처리
      } catch (error) {
        alert("게시글을 불러오는 데 실패했습니다.");
      }
    };
    fetchPost();
  }, [postId]);

  // 수정 요청
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      return alert("제목을 입력해주세요.");
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      recruit_limit: recruitLimit, // 반드시 포함!
    };

    try {
      await updateBoard(postId, payload, "project");
      alert("게시글이 성공적으로 수정되었습니다.");
      navigate(`/board/project/${postId}`);
    } catch (error) {
      alert("게시글 수정에 실패했습니다: " + error.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white min-h-screen">
      <h2 className="text-2xl font-semibold mb-6">프로젝트 게시글 수정</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full border p-2"
        />
        <input
          type="number"
          value={recruitLimit}
          onChange={(e) => setRecruitLimit(Number(e.target.value))}
          placeholder="모집 인원 수"
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

export default ProjectBoardEditForm;
