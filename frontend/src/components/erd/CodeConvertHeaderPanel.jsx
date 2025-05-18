import React from "react";

const CodeConvertHeaderPanel = ({
  language,
  setLanguage,
  convertType,
  setConvertType,
  onBack,
  onFetch
}) => {
  return (
    <div className="flex flex-col gap-2 w-full text-[15px]">
      {/* ✅ 줄 1: 제목 + 돌아가기 */}
      <div className="flex items-center justify-between">
        <div className="text-[17px] font-semibold">
          <button
            onClick={onBack}
            className="text-white hover:text-gray-300 mr-2"
          >
            ←
          </button>
          <span>ERD 샘플 프로젝트</span>
        </div>
      </div>

      {/* ✅ 줄 2: 옵션 영역 */}
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4 mt-2">
        {/* ERD 가져오기 */}
        <button
          onClick={onFetch}
          className="px-3 py-1.5 hover:bg-[#333] rounded border border-gray-500"
        >
          ↪ 현재 ERD에서 자동 가져오기
        </button>

        {/* 언어 선택 */}
        <div className="flex items-center gap-2">
          <span className="text-sm">언어 선택:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#1E1E2F] border border-gray-600 px-2 py-1 rounded text-sm"
          >
            <option>Python</option>
            <option>Java</option>
            <option>TypeScript</option>
            <option>C#</option>
          </select>
        </div>

        {/* 변환 타입 선택 */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="convert"
              value="class"
              checked={convertType === "class"}
              onChange={() => setConvertType("class")}
              className="mr-1"
            />
            🧱 실전용 클래스 생성
          </label>
          <ul className="text-xs text-gray-400 pl-5 list-disc">
            <li>컬럼 → 속성 + FK → 참조 객체 포함</li>
            <li>실제 코드에 바로 활용 가능</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="convert"
              value="orm"
              checked={convertType === "orm"}
              onChange={() => setConvertType("orm")}
              className="mr-1"
            />
            🧩 ORM 매핑 코드 생성
          </label>
          <ul className="text-xs text-gray-400 pl-5 list-disc">
            <li>관계 방향성 포함 (List, backref 등)</li>
            <li>ORM 프레임워크에 최적화된 구조</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CodeConvertHeaderPanel;
