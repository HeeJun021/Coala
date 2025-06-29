import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteBoard } from "../../api/boardApi";
import { likeBoard, unlikeBoard } from "../../api/likeApi";
import { reportBoard } from "../../api/reportApi";
import ApplyModal from "../../components/ApplyModal";

import {
  Heart,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";

const ProjectBoardDetail = ({ post, user }) => {
  const navigate = useNavigate();
  const { boardType, postId } = useParams();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const isAuthor = user?.user_id === post.user_id;

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

  const handleEdit = () => navigate(`/board/${boardType}/edit/${postId}`);

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
      {/* 상단: 게시판 이름 + 뒤로가기 */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h1 className="text-xl font-bold text-green-700">프로젝트 게시판</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-1 bg-gray-200 text-sm rounded-md"
        >
          ← 뒤로가기
        </button>
      </div>

      {/* 본문: 제목 + 작성자 정보 */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
        <div className="flex items-center text-sm text-gray-500">
          <span className="font-medium">{post.author_nickname}</span>
          <span className="mx-2">|</span>
          <span>{new Date(post.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* 내용 */}
      <div className="mb-6 whitespace-pre-line text-gray-700 leading-relaxed">
        {post.content}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-4 border-t pt-4 mb-8">
        <button onClick={handleLike} className="text-red-500">
          <Heart
            size={20}
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
          />
        </button>
        <span className="text-sm">{likeCount}명 좋아요</span>
        <button
          onClick={handleReport}
          className="text-gray-500 flex items-center gap-1 text-sm"
        >
          <AlertCircle size={16} className="text-gray-500" />
          신고
        </button>
        {isAuthor && (
          <>
            <button
              onClick={handleEdit}
              className="text-yellow-600 flex items-center gap-1 text-sm"
            >
              <Edit size={16} className="text-yellow-600" />
              수정
            </button>
            <button
              onClick={handleDelete}
              className="text-red-600 flex items-center gap-1 text-sm"
            >
              <Trash2 size={16} className="text-red-600" />
              삭제
            </button>
          </>
        )}
      </div>

      {/* 작성자일 경우 지원자 보기 버튼 / 아니면 참여 신청 */}
      <div className="flex justify-end">
        {isAuthor ? (
          <button
            onClick={() => navigate(`/board/${boardType}/applicants/${postId}`)}
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            지원자 보기
          </button>
        ) : (
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            참여 신청하기
          </button>
        )}
      </div>

      {/* ApplyModal 표시 */}
      {showApplyModal && (
        <ApplyModal
          onClose={() => setShowApplyModal(false)}
          projectId={post.post_id || postId}
          user={user}
        />
      )}
    </div>
  );
};

export default ProjectBoardDetail;
