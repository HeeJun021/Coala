import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";

const StudyMaterialsPage = () => {
  // 📌 현재 URL 정보를 가져오기 위해 useLocation() 사용
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category") || "HTML"; // 기본값을 "HTML"로 설정

  // 📌 상태(State) 관리: 현재 선택된 카테고리, API에서 받아온 데이터, 로딩 상태, 오류 상태
  const [category, setCategory] = useState(initialCategory);
  const [rows, setRows] = useState([]); // API 데이터를 저장할 상태
  const [loading, setLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState(null); // API 요청 오류 상태

  // 📌 URL 파라미터가 변경될 때 category 상태를 업데이트
  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  // 📌 API 요청을 보내 학습자료 데이터를 가져오는 useEffect
  useEffect(() => {
    // 🔹 데이터를 가져오는 비동기 함수
    const fetchData = async () => {
      setLoading(true); // 로딩 상태 시작
      setError(null); // 기존 오류 초기화

      try {
        const url = `http://localhost:8000/api/materials/${category}`;
        console.log(`📡 API 요청: ${url}`);

        // API 호출 (GET 요청)
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // 응답이 정상적이지 않으면 오류 처리
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API 요청 실패 (HTTP ${response.status}): ${errorText}`);
        }

        // JSON 데이터 변환 후 상태 업데이트
        const data = await response.json();
        console.log("📡 응답 데이터:", data);
        setRows(data);
      } catch (err) {
        console.error("🚨 API 요청 중 오류 발생:", err);
        setError(err.message); // 오류 메시지 저장
      } finally {
        setLoading(false); // 로딩 상태 종료
      }
    };

    fetchData(); // 함수 실행
  }, [category]); // 📌 category가 변경될 때마다 useEffect 실행

  return (
    <div className="flex mt-36">
      {/* 🔹 Sidebar에서 카테고리 변경 가능 */}
      <Sidebar setCategory={setCategory} />

      {/* 🔹 메인 콘텐츠 영역 */}
      <div className="ml-8 flex-1 bg-white rounded-lg shadow-lg p-0">
        <h2 className="text-3xl font-bold mb-4 mt-4 ml-6">
          학습자료 - {category}
        </h2>

        {/* 🔹 로딩, 오류, 데이터 상태에 따라 다른 UI를 렌더링 */}
        {loading ? (
          <p className="text-center text-gray-600">데이터 로딩 중...</p>
        ) : error ? (
          <p className="text-center text-red-600">오류 발생: {error}</p>
        ) : (
          <Table rows={rows} type="materials" category={category} />
        )}
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
