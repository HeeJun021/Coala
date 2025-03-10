import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category") || "HTML";

  const [languages, setLanguages] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [studyExamples, setStudyExamples] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(initialCategory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExample, setIsExample] = useState(false); // ✅ 선언 추가

  useEffect(() => {
    setIsExample(initialCategory.startsWith("예제-")); // ✅ 이제 정상 작동
  }, [initialCategory]);
  

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch("/api/languages");
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
          console.log(`🔍 Fetching materials for language: ${selectedLanguage.toLowerCase()}`);
  
          const materialsResponse = await fetch(`/api/materials/${selectedLanguage.toLowerCase()}`);
          if (!materialsResponse.ok) throw new Error(`HTTP error! Status: ${materialsResponse.status}`);
  
          const materials = await materialsResponse.json();
          console.log(`✅ Materials loaded:`, materials);
          setStudyMaterials(materials);
  
          console.log(`🔍 Fetching examples for language: ${selectedLanguage.toLowerCase()}`);
          const examplesResponse = await fetch(`/api/examples/${selectedLanguage.toLowerCase()}`);
          if (!examplesResponse.ok) throw new Error(`HTTP error! Status: ${examplesResponse.status}`);
  
          const examples = await examplesResponse.json();
          console.log(`✅ Examples loaded:`, examples);
          setStudyExamples(examples);
        } catch (err) {
          console.error("❌ 오류 발생:", err);
          setError("학습 자료 데이터를 불러오는 중 오류 발생");
        }
      };
      fetchMaterialsAndExamples();
    }
  }, [selectedLanguage]);  
  

  const handleLanguageClick = (language) => {
    setSelectedLanguage(language);
    navigate(`/StudyMaterialsPage?category=${language}`);
  };

  return (
    <div className="absolute top-[239px] left-[33px] w-[243px] bg-white rounded-md shadow-md">
      <div className="h-[54px] flex items-center pl-6 bg-[#A7DA9B]">
        <h1 className="text-[20px] font-normal text-black">학습자료</h1>
      </div>

      {loading ? (
        <div className="h-[54px] flex items-center pl-6 text-gray-500">로딩 중...</div>
      ) : error ? (
        <div className="h-[54px] flex items-center pl-6 text-red-500">{error}</div>
      ) : (
        <>
          {languages.map((lang) => (
            <div
              key={lang.language_id}
              className={`h-[54px] flex items-center pl-6 cursor-pointer ${
                selectedLanguage === lang.language ? "bg-gray-300" : "bg-white"
              }`}
              onClick={() => handleLanguageClick(lang.language)}
            >
              {lang.language} {selectedLanguage === lang.language && ">"}
            </div>
          ))}

          {selectedLanguage && (
            <>
              <div className="pl-6 pt-2 font-bold text-lg">{selectedLanguage}</div>

              {studyMaterials.map((material) => (
                <div
                  key={material.material_id}
                  className="pl-8 cursor-pointer hover:bg-gray-100"
                  onClick={() => navigate(`/StudyMaterialsPage?category=${selectedLanguage}&content=${material.title}`)}
                >
                  {material.title}
                </div>
              ))}

              {studyExamples.length > 0 && (
                <div className="pl-6 pt-2 font-bold text-lg">{selectedLanguage} Example</div>
              )}

              {studyExamples.map((example) => (
                <div
                  key={example.example_id}
                  className="pl-8 cursor-pointer hover:bg-gray-100"
                  onClick={() => navigate(`/StudyMaterialsPage?category=${selectedLanguage}&content=${example.title}`)}
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
