import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category") || "HTML";
  const selectedContent = queryParams.get("content") || ""; // ✅ 현재 선택된 컨텐츠

  const [languages, setLanguages] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [studyExamples, setStudyExamples] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(initialCategory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch("http://localhost:8000/languages");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setLanguages(data);
      } catch (err) {
        setError("언어 데이터를 불러오는 중 오류 발생");
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      const fetchMaterialsAndExamples = async () => {
        try {
          const materialsResponse = await fetch(`http://localhost:8000/api/materials/${selectedLanguage}`);
          if (!materialsResponse.ok) throw new Error(`HTTP error! Status: ${materialsResponse.status}`);
          const materials = await materialsResponse.json();
          setStudyMaterials(materials);

          const examplesResponse = await fetch(`http://localhost:8000/api/examples/${selectedLanguage}`);
          if (!examplesResponse.ok) throw new Error(`HTTP error! Status: ${examplesResponse.status}`);
          const examples = await examplesResponse.json();
          setStudyExamples(examples);
        } catch (err) {
          console.error("❌ 오류 발생:", err);
          setError("학습 자료 데이터를 불러오는 중 오류 발생");
        }
      };
      fetchMaterialsAndExamples();
    }
  }, [selectedLanguage]);

  const handleMaterialClick = (materialTitle) => {
    navigate(`/StudyMaterialsPage?category=${selectedLanguage}&content=${materialTitle}`);
  };

  const handleExampleClick = (exampleTitle) => {
    navigate(`/StudyMaterialsPage?category=${selectedLanguage}&content=${exampleTitle}`);
  };

  return (
    <div className="absolute top-[239px] left-[33px] w-[243px] bg-white rounded-md shadow-md">
      {/* 사이드바 헤더 */}
      <div className="h-[54px] flex items-center pl-6 bg-[#A7DA9B]">
        <h1 className="text-[20px] font-normal text-black">학습자료</h1>
      </div>

      {loading ? (
        <div className="h-[54px] flex items-center pl-6 text-gray-500">로딩 중...</div>
      ) : error ? (
        <div className="h-[54px] flex items-center pl-6 text-red-500">{error}</div>
      ) : (
        <>
          {/* 언어 목록 (HTML, CSS, JavaScript 등) */}
          {languages.map((lang) => (
            <div
              key={lang.language_id}
              className={`h-[54px] flex items-center pl-6 cursor-pointer transition-all
                ${selectedLanguage === lang.language ? "bg-[#A7DA9B] text-white font-bold" : "bg-white text-black"}
                hover:bg-[#88C078] hover:text-white`}
              onClick={() => setSelectedLanguage(lang.language)}
            >
              {lang.language}
            </div>
          ))}

          {/* 학습자료 및 예제 출력 */}
          {selectedLanguage && (
            <>
              <div className="pl-6 pt-2 font-bold text-lg">{selectedLanguage}</div>

              {studyMaterials.map((material) => (
                <div
                  key={material.material_id}
                  className={`pl-8 text-sm cursor-pointer transition-all
                    ${selectedContent === material.title ? "bg-[#D9EAD3] text-black font-bold" : "text-gray-700"}
                    hover:bg-gray-200`}
                  onClick={() => handleMaterialClick(material.title)}
                >
                  {material.title}
                </div>
              ))}

              {/* 학습자료와 예제 구분선 */}
              <hr className="my-2 border-gray-300" />

              <div className="pl-6 pt-2 font-bold text-lg">{selectedLanguage} Example</div>

              {studyExamples.map((example) => (
                <div
                  key={example.example_id}
                  className={`pl-8 text-sm cursor-pointer transition-all
                    ${selectedContent === example.title ? "bg-[#D9EAD3] text-black font-bold" : "text-gray-700"}
                    hover:bg-gray-200`}
                  onClick={() => handleExampleClick(example.title)}
                >
                  {example.title}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Sidebar;
