import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const StudyMaterialsPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get("category");
  const materialId = queryParams.get("id");
  const exampleId = queryParams.get("exampleId");

  const [studyContent, setStudyContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!category || (!materialId && !exampleId)) {
      console.warn("🚨 category 또는 id 값이 없습니다.");
      return;
    }

    const fetchContent = async () => {
      try {
        let apiUrl = "";
        if (materialId) {
          apiUrl = `http://localhost:8000/api/materials/${encodeURIComponent(category)}/${materialId}`;
          console.log(`🛠 학습자료 API 요청: ${apiUrl}`);
        } else if (exampleId) {
          apiUrl = `http://localhost:8000/api/examples/${encodeURIComponent(category)}/${exampleId}`;
          console.log(`🛠 예제 API 요청: ${apiUrl}`);
        }

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log("✅ 응답 받은 데이터:", data);
        setStudyContent(data);
      } catch (err) {
        console.error("❌ 데이터 불러오기 실패:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [category, materialId, exampleId]);

  return (
    <div className="flex justify-center p-10">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-5xl w-full text-left">
        {loading ? (
          <div className="text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : studyContent ? (
          <>
            <h1 className="text-4xl font-bold text-gray-800">{studyContent.title}</h1>
            <p className="mt-4 text-lg text-gray-700 leading-relaxed">{studyContent.content}</p>

            {studyContent.sections && studyContent.sections.length > 0 && (
              <div className="mt-6">
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">추가 자료</h2>
                {studyContent.sections.map((section, index) => (
                  <div key={`${section.type}-${index}`} className="mt-4">
                    {section.type === "text" && <p className="text-lg text-gray-700">{section.content}</p>}

                    {section.type === "image" && (
                      <img
                        className="mt-2 w-full max-w-2xl rounded-lg shadow-md"
                        src={section.content}
                        alt="설명 이미지"
                      />
                    )}

                    {section.type === "code" && (
                      <pre className="bg-gray-100 text-sm p-4 rounded-md font-mono mt-2 border border-gray-300 overflow-x-auto">
                        {section.content}
                      </pre>
                    )}

                    {section.type === "video" && (
                      <div className="mt-4">
                        <iframe
                          className="w-full max-w-3xl rounded-md"
                          style={{ aspectRatio: "16 / 9" }}
                          src={section.content}
                          title="YouTube Video"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}

                    {section.type === "quiz" && (
                      <div className="bg-yellow-100 p-4 rounded-md mt-2 border border-yellow-500">
                        <p className="font-semibold text-lg text-yellow-900">{section.content.question}</p>
                        <ul className="list-disc pl-6 mt-1 text-gray-800">
                          {section.content.options.map((option, idx) => (
                            <li key={idx}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-500">데이터를 찾을 수 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
