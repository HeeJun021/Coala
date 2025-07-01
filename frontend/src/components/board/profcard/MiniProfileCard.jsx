import React from "react";

const MiniProfileCard = ({ user, isFollowing, onFollowToggle }) => {
  console.log("🧩 MiniProfileCard 내부 user:", user); // 디버깅 로그

  // 안전하게 skill 배열 처리
  const skills = user?.skills || [];

  return (
    <div className="rounded-2xl shadow-lg w-[260px] bg-[#fdfaec] border border-gray-400 overflow-hidden z-50 p-3">
      {/* 상단 헤더 (닉네임 + 팔로우 버튼) */}
      <div className="bg-green-600 text-white px-4 py-2 flex justify-between items-center">
        <span className="font-bold text-sm">{user.nickname}</span>
        <button
          className="bg-white text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-100"
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

      {/* 메시지 안내 */}
      <div className="text-center text-gray-600 text-sm bg-white py-2 px-3 border-t">
        @{user.nickname}님에게 메시지 보내기
      </div>
    </div>
  );
};

export default MiniProfileCard;
