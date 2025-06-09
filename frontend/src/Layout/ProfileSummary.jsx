// src/components/ProfileSummary.jsx
import React from "react";
import { Leaf } from "lucide-react";

const ProfileSummary = ({
  profile_image_url,
  nickname,
  eucalyptus_balance,
}) => {
  return (
    <div className="bg-white p-4 rounded-md shadow-md flex flex-col items-center space-y-2">
      {/* 프로필 이미지 */}
      <img
        src={profile_image_url ?? "assets/koala.jpg"}
        alt="Profile"
        className="w-20 h-20 object-contain rounded-lg"
      />

      {/* 닉네임 */}
      <h2 className="text-lg font-bold">{nickname}</h2>

      {/* 유칼립투스 화폐 표시 */}
      <div className="flex items-center gap-1 text-green-700 font-semibold text-sm">
        <Leaf size={16} className="text-green-600" />
        {eucalyptus_balance ?? 0}
      </div>
    </div>
  );
};

export default ProfileSummary;
