import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { loginUser } from "../api/authApi";
import SocialLogin from "../components/SocialLogin"; // ✅ 추가

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      navigate("/");
      window.location.reload();
    } catch (error) {
      alert("로그인 실패: " + (error.response?.data?.detail || "오류 발생"));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] bg-gray-50 px-4 gap-24">
      {/* 좌측 설명 영역 */}
      <div className="flex-1 max-w-[500px] text-left -mt-40">
        <h1 className="text-5xl font-extrabold text-navbar mb-4">Coala</h1>
        <p className="text-lg text-black leading-8">
          <span className="font-semibold text-gray-800">
            코드를 배우고, 문제를 해결하며
          </span>
          <br />
          함께 성장하는 개발 학습 플랫폼입니다.
        </p>
      </div>

      {/* 우측 로그인 박스 */}
      <div className="w-full max-w-[450px] bg-white p-16 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 text-left mt-12 md:mt-0">
        <h2 className="text-3xl font-extrabold text-center mb-6 text-navbar">
          로그인
        </h2>
        <p className="text-center text-dark mb-8">
          Coala에 오신 것을 환영합니다!
        </p>

        <form className="flex flex-col gap-6" onSubmit={handleLogin}>
          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaEnvelope className="text-dark mr-2" />
            <input
              type="text"
              placeholder="이메일"
              className="w-full p-2 h-10 outline-none text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center border-b border-gray-200 pb-2">
            <FaLock className="text-dark mr-2" />
            <input
              type="password"
              placeholder="비밀번호"
              className="w-full p-2 h-10 outline-none text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-center mt-8">
            <button
              type="submit"
              className="bg-accent text-white px-8 py-3 rounded-full font-bold hover:bg-[#17a94d] shadow-lg w-full"
            >
              로그인
            </button>
          </div>
        </form>

        <div className="flex justify-center gap-6 mt-8 text-dark text-sm">
          <Link to="/signup" className="hover:underline">
            회원가입
          </Link>
          <span className="text-gray-300">|</span>
          <Link to="/forgot-password" className="hover:underline">
            비밀번호 찾기
          </Link>
        </div>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 text-gray-500 text-sm">간편 로그인</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* ✅ 소셜 로그인 버튼 */}
        <SocialLogin />
      </div>
    </div>
  );
};

export default Login;
