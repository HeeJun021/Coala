import React, { useEffect, useState } from "react";
import { fetchAdminUsers, fetchAdminUserDetail } from "../api/adminApi";
import UserDetailDialog from "./component/UserDetailDialog"; // 추후 생성
import defaultProfile from "../assets/koala.jpg"; // 기본 이미지

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetail, setUserDetail] = useState(null);

  // ✅ 사용자 전체 목록 불러오기
  const loadUsers = async () => {
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error("사용자 목록 조회 실패:", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ✅ 상세 사용자 정보 불러오기
  useEffect(() => {
    const loadUserDetail = async () => {
      if (selectedUserId !== null) {
        try {
          const detail = await fetchAdminUserDetail(selectedUserId);
          setUserDetail(detail);
        } catch (err) {
          console.error("사용자 상세 조회 실패:", err);
        }
      }
    };
    loadUserDetail();
  }, [selectedUserId]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🧑‍💼 사용자 관리</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {users.map((user) => (
          <div
            key={user.user_id}
            onClick={() => setSelectedUserId(user.user_id)}
            className="cursor-pointer bg-white p-4 rounded shadow hover:shadow-md transition"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src={user.profile_image_url || defaultProfile}
                alt="profile"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{user.nickname}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p>📝 게시글 {user.post_count}개</p>
              <p>💬 댓글 {user.comment_count}개</p>
              <p>🎖️ 티어: {user.tier_name || "없음"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ 사용자 상세 모달 */}
      {userDetail && (
        <UserDetailDialog
          open={!!userDetail}
          onClose={() => {
            setSelectedUserId(null);
            setUserDetail(null);
          }}
          user={userDetail}
          onUserDeleted={async () => {
            await loadUsers(); // ✅ 사용자 목록 재요청
            setSelectedUserId(null);
            setUserDetail(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagementPage;