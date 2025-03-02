import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { loginUser } from "../api/authApi"; 
import SocialLogin from "../components/SocialLogin";  // ✅ 추가

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      alert("로그인 성공!");
      navigate("/");
      window.location.reload();
    } catch (error) {
      alert("로그인 실패: " + (error.response?.data?.detail || "오류 발생"));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen mt-[-70px]">
      <div className="bg-white p-16 rounded-lg shadow-lg w-full max-w-[450px] text-left">
        <h2 className="text-3xl font-extrabold text-center mb-6 text-navbar">로그인</h2>
        <p className="text-center text-dark mb-8">Coala에 오신 것을 환영합니다!</p>

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
            <button type="submit" className="bg-accent text-white px-8 py-3 rounded-full font-bold hover:bg-green-400 shadow-lg w-full">
              로그인
            </button>
          </div>
        </form>

        <div className="flex justify-center gap-6 mt-8 text-dark text-sm">
          <Link to="/signup" className="hover:underline">회원가입</Link>
          <span className="text-gray-300">|</span>
          <Link to="/forgot-password" className="hover:underline">비밀번호 찾기</Link>
        </div>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 text-gray-500 text-sm">간편 로그인</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* ✅ 소셜 로그인 버튼을 컴포넌트로 사용 */}
        <SocialLogin />
      </div>
    </div>
  );
};

export default Login;
