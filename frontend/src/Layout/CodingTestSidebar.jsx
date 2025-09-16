// frontend/src/Layout/CodingTestSidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const CodingTestSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ===== 부드러운 스크롤 추적 설정 =====
  const BASE_TOP = 32;      // 시작 기준 Y
  const SCROLL_FACTOR = 0.2; // 스크롤 반응 비율(0~1)
  const EASE = 0.15;         // 이징(0.05~0.2 권장)

  const [posY, setPosY] = useState(BASE_TOP);
  const targetYRef = useRef(BASE_TOP);
  const rafRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      setPosY(prev => {
        const next = prev + (targetYRef.current - prev) * EASE;
        rafRef.current = requestAnimationFrame(tick);
        return next;
      });
    };

    const updateTarget = () => {
      targetYRef.current = BASE_TOP + window.scrollY * SCROLL_FACTOR;
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget);
    updateTarget();

    return () => {
      window.removeEventListener("scroll", updateTarget);
      window.removeEventListener("resize", updateTarget);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, []);

  // ===== 활성 메뉴 판별 =====
  const isExplore = pathname === "/problem-explore";
  const isAllProblems =
    pathname === "/codingtest" || pathname.startsWith("/codingtest/");
  const isSubs = pathname.startsWith("/my-submissions");
  const isStats = pathname.startsWith("/my-stats");

  const go = (path) => navigate(path);

  const baseItem =
    "px-6 py-4 w-full text-left cursor-pointer text-[16px] font-semibold transition-all duration-150";
  const activeCls = "bg-[#D9D9D9] text-gray-800";
  const idleCls = "hover:bg-gray-100 text-gray-600";

  return (
    <div
      className="fixed left-[70px] w-[260px] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-40 will-change-transform"
      style={{ transform: `translateY(${posY}px)` }}
    >
      {/* 헤더 */}
      <div className="h-[56px] flex items-center px-6 bg-[#88C078] rounded-t-2xl shadow-sm">
        <h1 className="text-[18px] font-semibold text-black tracking-wide">코딩테스트</h1>
      </div>

      {/* 메뉴 */}
      <div className="divide-y divide-gray-100">
        <button
          type="button"
          className={`${baseItem} ${isExplore ? activeCls : idleCls}`}
          onClick={() => go("/problem-explore")}   // ✅ 여기로 이동
        >
          문제 탐색
        </button>

        <button
          type="button"
          className={`${baseItem} ${isAllProblems ? activeCls : idleCls}`}
          onClick={() => go("/codingtest")}
        >
          문제 목록
        </button>

        <button
          type="button"
          className={`${baseItem} ${isSubs ? activeCls : idleCls}`}
          onClick={() => go("/my-submissions")}
        >
          제출 내역
        </button>

        <button
          type="button"
          className={`${baseItem} ${isStats ? activeCls : idleCls}`}
          onClick={() => go("/my-stats")}
        >
          코딩테스트 통계
        </button>
      </div>
    </div>
  );
};

export default CodingTestSidebar;
