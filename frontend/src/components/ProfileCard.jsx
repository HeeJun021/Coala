import React, { useState } from 'react';
import { updateUserInfo } from '../api/userApi';

const ProfileCard = ({ userId, profile_image_url, nickname, tier_name, bio }) => {
    const [isEditing, setIsEditing] = useState(false); // 수정 모드 상태
    const [formData, setFormData] = useState({
        nickname,
        tier_name,
        bio,
    });

    // 입력값 변경 핸들러
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // 수정 모드 전환 핸들러
    const toggleEditMode = () => {
        setIsEditing((prev) => !prev);
    };

    // 저장 로직 (백엔드와 연결 시 추가)
    const saveProfile = async () => {
        try {
            await updateUserInfo(userId, formData);
            alert('프로필이 업데이트되었습니다.');
            setIsEditing(false);
        } catch (error) {
            alert('프로필 업데이트 실패');
        }
    };

    return (
        <div className="relative rounded-lg bg-white flex flex-col items-left space-y-4">
            {isEditing ? (
                // 수정 모드
                <>
                <h2 className="text-lg font-bold mb-1">사용자 정보</h2>
                    {/* 프로필 이미지 */}
                    {profile_image_url && (
                        <div className="flex items-center gap-4">
                            <img
                                src={profile_image_url}
                                alt="Profile"
                                className="w-16 h-16 rounded-md"
                            />
                            <button className="bg-accent text-white px-4 py-1 rounded-lg hover:bg-[#6b8d63]">
                                변경
                            </button>
                        </div>
                    )}

                    {/* 수정 입력 폼 */}
                    <div>
                        <label className="flex items-center justify-between pt-1">
                            <h2 className='font-bold'>닉네임</h2>
                            <input
                                type="text"
                                name="nickname"
                                value={formData.nickname}
                                onChange={handleInputChange}
                                className="w-[75%] border border-gray-300 rounded-md px-2 py-1 mt-1 bg-beige ml-auto mr-10"
                            />
                        </label>
                        <label className="flex items-center justify-between pt-1">
                            <h2 className='font-bold'>자기소개</h2>
                            <input
                                type="text"
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                className="w-[75%] border border-gray-300 rounded-md px-2 py-1 mt-1 bg-beige ml-auto mr-10"
                            />
                        </label>
                        <label className='flex items-center justify-between pt-1'>
                            <h2 className='font-bold'>사용자 티어</h2>
                            <input
                                type="text"
                                name="bio"
                                value={formData.tier_name}
                                readOnly
                                className="w-[75%] border border-gray-300 rounded-md px-2 py-1 mt-1 bg-gray-50 ml-auto mr-10"
                            />
                        </label>

                    </div>

                    {/* 취소 및 저장 버튼 */}
                    <div className="flex justify-end gap-4 mt-4">
                        <button
                            className="bg-gray-300 text-gray-700 px-4 py-1 rounded-lg hover:bg-gray-400"
                            onClick={toggleEditMode}
                        >
                            취소
                        </button>
                        <button
                            className="bg-accent text-white px-4 py-1 rounded-lg hover:bg-[#6b8d63]"
                            onClick={saveProfile} // 저장 로직 호출
                        >
                            저장
                        </button>
                    </div>
                </>
            ) : (
                // 기본 모드
                <>
                    <h2 className="text-lg font-bold mb-1">사용자 정보</h2>
                    {/* 프로필 이미지 */}
                    {profile_image_url && (
                        <img
                            src={profile_image_url}
                            alt="Profile"
                            className="w-16 h-16 rounded-md"
                        />
                    )}

                    {/* 텍스트 정보 */}
                    <div className="flex flex-col gap-2">
                        {/* 닉네임 */}
                        <div className="flex items-center">
                            <h2 className="font-bold w-24">닉네임</h2>
                            <p className="flex-1">{formData.nickname}</p>
                        </div>

                        {/* 자기소개 */}
                        <div className="flex items-center">
                            <h2 className="font-bold w-24">자기소개</h2>
                            <p className="flex-1">{formData.bio}</p>
                        </div>

                        {/* ✅ 티어 정보 추가 */}
                        <div className="flex items-center">
                            <h2 className="font-bold w-24">등급</h2>
                            <p className="flex-1">{formData.tier_name}</p>
                        </div>

                    </div>


                    {/* 수정 버튼 */}
                    <button
                        className="absolute bottom-0 text-white right-0 bg-accent px-4 py-2 rounded-lg hover:bg-[#6b8d63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                        onClick={toggleEditMode} 
                    >
                        수정
                    </button>
                </>
            )}
        </div>
    );
};

export default ProfileCard;
