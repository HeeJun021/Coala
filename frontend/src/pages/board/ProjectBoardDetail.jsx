import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteBoard } from "../../api/boardApi";
import { likeBoard, unlikeBoard } from "../../api/likeApi";
import { reportBoard } from "../../api/reportApi";
import ApplyModal from "../../components/ApplyModal";
import BoardDetailLayout from "../../components/board/BoardDetailLayout";
import BoardDetailTemplate from "./BoardDetailTemplate";

const ProjectBoardDetail = ({ post, user }) => {
  const navigate = useNavigate();
  const { boardType, postId } = useParams();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.like_count || 0);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const isAuthor = user?.user_id === (post?.user_id ?? post?.author_id);

  // ✅ 좋아요 처리
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

  // ✅ 신고 처리
  const handleReport = async () => {
    try {
      await reportBoard({
        post_id: parseInt(postId, 10),
        user_id: user.user_id,
        reason: "부적절한 게시글",
      });
      alert("게시글이 신고되었습니다.");
    } catch {
      alert("이미 신고하셨습니다!");
    }
  };

  // ✅ 수정 / 삭제 처리
  const handleEdit = () => navigate(`/board/${boardType}/edit/${postId}`);

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteBoard(postId);
      alert("삭제되었습니다.");
      navigate(`/board/${boardType}`);
    } catch {
      alert("삭제 실패!");
    }
  };

  return (
    <BoardDetailLayout title="프로젝트 게시판" onBack={() => navigate(-1)}>
      <BoardDetailTemplate
        boardName="project"
        post={post}
        user={user}
        liked={liked}
        likeCount={likeCount}
        handleLike={handleLike}
        handleReport={handleReport}
        isAuthor={isAuthor}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        commentType="none"  // ✅ 댓글 완전히 비활성화
      />

      {/* ✅ 지원/지원자 버튼 */}
      <div className="flex justify-end mt-6">
        {isAuthor ? (
          <button
            onClick={() => navigate(`/board/${boardType}/applicants/${postId}`)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            지원자 보기
          </button>
        ) : (
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            참여 신청하기
          </button>
        )}
      </div>

      {/* ✅ 참여 신청 모달 */}
      {showApplyModal && (
        <ApplyModal
          onClose={() => setShowApplyModal(false)}
          projectId={post?.post_id || postId}
          user={user}
        />
      )}
    </BoardDetailLayout>
  );
};

export default ProjectBoardDetail;
