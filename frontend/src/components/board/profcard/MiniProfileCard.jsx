import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const MiniProfileCard = ({ user, isFollowing, onFollowToggle, onSendMessage }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth(); // 현재 로그인된 사용자
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;
    onSendMessage(text);
    setMessage("");
  };

  // ✅ 프로필 이미지 클릭 핸들러
  const handleProfileClick = () => {
    if (!user) return;
    if (currentUser?.user_id === user.user_id) {
      // 자기 자신 → 마이페이지 수정
      navigate("/mypage/modify");
    } else {
      // 다른 사용자 → 뷰어 페이지
      navigate(`/user/${user.user_id}`);
    }
  };

  return (
    <div className="rounded-2xl shadow-lg w-[260px] bg-[#fdfaec] border border-gray-400 overflow-hidden z-50 p-3">
      {/* 상단 헤더 */}
      <div className="bg-green-600 text-white px-4 py-2 flex justify-between items-center">
        <span className="font-bold text-sm">{user.nickname}</span>
        <button
          type="button"
          className="bg-white text-green-600 text-xs px-2 py-1 rounded-md hover:bg-gray-100 transition"
          onClick={onFollowToggle}
        >
          {isFollowing ? "팔로우 취소" : "팔로우"}
        </button>
      </div>

      {/* 프로필 이미지 */}
      <div className="flex justify-center my-3">
        <img
          src={user.profile_image_url || "/default-profile.png"}
          alt="프로필 이미지"
          className="w-16 h-16 rounded-full object-cover border border-gray-300 shadow-sm cursor-pointer hover:opacity-80 transition"
          onClick={handleProfileClick} // ✅ 클릭 시 이동
        />
      </div>

      {/* 자기소개 */}
      <p className="text-center text-sm text-gray-700 mb-3">
        {user.bio || "자기소개가 없습니다."}
      </p>

      {/* 기술 스택 */}
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {user.skills?.length > 0 ? (
          user.skills.map((skill) => (
            <span
              key={skill}
              className="text-xs bg-gray-100 px-2 py-1 rounded-full border border-gray-300"
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">기술 없음</span>
        )}
      </div>

      {/* 채팅 메시지 입력 */}
      <div className="px-3 pb-2 border-t pt-2">
        <label className="text-xs text-gray-500 block mb-1">
          @{user.nickname} 님에게 메시지 보내기
        </label>
        <input
          type="text"
          autoComplete="off"
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
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
          className="w-full bg-green-500 text-white text-xs py-1.5 rounded-md hover:bg-green-600 transition disabled:opacity-50"
          onClick={handleSend}
          disabled={!message.trim()}
        >
          전송
        </button>
      </div>
    </div>
  );
};

export default MiniProfileCard;
