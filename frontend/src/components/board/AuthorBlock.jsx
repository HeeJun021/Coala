import React from "react";
import UserNameWithProfile from "./profcard/UserNameWithProfile";

const AuthorBlock = ({ post, authorName }) => {
  if (!post) return null;
  return (
    <div className="flex items-center text-sm text-gray-500 mb-6">
      {post?.author_id ? (
        <UserNameWithProfile
          userId={post.author_id}
          nickname={authorName || "작성자"}
        />
      ) : (
        <span className="font-medium">{authorName}</span>
      )}
      <span className="mx-2">|</span>
      <span>
        {post?.created_at ? new Date(post.created_at).toLocaleString() : ""}
      </span>
    </div>
  );
};

export default AuthorBlock;
