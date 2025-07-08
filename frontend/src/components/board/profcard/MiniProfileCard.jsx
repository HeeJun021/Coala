import React, { useState } from "react";

const MiniProfileCard = ({
  user,
  isFollowing,
  onFollowToggle,
  onSendMessage,
}) => {
  const skills = user?.skills || [];
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage("");
  };

  return (
    <div className="rounded-2xl shadow-lg w-[260px] bg-[#fdfaec] border border-gray-400 overflow-hidden z-50 p-3">
      {/* 헤더 */}
      <div className="bg-green-600 text-white px-4 py-2 flex justify-between items-center">
        <span className="font-bold text-sm">{user.nickname}</span>
        <button
          className="bg-white text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-100"
          onClick={onFollowToggle}
        >
          {isFollowing ? "팔로우 취소" : "팔로우"}
        </button>
      </div>

      {/* 이미지 */}
      <div className="flex justify-center my-3">
        <img
          src={user.profile_image_url || "/default-profile.png"}
          alt="프로필 이미지"
          className="w-14 h-14 rounded-full object-cover border"
        />
      </div>

      {/* 자기소개 */}
      <p className="text-center text-sm text-gray-700 mb-3">
        {user.bio || "자기소개가 없습니다."}
      </p>

      {/* 기술 스택 */}
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <span
              key={skill}
              className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-700"
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">기술 없음</span>
        )}
      </div>

      {/* 채팅 메시지 입력 */}
      <div className="mt-2">
        <label className="text-xs text-gray-600 block mb-1">
          @{user.nickname} 님에게 메시지 보내기
        </label>
        <input
          type="text"
          className="w-full px-2 py-1 text-sm border rounded mb-1 focus:outline-none focus:ring"
          placeholder="메시지를 입력하세요"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          className="w-full bg-blue-500 text-white text-xs py-1 rounded hover:bg-blue-600"
          onClick={handleSend}
        >
          전송
        </button>
      </div>
    </div>
  );
};

export default MiniProfileCard;