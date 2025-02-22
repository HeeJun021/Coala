import React, { useState } from "react";
import { FaUser, FaIdCard, FaLock, FaEnvelope, FaPhone } from "react-icons/fa";

const Signup = () => {
  const [selectedCarrier, setSelectedCarrier] = useState(""); // 선택된 통신사 상태 관리

  const handleCarrierSelect = (carrier) => {
    setSelectedCarrier(carrier);
  };

  return (
    <div className="flex items-center justify-center min-h-screen mt-8">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-[600px] text-left">
        {/* 타이틀 */}
        <h2 className="text-3xl font-extrabold text-center mb-4 text-navbar">
          회원가입
        </h2>
        <p className="text-center text-dark mb-6">
          간단한 정보를 입력하고 Coala에 가입하세요!
        </p>
        <form className="flex flex-col gap-4">
          {/* 이름 */}
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaUser className="text-dark mr-2" />
            <input
              type="text"
              name="name"
              placeholder="이름"
              className="w-full p-1.5 h-10 outline-none text-black"
            />
          </div>

          {/* 아이디 */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <FaIdCard className="text-dark mr-2" />
            <input
              type="text"
              name="username"
              placeholder="아이디"
              className="flex-1 p-1.5 h-10 outline-none text-black"
            />
            <button className="ml-4 bg-accent text-white px-6 py-1.5 h-8 rounded-md hover:bg-green-400">
              중복확인
            </button>
          </div>

          {/* 비밀번호 */}
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaLock className="text-dark mr-2" />
            <input
              type="password"
              name="password"
              placeholder="비밀번호"
              className="w-full p-1.5 h-10 outline-none text-black"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaLock className="text-dark mr-2" />
            <input
              type="password"
              name="confirmPassword"
              placeholder="비밀번호 확인"
              className="w-full p-1.5 h-10 outline-none text-black"
            />
          </div>

          {/* 이메일 */}
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaEnvelope className="text-dark mr-2" />
            <input
              type="text"
              name="email"
              placeholder="이메일"
              className="w-full p-1.5 h-10 outline-none text-black"
            />
            <select className="ml-4 border p-1.5 h-10 rounded-md text-black">
              <option>직접입력</option>
              <option>naver.com</option>
              <option>gmail.com</option>
              <option>kakao.com</option>
              <option>outlook.com</option>
              <option>icloud.com</option>
              <option>yahoo.com</option>
              <option>hotmail.com</option>
              <option>daum.net</option>
              <option>hanmail.net</option>
            </select>
          </div>

          {/* 생년월일 (드롭다운 방식) */}
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaUser className="text-dark mr-2" />

            {/* 연도 선택 */}
            <select
              name="birthYear"
              className="border p-1.5 h-10 rounded-md w-1/3 text-black"
            >
              <option value="">년</option>
              {Array.from({ length: 100 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>

            {/* 월 선택 */}
            <select
              name="birthMonth"
              className="border p-1.5 h-10 rounded-md w-1/3 ml-2 text-black"
            >
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}월
                </option>
              ))}
            </select>

            {/* 일 선택 */}
            <select
              name="birthDay"
              className="border p-1.5 h-10 rounded-md w-1/3 ml-2 text-black"
            >
              <option value="">일</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}일
                </option>
              ))}
            </select>
          </div>

          {/* 통신사 선택 */}
          <div className="flex items-center gap-2 mb-2">
            {["SKT", "KT", "LG U+", "알뜰폰"].map((carrier) => (
              <button
                key={carrier}
                type="button"
                className={`px-11 py-1.5 h-9 rounded-md font-medium border ${
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

          {/* 전화번호 */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <FaPhone className="text-dark mr-2" />
            <input
              type="text"
              name="phoneNumber"
              placeholder="+82 전화번호"
              className="flex-1 p-1.5 h-10 outline-none text-black"
            />
            <button className="ml-4 bg-accent text-white px-6 py-1.5 h-8 rounded-md hover:bg-green-400">
              인증 요청
            </button>
          </div>

          {/* 인증번호 입력 및 확인 버튼 */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-2 mt-4">
            <input
              type="text"
              name="verificationCode"
              placeholder="인증번호 입력"
              className="flex-1 p-1.5 h-10 outline-none text-black"
            />
            <button className="ml-4 bg-accent text-white px-6 py-1.5 h-8 rounded-md hover:bg-green-400">
              인증 확인
            </button>
          </div>

          {/* 회원가입 버튼 */}
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              className="bg-accent text-white px-8 py-3 rounded-full font-bold hover:bg-green-400 shadow-lg"
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
