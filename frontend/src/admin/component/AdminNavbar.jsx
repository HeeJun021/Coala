import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";

const AdminNavbar = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();           // ✅ API 호출
      setUser(null);                // ✅ context 상태 초기화
      navigate("/");                // ✅ 홈으로 이동
      window.location.reload();     // ✅ 전체 새로고침으로 상태 리셋
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
  };

  const adminMenuItems = [
    { label: "학습자료", path: "/admin/materials" },
    { label: "퀴즈문제", path: "/admin/quizzes" },
    { label: "코딩테스트", path: "/admin/codingtest" },
    { label: "게시판", path: "/admin/board" },
    { label: "팀프로젝트", path: "/admin/projects" },
    { label: "사용자", path: "/admin/users" },
  ];

  return (
    <div className="fixed top-0 left-0 w-full h-[70px] bg-white border-b shadow-sm flex items-center justify-between px-12 z-50">
      <Link to="/admin" className="flex items-center">
        <img src="/coala.jpg" alt="Coala Logo" className="w-10 h-10 mr-2 rounded-full border" />
        <span className="text-2xl font-semibold text-green-700"> Admin</span>
      </Link>

      <div className="flex gap-8">
        {adminMenuItems.map((item, idx) => (
          <Link key={idx} to={item.path} className="text-[16px] font-semibold text-gray-800 hover:text-green-600 transition">
            {item.label}
          </Link>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
      >
        로그아웃
      </button>
    </div>
  );
};

export default AdminNavbar;
