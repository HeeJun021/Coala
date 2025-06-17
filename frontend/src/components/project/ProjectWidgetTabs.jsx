import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import ProjectDetailPanel from "./ProjectDetailPanel";
import MemoTab from "./MemoTab";
import TaskCalendarView from "./TaskCalendarView";
import ProjectTasksTab from "./ProjectTasksTab";
import TimelineWidget from "./TimelineWidget";
import { updateProject, getMyProjects } from "../../api/projectApi";
import { getErds } from "../../api/erd/erdApi";
import { getMyTasks } from "../../api/taskApi";
import ErdListPanel from "../erd/list/ErdListPanel";
import DocsListPanel from "./DocsListPanel";

const WIDGET_TABS = [
  { key: "overview", label: "개요" },
  { key: "erd", label: "ERD 설계" },
  { key: "git", label: "GitHub" },
  { key: "docs", label: "문서" },
  { key: "chat", label: "채팅" },
  { key: "calendar", label: "캘린더" },
  { key: "memo", label: "메모" },
  { key: "tasks", label: "작업" },
  { key: "timeline", label: "타임라인" },
];

const ProjectWidgetTabs = ({ project, onNameChange }) => {
  const location = useLocation();
  const initialTab = location.state?.subTab ?? location.state?.tab ?? "overview"; // subTab 우선
  const [activeTab, setActiveTab] = useState(initialTab);
  const [enabledTabs, setEnabledTabs] = useState(["overview", "erd"]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);
  const [erds, setErds] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [draggedTab, setDraggedTab] = useState(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const addMenuRef = useRef(null);

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

  const handleDragOver = (e, tab) => {
    e.preventDefault();
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

  const handleDragLeaveTrash = () => {
    setIsOverTrash(false);
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

  const handleUpdate = async () => {
    try {
      const projects = await getMyProjects();
      const updatedProject = projects.find(
        (p) => p.project_id === currentProject.project_id
      );
      if (updatedProject) {
        setCurrentProject(updatedProject);
        const widgets = updatedProject.widgets || { erd: true };
        const widgetOrder = updatedProject.widget_order || ["overview", "erd"];
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
      }
      loadTasks();
    } catch (err) {
      console.error("프로젝트 업데이트 실패", err);
    }
  };

  useEffect(() => {
    if (!enabledTabs.includes(activeTab)) {
      if (activeTab === "erd") {
        handleAddTab("erd");
      } else {
        setActiveTab("overview");
      }
    }
  }, [activeTab, enabledTabs, handleAddTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <ProjectDetailPanel
            project={currentProject}
            onUpdate={handleUpdate}
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
      case "memo":
        return <MemoTab />;
      case "calendar":
        return (
          <TaskCalendarView
            tasks={tasks}
            projects={[currentProject]}
            onTaskClick={() => {}}
            title={`${currentProject.name} 캘린더`}
          />
        );
      case "tasks":
        return <ProjectTasksTab project={currentProject} />;
      case "timeline":
        return <TimelineWidget project={currentProject} />;
      case "docs":
        return <DocsListPanel project={currentProject} />;
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
    <div>
      <div className="sticky top-[70px] z-10 bg-white border-b">
        <div className="flex items-center h-12 px-6">
          {enabledTabs.map((tab) => {
            const label = WIDGET_TABS.find((t) => t.key === tab)?.label || tab;
            return (
              <button
                key={tab}
                draggable={tab !== "overview" && tab !== "erd"}
                onDragStart={(e) => handleDragStart(e, tab)}
                onDragOver={(e) => handleDragOver(e, tab)}
                onDrop={(e) => handleDrop(e, tab)}
                onClick={() => setActiveTab(tab)}
                className={`mr-4 text-sm font-medium border-b-2 min-w-[50px] px-2 py-1
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
            onDragOver={handleDragOverTrash}
            onDragLeave={handleDragLeaveTrash}
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

      <div className="flex-1 min-w-0 overflow-hidden">{renderTabContent()}</div>
    </div>
  );
};

export default ProjectWidgetTabs;