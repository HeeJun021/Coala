import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="absolute top-[239px] left-[33px] w-[243px] bg-white rounded-md shadow-md">
      {/* 학습자료 섹션 */}
      <div className="bg-[#A7DA9B] h-[102px] flex items-center justify-start pl-6 rounded-t-md">
        <h1 className="text-[25px] font-normal text-black">학습자료</h1>
      </div>

      {/* 메뉴 */}
      <div className="bg-[#EFEFEF] h-[54px] flex items-center pl-6">
        <Link
          to="/StudyMaterialsPage/HTML"
          className="text-[20px] font-normal text-black hover:underline"
        >
          HTML
        </Link>
      </div>
      <div className="bg-[#FFFFFF] h-[54px] flex items-center pl-6">
        <Link
          to="/StudyMaterialsPage/CSS"
          className="text-[20px] font-normal text-black hover:underline"
        >
          CSS
        </Link>
      </div>
      <div className="bg-[#FFFFFF] h-[54px] flex items-center pl-6">
        <Link
          to="/StudyMaterialsPage/JAVASCRIPT"
          className="text-[20px] font-normal text-black hover:underline"
        >
          JAVASCRIPT
        </Link>
      </div>

      {/* 강의영상 */}
      <div className="bg-[#959595] h-[68px] flex items-center pl-6">
        <Link
          to="/StudyMaterialsPage/Videos"
          className="text-[25px] font-normal text-white hover:underline"
        >
          강의영상
        </Link>
      </div>

      {/* 예제 */}
      <div className="bg-[#959595] h-[68px] flex items-center pl-6 rounded-b-md">
        <Link
          to="/StudyMaterialsPage/Examples"
          className="text-[25px] font-normal text-white hover:underline"
        >
          예제
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
