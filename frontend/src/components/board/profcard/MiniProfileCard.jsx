import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const MiniProfileCard = ({ user, isFollowing, onFollowToggle, onSendMessage }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;
    onSendMessage(text);
    setMessage("");
  };

  const handleProfileClick = () => {
    if (!user) return;
    if (currentUser?.user_id === user.user_id) navigate("/mypage/modify");
    else navigate(`/user/${user.user_id}`);
  };

  // 팔로우 버튼 스타일 (사이트 톤)
  const followBtnClass = isFollowing
    ? "bg-green-600 text-white hover:bg-green-700"
    : "bg-white text-green-700 border border-green-600 hover:bg-green-50";

  return (
    <div className="w-[280px] rounded-2xl bg-white border border-gray-300 shadow-xl p-4 z-50">
      {/* 헤더: 아바타 + 닉네임 + 팔로우 버튼 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={user?.profile_image_url || "/default-profile.png"}
            alt="프로필 이미지"
            className="w-14 h-14 rounded-full object-cover border border-gray-200 shadow cursor-pointer hover:opacity-90 transition"
            onClick={handleProfileClick}
          />
          <div className="min-w-0">
            <div
              className="font-semibold text-gray-900 cursor-pointer hover:underline truncate"
              onClick={handleProfileClick}
              title={user?.nickname}
            >
              {user?.nickname}
            </div>
            <div className="text-xs text-gray-500">
              @{user?.username || user?.nickname || "user"}
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`px-3 py-1.5 text-xs rounded-md transition ${followBtnClass}`}
          onClick={onFollowToggle}
        >
          {isFollowing ? "팔로우 취소" : "팔로우"}
        </button>
      </div>

      {/* 소개 */}
      <p className="mt-3 text-sm text-gray-700 leading-relaxed">
        {user?.bio || "자기소개가 없습니다."}
      </p>

      {/* 기술 스택 */}
      <div className="mt-3 flex flex-wrap gap-2">
        {user?.skills?.length ? (
          user.skills.map((skill) => (
            <span
              key={skill}
              className="text-[11px] px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700"
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">기술 없음</span>
        )}
      </div>

      {/* 메시지 입력 */}
      <div className="mt-4 border-t border-gray-200 pt-3">
        <label className="text-xs text-gray-500 block mb-1">
          @{user?.nickname} 님에게 메시지 보내기
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            autoComplete="off"
            className="flex-1 h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder="메시지를 입력하세요"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            className="w-full bg-green-500 text-white text-sm py-1.5 rounded-md hover:bg-green-800 transition disabled:opacity-50 flex items-center justify-center"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniProfileCard;
