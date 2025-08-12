import React from "react";
import { useParams } from "react-router-dom";
import FreeBoardEditForm from "./FreeBoardEditForm";
import CodeBoardEditForm from "./CodeBoardEditForm";
import ProjectBoardEditForm from "./ProjectBoardEditForm";

const BoardEditPage = () => {
  const { boardType, postId } = useParams();

  if (boardType === "free") {
    return <FreeBoardEditForm postId={postId} />;
  } else if (boardType === "code") {
    return <CodeBoardEditForm postId={postId} />;
  } else if (boardType === "project") {
    return <ProjectBoardEditForm postId={postId} />;
  } else {
    return <div>지원하지 않는 게시판 유형입니다: {boardType}</div>;
  }
};

export default BoardEditPage;
