import React from "react";
import CommentEditor from "../components/CommentEditor";
import UserNameWithProfile from "../components/UserNameWithProfile";

const BoardDetailTemplate = ({
  boardName,
  post,
  user,
  liked,
  likeCount,
  handleLike,
  handleReport,
  isAuthor,
  handleEdit,
  handleDelete,
  handleCommentSubmit,
  parentComments = [],
  childComments = [],
  commentLikes = {},
  handleCommentLike,
  handleCommentEdit,
  handleCommentDelete,
  editingId,
  editContent,
  setEditingId,
  setEditContent,
  replyTargetId,
  setReplyTargetId,
  replyContent,
  setReplyContent,
  handleReplySubmit,
  handleReplyCancel,
  handleCommentReport,
  handleReplyReport,
  commentType = "basic", // "basic", "code", "none"
}) => {
  if (!post) return <div className="p-8">로딩 중...</div>;

  const safeHandleCommentSubmit = (content) => {
    if (typeof handleCommentSubmit === "function") {
      handleCommentSubmit(content);
    } else {
      console.warn("⚠️ handleCommentSubmit is not a function");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      {/* 작성자 정보 */}
      <div className="flex items-center gap-2 mb-4 text-gray-600 text-sm">
        <span>작성자:</span>
        {post?.author_id && (
          <UserNameWithProfile
            userId={post.author_id}
            nickname={post.nickname || "작성자"}
          />
        )}
      </div>

      {/* 제목 */}
      <h2 className="text-2xl font-semibold mb-4">{post.title}</h2>

      {/* 본문 */}
      <p className="mb-6 whitespace-pre-line">{post.content}</p>

      {/* 좋아요, 신고 */}
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

      {/* 수정/삭제 버튼 */}
      {isAuthor && (
        <div className="flex gap-2 mb-6">
          <button
            className="px-3 py-1 bg-yellow-400 text-white rounded"
            onClick={handleEdit}
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

      {/* 댓글 작성 */}
      {commentType !== "none" && (
        <>
          <h3 className="text-lg font-semibold mb-2">댓글 작성</h3>
          {commentType === "code" ? (
            <CommentEditor onSubmit={safeHandleCommentSubmit} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const content = e.target.comment.value.trim();
                if (!content) return alert("내용을 입력하세요.");
                safeHandleCommentSubmit(content);
                e.target.comment.value = "";
              }}
              className="mt-4"
            >
              <textarea
                name="comment"
                placeholder="댓글을 입력하세요"
                className="w-full border p-2 h-24"
              />
              <button
                type="submit"
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md"
              >
                댓글 등록
              </button>
            </form>
          )}
        </>
      )}

      {/* 댓글 목록 */}
      {commentType !== "none" && parentComments.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">댓글 목록</h3>
          <ul className="space-y-4 mt-4">
            {parentComments.map((c) => (
              <li key={c.comment_id} className="border p-2 rounded-md">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {c?.user_id && c?.nickname && (
                        <UserNameWithProfile userId={c.user_id} nickname={c.nickname} />
                      )}
                    </div>
                    {editingId === c.comment_id ? (
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full border p-1 rounded"
                      />
                    ) : (
                      <p className="text-sm">{c.content}</p>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs ml-4">
                    {editingId === c.comment_id ? (
                      <>
                        <button
                          className="text-green-600"
                          onClick={() => handleCommentEdit(c.comment_id)}
                        >
                          저장
                        </button>
                        <button
                          className="text-gray-500"
                          onClick={() => setEditingId(null)}
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="text-blue-500"
                          onClick={() => {
                            setEditingId(c.comment_id);
                            setEditContent(c.content);
                          }}
                        >
                          수정
                        </button>
                        <button
                          className="text-red-500"
                          onClick={() => handleCommentDelete(c.comment_id)}
                        >
                          삭제
                        </button>
                        <button
                          className="text-gray-500"
                          onClick={() => {
                            setReplyTargetId(c.comment_id);
                            setReplyContent("");
                          }}
                        >
                          답글
                        </button>
                        <button
                          className="text-gray-400"
                          onClick={() => handleCommentReport(c.comment_id)}
                        >
                          신고
                        </button>
                        <button
                          className="text-sm text-red-500"
                          onClick={() => handleCommentLike(c.comment_id)}
                        >
                          {commentLikes[c.comment_id]?.liked ? "❤️" : "🤍"}
                        </button>
                        <span className="text-xs">
                          {commentLikes[c.comment_id]?.count || 0}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 대댓글 입력 */}
                {replyTargetId === c.comment_id && (
                  <div className="mt-2 ml-4">
                    <input
                      type="text"
                      placeholder="대댓글을 입력하세요"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full border p-1 rounded"
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        className="text-green-600 text-sm"
                        onClick={() => handleReplySubmit(c.comment_id)}
                      >
                        등록
                      </button>
                      <button
                        className="text-gray-500 text-sm"
                        onClick={handleReplyCancel}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* 대댓글 목록 */}
                {childComments
                  .filter((r) => r.parent_comment_id === c.comment_id)
                  .map((r) => (
                    <div key={r.comment_id} className="ml-6 mt-2 pl-2 border-l text-sm">
                      <div className="text-xs text-gray-500 mb-1">
                        {r?.user_id && r?.nickname && (
                          <UserNameWithProfile userId={r.user_id} nickname={r.nickname} />
                        )}
                      </div>
                      <div className="flex justify-between">
                        {editingId === r.comment_id ? (
                          <>
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full border p-1 rounded"
                            />
                            <div className="ml-2 flex gap-2 text-xs">
                              <button
                                className="text-green-600"
                                onClick={() => handleCommentEdit(r.comment_id)}
                              >
                                저장
                              </button>
                              <button
                                className="text-gray-500"
                                onClick={() => setEditingId(null)}
                              >
                                취소
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p>↳ {r.content}</p>
                            <div className="ml-2 flex gap-2 text-xs">
                              <button
                                className="text-blue-500"
                                onClick={() => {
                                  setEditingId(r.comment_id);
                                  setEditContent(r.content);
                                }}
                              >
                                수정
                              </button>
                              <button
                                className="text-red-500"
                                onClick={() => handleCommentDelete(r.comment_id)}
                              >
                                삭제
                              </button>
                              <button
                                className="text-gray-400"
                                onClick={() => handleReplyReport(r.comment_id)}
                              >
                                신고
                              </button>
                              <button
                                className="text-sm text-red-500"
                                onClick={() => handleCommentLike(r.comment_id)}
                              >
                                {commentLikes[r.comment_id]?.liked ? "❤️" : "🤍"}
                              </button>
                              <span className="text-xs">
                                {commentLikes[r.comment_id]?.count || 0}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BoardDetailTemplate;
