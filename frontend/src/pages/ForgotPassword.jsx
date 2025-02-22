import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";

const FindPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 타이머 감소 로직
  React.useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // 이메일 입력 핸들러
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  // 인증 코드 요청
  const handleSendCode = () => {
    if (!email) {
      alert("이메일을 입력해주세요!");
      return;
    }
    console.log("인증 코드 전송:", email);
    setTimer(300); // 5분 (300초) 타이머 시작
  };

  // 인증 코드 확인
  const handleVerifyCode = () => {
    if (verificationCode === "123456") {
      setIsVerified(true);
      console.log("이메일 인증 성공");
    } else {
      alert("잘못된 인증 코드입니다.");
    }
  };

  // 새 비밀번호 입력 핸들러
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setNewPassword(newPassword);

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

  // 비밀번호 확인 핸들러
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  // 비밀번호 변경 요청
  const handleResetPassword = () => {
    if (newPassword !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    console.log("비밀번호 변경 요청:", newPassword);
    alert("비밀번호가 성공적으로 변경되었습니다.");
    navigate("/login"); // 변경 후 로그인 페이지로 이동
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative">
  <div 
    className={`absolute top-[40%] transform -translate-y-1/2 
      bg-white p-12 rounded-lg shadow-lg w-full max-w-[500px] text-left 
      transition-all duration-500 ease-in-out overflow-hidden 
      ${isVerified ? "max-h-[600px]" : "max-h-[350px]"}`}
  >


        {/* 타이틀 */}
        <h2 className="text-3xl font-extrabold text-center mb-6 text-navbar">
          비밀번호 찾기
        </h2>
        <p className="text-center text-dark mb-8">
          가입한 이메일을 입력하고 인증을 진행하세요.
        </p>

        {/* 이메일 입력 */}
        <div className="flex items-center border-b border-gray-200 pb-2 mb-4">
          <FaEnvelope className="text-dark mr-2 text-xl" />
          <input
            type="text"
            name="email"
            placeholder="이메일 입력"
            className="w-full p-2 h-10 outline-none text-black"
            value={email}
            onChange={handleEmailChange}
          />
          <button
            onClick={handleSendCode}
            className="ml-4 bg-accent text-white px-5 py-2 h-10 rounded-md hover:bg-green-400 whitespace-nowrap"
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
          {timer > 0 && (
            <span className="ml-2 text-red-500">
              {`${Math.floor(timer / 60)}:${String(timer % 60).padStart(
                2,
                "0"
              )}`}
            </span>
          )}
          <button
            onClick={handleVerifyCode}
            className="ml-4 bg-accent text-white px-5 py-2 h-10 rounded-md hover:bg-green-400 whitespace-nowrap"
          >
            인증 확인
          </button>
        </div>

        {/* 비밀번호 재설정 (이메일 인증 성공 후 표시) */}
        {isVerified && (
          <>
            {/* 새 비밀번호 입력 */}
            <div className="flex flex-col border-b border-gray-200 pb-2">
              <div className="flex items-center">
                <FaLock className="text-dark mr-2" />
                <input
                  type="password"
                  name="newPassword"
                  placeholder="새 비밀번호"
                  className="w-full p-2 h-10 outline-none text-black"
                  value={newPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-500 mt-1">{passwordError}</p>
              )}
            </div>

            {/* 비밀번호 확인 (간격 추가: mt-4) */}
            <div className="flex items-center border-b border-gray-200 pb-2 mt-4">
              <FaLock className="text-dark mr-2" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="비밀번호 확인"
                className="w-full p-2 h-10 outline-none text-black"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
            </div>

            <button
              onClick={handleResetPassword}
              className="w-full bg-accent text-white px-6 py-3 rounded-md font-bold hover:bg-green-400 mt-6"
            >
              비밀번호 변경
            </button>
          </>
        )}

        {/* 로그인으로 돌아가기 */}
        <div className="flex justify-center mt-8 text-dark text-sm">
          <Link to="/login" className="hover:underline">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FindPassword;
