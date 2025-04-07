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
    setSelectedMaterialId(String(materialId));
    setSelectedExampleId("");
    navigate(`/StudyMaterialsPage?category=${encodeURIComponent(selectedLanguage)}&id=${materialId}`);
  };

  const handleExampleClick = (exampleId) => {
    setSelectedExampleId(String(exampleId));
    setSelectedMaterialId("");
    navigate(`/StudyMaterialsPage?category=${encodeURIComponent(selectedLanguage)}&exampleId=${exampleId}`);
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
          {!languages.length ? (
            <div className="h-[54px] flex items-center pl-6 text-gray-500">언어 목록이 없습니다.</div>
          ) : (
            languages.map((lang) => (
              <div
                key={lang.language_id}
                className={`h-[54px] flex items-center pl-6 cursor-pointer transition-all ${
                  selectedLanguage === lang.language ? "bg-[#A7DA9B] text-white font-bold" : "bg-white text-black"
                } hover:bg-[#88C078] hover:text-white`}
                onClick={() => setSelectedLanguage(lang.language)}
              >
                {lang.language}
              </div>
            ))
          )}

          <div className="pl-6 pt-2 font-bold text-lg">{selectedLanguage}</div>

          {studyMaterials.map((material) => (
            <div
              key={material.material_id}
              className={`pl-8 text-sm cursor-pointer transition-all flex justify-between pr-4 ${
                selectedMaterialId === String(material.material_id)
                  ? "bg-[#D9EAD3] text-black font-bold"
                  : "text-gray-700"
              } hover:bg-gray-200`}
              onClick={() => handleMaterialClick(material.material_id)}
            >
              <div className="flex items-center gap-2">
                <span>{material.title}</span>
                {material.is_completed && <span className="text-green-500">✅</span>}
              </div>
            </div>
          ))}

          <hr className="my-2 border-gray-300" />

          <div className="pl-6 pt-2 font-bold text-lg">{selectedLanguage} Example</div>

          {studyExamples.length ? (
            studyExamples.map((example) => (
              <div
                key={example.example_id}
                className={`pl-8 text-sm cursor-pointer transition-all flex justify-between pr-4 ${
                  selectedExampleId === String(example.example_id)
                    ? "bg-[#D9EAD3] text-black font-bold"
                    : "text-gray-700"
                } hover:bg-gray-200`}
                onClick={() => handleExampleClick(example.example_id)}
              >
                <div className="flex items-center gap-2">
                  <span>{example.title}</span>
                  {example.is_completed && <span className="text-green-500">✅</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="pl-6 text-gray-500">예제가 없습니다.</div>
          )}
        </>
      )}
    </div>
  );
};

export default Sidebar;
