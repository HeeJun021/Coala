import React from 'react';
import koala from '../assets/koala.jpg'


const ProfileSummary = ({ profile_image_url, nickname }) => {
    return (
        <div className="bg-yellow-50 p-4 rounded-md shadow-md flex flex-col items-center">
            {/* 프로필 이미지 */}
            <img 
                src={profile_image_url || koala} 
                alt="Profile" 
                className="w-20 h-20 object-contain rounded-lg"
            />
            {/* 프로필 텍스트 */}
            <h2 className="text-lg font-bold">{nickname || "사용자"}</h2>
        </div>
    );
};

export default ProfileSummary;
