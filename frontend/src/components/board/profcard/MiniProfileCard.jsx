import React, { useState } from "react";

const MiniProfileCard = ({ user, isFollowing, onFollowToggle, onSendMessage }) => {
  const skills = user?.skills || [];
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;
    onSendMessage(text);
    setMessage("");
  };

  return (
    <div className="rounded-xl shadow-md w-[260px] bg-white border border-gray-200 overflow-hidden z-50">
      {/* 헤더 */}
      <div className="bg-green-500 text-white px-4 py-2 flex justify-between items-center">
        <span className="font-semibold">{user.nickname}</span>
        <button
          type="button"  // ✅ 부모 폼 submit 방지
          className="bg-white text-green-600 text-xs px-2 py-1 rounded-md hover:bg-gray-100 transition"
          onClick={onFollowToggle}
        >
          {isFollowing ? "팔로우 취소" : "팔로우"}
        </button>
      </div>

      {/* 프로필 이미지 */}
      <div className="flex justify-center mt-4">
        <img
          src={user.profile_image_url || "/default-profile.png"}
          alt="프로필 이미지"
          className="w-16 h-16 rounded-full object-cover border border-gray-300 shadow-sm"
        />
      </div>

      {/* 자기소개 */}
      <p className="text-center text-sm text-gray-700 mt-3 px-3">
        {user.bio || "자기소개가 없습니다."}
      </p>

      {/* 기술 스택 */}
      <div className="flex flex-wrap justify-center gap-2 mt-3 px-3">
        {skills.length > 0 ? (
          skills.map((skill) => (
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
      <div className="mt-4 px-3 pb-4">
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
              e.preventDefault(); // ✅ 엔터 시 부모 폼 제출 막기
              handleSend();
            }
          }}
        />
        <button
          type="button" // ✅ 부모 폼 submit 방지
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
