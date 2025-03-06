
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Table from "../components/Table";

const StudyMaterialsPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category") || "HTML";

  const [category, setCategory] = useState(initialCategory);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExample, setIsExample] = useState(false); // ✅ 예제인지 여부 확인

  useEffect(() => {
    setCategory(initialCategory);
    setIsExample(initialCategory.startsWith("예제-")); // ✅ "예제-"로 시작하면 예제 데이터
  }, [initialCategory]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
  
      try {
        const endpoint = isExample ? "examples" : "materials";
        const formattedCategory = category.replace("예제-", ""); // ✅ "예제-" 제거
        const url = `http://localhost:8000/api/${endpoint}/${formattedCategory}`;
  
        console.log(`📡 API 요청: ${url}`);
  
        const response = await fetch(url, {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API 요청 실패 (HTTP ${response.status}): ${errorText}`);
        }
  
        const data = await response.json();
        console.log("📡 응답 데이터:", data); // ✅ 여기서 데이터 확인!
  
        // ✅ 데이터 확인을 위해 로그 추가
        setRows(data);
      } catch (err) {
        console.error("🚨 API 요청 중 오류 발생:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category, isExample]);

  return (
    <div className="flex mt-36">
      <div className="ml-8 flex-1 bg-white rounded-lg shadow-lg p-0">
        <h2 className="text-3xl font-bold mb-4 mt-4 ml-6">
          {isExample ? "학습 예제" : "학습 자료"} - {category.replace("예제-", "")}
        </h2>

        {loading ? (
          <p className="text-center text-gray-600">데이터 로딩 중...</p>
        ) : error ? (
          <p className="text-center text-red-600">오류 발생: {error}</p>
        ) : (
          <Table rows={rows} type={isExample ? "examples" : "materials"} category={category} />
        )}
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
