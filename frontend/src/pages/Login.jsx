import React from "react";
import { Link } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";

const Login = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-16 rounded-lg shadow-lg w-full max-w-[450px] text-left">
        {/* 타이틀 - 상단 간격 조정 */}
        <h2 className="text-3xl font-extrabold text-center mb-6 text-navbar">
          로그인
        </h2>
        <p className="text-center text-dark mb-8">
          Coala에 오신 것을 환영합니다!
        </p>

        <form className="flex flex-col gap-6">
          {/* 아이디 입력 */}
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaUser className="text-dark mr-2" />
            <input
              type="text"
              name="username"
              placeholder="아이디"
              className="w-full p-2 h-10 outline-none text-black"
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaLock className="text-dark mr-2" />
            <input
              type="password"
              name="password"
              placeholder="비밀번호"
              className="w-full p-2 h-10 outline-none text-black"
            />
          </div>

          {/* 로그인 버튼 - 하단 여백 추가 */}
          <div className="flex justify-center mt-8">
            <button
              type="submit"
              className="bg-accent text-white px-8 py-3 rounded-full font-bold hover:bg-green-400 shadow-lg w-full"
            >
              로그인
            </button>
          </div>
        </form>

        {/* 회원가입 | 아이디 찾기 | 비밀번호 찾기 - 간격 추가 */}
        <div className="flex justify-center gap-6 mt-8 text-dark text-sm">
          <Link to="/signup" className="hover:underline">
            회원가입
          </Link>
          <span className="text-gray-300">|</span>
          <Link to="/find-id" className="hover:underline">
            아이디 찾기
          </Link>
          <span className="text-gray-300">|</span>
          <Link to="/forgot-password" className="hover:underline">
            비밀번호 찾기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
