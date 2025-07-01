import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaLock } from "react-icons/fa";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  const handleResetPassword = () => {
    if (newPassword !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    setIsResetSuccess(true);
    alert("비밀번호가 성공적으로 변경되었습니다!");
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-12 rounded-lg shadow-lg w-full max-w-[580px] text-left">
        {/* 타이틀 */}
        <h2 className="text-3xl font-extrabold text-center mb-6 text-green-600">
          비밀번호 재설정
        </h2>

        {!isResetSuccess ? (
          <>
            <p className="text-center text-dark mb-6">
              새 비밀번호를 입력하고 변경을 완료하세요.
            </p>

            {/* 새 비밀번호 입력 */}
            <div className="flex items-center border-b border-gray-200 pb-2 mb-4">
              <FaLock className="text-dark mr-2" />
              <input
                type="password"
                name="newPassword"
                placeholder="새 비밀번호"
                className="w-full p-2 h-10 outline-none text-black"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {/* 새 비밀번호 확인 */}
            <div className="flex items-center border-b border-gray-200 pb-2 mb-6">
              <FaLock className="text-dark mr-2" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="새 비밀번호 확인"
                className="w-full p-2 h-10 outline-none text-black"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* 비밀번호 재설정 버튼 */}
            <div className="flex justify-center mt-6">
              <button
                onClick={handleResetPassword}
                className="bg-accent text-white px-6 py-2 h-10 w-full rounded-md hover:bg-green-400 shadow-lg"
              >
                비밀번호 변경
              </button>
            </div>
          </>
        ) : (
          <div className="text-center mt-8">
            <p className="text-lg text-dark mb-6">
              비밀번호가 성공적으로 변경되었습니다!
            </p>
            <Link
              to="/login"
              className="text-navbar text-lg font-bold hover:underline"
            >
              로그인하기
            </Link>
          </div>
        )}

        {/* 로그인으로 돌아가기 */}
        {!isResetSuccess && (
          <div className="flex justify-center mt-8 text-dark text-sm">
            <Link to="/login" className="hover:underline">
              로그인으로 돌아가기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
