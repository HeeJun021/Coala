import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ 네비게이션 추가
import { FaUser, FaLock, FaEnvelope, FaCalendarAlt } from "react-icons/fa";
import { requestEmailVerification, verifyEmail } from "../api/userApi"; // ✅ 이메일 인증 관련 API
import { registerUser } from "../api/authApi"; // ✅ 회원가입 API


const Signup = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState("naver.com");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [timer, setTimer] = useState(0);

  const [password, setPassword] = useState(""); // 비밀번호 입력값
  const [confirmPassword, setConfirmPassword] = useState(""); // 비밀번호 확인
  const [passwordError, setPasswordError] = useState(""); // 비밀번호 유효성 메시지

  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");

  const [nickname, setNickname] = useState(""); // 닉네임 상태 추가

  const domains = ["naver.com", "gmail.com", "kakao.com", "daum.net"];

  // 🔹 연도 목록 생성 (현재 연도 - 100년까지)
  const years = Array.from(
    { length: 100 },
    (_, i) => new Date().getFullYear() - i
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // 🔹 타이머 감소 로직
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // ✅ 이메일 인증 요청 (백엔드 API 호출)
const handleVerificationRequest = async () => {
  const fullEmail = `${email}@${selectedDomain}`;
  if (email && selectedDomain) {
    alert(`인증 코드가 ${fullEmail}로 전송되었습니다.`);
    try {
      await requestEmailVerification(fullEmail);
      setTimer(300); // 5분 타이머 설정
    } catch (error) {
      alert(error.message);
    }
  }
};

  // ✅ 이메일 인증 확인 (백엔드 API 호출)
  const handleVerificationConfirm = async () => {
    const fullEmail = `${email}@${selectedDomain}`;
    try {
      await verifyEmail(fullEmail, verificationCode);
      setIsEmailVerified(true);
      alert("이메일 인증 성공!");
    } catch (error) {
      alert("잘못된 인증 코드입니다.");
    }
  };

  // ✅ 비밀번호 유효성 검사
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    const passwordRegex = /^(?=.*[A-Za-z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError(
        "비밀번호는 최소 8자 이상이며, 영문을 1개 이상 포함해야 합니다."
      );
    } else {
      setPasswordError("");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isEmailVerified) {
      alert("이메일 인증을 완료해야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
  
    const fullEmail = `${email}@${selectedDomain}`;
    const birthDate = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;
  
    try {
      await registerUser({
        email: fullEmail,
        password,
        nickname,
        birth_date: birthDate,
      });
      alert("회원가입 성공!");
      navigate("/login"); // ✅ 로그인 페이지로 이동
    } catch (error) {
      alert(error.message);
    }
  };

  return (
<div className="flex items-center justify-center min-h-screen mt-[0px]" >
  <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-[625px] text-left">
    <h2 className="text-3xl font-extrabold text-center mb-10 text-navbar">
      회원가입
    </h2>
    <p className="text-center text-dark mb-6">
      간단한 정보를 입력하고 Coala에 가입하세요!
    </p>
    <form className="flex flex-col gap-4" onSubmit={handleSignup}>
      {/* 닉네임 */}
      <div className="flex items-center border-b border-gray-200 pb-2">
        <FaUser className="text-dark mr-2" />
        <input
          type="text"
          name="nickname"
          placeholder="닉네임"
          className="w-full p-1.5 h-10 outline-none text-black"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      {/* 🔹 생년월일 (가로폭 1/3씩 균등 배치) */}
      <div className="flex items-center border-b border-gray-200 pb-2">
        <FaCalendarAlt className="text-dark mr-3" />
        <div className="flex w-full gap-2">
          <select
            className="border p-1.5 h-10 rounded-md text-black w-1/3"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
          >
            <option value="">년</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>

          <select
            className="border p-1.5 h-10 rounded-md text-black w-1/3"
            value={birthMonth}
            onChange={(e) => setBirthMonth(e.target.value)}
          >
            <option value="">월</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}월
              </option>
            ))}
          </select>

          <select
            className="border p-1.5 h-10 rounded-md text-black w-1/3"
            value={birthDay}
            onChange={(e) => setBirthDay(e.target.value)}
          >
            <option value="">일</option>
            {days.map((day) => (
              <option key={day} value={day}>
                {day}일
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 이메일 입력 + 도메인 선택 + 인증 코드 요청 버튼 */}
      <div className="border-b border-gray-200 pb-2 flex items-center">
        <FaEnvelope className="text-dark mr-2 text-3xl" />
        <input
          type="text"
          name="email"
          placeholder="이메일"
          className="w-full p-1.5 h-10 outline-none text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <span className="mx-2 text-black">@</span>
        <select
          className="border p-1.5 h-10 rounded-md text-black"
          onChange={(e) => setSelectedDomain(e.target.value)}
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
          className="ml-4 bg-accent text-white px-4 py-1.5 rounded-md min-w-[105px] hover:bg-[#17a94d]"
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
          className="ml-4 bg-accent text-white px-4 py-1.5 rounded-md min-w-[105px] hover:bg-[#17a94d]"
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

      {/* 비밀번호 확인 입력 */}
      <div className="flex flex-col border-b border-gray-200 pb-2">
        <div className="flex items-center">
          <FaLock className="text-dark mr-2" />
          <input
            type="password"
            name="confirmPassword"
            placeholder="비밀번호 확인"
            className="w-full p-1.5 h-10 outline-none text-black"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      {/* 비밀번호 일치 여부 확인 */}
      {confirmPassword && confirmPassword !== password && (
        <p className="text-sm text-red-500 mt-1">
          비밀번호가 일치하지 않습니다.
        </p>
      )}

      {/* 회원가입 버튼 */}
      <div className="flex justify-center mt-6">
        <button
          type="submit"
          className={`bg-accent text-white px-8 py-3 rounded-full font-bold hover:bg-[#17a94d] shadow-lg ${
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
