import React, { useState } from 'react';
import { resetPassword } from '../../api/passwordApi';

const InfoCard = ({ userData, setUserData }) => {
    // 상태 관리
    const [isEditingPassword, setIsEditingPassword] = useState(false); // 비밀번호 수정 모드 상태
    const [newPassword, setNewPassword] = useState(''); // 새 비밀번호
    const [confirmPassword, setConfirmPassword] = useState(''); // 비밀번호 확인
    const [setLoading] = useState(false); // ✅ 로딩 상태 추가


    // 비밀번호 저장 로직 (백엔드와 연결 필요)
    const savePassword = async () => {
        if (newPassword !== confirmPassword) {
            return;
        }

        setLoading(true);
        try {
            await resetPassword(userData.email, newPassword); // ✅ 비밀번호 변경 API 호출
            alert("비밀번호가 성공적으로 변경되었습니다.");
            setIsEditingPassword(false);
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.log("비밀번호 변경 실패");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative rounded-lg bg-white flex-col items-start space-y-3">
            {/* 제목 */}
            <h2 className="text-lg font-bold mb-4">계정 정보</h2>
            
            {/* 이메일 섹션 */}
            <div className="flex items-center w-full gap-4">
                <h2 className="font-bold w-14">이메일</h2>
                <p className="text-gray-700">{userData?.email}</p>
            </div>

            {/* 비밀번호 섹션 */}
            <div className="flex items-start w-full">
                <h2 className="font-bold w-24">비밀번호</h2>
                {isEditingPassword ? (
                    <div className="flex flex-col flex-1 gap-2">
                        <div className="flex items-center w-full">
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)} // 새 비밀번호 입력 핸들러
                                className="w-[75%] border border-gray-300 rounded-md px-2 py-1 bg-beige"
                                placeholder="새 비밀번호"
                            />
                        </div>
                        <div className="flex justify-between items-center w-full">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)} // 비밀번호 확인 입력 핸들러
                                className="w-[75%] border border-gray-300 rounded-md px-2 py-1 bg-beige"
                                placeholder="비밀번호 확인"
                            />
                            <button
                                className="bg-green-600 px-4 py-1 rounded-md text-sm text-white font-medium hover:bg-green-700"
                                onClick={savePassword} // 비밀번호 저장 버튼
                            >
                                저장
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-700 flex-1">********</p>
                        <button
                            className="ml-auto bg-green-600 px-4 py-1 rounded-md text-sm text-white font-medium hover:bg-green-700"
                            onClick={() => setIsEditingPassword(true)} // 수정 모드 전환 버튼
                        >
                            변경
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default InfoCard;
