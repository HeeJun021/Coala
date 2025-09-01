import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MiniProfileCard from "./MiniProfileCard";
import useUserProfile from "../../../hooks/useUserProfile";
import { followUser, unfollowUser, getFollowings } from "../../../api/followApi";
import { getChatRooms, createChatRoom, sendMessage } from "../../../api/chatApi";
import { useChatUI } from "../../../context/ChatUIContext"; // 전역 UI (채팅패널)
import { useAuth } from "../../../context/AuthContext";

const UserNameWithProfile = ({ userId, nickname }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const ref = useRef(null);

  const { user, loading, error } = useUserProfile(userId);
  const { openChat } = useChatUI();
  const { user: currentUser } = useAuth(); // 현재 로그인한 사용자
  const navigate = useNavigate();

  // 현재 유저와의 팔로우 여부 로딩
  useEffect(() => {
    if (!user) return;
    getFollowings()
      .then((followings) => {
        const following = (followings || []).some((f) => f.user_id === user.user_id);
        setIsFollowing(following);
      })
      .catch((err) => console.warn("팔로잉 목록 조회 실패:", err));
  }, [user]);

  // 팔로우/언팔로우 토글
  const handleFollowToggle = async () => {
    try {
      if (!user) return;
      if (isFollowing) {
        await unfollowUser(user.user_id);
      } else {
        await followUser(user.user_id);
      }
      setIsFollowing((prev) => !prev);
    } catch (err) {
      console.error("팔로우/언팔로우 실패:", err);
    }
  };

  // 메시지 전송 + 1:1방 중복 방지 + 채팅 패널 열기
  const handleSendMessage = async (messageText) => {
    try {
      if (!user) return;

      // 1) 기존 방 조회
      const chatRooms = await getChatRooms();

      // 2) 해당 유저와의 1:1 방 찾기
      const existingRoom = (chatRooms || []).find((room) => {
        const participants = room.participants || [];
        return (
          !room.is_group &&
          participants.length === 2 &&
          participants.some((p) => p.user_id === user.user_id)
        );
      });

      // 3) 없으면 생성
      const roomId = existingRoom
        ? existingRoom.room_id
        : (await createChatRoom([user.user_id])).room_id;

      // 4) 메시지 전송
      await sendMessage(roomId, { type: "text", content: messageText });

      // 5) 채팅 패널 열고 해당 방 포커스
      openChat(roomId);

      // 6) 미니 프로필 카드 닫기
      setShowProfile(false);
    } catch (err) {
      console.error("메시지 전송 실패:", err);
    }
  };

  // 프로필 이미지 클릭 → 자기 자신이면 수정페이지, 다른 사람은 뷰어페이지로 이동
  const handleProfileClick = () => {
    if (!user) return;
    setShowProfile(false);
    if (currentUser?.user_id === user.user_id) {
      navigate("/mypage/modify"); // 본인 → 수정 페이지
    } else {
      navigate(`/users/${user.user_id}`); // 다른 사용자 → 뷰어 페이지
    }
  };

  // 외부 클릭 시 카드 닫기
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

  return (
    <div className="relative inline-block" ref={ref}>
      <span
        className="font-semibold hover:underline cursor-pointer"
        onClick={() => setShowProfile((prev) => !prev)}
      >
        {nickname}
      </span>

      {showProfile && (
        <div className="absolute z-50 top-full left-0 mt-2">
          {loading ? (
            <div className="text-xs text-gray-400 bg-white border rounded px-2 py-1 shadow">
              불러오는 중...
            </div>
          ) : error ? (
            <div className="text-xs text-red-500 bg-white border rounded px-2 py-1 shadow">
              사용자 정보 불러오기 실패
            </div>
          ) : user ? (
            <MiniProfileCard
              user={user}
              isFollowing={isFollowing}
              onFollowToggle={handleFollowToggle}
              onSendMessage={handleSendMessage}
              onProfileClick={handleProfileClick} // 🔹 클릭 이벤트 전달
            />
          ) : (
            <div className="text-sm text-gray-500 bg-white border rounded px-2 py-1 shadow">
              유효하지 않은 사용자
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserNameWithProfile;
