import React, { useState, useEffect, useCallback } from "react";
import ProjectDetailPanel from "./ProjectDetailPanel";
import { updateProject, getMyProjects } from "../../api/projectApi";
import { getErds } from "../../api/erd/erdApi";
import ErdListPanel from "../erd/list/ErdListPanel";

const WIDGET_TABS = [
  { key: "overview", label: "개요" },
  { key: "erd", label: "ERD 설계" },
  { key: "git", label: "GitHub" },
  { key: "docs", label: "문서" },
  { key: "chat", label: "채팅" },
  { key: "calendar", label: "캘린더" },
  { key: "memo", label: "메모" },
];

const ProjectWidgetTabs = ({ project }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [enabledTabs, setEnabledTabs] = useState(["overview"]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);
  const [erds, setErds] = useState([]);

  useEffect(() => {
    const initialTabs = ["overview"];
    const widgets = project.widgets || {};
    Object.keys(widgets).forEach((key) => {
      if (widgets[key]) initialTabs.push(key);
    });
    setEnabledTabs(initialTabs);
    setCurrentProject(project);
  }, [project]);

  const handleAddTab = async (key) => {
    if (!enabledTabs.includes(key)) {
      try {
        const updatedWidgets = { ...currentProject.widgets, [key]: true };
        await updateProject(currentProject.project_id, {
          name: currentProject.name,
          description: currentProject.description,
          widgets: updatedWidgets,
        });
        const projects = await getMyProjects();
        const updatedProject = projects.find(
          (p) => p.project_id === currentProject.project_id
        );
        setCurrentProject(updatedProject);
        const newTabs = ["overview"];
        Object.keys(updatedProject.widgets).forEach((widgetKey) => {
          if (updatedProject.widgets[widgetKey]) newTabs.push(widgetKey);
        });
        setEnabledTabs(newTabs);
        setActiveTab(key);
      } catch (err) {
        console.error("위젯 추가 실패", err);
        alert("위젯 추가에 실패했습니다.");
      }
    }
    setShowAddMenu(false);
  };

  const loadErds = useCallback(async () => {
    try {
      const res = await getErds(project.project_id);
      setErds(res);
    } catch (err) {
      console.error("ERD 목록 조회 실패", err);
    }
  }, [project.project_id]);

  useEffect(() => {
    if (project?.project_id) {
      loadErds();
    }
  }, [project, loadErds]);

  const handleUpdate = async () => {
    try {
      const projects = await getMyProjects();
      const updatedProject = projects.find(
        (p) => p.project_id === currentProject.project_id
      );
      setCurrentProject(updatedProject);
      const newTabs = ["overview"];
      Object.keys(updatedProject.widgets).forEach((widgetKey) => {
        if (updatedProject.widgets[widgetKey]) newTabs.push(widgetKey);
      });
      setEnabledTabs(newTabs);
    } catch (err) {
      console.error("프로젝트 업데이트 실패", err);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <ProjectDetailPanel
            project={currentProject}
            onUpdate={handleUpdate}
          />
        );
      case "erd":
        return (
          <ErdListPanel
            project={currentProject}
            erds={erds} // ✅ ERD 목록 전달
            onRefresh={loadErds} // ✅ 생성 후 목록 새로고침용
            onSelect={() => {}} // ✅ 필요 시 선택 핸들러
          />
        );
      default:
        return (
          <div className="p-10 text-gray-500 text-sm">
            <p>
              🚧 `{WIDGET_TABS.find((t) => t.key === activeTab)?.label}` 탭은
              준비 중입니다.
            </p>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="sticky top-[70px] z-10 bg-white border-b">
        <div className="flex items-center h-12 px-6">
          {enabledTabs.map((tab) => {
            const label = WIDGET_TABS.find((t) => t.key === tab)?.label || tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mr-4 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-blue-600"
                }`}
              >
                {label}
              </button>
            );
          })}

          <div className="relative">
            <button
              onClick={() => setShowAddMenu((prev) => !prev)}
              className="text-gray-400 hover:text-blue-500 text-lg font-bold"
            >
              ＋
            </button>

            {showAddMenu && (
              <div className="absolute left-0 top-full mt-2 bg-white border rounded shadow p-2 z-20">
                {WIDGET_TABS.filter(
                  (w) => w.key !== "overview" && !enabledTabs.includes(w.key)
                ).map((w) => (
                  <button
                    key={w.key}
                    onClick={() => handleAddTab(w.key)}
                    className="block px-3 py-1 text-sm text-left hover:bg-gray-100 w-full"
                  >
                    {w.label}
                  </button>
                ))}
                {WIDGET_TABS.filter(
                  (w) => w.key !== "overview" && !enabledTabs.includes(w.key)
                ).length === 0 && (
                  <div className="text-xs text-gray-400 px-2 py-1">
                    추가 가능한 위젯이 없습니다
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>{renderTabContent()}</div>
    </div>
  );
};

export default ProjectWidgetTabs;
