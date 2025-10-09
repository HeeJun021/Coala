// frontend/src/components/erd/list/ErdListPanel.jsx
import React, { useState, useMemo } from "react";
import ErdCard from "./ErdCard";
import CreateErdModal from "./CreateErdModal";
import { createErd } from "../../../api/erd/erdApi";
import { FolderPlus, GitBranch, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ErdListPanel = ({ erds, onSelect, onRefresh, project }) => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("latest");

  const projectId = project?.project_id;

  // 🔹 필터 + 정렬 적용
  const filteredErds = useMemo(() => {
    if (!erds) return [];
    let list = [...erds];

    // 검색 필터
    if (searchTerm.trim()) {
      list = list.filter((e) =>
        e.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 정렬
    if (sortOption === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.reverse(); // 최신순
    }

    return list;
  }, [erds, searchTerm, sortOption]);

  const handleCreate = async (data) => {
    if (!projectId) {
      alert("project_id를 찾을 수 없습니다.");
      return;
    }

    try {
      await createErd(projectId, data);
      setShowCreateModal(false);
      onRefresh?.();
    } catch (error) {
      alert("ERD 생성 실패");
      console.error(error);
    }
  };

  return (
    <div className="w-full">
      {/* 🔹 헤더 */}
      <h2 className="text-xl font-bold mt-4 mb-4 flex items-center gap-2 pl-8">
        <GitBranch size={20} className="text-gray-700" /> ERD 관리
      </h2>

      {/* 🔹 검색 + 정렬 바 */}
      <div className="border-t pt-4 px-8 flex items-center justify-between mb-2">
        {/* 검색창 */}
        <div className="relative w-[400px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ERD 제목 검색..."
            className="w-full pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
          />
          {searchTerm && (
            <X
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
              size={18}
              onClick={() => setSearchTerm("")}
            />
          )}
        </div>

        {/* 정렬 옵션 */}
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        >
          <option value="latest">최신순</option>
          <option value="title">ㄱㄴㄷ순</option>
        </select>
      </div>

      {/* 🔹 ERD 카드 리스트 */}
    
        {filteredErds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-600">
            <p className="text-xl font-medium mb-4">
              아직 생성된 ERD가 없습니다.
              <br />
              새로운 ERD를 추가해보세요!
            </p>
            <div
              onClick={() => setShowCreateModal(true)}
              className="w-[340px] h-[200px] border border-dashed border-gray-400 rounded-2xl flex flex-col justify-center items-center text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
            >
              <FolderPlus className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">새 ERD 만들기</span>
            </div>
          </div>
        ) : (
          <div className="p-6 flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredErds.map((erd) => (
                <ErdCard
                  key={erd.erd_id}
                  erd={erd}
                  onSelect={() => navigate(`/erd/${erd.erd_id}/${projectId}`)}
                  onDelete={onRefresh}
                  project={project}
                />
              ))}

              {/* 새 ERD 만들기 카드 */}
              <div
                onClick={() => setShowCreateModal(true)}
                className="w-[340px] h-[200px] border border-dashed border-gray-400 rounded-2xl flex flex-col justify-center items-center text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
              >
                <FolderPlus className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">새 ERD 만들기</span>
              </div>
            </div>
          </div>
        )}
    

      {/* 🔹 ERD 생성 모달 */}
      {showCreateModal && (
        <CreateErdModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

export default ErdListPanel;
