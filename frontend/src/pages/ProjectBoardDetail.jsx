import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteBoard } from "../api/boardApi"; // ✅ 게시글 삭제
import { likeBoard, unlikeBoard } from "../api/likeApi"; // ✅ 좋아요 처리
import { reportBoard } from "../api/reportApi"; // ✅ 신고 처리

const ProjectBoardDetail = ({ post, user }) => {
  const navigate = useNavigate();
  const { boardType, postId } = useParams();
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(post.like_count || 0);

  const isAuthor = user?.user_id === post.author_id;

  const handleLike = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    try {
      if (liked) {
        await unlikeBoard(postId, user.user_id);
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await likeBoard(postId, user.user_id);
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("좋아요 처리 실패:", err);
    }
  };

  const handleReport = async () => {
    try {
      await reportBoard({
        post_id: parseInt(postId),
        user_id: user.user_id,
        reason: "부적절한 게시글",
      });
      alert("게시글이 신고되었습니다.");
    } catch (err) {
      alert("이미 신고하셨습니다!");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("정말 삭제하시겠습니까?");
    if (confirmDelete) {
      try {
        await deleteBoard(postId);
        alert("삭제되었습니다.");
        navigate(`/board/${boardType}`);
      } catch (err) {
        alert("삭제 실패!");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-green-700">프로젝트 게시판</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 text-black rounded-md"
        >
          뒤로가기
        </button>
      </div>

      <h2 className="text-2xl font-semibold mb-4">{post.title}</h2>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={handleLike} className="text-red-500 text-2xl">
          {liked ? "❤️" : "🤍"}
        </button>
        <span className="text-sm">{likeCount}명 좋아요</span>

        <button
          className="text-sm text-gray-500 underline"
          onClick={handleReport}
        >
          신고
        </button>
      </div>

      <p className="mb-6 whitespace-pre-line">{post.content}</p>

      {isAuthor && (
        <div className="flex gap-2 mb-6">
          <button
            className="px-3 py-1 bg-yellow-400 text-white rounded"
            onClick={() => navigate(`/board/${boardType}/edit/${postId}`)}
          >
            수정
          </button>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded"
            onClick={handleDelete}
          >
            삭제
          </button>
        </div>
      )}

      <button className="px-4 py-2 bg-green-500 text-white rounded-md mb-8">
        참여 신청하기
      </button>
    </div>
  );
};

export default ProjectBoardDetail;