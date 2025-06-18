import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import CommentEditor from "../components/CommentEditor";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import UserNameWithProfile from "../components/UserNameWithProfile";
import {
  Heart,
  Edit,
  Trash2,
  AlertCircle,
  Reply,
} from "lucide-react";

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
  commentType = "basic",
}) => {
  const { user: currentUser } = useAuth();

  if (!post) return <div className="p-8">로딩 중...</div>;

  const safeHandleCommentSubmit = (content) => {
    if (typeof handleCommentSubmit === "function") {
      handleCommentSubmit(content);
    } else {
      console.warn("⚠️ handleCommentSubmit is not a function");
    }
  };

  const handleImportCode = async () => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      await apiClient.post(`/board/post/${post.post_id}/import_code`, {}, {
        params: { user_id: currentUser.user_id },
        withCredentials: true,
      });
      alert("코드가 성공적으로 가져왔습니다!");
      window.dispatchEvent(new Event("refreshDirectory"));
    } catch (err) {
      console.error("코드 가져오기 실패:", err);
      alert("코드 가져오기에 실패했습니다.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      <div className="flex items-center gap-2 mb-4 text-gray-600 text-sm">
        <span>작성자:</span>
        {post?.author_id ? (
          <UserNameWithProfile
            userId={post.author_id}
            nickname={post.nickname || post.author_nickname || "작성자"}
          />
        ) : (
          <span className="font-semibold">{post.author_nickname}</span>
        )}
      </div>

      <h2 className="text-2xl font-semibold mb-4">{post.title}</h2>
      <p className="mb-6 whitespace-pre-line">{post.content}</p>

      {post.code && (
        <div className="mb-6 relative">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              코드 파일: {post.code_filename || "code.js"}
            </span>
            <button
              onClick={handleImportCode}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              코드 가져오기
            </button>
          </div>
          <SyntaxHighlighter
            language={post.code_language || "javascript"}
            style={dracula}
            className="rounded-md"
            wrapLines={true}
            customStyle={{ whiteSpace: "pre-wrap", fontSize: "15px" }}
          >
            {post.code}
          </SyntaxHighlighter>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-600 mt-4">
        {/* 좋아요 아이콘 + 카운트 */}
        <div className="flex items-center gap-1 text-red-500 cursor-pointer" onClick={handleLike}>
          <Heart size={18} fill={liked ? "currentColor" : "none"} stroke="currentColor" />
          <span className="text-gray-700">{likeCount}명 좋아요</span>
        </div>

        {/* 신고 */}
        <button onClick={handleReport} className="flex items-center gap-1 text-gray-500 hover:underline">
          <AlertCircle size={16} />
          신고
        </button>

        {/* 수정/삭제 (작성자만) */}
        {isAuthor && (
          <>
            <button onClick={handleEdit} className="flex items-center gap-1 text-yellow-600 hover:underline">
              <Edit size={16} />
              수정
            </button>
            <button onClick={handleDelete} className="flex items-center gap-1 text-red-600 hover:underline">
              <Trash2 size={16} />
              삭제
            </button>
          </>
        )}
      </div>

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
                  <div className="flex gap-2 text-xs ml-4 items-center">
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
                        <Edit
                          size={16}
                          className="text-blue-500 cursor-pointer"
                          onClick={() => {
                            setEditingId(c.comment_id);
                            setEditContent(c.content);
                          }}
                        />
                        <Trash2
                          size={16}
                          className="text-red-500 cursor-pointer"
                          onClick={() => handleCommentDelete(c.comment_id)}
                        />
                        <Reply
                          size={16}
                          className="text-gray-500 cursor-pointer"
                          onClick={() => {
                            setReplyTargetId(c.comment_id);
                            setReplyContent("");
                          }}
                        />
                        <AlertCircle
                          size={16}
                          className="text-gray-400 cursor-pointer"
                          onClick={() => handleCommentReport(c.comment_id)}
                        />
                        <Heart
                          size={16}
                          fill={commentLikes[c.comment_id]?.liked ? "currentColor" : "none"}
                          stroke="currentColor"
                          className="text-red-500 cursor-pointer"
                          onClick={() => handleCommentLike(c.comment_id)}
                        />
                        <span className="text-xs">
                          {commentLikes[c.comment_id]?.count || 0}
                        </span>
                      </>
                    )}
                  </div>
                </div>

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

                {childComments
                  .filter((r) => r.parent_comment_id === c.comment_id)
                  .map((r) => (
                    <div key={r.comment_id} className="ml-6 mt-2 pl-2 border-l text-sm">
                      <div className="text-xs text-gray-500 mb-1">
                        {r?.user_id && r?.nickname && (
                          <UserNameWithProfile userId={r.user_id} nickname={r.nickname} />
                        )}
                      </div>
                      <div className="flex justify-between items-center">
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
                            <div className="ml-2 flex gap-2 text-xs items-center">
                              <Edit
                                size={16}
                                className="text-blue-500 cursor-pointer"
                                onClick={() => {
                                  setEditingId(r.comment_id);
                                  setEditContent(r.content);
                                }}
                              />
                              <Trash2
                                size={16}
                                className="text-red-500 cursor-pointer"
                                onClick={() => handleCommentDelete(r.comment_id)}
                              />
                              <AlertCircle
                                size={16}
                                className="text-gray-400 cursor-pointer"
                                onClick={() => handleReplyReport(r.comment_id)}
                              />
                              <Heart
                                size={16}
                                fill={commentLikes[r.comment_id]?.liked ? "currentColor" : "none"}
                                stroke="currentColor"
                                className="text-red-500 cursor-pointer"
                                onClick={() => handleCommentLike(r.comment_id)}
                              />
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

            {commentType !== "none" && (
        <>
        <div className="pt-6 mt-6 border-t border-gray-200">
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
              className="mt-"
            >
              <textarea
                name="comment"
                placeholder="댓글을 입력하세요"
                className="w-full border p-2 h-24"
              />
              <button
                type="submit"
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md"
              >
                댓글 등록
              </button>
            </form>
          )}
          </div>
        </>
      )}
    </div>
  );
};

export default BoardDetailTemplate;
