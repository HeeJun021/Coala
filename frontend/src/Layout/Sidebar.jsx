import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate(); // ✅ 페이지 이동을 위한 `useNavigate` 훅
  const location = useLocation(); // ✅ 현재 URL 정보를 가져오는 `useLocation` 훅

  // ✅ 현재 URL에서 'category' 파라미터 가져오기
  const queryParams = new URLSearchParams(location.search);
  const currentCategory = queryParams.get("category") || "HTML"; // 기본값: "HTML"
  const isExample = currentCategory.startsWith("예제"); // "예제-"로 시작하면 예제 카테고리
  const initialSection = isExample ? "예제" : "학습자료"; // 기본적으로 예제인지 학습자료인지 확인

  // ✅ 상태(State) 정의
  const [activeSection, setActiveSection] = useState(initialSection); // "학습자료" 또는 "예제"
  const [activeSubMenu, setActiveSubMenu] = useState(currentCategory); // 현재 선택된 카테고리 (HTML, CSS, JavaScript 등)

  // ✅ 컴포넌트가 처음 마운트되었을 때 URL에 맞춰서 상태 설정
  useEffect(() => {
    if (!activeSubMenu) {
      setActiveSubMenu(currentCategory);
      setActiveSection(initialSection);
    }
  }, [currentCategory, initialSection, activeSubMenu]);

  // ✅ "학습자료" 또는 "예제" 버튼 클릭 시 호출되는 함수
  const handleSectionClick = (section) => {
    setActiveSection(section);
    const defaultCategory = section === "학습자료" ? "HTML" : "예제-HTML"; // 학습자료: HTML / 예제: 예제-HTML
    setActiveSubMenu(defaultCategory.replace("예제-", "")); // "예제-" 제거하여 상태 업데이트
    navigate(`/StudyMaterialsPage?category=${defaultCategory}`); // ✅ URL 변경하여 페이지 이동
  };

  // ✅ 서브메뉴 (HTML, CSS, JavaScript) 클릭 시 호출되는 함수
  const handleSubMenuClick = (menu) => {
    const newCategory = activeSection === "예제" ? `예제-${menu}` : menu; // 예제라면 "예제-" 붙이기
    setActiveSubMenu(newCategory); // 상태 업데이트
    navigate(`/StudyMaterialsPage?category=${newCategory}`); // ✅ URL 변경하여 페이지 이동
  };

  return (
    <div className="absolute top-[239px] left-[33px] w-[243px] bg-white rounded-md shadow-md">
      {/* ✅ 학습자료 섹션 */}
      <div
        className={`h-[54px] flex items-center pl-6 cursor-pointer ${
          activeSection === "학습자료" ? "bg-[#A7DA9B]" : "bg-[#EFEFEF]"
        }`}
        onClick={() => handleSectionClick("학습자료")}
      >
        <h1 className={`text-[20px] font-normal ${activeSection === "학습자료" ? "text-black" : "text-gray-600"}`}>
          학습자료
        </h1>
      </div>

      {/* ✅ 학습자료 카테고리 (HTML, CSS, JavaScript) */}
      {activeSection === "학습자료" && (
        <>
          {["HTML", "CSS", "JavaScript"].map((menu) => (
            <div
              key={menu}
              className={`h-[54px] flex items-center pl-6 cursor-pointer ${
                activeSubMenu === menu ? "bg-gray-300" : "bg-white"
              }`}
              onClick={() => handleSubMenuClick(menu)}
            >
              {menu} {activeSubMenu === menu && ">"}
            </div>
          ))}
        </>
      )}

      {/* ✅ 예제 섹션 */}
      <div
        className={`h-[54px] flex items-center pl-6 cursor-pointer ${
          activeSection === "예제" ? "bg-[#A7DA9B]" : "bg-[#EFEFEF]"
        }`}
        onClick={() => handleSectionClick("예제")}
      >
        <h1 className={`text-[20px] font-normal ${activeSection === "예제" ? "text-black" : "text-gray-600"}`}>
          예제
        </h1>
      </div>

      {/* ✅ 예제 카테고리 (HTML, CSS, JavaScript) */}
      {activeSection === "예제" && (
        <>
          {["HTML", "CSS", "JavaScript"].map((menu) => (
            <div
              key={menu}
              className={`h-[54px] flex items-center pl-6 cursor-pointer ${
                activeSubMenu === `예제-${menu}` ? "bg-gray-300" : "bg-white"
              }`}
              onClick={() => handleSubMenuClick(menu)}
            >
              {menu} {activeSubMenu === `예제-${menu}` && ">"}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default Sidebar;
