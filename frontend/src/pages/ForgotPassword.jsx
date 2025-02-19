import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPhone } from "react-icons/fa";

const FindPassword = () => {
  const navigate = useNavigate();
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCarrierSelect = (carrier) => setSelectedCarrier(carrier);

  const handleSendCode = () => {
    if (!selectedCarrier) {
      alert("통신사를 선택해주세요!");
      return;
    }
    alert("인증번호가 전송되었습니다.");
  };

  const handleVerifyCode = () => {
    setIsVerified(true);
    alert("인증이 완료되었습니다.");
  };

  const handleResetPassword = () => {
    navigate("/reset-password"); // 비밀번호 재설정 페이지로 이동
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-12 rounded-lg shadow-lg w-full max-w-[580px] text-left">
        {/* 타이틀 */}
        <h2 className="text-3xl font-extrabold text-center mb-6 text-navbar">
          비밀번호 찾기
        </h2>

        {!isVerified ? (
          <>
            {/* 통신사 선택 */}
            <div className="flex justify-center gap-3 mb-4">
              {["SKT", "KT", "LG U+", "알뜰폰"].map((carrier) => (
                <button
                  key={carrier}
                  type="button"
                  className={`px-6 py-2 h-10 rounded-md font-medium border w-1/4 ${
                    selectedCarrier === carrier
                      ? "bg-accent text-white"
                      : "bg-white text-black border-gray-300"
                  }`}
                  onClick={() => handleCarrierSelect(carrier)}
                >
                  {carrier}
                </button>
              ))}
            </div>

            {/* 전화번호 입력 */}
            <div className="flex items-center border-b border-gray-200 pb-2 mb-4">
              <FaPhone className="text-dark mr-2" />
              <input
                type="text"
                name="phone"
                placeholder="+82 전화번호"
                className="w-full p-2 h-10 outline-none text-black"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <button
                onClick={handleSendCode}
                className="ml-4 bg-accent text-white px-6 py-2 h-10 w-[90px] rounded-md hover:bg-green-400 flex items-center justify-center whitespace-nowrap"
              >
                인증 요청
              </button>
            </div>

            {/* 인증번호 입력 */}
            <div className="flex items-center border-b border-gray-200 pb-2 mb-6">
              <input
                type="text"
                name="verificationCode"
                placeholder="인증번호 입력"
                className="w-full p-2 h-10 outline-none text-black"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <button
                onClick={handleVerifyCode}
                className="ml-4 bg-accent text-white px-6 py-2 h-10 w-[90px] rounded-md hover:bg-green-400 flex items-center justify-center whitespace-nowrap"
              >
                인증 확인
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 기존 비밀번호 표시 */}
            <h3 className="text-lg font-bold text-center text-green-500 mb-4">
              인증이 완료되었습니다. 현재 비밀번호를 확인하세요.
            </h3>
            <div className="flex items-center border-b border-gray-200 pb-2 mb-6 justify-between">
              <span className="text-black text-lg">
                {showPassword ? "example1234!" : "********"}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="ml-4 text-navbar font-bold hover:underline"
              >
                {showPassword ? "숨기기" : "보기"}
              </button>
            </div>

            {/* 비밀번호 재설정 버튼 */}
            <div className="flex justify-center mt-8">
              <button
                onClick={handleResetPassword}
                className="bg-accent text-white px-6 py-2 h-10 w-full rounded-md hover:bg-green-400 shadow-lg"
              >
                비밀번호 재설정
              </button>
            </div>
          </>
        )}

        {/* 로그인으로 돌아가기 */}
        <div className="flex justify-center mt-10 text-dark text-sm">
          <Link to="/login" className="hover:underline">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FindPassword;
