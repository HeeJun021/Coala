import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchStudyMaterialById } from "../../api/studyMaterialsApi";

const StudyMaterialsPageDetails = () => {
  const { language, id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!id) {
      console.error("❌ ID가 undefined입니다!");
      return;
    }

    fetchStudyMaterialById(language, id)
      .then((data) => {
        setData(data);
      })
      .catch((error) => console.error("❌ API 요청 실패:", error));
  }, [language, id]);

  if (!data) return <div className="text-center mt-20 text-xl">로딩 중...</div>;

  return (
      <div className="flex mt-32"> {/* ✅ Navbar와 겹치지 않도록 여백 추가 (mt-32) */}
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg flex-1"> {/* ✅ 본문 정렬 유지 */}
      {/* 제목 */}
      <h1 className="text-4xl font-bold mb-4 border-b pb-3">{data.title}</h1>
      
      {/* 작성자 정보 */}
      <div className="flex items-center text-gray-600 text-sm mb-4">
        <span>작성일: {new Date(data.created_at).toLocaleDateString()}</span>
      </div>
      
      {/* 본문 내용 */}
      <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap mb-6">
        {data.content}
      </div>
      
      {/* 파일 첨부 */}
      {data.file_url && (
        <div className="mt-6">
          <a href={data.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            파일 다운로드
          </a>
        </div>
      )}
      
      {/* 뒤로 가기 버튼 */}
      <div className="mt-8 flex justify-between">
        <button
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          onClick={() => navigate(-1)}
        >
          뒤로 가기
        </button>
      </div>
    </div>
    </div>
  );
};

export default StudyMaterialsPageDetails;
