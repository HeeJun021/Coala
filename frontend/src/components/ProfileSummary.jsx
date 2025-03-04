import React from 'react';

const ProfileSummary = ({ profile_image_url, username }) => {
    return (
        <div className="bg-yellow-50 p-4 rounded-md shadow-md flex flex-col items-center">
            {/* 프로필 이미지 */}
            <img 
                src={profile_image_url} 
                alt="Profile" 
                className="w-20 h-20 object-contain rounded-lg"
            />
            {/* 프로필 텍스트 */}
            <h2 className="text-lg font-bold">{username}</h2>
        </div>
    );
};

export default ProfileSummary;
