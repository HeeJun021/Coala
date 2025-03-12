import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const StudyMaterialsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const selectedContent = queryParams.get("content");
  const selectedCategory = queryParams.get("category") || "HTML";

  const [contentData, setContentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ 첫 번째 학습자료/예제 선택 여부 추적 (불필요한 재렌더링 방지)
  const isFirstLoad = useRef(true);

  // ✅ 학습자료 & 예제 목록 가져오기
  useEffect(() => {
    const fetchMaterialsAndExamples = async () => {
      try {
        const materialsResponse = await fetch(`http://localhost:8000/api/materials/${selectedCategory}`);
        const examplesResponse = await fetch(`http://localhost:8000/api/examples/${selectedCategory}`);

        if (!materialsResponse.ok || !examplesResponse.ok) {
          throw new Error("데이터를 불러올 수 없습니다.");
        }

        const materialsData = await materialsResponse.json();
        const examplesData = await examplesResponse.json();

        // ✅ 첫 진입 시, 자동으로 첫 번째 컨텐츠 선택
        if (isFirstLoad.current && !selectedContent) {
          if (materialsData.length > 0) {
            navigate(`/StudyMaterialsPage?category=${selectedCategory}&content=${materialsData[0].title}`);
          } else if (examplesData.length > 0) {
            navigate(`/StudyMaterialsPage?category=${selectedCategory}&content=${examplesData[0].title}`);
          }
          isFirstLoad.current = false; // ✅ 첫 로드 이후 false로 변경
        }
      } catch (err) {
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchMaterialsAndExamples();
  }, [selectedCategory, navigate, selectedContent]);

  // ✅ 선택한 컨텐츠 가져오기
  useEffect(() => {
    if (!selectedContent) return;

    const fetchContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const isExample = selectedContent.includes("예제");
        const endpoint = isExample ? "examples" : "materials";
        const url = `http://localhost:8000/api/${endpoint}/${selectedCategory}/${selectedContent}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("선택한 컨텐츠를 불러올 수 없습니다.");

        const data = await response.json();
        setContentData(data);
      } catch (err) {
        setError("선택한 컨텐츠를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [selectedContent, selectedCategory]);

  return (
    <div className="flex mt-36">
      <div className="ml-8 flex-1 bg-white rounded-lg shadow-lg p-6">
        {/* 제목 */}
        <h2 className="text-3xl font-bold mb-4 border-b pb-3">
          {selectedContent ? selectedContent : "학습 자료를 선택하세요"}
        </h2>

        {/* 로딩 상태 */}
        {loading && <p className="text-center text-gray-600">로딩 중...</p>}
        
        {/* 오류 메시지 */}
        {error && <p className="text-center text-red-600">{error}</p>}
        
        {/* 컨텐츠 출력 */}
        {contentData && (
          <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
            {contentData.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
