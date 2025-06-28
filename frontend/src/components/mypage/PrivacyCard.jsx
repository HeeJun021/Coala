import React, { useState } from 'react';

const PrivacyCard = () => {
    const [profileVisibility, setProfileVisibility] = useState('전체 공개');
    const [activityVisibility, setActivityVisibility] = useState('전체 공개');

    return (
        <div className="p-6 bg-white shadow-lg rounded-lg border border-gray-300 w-full max-w-2xl">
            <h2 className="text-lg font-bold mb-4">공개 설정</h2>
            
            {/* 프로필 공개 범위 */}
            <div className="mb-4">
                <label className="font-semibold block mb-2">프로필 공개 범위</label>
                <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                    value={profileVisibility}
                    onChange={(e) => setProfileVisibility(e.target.value)}
                >
                    <option>전체 공개</option>
                    <option>팀원/멘토만 공개</option>
                    <option>비공개</option>
                </select>
            </div>
            
            {/* 활동 내역 공개 설정 */}
            <div>
                <label className="font-semibold block mb-2">활동 내역 공개 설정</label>
                <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                    value={activityVisibility}
                    onChange={(e) => setActivityVisibility(e.target.value)}
                >
                    <option>전체 공개</option>
                    <option>팀원/멘토만 공개</option>
                    <option>비공개</option>
                </select>
            </div>
        </div>
    );
};

export default PrivacyCard;