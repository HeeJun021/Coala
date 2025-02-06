import React from "react";
import { useParams } from "react-router-dom";

const StudyMaterialsPage_Details = () => {
  const { type, language, id } = useParams();

  return (
    <div className="mt-36 mx-auto max-w-4xl bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">
        {type === "examples" ? "예제" : "학습자료"}: {language} - {id}
      </h1>

      {/* 콘텐츠 영역 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold">콘텐츠 내용</h2>
        <p>여기에 데이터베이스에서 가져온 {language} 관련 {type} 내용을 렌더링합니다.</p>
      </div>

      {/* 코드 영역 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold">코드 예제</h2>
        <pre className="bg-gray-800 text-white p-4 rounded-md">
          {/* 여기에 코드 예제를 렌더링 */}
          <code>
            &lt;form&gt;
            &lt;label&gt; 아이디: &lt;/label&gt;
            &lt;input type="text" /&gt;
            &lt;/form&gt;
          </code>
        </pre>
      </div>

      {/* 이전/다음 페이지 이동 */}
      <div className="flex justify-between">
        <button className="px-4 py-2 bg-gray-200 rounded-md">이전 페이지</button>
        <button className="px-4 py-2 bg-gray-200 rounded-md">다음 페이지</button>
      </div>
    </div>
  );
};

export default StudyMaterialsPage_Details;
