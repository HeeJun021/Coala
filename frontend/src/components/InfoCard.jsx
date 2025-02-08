import React, { useState } from 'react';

const InfoCard = ({ userId, hashedPassword, email, phone, isEmailVerified }) => {
    // 상태 관리
    const [isEditingId, setIsEditingId] = useState(false); // 아이디 수정 모드 상태
    const [newUserId, setNewUserId] = useState(userId); // 변경된 아이디 값
    const [isEditingPassword, setIsEditingPassword] = useState(false); // 비밀번호 수정 모드 상태
    const [newPassword, setNewPassword] = useState(''); // 새 비밀번호
    const [confirmPassword, setConfirmPassword] = useState(''); // 비밀번호 확인
    const [isEditingEmail, setIsEditingEmail] = useState(false); // 이메일 수정/인증 모드 상태
    const [newEmail, setNewEmail] = useState(email); // 새 이메일 값
    const [isEditingPhone, setIsEditingPhone] = useState(false); // 전화번호 수정 모드 상태
    const [newPhone, setNewPhone] = useState(phone); // 새 전화번호
    const [verificationCode, setVerificationCode] = useState(''); // 인증번호 입력 값
    const [selectedCarrier, setSelectedCarrier] = useState(''); // 통신사 선택 상태

    // 입력값 변경 핸들러
    const handleInputChange = (e) => {
        setNewUserId(e.target.value); // 아이디 입력 상태 업데이트
    };

    // 아이디 저장 로직 (백엔드와 연결 필요)
    const saveUserId = () => {
        alert(`새로운 아이디: ${newUserId}`); // 저장 후 백엔드 API 호출
        setIsEditingId(false); // 수정 모드 종료
    };

    // 비밀번호 저장 로직 (백엔드와 연결 필요)
    const savePassword = () => {
        if (newPassword !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.'); // 비밀번호 확인 실패
            return;
        }
        alert(`새로운 비밀번호: ${newPassword}`); // 저장 후 백엔드 API 호출
        setIsEditingPassword(false); // 수정 모드 종료
    };

    // 이메일 인증 요청 로직
    const sendEmailVerification = () => {
        if (!newEmail) {
            alert('이메일 주소를 입력하세요.'); // 이메일 미입력 경고
            return;
        }
        alert(`이메일 전송: ${newEmail}`); // 인증 요청 후 백엔드 API 호출
        setIsEditingEmail(false); // 인증 모드 종료
    };

    // 전화번호 인증 요청 로직
    const requestVerification = () => {
        if (!newPhone) {
            alert('전화번호를 입력하세요.'); // 전화번호 미입력 경고
            return;
        }
        alert(`인증 요청: ${newPhone}`); // 인증 요청 후 백엔드 API 호출
    };

    // 인증번호 확인 로직
    const confirmVerification = () => {
        if (!verificationCode) {
            alert('인증번호를 입력하세요.'); // 인증번호 미입력 경고
            return;
        }
        alert(`인증번호 확인: ${verificationCode}`); // 인증 확인 후 백엔드 API 호출
        setIsEditingPhone(false); // 인증 완료 후 수정 모드 종료
    };

    // 통신사 선택 로직
    const handleCarrierSelect = (carrier) => {
        setSelectedCarrier(carrier); // 선택한 통신사 업데이트
    };

    return (
        <div className="relative rounded-lg bg-white flex-col items-start space-y-3">
            {/* 제목 */}
            <h2 className="text-lg font-bold mb-4">계정 정보</h2>

            {/* 아이디 섹션 */}
            <div className="flex items-center w-full">
                <h2 className="font-bold w-24">아이디</h2>
                {isEditingId ? (
                    <div className="flex items-center justify-between flex-1">
                        <input
                            type="text"
                            value={newUserId}
                            onChange={handleInputChange} // 아이디 입력 핸들러
                            className="w-[80%] border border-gray-300 rounded-md px-2 py-1 bg-beige"
                        />
                        <button
                            className="ml-2 bg-accent px-4 py-1 rounded-md text-sm text-white font-medium hover:bg-[#6b8d63]"
                            onClick={saveUserId} // 아이디 저장 버튼
                        >
                            저장
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-700 flex-1">{userId}</p>
                        <button
                            className="ml-auto bg-accent px-4 py-1 rounded-md text-sm  text-white font-medium hover:bg-[#6b8d63]"
                            onClick={() => setIsEditingId(true)} // 수정 모드 전환 버튼
                        >
                            변경
                        </button>
                    </>
                )}
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
                                className="bg-accent px-4 py-1 rounded-md text-sm text-white font-medium hover:bg-[#6b8d63]"
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
                            className="ml-auto bg-accent px-4 py-1 rounded-md text-sm text-white font-medium hover:bg-[#6b8d63]"
                            onClick={() => setIsEditingPassword(true)} // 수정 모드 전환 버튼
                        >
                            변경
                        </button>
                    </>
                )}
            </div>

            {/* 이메일 섹션 */}
            <div className="flex items-center w-full gap-4">
                <h2 className="font-bold w-14">이메일</h2>
                {isEditingEmail ? (
                    <div className="flex items-center justify-between flex-1 gap-2">
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)} // 이메일 입력 핸들러
                            className="w-[75%] border border-gray-300 rounded-md px-2 py-1 bg-beige"
                            placeholder="새 이메일 주소를 입력하세요"
                        />
                        <button
                            className="bg-accent px-4 py-1 rounded-md text-sm text-white font-medium hover:bg-[#6b8d63]"
                            onClick={sendEmailVerification} // 이메일 인증 요청 버튼
                        >
                            전송
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center flex-1">
                        {isEmailVerified ? (
                            <span className="text-green-500 mr-2">✔</span> // 인증 상태 표시
                        ) : (
                            <span className="text-red-500 mr-2">✖</span> // 미인증 상태 표시
                        )}
                        <p className="text-gray-700">{email}</p>
                        <button
                            className="ml-auto bg-accent px-4 py-1 rounded-md text-sm text-white font-medium hover:bg-[#6b8d63]"
                            onClick={() => setIsEditingEmail(true)} // 수정 모드 전환 버튼
                        >
                            {isEmailVerified ? '변경' : '인증'}
                        </button>
                    </div>
                )}
            </div>

            {/* 전화번호 섹션 */}
            <div className="flex items-start w-full">
                <h2 className="font-bold w-24">전화번호</h2>
                {isEditingPhone ? (
                    <div className="flex flex-col flex-1 gap-2">
                        <div className="flex items-center gap-2">
                            {['SKT', 'KT', 'LG U+', '알뜰폰'].map((carrier) => (
                                <button
                                    key={carrier}
                                    type="button"
                                    className={`px-4 py-1 rounded-md font-medium border ${
                                        selectedCarrier === carrier
                                            ? 'bg-accent text-black'
                                            : 'bg-white text-black border-gray-300'
                                    }`}
                                    onClick={() => handleCarrierSelect(carrier)} // 통신사 선택 버튼
                                >
                                    {carrier}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <input
                                type="text"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)} // 전화번호 입력 핸들러
                                className="w-[75%] border border-gray-300 rounded-md px-2 py-1 bg-beige"
                                placeholder="전화번호를 입력하세요"
                            />
                            <button
                                className="bg-accent px-4 py-1 rounded-md text-sm text-white font-medium hover:bg-[#6b8d63]"
                                onClick={requestVerification} // 인증 요청 버튼
                            >
                                전송
                            </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)} // 인증번호 입력 핸들러
                                className="w-[75%] border border-gray-300 rounded-md px-2 py-1 bg-beige"
                                placeholder="인증번호를 입력하세요"
                            />
                            <button
                                className="bg-accent px-4 py-1 rounded-md text-sm text-white font-medium hover:bg-[#6b8d63]"
                                onClick={confirmVerification} // 인증번호 확인 버튼
                            >
                                확인
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-700 flex-1">{phone}</p>
                        <button
                            className="ml-auto bg-accent px-4 py-1 rounded-md text-sm text-white font-medium hover:bg-[#6b8d63]"
                            onClick={() => setIsEditingPhone(true)} // 수정 모드 전환 버튼
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
