import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import BoardDetailLayout from "../../components/board/BoardDetailLayout";
import AuthorBlock from "../../components/board/AuthorBlock";
import BoardDetailTemplate from "./BoardDetailTemplate";

const CommonBoardDetail = ({ post, user, ...rest }) => {
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
    <BoardDetailLayout title="자유 게시판" onBack={() => navigate(-1)}>
      <BoardDetailTemplate
        boardName="common"
        post={post}
        user={user}
        commentType="basic"
        {...rest}
      />
    </BoardDetailLayout>
  );
};

export default CommonBoardDetail;
