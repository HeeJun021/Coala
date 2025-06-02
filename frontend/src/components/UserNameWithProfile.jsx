import React, { useState, useRef, useEffect } from "react";
import MiniProfileCard from "./MiniProfileCard";
import useUserProfile from "../hooks/useUserProfile";

const UserNameWithProfile = ({ userId, nickname }) => {
  const [showProfile, setShowProfile] = useState(false);
  const ref = useRef(null);

  const { user, loading, error } = useUserProfile(userId);

  // 디버깅 로그
  useEffect(() => {
    console.log("📌 [UserNameWithProfile] userId:", userId);
    console.log("📌 [UserNameWithProfile] fetched user:", user);
  }, [userId, user]);

  const handleToggle = () => {
    console.log("🔘 닉네임 클릭됨");
    setShowProfile((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      setTimeout(() => {
        if (ref.current && !ref.current.contains(event.target)) {
          setShowProfile(false);
        }
      }, 50);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ nickname 존재만 체크 (너무 강한 조건 X)
  const isValidUser = !!user?.nickname;

  return (
    <div className="relative inline-block" ref={ref}>
      <span
        className="font-semibold hover:underline cursor-pointer"
        onClick={handleToggle}
      >
        {nickname}
      </span>

      {showProfile && (
        <div className="absolute z-50 top-full left-0 mt-2 bg-white border border-blue-400 shadow-lg p-2 w-[260px] rounded">
          {console.log("🔥 showProfile === true, user:", user)}

          {loading ? (
            <div className="text-xs text-gray-400">불러오는 중...</div>
          ) : error ? (
            <div className="text-xs text-red-500">사용자 정보 불러오기 실패</div>
          ) : isValidUser ? (
            <>
              {console.log("🎯 MiniProfileCard 렌더링됨:", user)}
              <MiniProfileCard
                user={user}
                isFollowing={false}
                onFollowToggle={() =>
                  alert("팔로우 기능은 추후 지원 예정입니다.")
                }
              />
            </>
          ) : (
            <div className="text-gray-400 text-sm">
              ⚠️ 사용자 정보가 유효하지 않습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserNameWithProfile;
