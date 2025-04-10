import React from "react";
import { FaHeart, FaRegComment } from "react-icons/fa";
import { BOARD_TYPES } from "../constants/boardConstants";
import { MdOutlinePhoto } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const BoardItem = ({ post, boardType }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/board/${boardType}/${post.post_id}`); // ✅ post.id → post.post_id
  };

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer"
      onClick={handleClick}
    >
      {/* 작성일 */}
      <td className="border p-2 text-center">
        {new Date(post.created_at).toLocaleDateString("ko-KR")}
      </td>

      {/* 제목 */}
      <td className="border p-2">{post.title}</td>

      {/* 사진첨부 여부 */}
      <td className="border p-2 text-center">
        {post.image_url ? (
          <MdOutlinePhoto className="inline text-blue-500 text-lg" />
        ) : (
          "-"
        )}
      </td>

      {/* 댓글 수 or 모집인원 */}
      {boardType === BOARD_TYPES.PROJECT ? (
        <td className="border p-2 text-center">-</td> // 모집인원 기능은 별도 구현 필요
      ) : (
        <td className="border p-2">
          <div className="flex justify-center items-center gap-1">
            <FaRegComment className="text-gray-600 text-sm" />
            <span>{post.comment_count}</span> {/* ✅ post.comments → post.comment_count */}
          </div>
        </td>
      )}

      {/* 좋아요 */}
      <td className="border p-2">
        <div className="flex justify-center items-center gap-1 text-red-500">
          <FaHeart className="text-sm" />
          <span>{post.like_count}</span> {/* ✅ post.likes → post.like_count */}
        </div>
      </td>
    </tr>
  );
};

export default BoardItem;
