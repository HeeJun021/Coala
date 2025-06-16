import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Library, BookOpenText, Code2, FileCheck } from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category") || "HTML";
  const initialMaterialId = queryParams.get("id") || "";
  const initialExampleId = queryParams.get("exampleId") || "";
  const sidebarRef = useRef(null);

  const [languages, setLanguages] = useState([]);
  const [materialsMap, setMaterialsMap] = useState({});
  const [examplesMap, setExamplesMap] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState(initialCategory);
  const [selectedMaterialId, setSelectedMaterialId] = useState(initialMaterialId);
  const [selectedExampleId, setSelectedExampleId] = useState(initialExampleId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredLanguage, setHoveredLanguage] = useState(null);
  const [sidebarTop, setSidebarTop] = useState(239);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setSelectedLanguage(initialCategory);
    setSelectedMaterialId(initialMaterialId);
    setSelectedExampleId(initialExampleId);
    setHoveredLanguage(initialCategory);

    let animationFrameId;

    const handleScroll = () => {
      if (isHovering) return;
      const targetTop = window.scrollY + 239;
      animationFrameId = requestAnimationFrame(() => {
        setSidebarTop((prevTop) => prevTop + (targetTop - prevTop) * 0.3);
      });
    };

    const fetchAll = async () => {
      try {
        const langRes = await fetch("http://localhost:8000/languages");
        const langData = await langRes.json();
        setLanguages(langData);

        const matMap = {};
        const exMap = {};

        for (const lang of langData) {
          const [matRes, exRes] = await Promise.all([
            fetch(`http://localhost:8000/api/materials/${lang.language}`, { credentials: "include" }),
            fetch(`http://localhost:8000/api/examples/${lang.language}`, { credentials: "include" }),
          ]);
          matMap[lang.language] = await matRes.json();
          exMap[lang.language] = await exRes.json();

          if (
            lang.language === initialCategory &&
            !initialMaterialId &&
            !initialExampleId &&
            matMap[lang.language].length > 0
          ) {
            setSelectedMaterialId(String(matMap[lang.language][0].material_id));
            navigate(`/StudyMaterialsPage?category=${encodeURIComponent(lang.language)}&id=${matMap[lang.language][0].material_id}`, { replace: true });
          }
        }

        setMaterialsMap(matMap);
        setExamplesMap(exMap);
      } catch (err) {
        console.error("❌ 전체 데이터 로딩 오류:", err);
        setError("전체 데이터를 불러오는 중 오류 발생");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovering, initialCategory, initialMaterialId, initialExampleId, navigate]);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const handleMaterialClick = (materialId, lang) => {
    if (selectedMaterialId === String(materialId)) {
  window.scrollTo({ top: 0, behavior: "smooth" });
  return;
 }
    setSelectedMaterialId(String(materialId));
    setSelectedExampleId("");
    setSelectedLanguage(lang);
    setHoveredLanguage(lang);
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/StudyMaterialsPage?category=${encodeURIComponent(lang)}&id=${materialId}`, { replace: false });
  };

  const handleExampleClick = (exampleId, lang) => {
    if (selectedExampleId === String(exampleId)) {
   window.scrollTo({ top: 0, behavior: "smooth" });
   return;
 }
    setSelectedExampleId(String(exampleId));
    setSelectedMaterialId("");
    setSelectedLanguage(lang);
    setHoveredLanguage(lang);
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/StudyMaterialsPage?category=${encodeURIComponent(lang)}&exampleId=${exampleId}`, { replace: false });
  };

  return (
    <div
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ top: `${sidebarTop}px`, transition: "top 0.1s ease-out" }}
      className="absolute left-[33px] w-[260px] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-40"
    >
      <div className="h-[56px] flex items-center px-6 bg-[#88C078] rounded-t-2xl shadow-sm">
        <Library className="w-5 h-5 text-white mr-2" />
        <h1 className="text-[18px] font-semibold text-black tracking-wide">학습자료</h1>
      </div>

      {loading ? (
        <div className="h-[54px] flex items-center px-6 text-gray-500">로딩 중...</div>
      ) : error ? (
        <div className="h-[54px] flex items-center px-6 text-red-500">{error}</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {languages.map((lang) => {
            const materials = materialsMap[lang.language] || [];
            const examples = examplesMap[lang.language] || [];
            const selectedMaterial = materials.find((m) => String(m.material_id) === selectedMaterialId);
            const selectedExample = examples.find((e) => String(e.example_id) === selectedExampleId);
            return (
              <div key={lang.language_id}
                onMouseEnter={() => setHoveredLanguage(lang.language)}
                onMouseLeave={() => setHoveredLanguage(selectedLanguage)}
              >
                <div
                  className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
                    selectedLanguage === lang.language
                      ? "bg-[#D9D9D9] text-gray-800"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                  onClick={() => {
                    setSelectedLanguage(lang.language);
                    if (materials.length > 0 && !selectedMaterialId && !selectedExampleId) {
                      handleMaterialClick(materials[0].material_id, lang.language);
                    }
                  }}
                >
                  <div className="flex flex-col">
                    <span>{lang.language}</span>
                    {selectedLanguage === lang.language && (selectedMaterial?.title || selectedExample?.title) && (
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-sm font-normal text-gray-700 break-words leading-snug">
                          {selectedMaterialId ? selectedMaterial?.title : selectedExample?.title}
                        </span>
                        {(selectedMaterial?.is_completed || selectedExample?.is_completed) && (
                          <FileCheck className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden transform origin-top ${
                    hoveredLanguage === lang.language || selectedLanguage === lang.language
                      ? "max-h-[800px] opacity-100 scale-y-100"
                      : "max-h-0 opacity-0 scale-y-95"
                  }`}
                  style={{
                    pointerEvents:
                      hoveredLanguage === lang.language || selectedLanguage === lang.language ? "auto" : "none",
                  }}
                >
                  <div className="px-6 mt-3 mb-1 font-semibold text-gray-700 text-[15px] flex items-center">
                    <BookOpenText className="w-4 h-4 mr-1 text-[#88C078]" />
                    {lang.language} 학습자료
                  </div>

                  {materials.map((material) => (
                    <div
                      key={material.material_id}
                      className={`flex items-center justify-between text-[14px] rounded-md mx-4 px-3 py-2 cursor-pointer transition-all duration-150 ${
                        selectedMaterialId === String(material.material_id)
                          ? "bg-[#D9D9D9] text-gray-800 font-semibold"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      onClick={() => handleMaterialClick(material.material_id, lang.language)}
                    >
                      <span className="break-words">{material.title}</span>
                      {material.is_completed && <FileCheck className="w-4 h-4 text-green-500 ml-2" />}
                    </div>
                  ))}

                  <div className="px-6 mt-4 mb-1 font-semibold text-gray-700 text-[15px] flex items-center">
                    <Code2 className="w-4 h-4 mr-1 text-[#88C078]" />
                    {lang.language} 예제
                  </div>

                  {examples.length ? (
                    examples.map((example) => (
                      <div
                        key={example.example_id}
                        className={`flex items-center justify-between text-[14px] rounded-md mx-4 px-3 py-2 cursor-pointer transition-all duration-150 ${
                          selectedExampleId === String(example.example_id)
                            ? "bg-[#D9D9D9] text-gray-800 font-semibold"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                        onClick={() => handleExampleClick(example.example_id, lang.language)}
                      >
                        <span className="break-words">{example.title}</span>
                        {example.is_completed && <FileCheck className="w-4 h-4 text-green-500 ml-2" />}
                      </div>
                    ))
                  ) : (
                    <div className="px-6 text-gray-400 text-sm">예제가 없습니다.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
