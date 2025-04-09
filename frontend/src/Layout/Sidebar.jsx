import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // ✅ AuthContext에서 사용자 정보 가져오기

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // ✅ 사용자 정보
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category") || "HTML";
  const initialMaterialId = queryParams.get("id") || "";
  const initialExampleId = queryParams.get("exampleId") || "";

  const [languages, setLanguages] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [studyExamples, setStudyExamples] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(initialCategory);
  const [selectedMaterialId, setSelectedMaterialId] = useState(initialMaterialId);
  const [selectedExampleId, setSelectedExampleId] = useState(initialExampleId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await fetch("http://localhost:8000/languages");
        const data = await res.json();
        setLanguages(data);
      } catch (err) {
        console.error("🚨 언어 목록 오류:", err);
        setError("언어 데이터를 불러오는 중 오류 발생");
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    const refreshSidebar = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("refreshSidebar", refreshSidebar);
    return () => window.removeEventListener("refreshSidebar", refreshSidebar);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [materialsRes, examplesRes] = await Promise.all([
          fetch(`http://localhost:8000/api/materials/${selectedLanguage}`, {
            credentials: "include", // ✅ 로그인 사용자용
          }),
          fetch(`http://localhost:8000/api/examples/${selectedLanguage}`, {
            credentials: "include",
          }),
        ]);

        const materials = await materialsRes.json();
        const examples = await examplesRes.json();

        setStudyMaterials(Array.isArray(materials) ? materials : []);
        setStudyExamples(Array.isArray(examples) ? examples : []);
      } catch (err) {
        console.error("❌ 자료 로딩 오류:", err);
        setError("자료를 불러오는 중 오류가 발생했습니다.");
        setStudyMaterials([]);
        setStudyExamples([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedLanguage) fetchData();
  }, [selectedLanguage, user, refreshTrigger]); // ✅ user 정보 감지 포함

  const handleMaterialClick = (materialId) => {
    if (selectedMaterialId === String(materialId)) return; // ✅ 이미 선택된 항목이면 중복 이동 막기
    setSelectedMaterialId(String(materialId));
    setSelectedExampleId("");
    navigate(`/StudyMaterialsPage?category=${encodeURIComponent(selectedLanguage)}&id=${materialId}`, { replace: false });
  };
  
  const handleExampleClick = (exampleId) => {
    if (selectedExampleId === String(exampleId)) return;
    setSelectedExampleId(String(exampleId));
    setSelectedMaterialId("");
    navigate(`/StudyMaterialsPage?category=${encodeURIComponent(selectedLanguage)}&exampleId=${exampleId}`, { replace: false });
  };
  

  return (
    <div className="absolute top-[239px] left-[33px] w-[260px] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="h-[56px] flex items-center px-6 bg-[#A7DA9B] rounded-t-2xl shadow-sm">
        <h1 className="text-[18px] font-semibold text-white tracking-wide">📚 학습자료</h1>
      </div>
  
      {loading ? (
        <div className="h-[54px] flex items-center px-6 text-gray-500">로딩 중...</div>
      ) : error ? (
        <div className="h-[54px] flex items-center px-6 text-red-500">{error}</div>
      ) : (
        <>
          {!languages.length ? (
            <div className="h-[54px] flex items-center px-6 text-gray-500">언어 목록이 없습니다.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {languages.map((lang) => (
                <div
                  key={lang.language_id}
                  className={`px-6 py-3 cursor-pointer text-[15px] transition-all duration-150 ${
                    selectedLanguage === lang.language
                      ? "bg-[#88C078] text-white font-bold"
                      : "hover:bg-gray-100 text-gray-800"
                  }`}
                  onClick={() => setSelectedLanguage(lang.language)}
                >
                  {lang.language}
                </div>
              ))}
            </div>
          )}
  
          <div className="px-6 mt-4 mb-2 font-semibold text-gray-700 text-[15px]">
            📘 {selectedLanguage}
          </div>
  
          {studyMaterials.map((material) => (
            <div
              key={material.material_id}
              className={`flex items-center justify-between text-[14px] rounded-md mx-4 px-3 py-2 cursor-pointer transition-all duration-150 ${
                selectedMaterialId === String(material.material_id)
                  ? "bg-[#D9EAD3] text-black font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => handleMaterialClick(material.material_id)}
            >
              <span className="truncate">{material.title}</span>
              {material.is_completed && <span className="text-green-500 text-xs ml-2">✅</span>}
            </div>
          ))}
  
          <hr className="my-4 border-gray-200 mx-4" />
  
          <div className="px-6 mb-2 font-semibold text-gray-700 text-[15px]">
            🧪 {selectedLanguage} Example
          </div>
  
          {studyExamples.length ? (
            studyExamples.map((example) => (
              <div
                key={example.example_id}
                className={`flex items-center justify-between text-[14px] rounded-md mx-4 px-3 py-2 cursor-pointer transition-all duration-150 ${
                  selectedExampleId === String(example.example_id)
                    ? "bg-[#D9EAD3] text-black font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleExampleClick(example.example_id)}
              >
                <span className="truncate">{example.title}</span>
                {example.is_completed && <span className="text-green-500 text-xs ml-2">✅</span>}
              </div>
            ))
          ) : (
            <div className="px-6 text-gray-400 text-sm">예제가 없습니다.</div>
          )}
        </>
      )}
    </div>
  );  
};

export default Sidebar;
