import React, { useState } from "react";

const Sidebar = ({ setCategory }) => {
  const [activeSection, setActiveSection] = useState("학습자료");
  const [activeSubMenu, setActiveSubMenu] = useState("HTML");

  const handleSectionClick = (section) => {
    setActiveSection(section);
    if (section === "학습자료") {
      setCategory("HTML"); // 학습자료 선택 시 기본값 HTML 설정
    } else if (section === "예제") {
      setCategory("예제-HTML"); // 예제 선택 시 기본값 예제-HTML 설정
    }
  };

  const handleSubMenuClick = (menu) => {
    setActiveSubMenu(menu);

    if (typeof setCategory === "function") {
      if (activeSection === "학습자료") {
        setCategory(menu);
      } else if (activeSection === "예제") {
        setCategory(`예제-${menu}`);
      }
    } else {
      console.error("setCategory is not a function. Check StudyMaterialsPage.");
    }
  };

  return (
    <div className="absolute top-[239px] left-[33px] w-[243px] bg-white rounded-md shadow-md">
      {/* 학습자료 섹션 */}
      <div
        className={`h-[54px] flex items-center pl-6 ${
          activeSection === "학습자료" ? "bg-[#A7DA9B]" : "bg-[#EFEFEF]"
        }`}
        onClick={() => handleSectionClick("학습자료")}
      >
        <h1
          className={`text-[20px] font-normal ${
            activeSection === "학습자료" ? "text-black" : "text-gray-600"
          }`}
        >
          학습자료
        </h1>
      </div>
      {activeSection === "학습자료" && (
        <>
          <div
            className={`h-[54px] flex items-center pl-6 ${
              activeSubMenu === "HTML" ? "bg-gray-300" : "bg-white"
            }`}
            onClick={() => handleSubMenuClick("HTML")}
          >
            HTML {activeSubMenu === "HTML" && ">"}
          </div>
          <div
            className={`h-[54px] flex items-center pl-6 ${
              activeSubMenu === "CSS" ? "bg-gray-300" : "bg-white"
            }`}
            onClick={() => handleSubMenuClick("CSS")}
          >
            CSS {activeSubMenu === "CSS" && ">"}
          </div>
          <div
            className={`h-[54px] flex items-center pl-6 ${
              activeSubMenu === "JavaScript" ? "bg-gray-300" : "bg-white"
            }`}
            onClick={() => handleSubMenuClick("JavaScript")}
          >
            JavaScript {activeSubMenu === "JavaScript" && ">"}
          </div>
        </>
      )}

      {/* 예제 섹션 */}
      <div
        className={`h-[54px] flex items-center pl-6 ${
          activeSection === "예제" ? "bg-[#A7DA9B]" : "bg-[#EFEFEF]"
        }`}
        onClick={() => handleSectionClick("예제")}
      >
        <h1
          className={`text-[20px] font-normal ${
            activeSection === "예제" ? "text-black" : "text-gray-600"
          }`}
        >
          예제
        </h1>
      </div>
      {activeSection === "예제" && (
        <>
          <div
            className={`h-[54px] flex items-center pl-6 ${
              activeSubMenu === "HTML" ? "bg-gray-300" : "bg-white"
            }`}
            onClick={() => handleSubMenuClick("HTML")}
          >
            HTML {activeSubMenu === "HTML" && ">"}
          </div>
          <div
            className={`h-[54px] flex items-center pl-6 ${
              activeSubMenu === "CSS" ? "bg-gray-300" : "bg-white"
            }`}
            onClick={() => handleSubMenuClick("CSS")}
          >
            CSS {activeSubMenu === "CSS" && ">"}
          </div>
          <div
            className={`h-[54px] flex items-center pl-6 ${
              activeSubMenu === "JavaScript" ? "bg-gray-300" : "bg-white"
            }`}
            onClick={() => handleSubMenuClick("JavaScript")}
          >
            JavaScript {activeSubMenu === "JavaScript" && ">"}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
