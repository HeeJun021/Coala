import React, { useState, useEffect } from 'react';
import { updateUserInfo } from '../api/userApi';

const ProfileCard = ({ userData, setUserData }) => {
    const [isEditing, setIsEditing] = useState(false); // 수정 모드 상태
    const [formData, setFormData] = useState({
        nickname: userData.nickname,
        tier_name: userData.tier_name,
        bio: userData.bio ?? "",
        profile_image_url: userData.profile_image_url 
    });

    // ✅ userData가 변경되면 formData도 업데이트되도록 설정
    useEffect(() => {
        console.log("🔍 ProfileCard useEffect 실행됨! userData:", userData);
    
        setFormData(prevFormData => ({
            nickname: userData.nickname ?? prevFormData.nickname,  // ✅ 기존 값 유지
            tier_name: userData.tier_name ?? prevFormData.tier_name,
            bio: userData.bio !== undefined ? userData.bio : prevFormData.bio,  // ✅ bio가 undefined면 기존 값 유지
            profile_image_url: userData.profile_image_url ?? prevFormData.profile_image_url
        }));
    }, [userData]); 

    // 입력값 변경 핸들러
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value ?? "",
        }));
    };

    // 수정 모드 전환 핸들러
    const toggleEditMode = () => {
        setIsEditing((prev) => !prev);
    };

    const saveProfile = async () => {
        try {
            const updatedData = await updateUserInfo(userData.user_id, formData);
            alert('프로필이 업데이트되었습니다.');
    
            setUserData(prevData => ({
                ...prevData,  // ✅ 기존 데이터 유지
                ...updatedData,  // ✅ 업데이트된 데이터 적용
                bio: updatedData.bio !== undefined ? updatedData.bio : prevData.bio, 
                profile_image_url: updatedData.profile_image_url || prevData.profile_image_url,  // ✅ 이미지 유지
                tier_name: prevData.tier_name  // ✅ 기존 사용자 티어 유지
            }));
    
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
                    {userData.profile_image_url && (
                        <div className="flex items-center gap-4">
                            <img
                                src={userData.profile_image_url}
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
                                defaultValue={formData.bio}
                                onChange={handleInputChange}
                                className="w-[75%] border border-gray-300 rounded-md px-2 py-1 mt-1 bg-beige ml-auto mr-10"
                            />
                        </label>
                        <label className='flex items-center justify-between pt-1'>
                            <h2 className='font-bold'>사용자 티어</h2>
                            <input
                                type="text"
                                name="bio"
                                value={userData.tier_name}
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
                    {userData.profile_image_url && (
                        <img
                            src={userData?.profile_image_url}
                            alt="Profile"
                            className="w-16 h-16 rounded-md"
                        />
                    )}

                    {/* 텍스트 정보 */}
                    <div className="flex flex-col gap-2">
                        {/* 닉네임 */}
                        <div className="flex items-center">
                            <h2 className="font-bold w-24">닉네임</h2>
                            <p className="flex-1">{userData?.nickname}</p>
                        </div>

                        {/* 자기소개 */}
                        <div className="flex items-center">
                            <h2 className="font-bold w-24">자기소개</h2>
                            <p className="flex-1">{userData?.bio}</p>
                        </div>

                        {/* ✅ 티어 정보 추가 */}
                        <div className="flex items-center">
                            <h2 className="font-bold w-24">등급</h2>
                            <p className="flex-1">{userData?.tier_name}</p>
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
