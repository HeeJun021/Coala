import React, { useState, useEffect, useMemo } from "react";
import ProjectCreateModal from "./ProjectCreateModal";
import { getMyProjects } from "../../api/projectApi";
import { LayoutDashboard, ListTodo, Inbox, Plus } from "lucide-react";
import ProjectGuideModal from "./ProjectGuideModal";
import { HelpCircle } from "lucide-react";

const ProjectSidebar = ({
  activeTab,
  setActiveTab,
  onProjectSelect,
  selectedProjectId,
  onUpdate,
  onNameChange,
}) => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingProjectId, setViewingProjectId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showDot, setShowDot] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("project_guide_seen");
    setShowDot(seen !== "true");
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await getMyProjects();
      // ✅ 응답 정규화: 배열이 아닐 경우 대비
      const list = Array.isArray(res) ? res : (res?.projects ?? []);
      setProjects(list || []);
    } catch (err) {
      console.error("프로젝트 목록 가져오기 실패", err);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // ✅ 탈퇴/종료 직후 즉시 새로고침 이벤트 수신
  useEffect(() => {
    const onProjectsRefresh = () => {
      setViewingProjectId(null);
      fetchProjects();
    };
    window.addEventListener("projects:refresh", onProjectsRefresh);
    return () => window.removeEventListener("projects:refresh", onProjectsRefresh);
  }, []);

  const handleOpenGuide = () => {
    setShowGuide(true);
    setShowDot(false);
    localStorage.setItem("project_guide_seen", "true");
  };

  const handleTabClick = (tabName) => {
    setViewingProjectId(null);
    if (typeof setActiveTab === "function") setActiveTab(tabName);
  };

  const handleProjectClick = (projectId) => {
    onProjectSelect?.(projectId);
    setViewingProjectId(projectId);
  };

  const handleProjectCreated = async (newProject) => {
    // ✅ 로컬 push 대신 서버에서 다시 가져와 일관성 보장
    setIsModalOpen(false);
    await fetchProjects();
    if (newProject?.project_id) onProjectSelect?.(newProject.project_id);
    onUpdate?.();
  };

  const isSelected = (pid) =>
    String(selectedProjectId) === String(pid) || viewingProjectId === pid;

  // ✅ 진행/종료 분리 (is_closed가 undefined여도 안전)
  const { activeProjects, closedProjects } = useMemo(() => {
    const act = [];
    const cls = [];
    for (const p of projects || []) {
      if (p?.is_closed) cls.push(p);
      else act.push(p);
    }
    return { activeProjects: act, closedProjects: cls };
  }, [projects]);

  return (
    <aside className="w-64 bg-white text-gray-800 flex flex-col px-4 py-6 border-r border-gray-200 shadow-sm">
      {/* 섹션: 작업 메뉴 */}
      <div className="space-y-3 mb-5">
   <div className="text-gray-700 uppercase tracking-wide text-[16px] font-semibold mb-2">내 활동</div>

        {/* 대시보드 */}
        <div
          onClick={() => handleTabClick("dashboard")}
          className={`flex items-center gap-2 text-left px-2 py-1.5 rounded cursor-pointer transition text-[15px] ${
     activeTab === "dashboard"
       ? "bg-gray-200 font-semibold text-black"
       : "text-gray-800 hover:text-black font-medium"
   }`}
        >
          <LayoutDashboard size={18} className="text-yellow-500" />
          <span className="leading-none">대시보드</span>
        </div>

        {/* 내 작업 */}
        <div
          onClick={() => handleTabClick("my-tasks")}
          className={`flex items-center gap-2 text-left px-2 py-1.5 rounded cursor-pointer transition text-[15px] ${
            activeTab === "my-tasks"
              ? "bg-gray-200 font-semibold text-black"
              : "text-gray-800 hover:text-black font-medium"
          }`}
        >
          <ListTodo size={18} className="text-emerald-500" />
          <span className="leading-none">내 작업</span>
        </div>

        {/* 수신함 */}
        <div
          onClick={() => handleTabClick("inbox")}
          className={`flex items-center gap-2 text-left px-2 py-1.5 rounded cursor-pointer transition text-[15px] ${
            activeTab === "inbox"
              ? "bg-gray-200 font-semibold text-black"
              : "text-gray-800 hover:text-black font-medium"
          }`}
        >
          <Inbox size={18} className="text-blue-500" />
          <span className="leading-none">수신함</span>
        </div>
      </div>

      <hr className="my-2 border-gray-300" />

      {/* 섹션: 프로젝트 목록 */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-gray-700 uppercase tracking-wide text-[16px] font-semibold mb-2">
            {/* 왼쪽: 프로젝트 + 가이드 버튼 */}
            <div className="flex items-center gap-1">
              <span>프로젝트</span>
              <button
                onClick={handleOpenGuide}
                className="relative text-green-600 hover:text-green-700 transition"
                title="프로젝트 가이드"
              >
                <HelpCircle size={18} className="text-gray-500" />
                {showDot && (
                  <span className="absolute -top-[2px] -right-[8px] w-2 h-2 bg-rose-500 rounded-full shadow" />
                )}
              </button>
            </div>

            {/* 오른쪽: + 버튼 */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-gray-700 hover:text-blue-500"
              title="새 프로젝트 생성"
            >
              <Plus size={18} />
            </button>
          </div>

          {Array.isArray(projects) && projects.length > 0 ? (
            <>
              {/* 진행 중 프로젝트 */}
              <div className="space-y-1 mb-2">
                {activeProjects.map((p) => (
                  <button
                    key={p.project_id}
                    onClick={() => handleProjectClick(p.project_id)}
                    className={`text-left block w-full px-2 py-1 rounded transition ${
                      isSelected(p.project_id)
                        ? "bg-gray-200 font-medium text-black"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
                {activeProjects.length === 0 && (
                  <p className="text-xs text-gray-400 italic px-2 py-1">
                    진행 중인 프로젝트 없음
                  </p>
                )}
              </div>

              {/* ──────── 빗금(점선) 구분선 ──────── */}
              <hr className="my-2 border-gray-300 border-dashed" />

              {/* 종료된 프로젝트 */}
              <div>
                <div className="px-2 py-1 text-[12px] font-semibold text-gray-500">
                  종료된 프로젝트
                </div>
                <div className="space-y-1">
                  {closedProjects.map((p) => (
                    <button
                      key={p.project_id}
                      onClick={() => handleProjectClick(p.project_id)}
                      className={`text-left block w-full px-2 py-1 rounded transition ${
                        isSelected(p.project_id)
                          ? "bg-gray-100 font-medium text-gray-700"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                      title="읽기 전용"
                    >
                      {p.name}
                    </button>
                  ))}
                  {closedProjects.length === 0 && (
                    <p className="text-xs text-gray-400 italic px-2 py-1">
                      종료된 프로젝트 없음
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 italic">등록된 프로젝트 없음</p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ProjectCreateModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleProjectCreated}
        />
      )}
      {showGuide && (
        <ProjectGuideModal
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
        />
      )}
    </aside>
  );
};

export default ProjectSidebar;
