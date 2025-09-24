import React, { useState, useEffect, useRef, useCallback } from "react";
import ProjectDetailPanel from "./ProjectDetailPanel";
import TaskCalendarView from "./TaskCalendarView";
import ProjectTasksTab from "./ProjectTasksTab";
import TimelineWidget from "./TimelineWidget";
import { updateProject } from "../../api/projectApi";
import { useLocation } from "react-router-dom";
import { getErds } from "../../api/erd/erdApi";
import { getMyTasks } from "../../api/taskApi";
// ▼▼▼ [추가] getRepoInfo API 임포트 ▼▼▼
import { getRepoInfo } from "../../api/project_gitApi";
import ErdListPanel from "../erd/list/ErdListPanel";
import DocsListPanel from "./DocsListPanel";
import TemplatesListPanel from "./TemplatesListPanel";
import CodeEditorPanel from "./CodeEditorPanel";
import GitHubPanel from "./GitHubPanel";

const WIDGET_TABS = [
  { key: "overview", label: "개요" },
  { key: "erd", label: "ERD 설계" },
  { key: "git", label: "GitHub" },
  { key: "docs", label: "문서" },
  { key: "calendar", label: "캘린더" },
  { key: "tasks", label: "작업" },
  { key: "timeline", label: "타임라인" },
  { key: "templates", label: "템플릿" },
  { key: "code_editor", label: "코드 에디터" },
];

const ProjectWidgetTabs = ({ project, onNameChange, currentUser, defaultTab = "overview" }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [enabledTabs, setEnabledTabs] = useState(["overview", "erd"]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);
  const [erds, setErds] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [draggedTab, setDraggedTab] = useState(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const addMenuRef = useRef(null);

  // ▼▼▼ [추가] 현재 선택된 브랜치를 관리하는 상태 ▼▼▼
  const [currentBranch, setCurrentBranch] = useState(null);

  useEffect(() => {
    const initialTab = location.state?.subTab || defaultTab;
    setActiveTab(initialTab);
  }, [location.state, defaultTab]);

  useEffect(() => {
    if (!project) return;
    const widgets = project.widgets || { erd: true };
    const widgetOrder = project.widget_order || ["overview", "erd"];
    const orderedTabs = ["overview"];
    widgetOrder.forEach((key) => {
      if (key !== "overview" && widgets[key]) {
        orderedTabs.push(key);
      }
    });
    if (!orderedTabs.includes("erd")) {
      orderedTabs.push("erd");
    }
    setEnabledTabs(orderedTabs);
    setCurrentProject(project);
    
    

    // ▼▼▼ [추가] 프로젝트가 바뀔 때마다 기본 브랜치를 가져와서 상태 초기화 ▼▼▼
    const fetchInitialBranch = async () => {
      if (project?.project_id) {
        try {
          const info = await getRepoInfo(project.project_id);
          setCurrentBranch(info.default_branch || "main");
        } catch (error) {
          console.log("초기 브랜치 정보 로드 실패 (레포 미연결일 수 있음)");
          setCurrentBranch(null);
        }
      }
    };
    fetchInitialBranch();
  }, [project]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddTab = useCallback(async (key) => {
    if (enabledTabs.includes(key)) return;
    try {
      const updatedWidgets = { ...currentProject.widgets, [key]: true, erd: true };
      const updatedOrder = [...enabledTabs, key];
      await updateProject(currentProject.project_id, {
        name: currentProject.name,
        description: currentProject.description,
        widgets: updatedWidgets,
        widget_order: updatedOrder,
      });
      setEnabledTabs(updatedOrder);
      setCurrentProject((prev) => ({
        ...prev,
        widgets: updatedWidgets,
        widget_order: updatedOrder,
      }));
    } catch (err) {
      console.error("위젯 추가 실패", err);
      alert("위젯 추가에 실패했습니다.");
    }
    setShowAddMenu(false);
  }, [currentProject, enabledTabs]);

  const handleDragStart = (e, tab) => {
    if (tab === "overview" || tab === "erd") return;
    setDraggedTab(tab);
    e.dataTransfer.setData("text/plain", tab);
  };

  const handleDrop = async (e, targetTab) => {
    e.preventDefault();
    if (draggedTab && targetTab !== "overview" && draggedTab !== targetTab) {
      const newTabs = [...enabledTabs];
      const draggedIndex = newTabs.indexOf(draggedTab);
      const targetIndex = newTabs.indexOf(targetTab);
      newTabs.splice(draggedIndex, 1);
      newTabs.splice(targetIndex, 0, draggedTab);

      try {
        await updateProject(currentProject.project_id, {
          name: currentProject.name,
          description: currentProject.description,
          widgets: currentProject.widgets,
          widget_order: newTabs,
        });
        setEnabledTabs(newTabs);
        setCurrentProject((prev) => ({
          ...prev,
          widget_order: newTabs,
        }));
      } catch (err) {
        console.error("위젯 순서 변경 실패", err);
        alert("위젯 순서 변경에 실패했습니다.");
      }
    }
    setDraggedTab(null);
  };

  const handleDragOverTrash = (e) => {
    e.preventDefault();
    setIsOverTrash(true);
  };

  const handleDropTrash = async () => {
    if (!draggedTab || draggedTab === "overview" || draggedTab === "erd") return;
    const newTabs = enabledTabs.filter((tab) => tab !== draggedTab);
    const updatedWidgets = { ...currentProject.widgets, [draggedTab]: false };

    try {
      await updateProject(currentProject.project_id, {
        name: currentProject.name,
        description: currentProject.description,
        widgets: updatedWidgets,
        widget_order: newTabs,
      });
      setEnabledTabs(newTabs);
      setCurrentProject((prev) => ({
        ...prev,
        widgets: updatedWidgets,
        widget_order: newTabs,
      }));
      if (activeTab === draggedTab) {
        setActiveTab("overview");
      }
    } catch (err) {
      console.error("위젯 삭제 실패", err);
      alert("위젯 삭제에 실패했습니다.");
    }
    setIsOverTrash(false);
    setDraggedTab(null);
  };

  const loadErds = useCallback(async () => {
    try {
      const res = await getErds(project.project_id);
      setErds(res);
    } catch (err) {
      console.error("ERD 목록 조회 실패", err);
    }
  }, [project.project_id]);

  const loadTasks = useCallback(async () => {
    try {
      const allTasks = await getMyTasks();
      const projectTasks = allTasks.filter(
        (task) => task.project_id === project.project_id
      );
      setTasks(projectTasks);
    } catch (err) {
      console.error("작업 목록 조회 실패", err);
    }
  }, [project.project_id]);

  useEffect(() => {
    if (project?.project_id) {
      loadErds();
      loadTasks();
    }
  }, [project, loadErds, loadTasks]);

  // ▼▼▼ [추가] 브랜치 변경 시 상태를 업데이트하는 핸들러 ▼▼▼
  const handleBranchChange = (newBranch) => {
    setCurrentBranch(newBranch);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <ProjectDetailPanel
            project={currentProject}
            onUpdate={loadTasks}
            onNameChange={onNameChange}
          />
        );
      case "erd":
        return (
          <ErdListPanel
            project={currentProject}
            erds={erds}
            onRefresh={loadErds}
            onSelect={() => {}}
          />
        );
      case "calendar":
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <TaskCalendarView
        tasks={tasks}
        projects={[currentProject]}
        onTaskClick={() => {}}
        title={`${currentProject.name} 캘린더`}
      />
    </div>
  );

      case "tasks":
        return <ProjectTasksTab project={currentProject} />;
      case "git":
        // ▼▼▼ [수정] GitHubPanel에 currentUser와 onBranchChange props 전달 ▼▼▼
        return (
          <GitHubPanel 
            project={currentProject} 
            currentUser={currentUser} 
            onBranchChange={handleBranchChange}
          />
        );
      case "timeline":
        return <TimelineWidget project={currentProject} />;
      case "docs":
        return <DocsListPanel project={currentProject} />;
      case "templates":
        return <TemplatesListPanel project={currentProject} />;
      case "code_editor":
        // ▼▼▼ [수정] CodeEditorPanel에 현재 branch와 onBranchChange props 전달 ▼▼▼
        return (
          <CodeEditorPanel 
            project={currentProject} 
            branch={currentBranch}
            onBranchChange={handleBranchChange}
          />
        );
      default:
        return (
          <div className="p-10 text-gray-500 text-sm">
            <p>
              🚧 `{WIDGET_TABS.find((t) => t.key === activeTab)?.label}` 탭은 준비 중입니다.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center h-12 px-6">
          {enabledTabs.map((tab) => {
            const label = WIDGET_TABS.find((t) => t.key === tab)?.label || tab;
            return (
              <button
                key={tab}
                draggable={tab !== "overview" && tab !== "erd"}
                onDragStart={(e) => handleDragStart(e, tab)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, tab)}
                onClick={() => setActiveTab(tab)}
                className={`mr-4 text-[15px] font-medium border-b-2 min-w-[50px] px-2 py-1
                  ${activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-blue-600"
                  } cursor-pointer`}
              >
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}

          <div
            className="relative"
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={handleDragOverTrash}
            onDragLeave={() => setIsOverTrash(false)}
            onDrop={handleDropTrash}
          >
            <button
              onClick={() => setShowAddMenu((prev) => !prev)}
              className={`text-gray-400 hover:text-blue-500 text-lg font-bold ${
                draggedTab ? "text-red-500" : ""
              } ${isOverTrash ? "text-red-700" : ""}`}
            >
              {draggedTab ? "🗑️" : "＋"}
            </button>

            {showAddMenu && (
              <div
                ref={addMenuRef}
                className="absolute left-0 top-full mt-2 bg-white border rounded shadow p-2 z-20"
              >
                {WIDGET_TABS.filter(
                  (w) => w.key !== "overview" && !enabledTabs.includes(w.key)
                ).map((w) => (
                  <button
                    key={w.key}
                    onClick={() => handleAddTab(w.key)}
                    className="block px-3 py-1 text-sm text-left hover:bg-gray-100 w-full"
                  >
                    <span className="whitespace-nowrap">{w.label}</span>
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

      <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden">
  {renderTabContent()}
</div>

    </div>
  );
};

export default ProjectWidgetTabs;