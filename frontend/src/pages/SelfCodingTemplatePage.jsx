import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Layout/Navbar";

const templates = [
  { name: "HTML + CSS + JS", emoji: "🌐", description: "기본 웹 페이지용 정적 템플릿", category: "frontend", id: "vanilla" },
  { name: "React App", emoji: "⚛️", description: "모던 UI 구축용 React SPA 프로젝트", category: "frontend", id: "react" },
  { name: "Vue.js App", emoji: "🖖", description: "Vue 기반 프론트엔드 프로젝트", category: "frontend", id: "vue" },
  { name: "Next.js App", emoji: "🧭", description: "정적/SSR 웹 구축용 React 기반 프레임워크", category: "frontend", id: "next" },
  { name: "Python FastAPI", emoji: "⚡", description: "빠르고 현대적인 Python API 서버", category: "backend", id: "fastapi" },
  { name: "Python Flask", emoji: "🍶", description: "간단한 웹 서버 개발용 Flask 프레임워크", category: "backend", id: "flask" },
];

const categories = [
  { key: "all", label: "전체" },
  { key: "frontend", label: "프론트엔드" },
  { key: "backend", label: "백엔드" },
];

const SelfCodingTemplatePage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleTemplateClick = (templateId) => {
    navigate("/self-coding", { state: { templateId } });
  };

  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((tpl) => tpl.category === selectedCategory);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-col items-center bg-white" style={{ height: "calc(100vh - 70px)" }}>
        <div className="w-full max-w-7xl px-8 py-10">
          <h1 className="text-3xl font-bold mb-2">📦 템플릿 선택</h1>
          <p className="text-gray-600 mb-6">시작하고 싶은 프로젝트 유형을 선택하세요</p>

          {/* 카테고리 필터 */}
          <div className="flex gap-4 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.key}
                className={`px-4 py-2 text-sm rounded-full border transition font-medium ${
                  selectedCategory === cat.key
                    ? "bg-green-600 text-white border-green-600"
                    : "text-green-700 border-green-400 hover:bg-green-50"
                }`}
                onClick={() => setSelectedCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((tpl, idx) => (
              <div
                key={idx}
                className="group rounded-xl shadow-md hover:shadow-xl border border-gray-200 p-6 cursor-pointer transition duration-200 hover:scale-[1.02] bg-white"
                onClick={() => handleTemplateClick(tpl.id)}
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-700 text-xl">
                    {tpl.emoji}
                  </div>
                  <h2 className="ml-3 text-xl font-semibold text-gray-800 group-hover:text-green-600">
                    {tpl.name}
                  </h2>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {tpl.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfCodingTemplatePage;
