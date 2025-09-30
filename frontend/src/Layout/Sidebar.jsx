// Sidebar.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpenText, Code2, ChevronRight, FileCheck, ChevronDown } from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // ✅ 초기 카테고리를 기본 "HTML" 이 아닌 빈 문자열로 두어 첫 진입 시 접힘 상태 유지
  const initialCategory = queryParams.get("category") || "";
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

const [tooltip, setTooltip] = useState(null);
  
  // ✅ 호버 기반 펼침 제거, 명시적으로 여닫기 위해 openLanguage 추가
  //    null 이면 전부 접힘, 특정 언어 문자열이면 그 언어 섹션만 펼침
  const [openLanguage, setOpenLanguage] = useState(
    // URL에 category가 있으면 그 언어만 펼치고, 없으면 null(전부 접힘)
    initialCategory || null
  );

  useEffect(() => {
  setOpenLanguage(initialCategory || null); // category 없으면 전부 접힘
}, [initialCategory]);

  // 기존 스크롤 고정 로직 유지
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setSelectedLanguage(initialCategory);
    setSelectedMaterialId(initialMaterialId);
    setSelectedExampleId(initialExampleId);

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

          let materials = await matRes.json();
          let examples = await exRes.json();

          // order 정렬
          materials = materials.sort((a, b) => a.order - b.order);
          examples = examples.sort((a, b) => a.order - b.order);

          matMap[lang.language] = materials;
          exMap[lang.language] = examples;
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
    return () => {};
  }, [isHovering, initialCategory, initialMaterialId, initialExampleId, navigate]);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  // ✅ 언어 헤더 클릭: 토글 동작
  const handleLanguageHeaderClick = (lang, materials) => {
    if (openLanguage === lang) {
      // 이미 열려 있으면 접기
      setOpenLanguage(null);
      // 선택된 글은 유지 (메인 컨텐츠는 그대로, 사이드만 접힘)
      return;
    }
    // 닫혀 있던 언어 펼치기
    setOpenLanguage(lang);

    // 자동 이동/자동 선택 제거: 의도치 않은 첫 글 자동 이동 방지
    // 단, 사용자가 이미 다른 글을 보고 있다면 selectedLanguage만 동기화
    if (!selectedMaterialId && !selectedExampleId) {
      setSelectedLanguage(lang);
    }
  };

  const handleMaterialClick = (materialId, lang) => {
    if (selectedMaterialId === String(materialId)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSelectedMaterialId(String(materialId));
    setSelectedExampleId("");
    setSelectedLanguage(lang);

    // ✅ 글을 선택하면 해당 언어 섹션은 자동으로 펼쳐진 상태 유지
    setOpenLanguage(lang);

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

    // ✅ 예제를 선택해도 해당 언어 섹션은 펼침 유지
    setOpenLanguage(lang);

    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/StudyMaterialsPage?category=${encodeURIComponent(lang)}&exampleId=${exampleId}`, { replace: false });
  };

return (
  <>
  <aside
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed left-[70px] top-[120px] w-[260px] max-h-[calc(100vh-120px)] 
                 bg-white rounded-2xl shadow-lg border border-gray-200 
                 overflow-y-auto scrollbar-hide z-40"
    >
    <div className="h-[56px] flex items-center px-6 bg-[#88C078] rounded-t-2xl shadow-sm">
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

          const isOpen = openLanguage === lang.language;

          return (
            <div key={lang.language_id}>
              {/* 언어 헤더 (클릭으로 토글) */}
              <div
                className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
                  isOpen ? "bg-[#D9D9D9] text-gray-800" : "hover:bg-gray-100 text-gray-600"
                }`}
                onClick={() => handleLanguageHeaderClick(lang.language, materials)}
              >
                <div className="flex items-center justify-between">
                  {/* 왼쪽: 언어명 + 선택된 글 제목 */}
                  <div className="flex flex-col">
                    <span>{lang.language}</span>
                    {selectedLanguage === lang.language &&
                      (selectedMaterial?.title || selectedExample?.title) && (
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <span className="text-sm font-normal text-gray-700 break-words leading-snug">
                            {selectedMaterialId ? selectedMaterial?.title : selectedExample?.title}
                          </span>
                          {(selectedMaterial?.is_completed || selectedExample?.is_completed) && (
  <div
    className="ml-2"
    onMouseEnter={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 6, // 아이콘 아래 6px
      });
    }}
    onMouseLeave={() => setTooltip(null)}
  >
    <FileCheck className="w-5 h-5 text-green-500" />
  </div>
)}

                        </div>
                      )}
                  </div>

                  {/* 오른쪽: 화살표 아이콘 */}
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>

              {/* 펼침 영역 */}
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden transform origin-top ${
                  isOpen ? "max-h-[800px] opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-95"
                }`}
                style={{ pointerEvents: isOpen ? "auto" : "none" }}
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
                    {material.is_completed && (
  <div
    className="ml-2"
    onMouseEnter={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 6, // 아이콘 아래 6px
      });
    }}
    onMouseLeave={() => setTooltip(null)}
  >
    <FileCheck className="w-5 h-5 text-green-500" />
  </div>
)}

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
                      {example.is_completed && (
  <div
    className="ml-2"
    onMouseEnter={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 6, // 아이콘 아래 6px
      });
    }}
    onMouseLeave={() => setTooltip(null)}
  >
    <FileCheck className="w-5 h-5 text-green-500" />
  </div>
)}


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
  </aside>

    {/* ✅ 사이드바 바깥, return 맨 아래 */}
    {tooltip && (
      <span
        className="fixed px-2 py-1 text-xs text-white bg-gray-800 rounded z-50 whitespace-nowrap"
        style={{
          top: tooltip.y,
          left: tooltip.x,
          transform: "translateX(-50%)",
        }}
      >
        학습이 완료되었습니다.
      </span>
    )}
  </>
);
};

export default Sidebar;
