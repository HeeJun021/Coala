import React from "react";

const StudyMaterialsPage = () => {
    return (
        <div>
      {/* 메인 컨텐츠 */}
      <div className="flex mt-36">

        {/* 학습자료 리스트 */}
        <div className="ml-8 flex-1 bg-white rounded-lg shadow-lg p-8">
          {/* 제목 */}
          <h2 className="text-3xl font-bold mb-4">HTML</h2>

          {/* 검색바 */}
          <div className="flex items-center mb-6">
            <input
              type="text"
              placeholder="검색어를 입력해 주세요"
              className="flex-1 px-4 py-2 border border-gray-400 rounded-l-md bg-[#EFEFEF]"
            />
            <button className="bg-[#A7DA9B] px-6 py-2 text-black border border-black rounded-r-md">
              검색
            </button>
          </div>

          {/* 테이블 */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left px-4 py-2">번호</th>
                <th className="text-left px-4 py-2">제목</th>
                <th className="text-center px-4 py-2">파일</th>
                <th className="text-center px-4 py-2">등록일</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">{75 - index}</td>
                  <td className="px-4 py-2">가나다라마바사아자차카타파하</td>
                  <td className="text-center px-4 py-2">-</td>
                  <td className="text-center px-4 py-2">-</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          <div className="mt-4 flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className="px-4 py-2 border rounded hover:bg-gray-200"
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
