import React, { useEffect, useState } from "react";
import { fetchStudyMaterialSummary, deleteStudyMaterial } from "../api/adminApi";
import { FaEllipsisV } from "react-icons/fa";

const StudyMaterialManagementPage = () => {
  const [materials, setMaterials] = useState([]);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [language, setLanguage] = useState("HTML"); // 기본 언어

  const fetchMaterials = async () => {
    try {
      const res = await fetchStudyMaterialSummary(language);
      setMaterials(res);
    } catch (err) {
      console.error("학습자료 목록 조회 실패:", err);
    }
  };

  const handleDelete = async (materialId) => {
    const confirmed = window.confirm("정말로 이 학습자료를 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      await deleteStudyMaterial(materialId);
      alert("삭제되었습니다.");
      fetchMaterials();
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류 발생");
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [language]);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = () => setDropdownOpenId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">학습자료 관리</h1>

      {/* 언어 선택 */}
      <div className="mb-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-1 border rounded"
        >
          <option value="HTML">HTML</option>
          <option value="CSS">CSS</option>
          <option value="JavaScript">JavaScript</option>
        </select>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full table-auto text-left">
          <thead className="bg-navbar text-white">
            <tr>
              <th className="px-4 py-3">제목</th>
              <th className="px-4 py-3">조회수</th>
              <th className="px-4 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => (
              <tr
                key={material.material_id}
                className="border-t hover:bg-gray-50 relative"
                onClick={(e) => e.stopPropagation()} // 드롭다운 클릭 방지
              >
                <td className="px-4 py-3">{material.title}</td>
                <td className="px-4 py-3">{material.read_count}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    className="text-gray-600 hover:text-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpenId(dropdownOpenId === material.material_id ? null : material.material_id);
                    }}
                  >
                    <FaEllipsisV />
                  </button>

                  {dropdownOpenId === material.material_id && (
                    <div className="absolute right-6 mt-2 bg-white border rounded shadow-md z-10 w-32">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-red-100 text-red-600"
                        onClick={() => handleDelete(material.material_id)}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudyMaterialManagementPage;
