import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser } from "../../api/authApi";

const TABS = ["신고 내역", "게시글", "댓글"];

const UserDetailDialog = ({ open, onClose, user, onUserDeleted }) => {
  const [activeTab, setActiveTab] = useState("신고 내역");
  const navigate = useNavigate();

  console.log("사용자 상세 정보(user):", user);
  console.log("댓글 리스트(user.comments):", user?.comments);

  if (!open || !user) return null;

  const handleDelete = async () => {
    const confirmed = window.confirm(`정말 ${user.nickname}님을 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      await deleteUser(user.user_id);
      onUserDeleted?.();
    } catch (error) {
      console.error("사용자 삭제 실패:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          title="닫기"
        >
          ✕
        </button>

        {/* 삭제 버튼 */}
        <button
          onClick={handleDelete}
          className="absolute top-4 right-12 text-red-500 hover:text-red-700 text-sm font-semibold"
          title="사용자 삭제"
        >
          삭제
        </button>

        {/* 사용자 정보 */}
        <div className="flex items-center gap-4 border-b pb-4 mb-4">
          <img
            src={user.profile_image_url || "assets/koala.jpg"}
            alt="profile"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-semibold">{user.nickname}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-sm mt-1">🎖️ {user.tier?.tier_name || "티어 없음"}</p>
          </div>
        </div>

        {/* 탭 버튼 */}
        <div className="flex gap-4 mb-4 border-b">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 border-b-2 ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="h-[300px] overflow-y-auto text-sm">
          {activeTab === "신고 내역" && (
            <div className="text-gray-700 space-y-2">
              <p>
                🚨 총 신고 횟수: <strong>{user.report_count}</strong>
              </p>
              {user.report_count === 0 && (
                <p className="text-gray-400">신고 내역이 없습니다.</p>
              )}
            </div>
          )}

          {activeTab === "게시글" && (
            <ul className="space-y-2">
              {user.posts.length === 0 ? (
                <p className="text-gray-400">작성한 게시글이 없습니다.</p>
              ) : (
                user.posts.map((post) => (
                  <li
                    key={post.post_id}
                    className="border p-2 rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/admin/posts/${post.post_id}`)}
                  >
                    <p className="font-medium">{post.title}</p>
                    <p className="text-gray-500 text-xs">
                      📂 {post.board_type} | 🕒 {new Date(post.created_at).toLocaleString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          )}

          {activeTab === "댓글" && (
            <ul className="space-y-2">
              {user.comments.length === 0 ? (
                <p className="text-gray-400">작성한 댓글이 없습니다.</p>
              ) : (
                user.comments.map((comment) => {
                  console.log("📝 댓글 정보:", comment); // 🔍 여기서 post_title 포함 여부 확인
                  return (
                    <li
                      key={comment.comment_id}
                      className="border p-2 rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/admin/posts/${comment.post_id}`)}
                    >
                      <p className="text-gray-800">{comment.content}</p>
                      <p className="text-gray-500 text-xs">
                        📝 게시글 제목: {comment.post_title || "(제목 없음)"} | 🕒{" "}
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailDialog;
