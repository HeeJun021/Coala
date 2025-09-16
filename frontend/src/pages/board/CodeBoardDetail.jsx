import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import BoardDetailLayout from "../../components/board/BoardDetailLayout";
import BoardDetailTemplate from "./BoardDetailTemplate";

const CodeBoardDetail = ({ post, user, ...rest }) => {
  const navigate = useNavigate();
  const { postId } = useParams();

  const authorName =
    post?.author_nickname ||
    post?.user?.nickname ||
    post?.author?.nickname ||
    post?.author_name ||
    post?.user?.name ||
    post?.author?.name ||
    "알 수 없음";

  return (
    <BoardDetailLayout title="코드 공유 게시판" onBack={() => navigate(-1)}>
      <BoardDetailTemplate
        boardName="code"
        post={post}
        user={user}
        commentType="basic" // ✅ 자유게시판처럼 일반 댓글 UI 사용
        {...rest}
      />
    </BoardDetailLayout>
  );
};

export default CodeBoardDetail;
