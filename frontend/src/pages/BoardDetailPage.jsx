import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBoardDetail, deleteBoard } from "../api/boardApi";
import { getComments, createComment } from "../api/commentApi";
import { likeBoard, unlikeBoard, checkLiked, likeComment, unlikeComment, checkCommentLiked } from "../api/likeApi";
import { reportBoard, reportComment } from "../api/reportApi";
import { useAuth } from "../context/AuthContext";
import { deleteComment } from "../api/commentApi";

import CommonBoardDetail from "./CommonBoardDetail";
import CodeBoardDetail from "./CodeBoardDetail";
import ProjectBoardDetail from "./ProjectBoardDetail";

const BoardDetailPage = () => {
  const { boardType, postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [comments, setComments] = useState([]);
  const [commentLikes, setCommentLikes] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  const isAuthor = user?.user_id === post?.author_id;

  // 게시글 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getBoardDetail(postId);
        setPost(data);
      } catch (err) {
        console.error("게시글 조회 실패:", err);
        navigate(`/board/${boardType}`);
      }
    };
    fetchPost();
  }, [postId, boardType, navigate]);

  // 좋아요 상태 확인
  useEffect(() => {
    const fetchLike = async () => {
      if (!user) return;
      try {
        const { liked, count } = await checkLiked(postId, user.user_id);
        setLiked(liked);
        setLikeCount(count);
      } catch (err) {
        console.error("좋아요 상태 확인 실패:", err);
      }
    };
    fetchLike();
  }, [postId, user]);

  // 댓글 불러오기
  const fetchComments = useCallback(async () => {
    try {
      const data = await getComments(postId);
      setComments(data);

      if (user) {
        const updatedLikes = {};
        await Promise.all(
          data.map(async (c) => {
            const { liked, count } = await checkCommentLiked(c.comment_id, user.user_id);
            console.log(`댓글 ${c.comment_id} 좋아요 상태:`, liked, count);  // 🔥 여기 추가
            updatedLikes[c.comment_id] = { liked, count };
          })
        );
        setCommentLikes(updatedLikes);
      }
    } catch (err) {
      console.error("댓글 조회 실패:", err);
    }
  }, [postId, user]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 게시글 좋아요
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
      console.error("좋아요 실패:", err);
    }
  };

  const handleReport = async () => {
    console.log("신고 postId:", postId);
    if (!user) return alert("로그인이 필요합니다.");
    try {
      await reportBoard({ post_id: parseInt(postId, 10), user_id: user.user_id, reason: "부적절한 게시글" });
      alert("게시글이 신고되었습니다.");
    } catch (err) {
      alert("이미 신고하셨습니다!");
    }
  };

  const handleEdit = () => navigate(`/board/${boardType}/edit/${postId}`);
  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await deleteBoard(postId);
        alert("삭제되었습니다.");
        navigate(`/board/${boardType}`);
      } catch (err) {
        alert("삭제 실패!");
      }
    }
  };

  // 댓글 관련 핸들러
  const handleCommentSubmit = async (content) => {
    if (!user) return alert("로그인이 필요합니다.");
    try {
      await createComment({ postId, content, user_id: user.user_id });
      fetchComments();
    } catch (err) {
      alert("댓글 작성 실패");
    }
  };

  const parentComments = comments.filter((c) => !c.parent_comment_id);
  const childComments = comments.filter((c) => c.parent_comment_id);

  const commonProps = {
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
    parentComments,
    childComments,
    commentLikes,
    handleCommentLike: async (commentId) => {
      if (!user) return alert("로그인이 필요합니다.");
      const { liked } = commentLikes[commentId] || {};
      try {
        if (liked) {
          await unlikeComment(commentId, user.user_id);
          setCommentLikes((prev) => ({
            ...prev,
            [commentId]: {
              liked: false,
              count: prev[commentId].count - 1,
            },
          }));
        } else {
          await likeComment(commentId, user.user_id);
          setCommentLikes((prev) => ({
            ...prev,
            [commentId]: {
              liked: true,
              count: (prev[commentId]?.count || 0) + 1,  // 안전하게 0으로 시작
            },
          }));
        }
      } catch (err) {
        console.error("댓글 좋아요 실패:", err);
      }
    },
    handleCommentEdit: async (commentId) => {
      const updated = comments.map((c) => {
        if (c.comment_id === commentId) c.content = editContent;
        return c;
      });
      setComments(updated);
      setEditingId(null);
    },
    handleCommentDelete: async (commentId) => {
      if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
      try {
        await deleteComment(commentId);
        fetchComments();
      } catch (err) {
        console.error("댓글 삭제 실패:", err);
      }
    },
    editingId,
    editContent,
    setEditingId,
    setEditContent,
    replyTargetId,
    setReplyTargetId,
    replyContent,
    setReplyContent,
    handleReplySubmit: async (parentId) => {
      if (!user) return alert("로그인이 필요합니다.");
      try {
        await createComment({
          postId,
          parentId,
          content: replyContent,
          user_id: user.user_id,
        });
        setReplyTargetId(null);
        setReplyContent("");
        fetchComments();
      } catch (err) {
        console.error("답글 작성 실패:", err);
      }
    },
    handleReplyCancel: () => {
      setReplyTargetId(null);
      setReplyContent("");
    },
    handleCommentReport: async (commentId) => {
      try {
        await reportComment({
          comment_id: commentId,
          user_id: user.user_id,
          reason: "부적절한 댓글",
        });
        alert("댓글이 신고되었습니다.");
      } catch (err) {
        alert("이미 신고하셨습니다!");
      }
    },
    handleReplyReport: async (commentId) => {
      try {
        await reportComment({
          comment_id: commentId,
          user_id: user.user_id,
          reason: "부적절한 대댓글",
        });
        alert("대댓글이 신고되었습니다.");
      } catch (err) {
        alert("이미 신고하셨습니다!");
      }
    },
  };

  if (!post) return <div className="p-8">로딩 중...</div>;
  if (boardType === "project") return <ProjectBoardDetail {...commonProps} />;
  if (boardType === "code") return <CodeBoardDetail {...commonProps} />;
  return <CommonBoardDetail {...commonProps} />;
};

export default BoardDetailPage;
