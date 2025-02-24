import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const StudyMaterialsPageDetails = () => {
  // ✅ URL 파라미터 가져오기
  const { type, language, id } = useParams(); // type(예제/자료), language(언어), id(자료 ID)
  const navigate = useNavigate(); // 페이지 이동을 위한 useNavigate()
  const [data, setData] = useState(null); // 선택된 학습자료를 저장할 상태

  // ✅ API 호출하여 해당 ID의 학습자료/예제 데이터 가져오기
  useEffect(() => {
    fetch(`http://localhost:8000/api/${type}/${language}`)
      .then((response) => response.json())
      .then((data) => {
        // 해당 ID의 자료를 찾아서 상태에 저장
        const selectedData = data.find((item) => item.material_id === id || item.example_id === id);
        setData(selectedData);
      })
      .catch((error) => console.error("Error fetching details:", error));
  }, [type, language, id]); // type, language, id가 변경될 때마다 API 호출

  // ✅ 사이드바에서 클릭할 때 페이지 이동이 되도록 설정
  const handleCategoryChange = (newCategory) => {
    if (newCategory.startsWith("예제")) {
      // 예제라면 예제 경로로 이동
      navigate(`/StudyMaterialsPage/examples/${newCategory.replace("예제-", "")}/1`);
    } else {
      // 학습자료라면 학습자료 경로로 이동
      navigate(`/StudyMaterialsPage/materials/${newCategory}/1`);
    }
  };

  return (
    <div className="flex mt-36">
      {/* ✅ Sidebar를 통해 다른 카테고리로 이동 가능 */}
      <Sidebar setCategory={handleCategoryChange} />

      {/* ✅ 상세 페이지 내용 */}
      <div className="flex-1 bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">
          {type === "examples" ? "예제" : "학습자료"}: {language} - {id}
        </h1>

        {/* ✅ 콘텐츠 영역 */}
        {data ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold">{data.title}</h2>
              <p>{data.content}</p>
            </div>

            {/* ✅ 코드 예제 영역 (예제인 경우 표시) */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold">코드 예제</h2>
              <pre className="bg-gray-800 text-white p-4 rounded-md">
                <code>{data.content}</code>
              </pre>
            </div>
          </>
        ) : (
          <p>로딩 중...</p>
        )}

        {/* ✅ 이전/다음 페이지 이동 버튼 */}
        <div className="flex justify-between">
          <button className="px-4 py-2 bg-gray-200 rounded-md">이전 페이지</button>
          <button className="px-4 py-2 bg-gray-200 rounded-md">다음 페이지</button>
        </div>
      </div>
    </div>
  );
};

export default StudyMaterialsPageDetails;
