import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category") || "HTML";
  const initialMaterialId = queryParams.get("id") || "";
  const initialExampleId = queryParams.get("exampleId") || ""; // ✅ 예제 ID 추가

  const [languages, setLanguages] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [studyExamples, setStudyExamples] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(initialCategory);
  const [selectedMaterialId, setSelectedMaterialId] = useState(initialMaterialId); // ✅ 학습자료 선택 상태
  const [selectedExampleId, setSelectedExampleId] = useState(initialExampleId); // ✅ 예제 선택 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        console.log("🛠 언어 목록 API 요청 중...");
        const response = await fetch("http://localhost:8000/languages");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log("✅ 언어 목록 응답:", data);
        setLanguages(data);
      } catch (err) {
        console.error("🚨 언어 데이터를 불러오는 중 오류 발생:", err);
        setError("언어 데이터를 불러오는 중 오류 발생");
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    console.log("📌 현재 선택된 언어:", selectedLanguage);

    if (!selectedLanguage) return;

    const fetchMaterialsAndExamples = async () => {
      try {
        console.log(`🛠 ${selectedLanguage} 학습자료 및 예제 API 요청 중...`);

        const [materialsResponse, examplesResponse] = await Promise.all([
          fetch(`http://localhost:8000/api/materials/${encodeURIComponent(selectedLanguage)}`),
          fetch(`http://localhost:8000/api/examples/${encodeURIComponent(selectedLanguage)}`)
        ]);

        if (!materialsResponse.ok || !examplesResponse.ok) {
          throw new Error(`HTTP error! Materials: ${materialsResponse.status}, Examples: ${examplesResponse.status}`);
        }

        const materials = await materialsResponse.json();
        const examples = await examplesResponse.json();

        console.log(`✅ ${selectedLanguage} 학습자료 응답:`, materials);
        console.log(`✅ ${selectedLanguage} 예제 응답:`, examples);

        setStudyMaterials(materials);
        setStudyExamples(examples);
      } catch (err) {
        console.error("❌ 오류 발생:", err);
        setError("학습 자료 데이터를 불러오는 중 오류 발생");
      }
    };

    fetchMaterialsAndExamples();
  }, [selectedLanguage]);

  const handleMaterialClick = (materialId) => {
    console.log(`📌 학습자료 선택됨 (ID: ${materialId})`);
    setSelectedMaterialId(String(materialId)); // ✅ 선택된 학습자료 ID를 문자열로 변환하여 저장
    setSelectedExampleId(""); // ✅ 예제 선택 초기화
    navigate(`/StudyMaterialsPage?category=${encodeURIComponent(selectedLanguage)}&id=${materialId}`);
  };

  const handleExampleClick = (exampleId) => {
    console.log(`📌 예제 선택됨 (ID: ${exampleId})`);
    setSelectedExampleId(String(exampleId)); // ✅ 선택된 예제 ID를 문자열로 변환하여 저장
    setSelectedMaterialId(""); // ✅ 학습자료 선택 초기화
    navigate(`/StudyMaterialsPage?category=${encodeURIComponent(selectedLanguage)}&exampleId=${exampleId}`);
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
          {!languages.length ? (
            <div className="h-[54px] flex items-center pl-6 text-gray-500">언어 목록이 없습니다.</div>
          ) : (
            languages.map((lang) => (
              <div
                key={lang.language_id}
                className={`h-[54px] flex items-center pl-6 cursor-pointer transition-all
                ${selectedLanguage === lang.language ? "bg-[#A7DA9B] text-white font-bold" : "bg-white text-black"}
                hover:bg-[#88C078] hover:text-white`}
                onClick={() => setSelectedLanguage(lang.language)}
              >
                {lang.language}
              </div>
            ))
          )}

          {/* 학습자료 및 예제 출력 */}
          {selectedLanguage && (
            <>
              <div className="pl-6 pt-2 font-bold text-lg">{selectedLanguage}</div>

              {studyMaterials.map((material) => (
                <div
                  key={material.material_id}
                  className={`pl-8 text-sm cursor-pointer transition-all
                    ${selectedMaterialId === String(material.material_id) ? "bg-[#D9EAD3] text-black font-bold" : "text-gray-700"}
                    hover:bg-gray-200`}
                  onClick={() => handleMaterialClick(material.material_id)}
                >
                  {material.title}
                </div>
              ))}

              {/* 학습자료와 예제 구분선 */}
              <hr className="my-2 border-gray-300" />

              <div className="pl-6 pt-2 font-bold text-lg">{selectedLanguage} Example</div>

              {studyExamples.length ? (
                studyExamples.map((example) => (
                  <div
                    key={example.example_id}
                    className={`pl-8 text-sm cursor-pointer transition-all
                    ${selectedExampleId === String(example.example_id) ? "bg-[#D9EAD3] text-black font-bold" : "text-gray-700"}
                    hover:bg-gray-200`}
                    onClick={() => handleExampleClick(example.example_id)}
                  >
                    {example.title}
                  </div>
                ))
              ) : (
                <div className="pl-6 text-gray-500">예제가 없습니다.</div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Sidebar;
