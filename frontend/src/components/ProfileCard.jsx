import React, { useState, useEffect } from 'react';
import { updateUserInfo } from '../api/userApi';
import RatingProgressBar from './RatingProgressBar';

const ProfileCard = ({ userData, setUserData }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        nickname: userData.nickname,
        tier_name: userData.tier_name,
        bio: userData.bio ?? "",
        profile_image_url: userData.profile_image_url 
    });

    useEffect(() => {
        setFormData(prevFormData => ({
            nickname: userData.nickname ?? prevFormData.nickname,
            tier_name: userData.tier_name ?? prevFormData.tier_name,
            bio: userData.bio !== undefined ? userData.bio : prevFormData.bio,
            profile_image_url: userData.profile_image_url ?? prevFormData.profile_image_url
        }));
    }, [userData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value ?? "",
        }));
    };

    const toggleEditMode = () => {
        setIsEditing((prev) => !prev);
    };

    const saveProfile = async () => {
        try {
            const updatedData = await updateUserInfo(userData.user_id, formData);
            alert('프로필이 업데이트되었습니다.');

            setUserData(prevData => ({
                ...prevData,
                ...updatedData,
                bio: updatedData.bio !== undefined ? updatedData.bio : prevData.bio,
                profile_image_url: updatedData.profile_image_url || prevData.profile_image_url,
                tier_name: prevData.tier_name
            }));

            setIsEditing(false);
        } catch (error) {
            alert('프로필 업데이트 실패');
        }
    };

    const getRange = (rating) => {
        if (rating <= 500) return { min: 0, max: 500 };
        if (rating <= 1000) return { min: 501, max: 1000 };
        return { min: 1001, max: 1500 };
    };

    const { min, max } = getRange(userData?.rating || 0);

    return (
        <div className="relative rounded-lg bg-white flex flex-col items-left space-y-4">
            {isEditing ? (
                <>
                    <h2 className="text-lg font-bold mb-1">사용자 정보</h2>
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
                    <div>
                        <label className="flex items-center justify-between pt-1">
                            <h2 className='font-bold'>닉네임</h2>
                            <input
                                type="text"
                                name="nickname"
                                value={formData.nickname}
                                onChange={handleInputChange}
                                className="w-[75%] border border-gray-300 rounded-md px-2 py-1 mt-1 bg-gray-50 ml-auto mr-10"
                            />
                        </label>
                        <label className="flex items-center justify-between pt-1">
                            <h2 className='font-bold'>자기소개</h2>
                            <input
                                type="text"
                                name="bio"
                                defaultValue={formData.bio}
                                onChange={handleInputChange}
                                className="w-[75%] border border-gray-300 rounded-md px-2 py-1 mt-1 bg-gray-50 ml-auto mr-10"
                            />
                        </label>
                        <label className='flex items-center justify-between pt-1'>
                            <h2 className='font-bold'>사용자 티어</h2>
                            <input
                                type="text"
                                name="tier_name"
                                value={userData.tier_name}
                                readOnly
                                className="w-[75%] border border-gray-300 rounded-md px-2 py-1 mt-1 bg-gray-400 ml-auto mr-10"
                            />
                        </label>
                    </div>
                    <div className="flex justify-end gap-4 mt-4">
                        <button
                            className="bg-gray-300 text-gray-700 px-4 py-1 rounded-lg hover:bg-gray-400"
                            onClick={toggleEditMode}
                        >
                            취소
                        </button>
                        <button
                            className="bg-accent text-white px-4 py-1 rounded-lg hover:bg-[#6b8d63]"
                            onClick={saveProfile}
                        >
                            저장
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <h2 className="text-lg font-bold mb-1">사용자 정보</h2>
                    {userData.profile_image_url && (
                        <img
                            src={userData?.profile_image_url}
                            alt="Profile"
                            className="w-16 h-16 rounded-md"
                        />
                    )}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center">
                            <h2 className="font-bold w-24">닉네임</h2>
                            <p className="flex-1">{userData?.nickname}</p>
                        </div>
                        <div className="flex items-center">
                            <h2 className="font-bold w-24">자기소개</h2>
                            <p className="flex-1">{userData?.bio}</p>
                        </div>
                        <div className="flex items-center">
                            <h2 className="font-bold w-24">등급</h2>
                            <p className="flex-1">{userData?.tier_name}</p>
                        </div>
                        {userData?.rating !== undefined && (
                            <>
                                <div className="flex items-center">
                                    <h2 className="font-bold w-24">레이팅</h2>
                                    <p className="flex-1">{userData.rating}</p>
                                </div>
                                <div className="w-full pr-24">
                                    <RatingProgressBar rating={userData.rating} min={min} max={max} />
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        className="absolute bottom-0 text-white right-0 bg-accent px-4 py-1 rounded-lg hover:bg-[#6b8d63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
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
