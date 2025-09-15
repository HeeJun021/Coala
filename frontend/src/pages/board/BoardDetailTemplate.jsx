import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import CommentEditor from "../../components/board/Comment/CommentEditor";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import UserNameWithProfile from "../../components/board/profcard/UserNameWithProfile";
import AlertModal from "../../components/AlertModal";
import { Heart, Edit, Trash2, AlertCircle, Reply } from "lucide-react";

const BoardDetailTemplate = ({
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  if (!post) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      {/* 📌 게시글 카드 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
        {/* 제목 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>

        {/* 작성자 + 작성일 */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          {post?.author_id ? (
            <UserNameWithProfile
              userId={post.author_id}
              nickname={post.author_nickname || "작성자"}
            />
          ) : (
            <span className="font-medium text-gray-700">
              {post.author_nickname || post.author_name || "알 수 없음"}
            </span>
          )}
          <span>·</span>
          <span>
            {post?.created_at ? new Date(post.created_at).toLocaleString() : ""}
          </span>
        </div>

        {/* 제목과 본문 구분선 */}
        <hr className="border-gray-200 mb-6" />

        {/* 본문 */}
        <div className="prose prose-gray max-w-none mb-6">
          <p className="whitespace-pre-line text-gray-800 leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* 코드 블록 */}
        {post.code && (
          <div className="mb-8 border rounded-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-100 text-sm text-gray-600">
              <span>{post.code_filename || "code.js"}</span>
              <button className="bg-green-600 px-3 py-1 rounded text-white text-xs hover:bg-green-700">
                코드 가져오기
              </button>
            </div>
            <SyntaxHighlighter
              language={post.code_language || "javascript"}
              style={dracula}
              customStyle={{
                margin: 0,
                borderRadius: "0 0 8px 8px",
                fontSize: "14px",
              }}
            >
              {post.code}
            </SyntaxHighlighter>
          </div>
        )}

        {/* 액션 바 */}
        <div className="flex items-center gap-6 text-sm text-gray-600 border-t pt-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 transition hover:text-red-500"
          >
            <Heart
              size={18}
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              className={liked ? "text-red-500" : "text-gray-400 group-hover:text-red-500"}
            />
            <span className={liked ? "text-red-500" : "text-gray-500"}>
              {likeCount}
            </span>
          </button>
          <button
            onClick={handleReport}
            className="flex items-center gap-1 hover:text-red-500 transition"
          >
            <AlertCircle size={16} /> 신고
          </button>
          {isAuthor && (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 hover:text-yellow-600 transition"
              >
                <Edit size={16} /> 수정
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 hover:text-red-600 transition"
              >
                <Trash2 size={16} /> 삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* 📌 댓글 섹션 (기존 기능 유지) */}
      {commentType !== "none" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">댓글</h2>

          {/* 댓글 목록 */}
          <ul className="space-y-4">
            {parentComments.map((c) => (
              <li key={c.comment_id} className="border p-3 rounded-md">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {c?.user_id && (
                        <UserNameWithProfile
                          userId={c.user_id}
                          nickname={c.nickname || "작성자"}
                        />
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
                        <button
                          onClick={() => handleCommentLike(c.comment_id)}
                          className="flex items-center gap-1 transition hover:text-red-500"
                        >
                          <Heart
                            size={16}
                            fill={
                              commentLikes[c.comment_id]?.liked
                                ? "currentColor"
                                : "none"
                            }
                            stroke="currentColor"
                            className={
                              commentLikes[c.comment_id]?.liked
                                ? "text-red-500"
                                : "text-gray-400"
                            }
                          />
                          <span
                            className={
                              commentLikes[c.comment_id]?.liked
                                ? "text-red-500"
                                : "text-gray-500"
                            }
                          >
                            {commentLikes[c.comment_id]?.count || 0}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 대댓글 */}
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
                    <div
                      key={r.comment_id}
                      className="ml-6 mt-2 pl-2 border-l text-sm"
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {r?.user_id && (
                          <UserNameWithProfile
                            userId={r.user_id}
                            nickname={r.nickname || "작성자"}
                          />
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
                              <button
                                onClick={() => handleCommentLike(r.comment_id)}
                                className="flex items-center gap-1 transition hover:text-red-500"
                              >
                                <Heart
                                  size={16}
                                  fill={
                                    commentLikes[r.comment_id]?.liked
                                      ? "currentColor"
                                      : "none"
                                  }
                                  stroke="currentColor"
                                  className={
                                    commentLikes[r.comment_id]?.liked
                                      ? "text-red-500"
                                      : "text-gray-400"
                                  }
                                />
                                <span
                                  className={
                                    commentLikes[r.comment_id]?.liked
                                      ? "text-red-500"
                                      : "text-gray-500"
                                  }
                                >
                                  {commentLikes[r.comment_id]?.count || 0}
                                </span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </li>
            ))}
          </ul>

          {/* 댓글 작성 */}
          <div className="pt-6 mt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-2">댓글 작성</h3>
            {commentType === "code" ? (
              <CommentEditor onSubmit={handleCommentSubmit} />
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const content = e.target.comment.value.trim();
                  if (!content) return alert("내용을 입력하세요.");
                  handleCommentSubmit(content);
                  e.target.comment.value = "";
                }}
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
        </div>
      )}

      <AlertModal
        isOpen={isModalOpen}
        message={modalMessage}
        onConfirm={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default BoardDetailTemplate;
