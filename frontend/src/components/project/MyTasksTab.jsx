// src/pages/MyTasksTab.jsx
import React, { useEffect, useState } from "react";
import { getMyTasks, createTask } from "../../api/taskApi";
import TaskDetailModal from "../../components/project/TaskDetailModal";
import TaskCalendarView from "../../components/project/TaskCalendarView";
import { getMyProjects, getProjectMembers } from "../../api/projectApi";

const sectionLabels = ["최근 배정된 작업", "오늘 할 일", "다음 주에 할 일", "나중에 할 일", "제목 없는 섹션"];

const MyTasksTab = () => {
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [newTask, setNewTask] = useState({ title: "", due_date: "", project_id: "", collaborator_ids: [] });
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getMyTasks();
        setTasks(res);
      } catch (err) {
        console.error("작업 불러오기 실패", err);
      }
    };
    fetchTasks();

    const fetchProjects = async () => {
      const res = await getMyProjects();
      setProjects(res);
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      if (newTask.project_id) {
        const res = await getProjectMembers(newTask.project_id);
        setMembers(res);
      }
    };
    fetchMembers();
  }, [newTask.project_id]);

  const getSectionTasks = (section) => {
    const today = new Date();
    const startOfNextWeek = new Date();
    startOfNextWeek.setDate(today.getDate() + 7);

    return tasks.filter((task) => {
      const due = new Date(task.due_date);
      switch (section) {
        case "최근 배정된 작업":
          return new Date(task.created_at) >= new Date(Date.now() - 3 * 86400000);
        case "오늘 할 일":
          return due.toDateString() === today.toDateString();
        case "다음 주에 할 일":
          return due > today && due <= startOfNextWeek;
        case "나중에 할 일":
          return due > startOfNextWeek;
        case "제목 없는 섹션":
          return !task.due_date;
        default:
          return false;
      }
    });
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.project_id) return;
    try {
      const res = await createTask(newTask);
      setTasks((prev) => [...prev, res]);
      setNewTask({ title: "", due_date: "", project_id: "", collaborator_ids: [] });
      setActiveSection(null);
    } catch (err) {
      console.error("작업 추가 실패", err);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">내 작업</h1>
        <div className="flex gap-4 mt-4 border-b pb-2">
          {["list", "calendar", "note"].map((tab) => (
            <button
              key={tab}
              onClick={() => setViewMode(tab)}
              className={`px-4 py-1 text-sm border-b-2 transition font-medium ${
                viewMode === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-blue-600"
              }`}
            >
              {tab === "list" ? "목록" : tab === "calendar" ? "캘린더" : "메모"}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "list" && (
        <div className="space-y-10">
          {sectionLabels.map((section) => (
            <div key={section}>
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-base">{section}</h2>
                <button onClick={() => setActiveSection(section)} className="text-sm text-blue-500 hover:underline">작업 추가 +</button>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-2 w-[25%]">이름</th>
                      <th className="px-4 py-2 w-[15%]">마감일</th>
                      <th className="px-4 py-2 w-[25%]">참여자</th>
                      <th className="px-4 py-2 w-[25%]">프로젝트</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSectionTasks(section).map((task) => (
                      <tr
                        key={task.task_id}
                        onClick={() => setSelectedTask(task)}
                        className="hover:bg-gray-50 cursor-pointer border-t"
                      >
                        <td className="px-4 py-2 font-medium">{task.title}</td>
                        <td className="px-4 py-2 text-gray-600">{task.due_date || "-"}</td>
                        <td className="px-4 py-2 text-gray-600">{task.collaborators?.map((c) => c.nickname).join(", ") || "-"}</td>
                        <td className="px-4 py-2 text-gray-600">{task.project_name || "-"}</td>
                      </tr>
                    ))}
                    {activeSection === section && (
                      <tr>
                        <td colSpan="4" className="px-4 py-2 bg-gray-50">
                          <input
                            type="text"
                            placeholder="작업 이름"
                            value={newTask.title}
                            onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                            className="w-full border rounded px-3 py-2 text-sm mb-2"
                          />
                          <div className="flex gap-2 mb-2">
                            <input
                              type="date"
                              value={newTask.due_date}
                              onChange={(e) => setNewTask((prev) => ({ ...prev, due_date: e.target.value }))}
                              className="border rounded px-3 py-1 text-sm"
                            />
                            <select
                              value={newTask.project_id}
                              onChange={(e) => setNewTask((prev) => ({ ...prev, project_id: e.target.value }))}
                              className="border rounded px-3 py-1 text-sm"
                            >
                              <option value="">프로젝트 선택</option>
                              {projects.map((p) => (
                                <option key={p.project_id} value={p.project_id}>{p.name}</option>
                              ))}
                            </select>
                            <select
                              multiple
                              value={newTask.collaborator_ids}
                              onChange={(e) =>
                                setNewTask((prev) => ({
                                  ...prev,
                                  collaborator_ids: Array.from(e.target.selectedOptions, (opt) => opt.value),
                                }))
                              }
                              className="border rounded px-3 py-1 text-sm h-[90px]"
                            >
                              {members.map((m) => (
                                <option key={m.user_id} value={m.user_id}>{m.nickname}</option>
                              ))}
                            </select>
                            <button onClick={handleAddTask} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">저장</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === "calendar" && <div className="mt-6"><TaskCalendarView tasks={tasks} onTaskClick={setSelectedTask} /></div>}

      {viewMode === "note" && <div className="mt-6 text-sm text-gray-500 italic">메모 기능 준비 중...</div>}

      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
};

export default MyTasksTab;
