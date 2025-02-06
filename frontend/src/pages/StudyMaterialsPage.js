import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const StudyMaterialsPage = () => {
  const [category, setCategory] = useState("HTML");

  const type = category === "HTML" || category === "CSS" || category === "JavaScript" ? "materials" : "examples";

  return (
    <div className="flex mt-36">
      <Sidebar setCategory={setCategory} />

      {/* 메인 컨텐츠 */}
      <div className="ml-8 flex-1 bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-4">{category} 자료</h2>

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
                <td className="px-4 py-2">{index + 1}</td>
                <td className="px-4 py-2">
                  <Link
                    to={`/StudyMaterialsPage/${type}/${category}/${index + 1}`}
                    className="text-blue-500 hover:underline"
                  >
                    {category} 자료 제목 {index + 1}
                  </Link>
                </td>
                <td className="text-center px-4 py-2">-</td>
                <td className="text-center px-4 py-2">-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
