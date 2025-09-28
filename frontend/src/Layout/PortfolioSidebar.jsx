// frontend/src/Layout/PortfolioSidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const PortfolioSidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ===== 부드러운 스크롤 추적 설정 (코딩테스트와 동일 포맷) =====
  const BASE_TOP = 50;       // 시작 기준 Y
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

  // ===== 활성 메뉴 판별 (코딩테스트 형식에 맞춰 명시 변수 사용) =====
  const isExtract = pathname === "/portfolio";
  const isHistory = pathname === "/portfolio/history" || pathname.startsWith("/portfolio/history");

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
      {/* 헤더 (포맷 동일, 타이틀만 포폴용) */}
      <div className="h-[56px] flex items-center px-6 bg-[#88C078] rounded-t-2xl shadow-sm">
        <h1 className="text-[18px] font-semibold text-black tracking-wide">포트폴리오</h1>
      </div>

      {/* 메뉴 (divide-y 포함) */}
      <div className="divide-y divide-gray-100">
        <button
          type="button"
          className={`${baseItem} ${isExtract ? activeCls : idleCls}`}
          onClick={() => go("/portfolio")}
        >
          포트폴리오 추출
        </button>

        <button
          type="button"
          className={`${baseItem} ${isHistory ? activeCls : idleCls}`}
          onClick={() => go("/portfolio/history")}
        >
          포트폴리오 추출 내역
        </button>
      </div>
    </div>
  );
};

export default PortfolioSidebar;
