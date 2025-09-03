import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchUserProfile } from "../../api/userApi"; // userApi.js 에 있는 함수 재활용

const UserProfileViewerPage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await fetchUserProfile(userId);
        setUser(data);
      } catch (err) {
        console.error("❌ 유저 정보를 불러오는 데 실패했습니다:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [userId]);

  if (loading) return <div className="p-6">로딩 중...</div>;
  if (!user) return <div className="p-6">유저 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      {/* 프로필 상단 */}
      <div className="flex items-center gap-6 border-b pb-4 mb-6">
        <img
          src={user.profile_image_url || "/default-profile.png"}
          alt="프로필 이미지"
          className="w-20 h-20 rounded-full border object-cover"
        />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{user.nickname}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* 자기소개 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700">자기소개</h3>
        <p className="text-gray-600 mt-2">
          {user.bio || "자기소개가 없습니다."}
        </p>
      </div>

      {/* 기술 스택 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700">기술 스택</h3>
        {user.skills?.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {user.skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 mt-2">등록된 기술이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default UserProfileViewerPage;
