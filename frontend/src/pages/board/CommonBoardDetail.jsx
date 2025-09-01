import React from "react";
import { useNavigate } from "react-router-dom";
import BoardDetailTemplate from "./BoardDetailTemplate";
import UserNameWithProfile from "../../components/board/profcard/UserNameWithProfile";

const getAuthorName = (post, fallback = "알 수 없음") => {
  if (!post) return fallback;
  return (
    post.author_nickname ??
    post.user?.nickname ??
    post.author?.nickname ??
    post.author_name ??
    post.user?.name ??
    post.author?.name ??
    fallback
  );
};

const CommonBoardDetail = (props) => {
  const navigate = useNavigate();
  const { post, authorName: injected } = props;
  const authorName = injected ?? getAuthorName(post);

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-green-700">자유 게시판</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 text-black rounded-md"
        >
          뒤로가기
        </button>
      </div>

      {/* 작성자 표시 */}
      {post?.author_id ? (
        <div className="mb-4 text-sm text-gray-600">
          <span className="mr-2 text-gray-500">작성자:</span>
          <UserNameWithProfile
            userId={post.author_id}
            nickname={authorName || "작성자"}
          />
        </div>
      ) : null}

      <BoardDetailTemplate {...props} authorName={authorName} commentType="basic" />
    </div>
  );
};

export default CommonBoardDetail;
