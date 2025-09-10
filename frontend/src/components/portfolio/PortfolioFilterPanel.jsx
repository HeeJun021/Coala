// frontend/src/components/portfolio/PortfolioFilterPanel.jsx
import React from "react";
import { SlidersHorizontal, LayoutTemplate, Eye } from "lucide-react";

/**
 * 앞으로 확장될 포트폴리오 필터/옵션 영역의 기본 뼈대
 */
export default function PortfolioFilterPanel() {
  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">포트폴리오 필터</h2>
        <div className="text-sm text-gray-500">* 연결이 완료되어 필터 사용 가능</div>
      </div>

      {/* 1) 필터 섹션 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={18} />
          <h3 className="font-semibold">기본 필터</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">기간</label>
            <select className="w-full border rounded-lg p-2">
              <option>최근 3개월</option>
              <option>최근 6개월</option>
              <option>올해</option>
              <option>전체</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">언어</label>
            <select className="w-full border rounded-lg p-2">
              <option>전체</option>
              <option>HTML</option>
              <option>CSS</option>
              <option>JavaScript</option>
              <option>Python</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">태그</label>
            <input className="w-full border rounded-lg p-2" placeholder="예: 프로젝트, 팀, 프론트엔드" />
          </div>
        </div>
      </section>

      {/* 2) 레이아웃/톤 프리셋 */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <LayoutTemplate size={18} />
          <h3 className="font-semibold">레이아웃 & 톤</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-3 py-2 rounded-xl border hover:bg-gray-50">개발자형</button>
          <button className="px-3 py-2 rounded-xl border hover:bg-gray-50">PM형</button>
          <button className="px-3 py-2 rounded-xl border hover:bg-gray-50">디자이너형</button>
          <span className="mx-2 text-gray-300">|</span>
          <button className="px-3 py-2 rounded-xl border hover:bg-gray-50">간결</button>
          <button className="px-3 py-2 rounded-xl border hover:bg-gray-50">서술</button>
          <button className="px-3 py-2 rounded-xl border hover:bg-gray-50">정량 강조</button>
        </div>
      </section>

      {/* 3) 미리보기/내보내기 CTA */}
      <section className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          * 세부 옵션(섹션 토글, 코테/퀴즈 지표 등)은 다음 단계에서 추가
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50">
            <Eye size={18} />
            미리보기
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white">
            노션으로 내보내기
          </button>
        </div>
      </section>
    </div>
  );
}
