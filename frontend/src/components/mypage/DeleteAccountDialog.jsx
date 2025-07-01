import React, { useState } from "react";

const DeleteAccountDialog = ({ isOpen, onClose, onConfirm }) => {
    const [password, setPassword] = useState("");

    if (!isOpen) return null; // 다이얼로그가 열려있지 않으면 렌더링 X

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-[#D9E1E5] p-6 rounded-lg shadow-lg w-[400px]">
                {/* 코알라 아이콘 */}
                <div className="flex justify-center">
                    <img src="/koala-icon.png" alt="Koala" className="w-12 h-12 mb-4" />
                </div>

                {/* 설명 텍스트 */}
                <h2 className="text-lg font-bold text-center mb-4">
                    계정 탈퇴를 위해 <br /> 현재 비밀번호를 입력해 주세요.
                </h2>

                {/* 비밀번호 입력 */}
                <input
                    type="password"
                    placeholder="비밀번호 입력"
                    className="w-full p-2 border border-gray-300 rounded-md mb-4"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* 버튼 영역 */}
                <div className="flex justify-between">
                    <button
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        onClick={onClose}
                    >
                        취소
                    </button>
                    <button
                        className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-navbar"
                        onClick={() => onConfirm(password)}
                    >
                        탈퇴 확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountDialog;
