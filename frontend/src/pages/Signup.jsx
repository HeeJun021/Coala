import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("naver.com");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [timer, setTimer] = useState(0);

  const [password, setPassword] = useState(""); // 비밀번호 입력값
  const [confirmPassword, setConfirmPassword] = useState(""); // 비밀번호 확인
  const [passwordError, setPasswordError] = useState(""); // 비밀번호 유효성 메시지

  const domains = ["naver.com", "gmail.com", "kakao.com", "daum.net"];

  // 타이머 감소 로직
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleDomainChange = (e) => {
    setSelectedDomain(e.target.value);
  };

  // 🔹 인증 코드 요청 버튼을 다시 누를 수 있도록 변경
  const handleVerificationRequest = () => {
    if (email && selectedDomain) {
      console.log("인증 코드 전송:", `${email}@${selectedDomain}`);

      // 인증 요청 시 타이머가 다시 5분으로 초기화
      setTimer(300);
    }
  };

  const handleVerificationConfirm = () => {
    if (verificationCode === "123456") {
      setIsEmailVerified(true);
      console.log("이메일 인증 성공");
    } else {
      alert("잘못된 인증 코드입니다.");
    }
  };

  // 🔹 비밀번호 유효성 검사
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    // 비밀번호 유효성 체크 (최소 8자, 영문 최소 1개 포함)
    const passwordRegex = /^(?=.*[A-Za-z]).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      setPasswordError(
        "비밀번호는 최소 8자 이상이며, 영문을 1개 이상 포함해야 합니다."
      );
    } else {
      setPasswordError("");
    }
  };

  // 🔹 비밀번호 확인 체크
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  return (
    <div className="flex items-center justify-center min-h-screen mt-[-90px]">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-[625px] text-left">
        <h2 className="text-3xl font-extrabold text-center mb-10 text-navbar">
          회원가입
          
        </h2>
        <p className="text-center text-dark mb-6">
          간단한 정보를 입력하고 Coala에 가입하세요!
        </p>
        <form className="flex flex-col gap-4">
          {/* 닉네임 */}
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaUser className="text-dark mr-2" />
            <input
              type="text"
              name="nickname"
              placeholder="닉네임"
              className="w-full p-1.5 h-10 outline-none text-black"
            />
          </div>

          {/* 이메일 입력 + 도메인 선택 + 인증 코드 요청 버튼 */}
          <div className="border-b border-gray-200 pb-2 flex items-center">
            <FaEnvelope className="text-dark mr-2 text-2xl" />
            <input
              type="text"
              name="email"
              placeholder="이메일"
              className="w-full p-1.5 h-10 outline-none text-black"
              value={email}
              onChange={handleEmailChange}
            />
            <span className="mx-2 text-black">@</span>
            <select
              className="border p-1.5 h-10 rounded-md text-black"
              onChange={handleDomainChange}
              value={selectedDomain}
            >
              {domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleVerificationRequest}
              className="ml-4 bg-accent text-white px-4 py-1.5 rounded-md min-w-[105px] hover:bg-green-400"
            >
              인증 요청
            </button>
          </div>

          {/* 인증 코드 입력 + 인증 확인 버튼 */}
          <div className="border-b border-gray-200 pb-2 flex items-center">
            <input
              type="text"
              name="verificationCode"
              placeholder="인증 코드 입력"
              className="flex-1 p-1.5 h-10 outline-none text-black"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <button
              type="button"
              onClick={handleVerificationConfirm}
              className="ml-4 bg-accent text-white px-4 py-1.5 rounded-md min-w-[105px] hover:bg-green-400"
            >
              인증 확인
            </button>
          </div>

          {/* 비밀번호 입력 */}
          <div className="flex flex-col border-b border-gray-200 pb-2">
            <div className="flex items-center">
              <FaLock className="text-dark mr-2" />
              <input
                type="password"
                name="password"
                placeholder="비밀번호"
                className="w-full p-1.5 h-10 outline-none text-black"
                value={password}
                onChange={handlePasswordChange}
              />
            </div>
          </div>
          {passwordError && (
            <p className="text-sm text-red-500 mt-1">{passwordError}</p>
          )}
          {/* 비밀번호 확인 */}
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaLock className="text-dark mr-2" />
            <input
              type="password"
              name="confirmPassword"
              placeholder="비밀번호 확인"
              className="w-full p-1.5 h-10 outline-none text-black"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
            />
          </div>

          {/* 회원가입 버튼 */}
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              className={`bg-accent text-white px-8 py-3 rounded-full font-bold hover:bg-green-400 shadow-lg ${
                isEmailVerified && password && !passwordError
                  ? ""
                  : "opacity-50 cursor-not-allowed"
              }`}
              disabled={!isEmailVerified || passwordError}
            >
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
