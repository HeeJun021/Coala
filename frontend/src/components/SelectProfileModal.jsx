import React from "react";
import { updateProfileImage } from "../api/userApi"; // 프로필 이미지 변경 API
import { EucalyptusActions } from "../constants/eucalyptusActions";
import { getCurrentUser } from "../api/authApi";

const profileImages = [
  "/assets/koala.jpg",
  "/assets/koala1.png",
  "/assets/koala2.webp",
];

const SelectProfileModal = ({ isOpen, onClose, onSelectImage, currentImageUrl }) => {
  if (!isOpen) return null;

  const handleImageSelect = async (imageUrl) => {
    if (imageUrl === currentImageUrl) {
      alert("현재 프로필입니다.");
      return;
    }

    try {
      // 이미지 변경 요청
      await updateProfileImage({
        profile_image_url: imageUrl,
        action: EucalyptusActions.CHANGE_PROFILE_IMAGE,
      });

      const freshUser = await getCurrentUser();
      onSelectImage(freshUser.profile_image_url, freshUser);
    } catch (error) {
      console.error("이미지 변경 실패:", error);
      alert(error.response?.data?.detail || "이미지 변경에 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
        <h2 className="text-lg font-bold mb-2">프로필 이미지 선택</h2>
        <p className="text-sm text-gray-600 mb-4">프로필 변경 시 <span className="font-semibold text-green-600">30 유칼립투스 잎</span>이 사용됩니다.</p>

        <div className="flex justify-center gap-4">
          {profileImages.map((img, idx) => (
            <div
              key={idx}
              className={`relative rounded-md border-4 transition ${
                img === currentImageUrl
                  ? "border-green-500"
                  : "border-transparent hover:border-blue-300"
              }`}
              onClick={() => handleImageSelect(img)}
            >
              <img
                src={img}
                alt={`koala-${idx}`}
                className="w-20 h-20 rounded-md cursor-pointer"
              />
              {img === currentImageUrl}
            </div>
          ))}
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-300 rounded hover:bg-gray-400"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectProfileModal;
