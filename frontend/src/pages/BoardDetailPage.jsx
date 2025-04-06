import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBoardDetail, deleteBoard } from "../api/boardApi";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../api/commentApi";
import {
  likeBoard,
  unlikeBoard,
  checkLiked,
} from "../api/likeApi";
import {
  reportBoard,
  reportComment,
} from "../api/reportApi";
import CommentEditor from "../components/CommentEditor";
import { useAuth } from "../context/AuthContext";

const BoardDetailPage = () => {
  const { boardType, postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ 로그인 유저
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 게시글 + 좋아요 상태 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getBoardDetail(postId);
        setPost(data);
      } catch (err) {
        console.error("게시글 조회 실패:", err);
      }
    };

    const fetchLike = async () => {
      try {
        const { liked, count } = await checkLiked(postId);
        setLiked(liked);
        setLikeCount(count);
      } catch (err) {
        console.error("좋아요 상태 확인 실패:", err);
      }
    };

    fetchPost();
    fetchLike();
  }, [postId]);

  // 댓글 불러오기
  const fetchComments = async () => {
    try {
      const data = await getComments(postId);
      setComments(data);
    } catch (err) {
      console.error("댓글 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleCommentSubmit = async (content) => {
    try {
      await createComment({ postId, content });
      fetchComments();
    } catch (err) {
      console.error("댓글 작성 실패:", err);
    }
  };

  const parentComments = comments.filter((c) => !c.parent_id);
  const childComments = comments.filter((c) => c.parent_id);

  if (!post) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      <h2 className="text-2xl font-semibold mb-4">{post.title}</h2>

      {/* ❤️ 좋아요 & 신고 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={async () => {
            try {
              if (liked) {
                await unlikeBoard(postId);
                setLiked(false);
                setLikeCount((prev) => prev - 1);
              } else {
                await likeBoard(postId);
                setLiked(true);
                setLikeCount((prev) => prev + 1);
              }
            } catch (err) {
              console.error("좋아요 처리 실패:", err);
            }
          }}
          className="text-red-500 text-2xl"
        >
          {liked ? "❤️" : "🤍"}
        </button>
        <span className="text-sm">{likeCount}명 좋아요</span>

        {/* 게시글 신고 */}
        <button
          className="text-sm text-gray-500 underline"
          onClick={async () => {
            try {
              await reportBoard({ boardId: postId, reason: "부적절한 게시글" });
              alert("게시글이 신고되었습니다.");
            } catch (err) {
              alert("이미 신고했거나 오류 발생!");
            }
          }}
        >
          신고
        </button>
      </div>

      <p className="mb-6 whitespace-pre-line">{post.content}</p>

      {/* ✏️ 수정/삭제 (작성자만) */}
      {user?.id === post.author_id && (
        <div className="flex gap-2 mb-6">
          <button
            className="px-3 py-1 bg-yellow-400 text-white rounded"
            onClick={() => navigate(`/board/${boardType}/edit/${postId}`)}
          >
            수정
          </button>
          <button
            className="px-3 py-1 bg-red-500 text-white rounded"
            onClick={async () => {
              const confirmDelete = window.confirm("정말 삭제하시겠습니까?");
              if (confirmDelete) {
                await deleteBoard(postId);
                alert("삭제되었습니다.");
                navigate(`/board/${boardType}`);
              }
            }}
          >
            삭제
          </button>
        </div>
      )}

      {/* 프로젝트 게시판은 참여 버튼 */}
      {boardType === "project" ? (
        <button className="px-4 py-2 bg-green-500 text-white rounded-md mb-8">
          참여 신청하기
        </button>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2">댓글 작성</h3>
          {boardType === "code" ? (
            <CommentEditor onSubmit={handleCommentSubmit} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const content = e.target.comment.value;
                if (!content.trim()) return alert("내용을 입력하세요.");
                handleCommentSubmit(content);
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

      {/* 💬 댓글 목록 */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">댓글 목록</h3>

        <ul className="space-y-4 mt-4">
          {parentComments.map((c) => (
            <li key={c.id} className="border p-2 rounded-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {editingId === c.id ? (
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
                  {editingId === c.id ? (
                    <>
                      <button
                        className="text-green-600"
                        onClick={async () => {
                          await updateComment(c.id, { content: editContent });
                          setEditingId(null);
                          fetchComments();
                        }}
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
                          setEditingId(c.id);
                          setEditContent(c.content);
                        }}
                      >
                        수정
                      </button>
                      <button
                        className="text-red-500"
                        onClick={async () => {
                          if (window.confirm("댓글을 삭제할까요?")) {
                            await deleteComment(c.id);
                            fetchComments();
                          }
                        }}
                      >
                        삭제
                      </button>
                      <button
                        className="text-gray-500"
                        onClick={() => {
                          setReplyTargetId(c.id);
                          setReplyContent("");
                        }}
                      >
                        답글
                      </button>
                      <button
                        className="text-gray-400"
                        onClick={async () => {
                          try {
                            await reportComment({
                              commentId: c.id,
                              reason: "부적절한 댓글",
                            });
                            alert("댓글이 신고되었습니다.");
                          } catch (err) {
                            alert("이미 신고했거나 오류 발생!");
                          }
                        }}
                      >
                        신고
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 대댓글 입력 */}
              {replyTargetId === c.id && (
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
                      onClick={async () => {
                        await createComment({
                          postId,
                          parentId: c.id,
                          content: replyContent,
                        });
                        setReplyTargetId(null);
                        setReplyContent("");
                        fetchComments();
                      }}
                    >
                      등록
                    </button>
                    <button
                      className="text-gray-500 text-sm"
                      onClick={() => {
                        setReplyTargetId(null);
                        setReplyContent("");
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {/* 대댓글 목록 */}
              {childComments
                .filter((r) => r.parent_id === c.id)
                .map((r) => (
                  <div
                    key={r.id}
                    className="ml-6 mt-2 pl-2 border-l text-sm flex justify-between"
                  >
                    <p>↳ {r.content}</p>
                    <button
                      className="text-xs text-gray-400 ml-4"
                      onClick={async () => {
                        try {
                          await reportComment({
                            commentId: r.id,
                            reason: "부적절한 댓글",
                          });
                          alert("대댓글이 신고되었습니다.");
                        } catch (err) {
                          alert("이미 신고했거나 오류 발생!");
                        }
                      }}
                    >
                      신고
                    </button>
                  </div>
                ))}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BoardDetailPage;
