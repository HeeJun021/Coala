import React, { useEffect, useRef, useState } from "react";
import {
  getMyTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../../api/taskApi";
import TaskCalendarView from "./TaskCalendarView";
import MemoTab from "./MemoTab";
import { getMyProjects, getProjectMembers } from "../../api/projectApi";
import {
  ClipboardEdit,
  CalendarCheck,
  FolderKanban,
  Users,
  Activity,
  FileText,
} from "lucide-react";

const sections = [
  "최근 배정된 작업",
  "오늘 할 일",
  "다가오는 일정",
  "완료",
  "마감일 지남",
];

const MyTasksTab = ({ projects: propProjects }) => {
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    start_date: "",
    due_date: "",
    project_id: "",
    collaborator_ids: [],
  });
  const [expandedSections, setExpandedSections] = useState(
    sections.reduce((acc, section) => ({ ...acc, [section]: true }), {})
  );
  const [projects, setProjects] = useState(propProjects || []);
  const [members, setMembers] = useState([]);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const slideRef = useRef(null);
  const collaboratorRef = useRef(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getMyTasks();
        console.log("Fetched tasks:", res);
        setTasks(res || []);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        setTasks([]);
      }
    };
    const fetchProjects = async () => {
      try {
        const res = await getMyProjects();
        console.log("Fetched projects:", res);
        setProjects(res || []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setProjects([]);
      }
    };
    fetchTasks();
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      if (newTask.project_id || (selectedTask && selectedTask.project_id)) {
        try {
          const projectId = newTask.project_id || selectedTask.project_id;
          const res = await getProjectMembers(projectId);
          console.log("Fetched members:", res);
          setMembers(res || []);
        } catch (err) {
          console.error("Failed to fetch members:", err);
          setMembers([]);
        }
      }
    };
    fetchMembers();
  }, [newTask.project_id, selectedTask]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (slideRef.current && !slideRef.current.contains(event.target)) {
        setSelectedTask(null);
      }
      if (
        collaboratorRef.current &&
        !collaboratorRef.current.contains(event.target)
      ) {
        setIsAddingCollaborator(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSectionTasks = (section) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfNextWeek = new Date(today);
    startOfNextWeek.setDate(today.getDate() + 7);

    return tasks.filter((task) => {
      const due = task.due_date ? new Date(task.due_date) : null;
      const start = task.start_date ? new Date(task.start_date) : null;
      switch (section) {
        case "최근 배정된 작업":
          return (
            task.created_at &&
            new Date(task.created_at) >= new Date(Date.now() - 7 * 86400000)
          );
        case "오늘 할 일":
          return (
            ((due && due.toDateString() === today.toDateString()) ||
              (start && start.toDateString() === today.toDateString())) &&
            task.status !== "완료됨"
          );
        case "다가오는 일정":
          return (
            due &&
            task.status !== "완료됨" &&
            due > today &&
            due <= startOfNextWeek
          );
        case "완료":
          return task.status === "완료됨";
        case "마감일 지남":
          return due && task.status !== "완료됨" && due < today;
        default:
          return false;
      }
    });
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.project_id) {
      alert("작업 이름과 프로젝트는 필수입니다.");
      return;
    }
    try {
      const taskData = {
        ...newTask,
        status: newTask.due_date ? "예정" : "완료됨",
      };
      const res = await createTask(taskData);
      setTasks((prev) => [...prev, res]);
      setNewTask({
        title: "",
        start_date: "",
        due_date: "",
        project_id: "",
        collaborator_ids: [],
      });
      setIsAddingTask(false);
    } catch (err) {
      console.error("Failed to add task:", err);
      alert("작업 추가에 실패했습니다.");
    }
  };

  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      const taskData = {
        ...updatedData,
        status:
          updatedData.status || (updatedData.due_date ? "예정" : "완료됨"),
      };
      const res = await updateTask(taskId, taskData);
      setTasks((prev) =>
        prev.map((task) => (task.task_id === res.task_id ? res : task))
      );
      setSelectedTask(res);
    } catch (err) {
      console.error("Failed to update task:", err);
      alert("작업 수정에 실패했습니다.");
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const updatedStatus = task.status === "완료됨" ? "예정" : "완료됨";
      const updatedTask = { ...task, status: updatedStatus };
      const res = await updateTask(task.task_id, updatedTask);
      setTasks((prev) =>
        prev.map((t) => (t.task_id === res.task_id ? res : t))
      );
      if (selectedTask && selectedTask.task_id === task.task_id) {
        setSelectedTask(res);
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("정말 이 작업을 삭제하시겠습니까?")) {
      try {
        await deleteTask(taskId);
        setTasks((prev) => prev.filter((task) => task.task_id !== taskId));
        setSelectedTask(null);
      } catch (err) {
        console.error("Failed to delete task:", err);
        alert("작업 삭제에 실패했습니다.");
      }
    }
  };

  const handleAddCollaborator = (user) => {
    if (!selectedTask) return;
    const updatedCollaborators = [
      ...(selectedTask.collaborators || []),
      { user_id: user.user_id, nickname: user.nickname },
    ];
    const newTask = { ...selectedTask, collaborators: updatedCollaborators };
    setSelectedTask(newTask);
    handleUpdateTask(selectedTask.task_id, newTask);
    setIsAddingCollaborator(false);
  };

  const handleRemoveCollaborator = (userId) => {
    if (!selectedTask) return;
    const updatedCollaborators = selectedTask.collaborators.filter(
      (c) => c.user_id !== userId
    );
    const newTask = { ...selectedTask, collaborators: updatedCollaborators };
    setSelectedTask(newTask);
    handleUpdateTask(selectedTask.task_id, newTask);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task.task_id === selectedTask?.task_id ? null : task);
  };

  return (
    <div className="flex max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">내 작업</h1>
          <div className="flex gap-4 mt-4 border-b pb-2">
            {["list", "calendar", "memo"].map((tab) => (
              <button
                key={tab}
                onClick={() => setViewMode(tab)}
                className={`px-4 py-1 text-sm border-b-2 transition font-medium ${
                  viewMode === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-blue-600"
                }`}
              >
                {tab === "list"
                  ? "목록"
                  : tab === "calendar"
                  ? "캘린더"
                  : "메모"}
              </button>
            ))}
          </div>
          {viewMode === "list" && (
            <button
              onClick={() => setIsAddingTask(true)}
              className="mt-2 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
            >
              작업 추가
            </button>
          )}
        </div>

        {viewMode === "list" && (
          <div className="space-y-10">
            {tasks.length === 0 && (
              <p className="text-gray-500">작업이 없습니다.</p>
            )}
            {sections.map((section) => (
              <div key={section}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSection(section)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedSections[section] ? "▼" : "▶"}
                    </button>
                    <h2 className="font-semibold text-sm">{section}</h2>
                  </div>
                </div>
                {expandedSections[section] && (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-500">
                          <th className="px-4 py-2 w-[5%]"></th>
                          <th className="px-4 py-2 w-[25%]">이름</th>
                          <th className="px-4 py-2 w-[15%]">시작일</th>
                          <th className="px-4 py-2 w-[15%]">마감일</th>
                          <th className="px-4 py-2 w-[20%]">참여자</th>
                          <th className="px-4 py-2 w-[20%]">프로젝트</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSectionTasks(section).length > 0 ? (
                          getSectionTasks(section).map((task) => (
                            <tr
                              key={task.task_id}
                              onClick={() => handleTaskClick(task)}
                              className={`hover:bg-gray-50 cursor-pointer border-t ${
                                selectedTask?.task_id === task.task_id
                                  ? "bg-blue-50"
                                  : ""
                              }`}
                            >
                              <td className="px-4 py-2">
                                <input
                                  type="checkbox"
                                  checked={task.status === "완료됨"}
                                  onChange={() => handleToggleComplete(task)}
                                  className="accent-blue-600"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td className="px-4 py-2 font-medium">
                                {task.title}
                              </td>
                              <td className="px-4 py-2 text-gray-600">
                                {task.start_date || "-"}
                              </td>
                              <td className="px-4 py-2 text-gray-600">
                                {task.due_date || "-"}
                              </td>
                              <td className="px-4 py-2 text-gray-600">
                                {task.collaborators
                                  ?.map((c) => c.nickname)
                                  .join(", ") || "-"}
                              </td>
                              <td className="px-4 py-2 text-gray-600">
                                {task.project_name || "-"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="6"
                              className="px-4 py-2 text-gray-500 text-center"
                            >
                              이 섹션에 작업이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {viewMode === "calendar" && (
          <div className="mt-6">
            <TaskCalendarView
              tasks={tasks}
              projects={projects}
              onTaskClick={handleTaskClick}
            />
          </div>
        )}

        {viewMode === "memo" && (
          <div className="mt-6">
            <MemoTab />
          </div>
        )}

        {isAddingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">새 작업 추가</h3>
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="text-gray-500 hover:text-black text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-col mb-2">
                <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
                  <ClipboardEdit className="w-4 h-4 text-blue-600" />
                  작업 이름
                </label>
                <input
                  type="text"
                  placeholder="작업 이름 입력"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-4 mb-4">
                <div className="flex gap-2">
                  <div className="flex flex-col flex-1">
                    <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
                      <CalendarCheck className="w-4 h-4 text-green-600" />
                      시작일
                    </label>
                    <input
                      type="date"
                      value={newTask.start_date}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          start_date: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
                      <CalendarCheck className="w-4 h-4 text-red-600" />
                      마감일
                    </label>
                    <input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          due_date: e.target.value,
                        }))
                      }
                      className="border rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
                    <FolderKanban className="w-4 h-4 text-indigo-600" />
                    프로젝트 선택
                  </label>
                  <select
                    value={newTask.project_id}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        project_id: e.target.value,
                      }))
                    }
                    className="border rounded px-3 py-2 text-sm"
                  >
                    <option value="">프로젝트 선택</option>
                    {projects.map((proj) => (
                      <option key={proj.project_id} value={proj.project_id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
                    <Users className="w-4 h-4 text-yellow-600" />
                    참여자 선택
                  </label>
                  <select
                    multiple
                    value={newTask.collaborator_ids}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        collaborator_ids: Array.from(
                          e.target.selectedOptions,
                          (option) => parseInt(option.value)
                        ),
                      }))
                    }
                    className="border rounded px-3 py-2 text-sm h-[100px]"
                  >
                    {members.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.nickname}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddTask}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                작업 추가
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTask && (
        <div
          ref={slideRef}
          className="w-[500px] bg-white border-l shadow-xl rounded p-6 fixed right-0 top-0 h-full overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setSelectedTask(null)}
              className="text-gray-500 hover:text-black text-2xl"
            >
              ×
            </button>
            <button
              onClick={() => handleDeleteTask(selectedTask.task_id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              작업 삭제
            </button>
          </div>

          <div className="mb-6 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedTask.status === "완료됨"}
              onChange={() => handleToggleComplete(selectedTask)}
              className="accent-blue-600"
            />
            <input
              type="text"
              value={selectedTask.title}
              onChange={(e) => {
                const newTask = { ...selectedTask, title: e.target.value };
                setSelectedTask(newTask);
                handleUpdateTask(selectedTask.task_id, newTask);
              }}
              className="text-xl font-semibold border-none focus:outline-none focus:ring-2 focus:ring-blue-200 rounded px-2 py-1 w-full"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
                <CalendarCheck className="w-4 h-4 text-green-600" />
                시작일
              </label>
              <input
                type="date"
                value={selectedTask.start_date || ""}
                onChange={(e) => {
                  const newTask = {
                    ...selectedTask,
                    start_date: e.target.value,
                  };
                  setSelectedTask(newTask);
                  handleUpdateTask(selectedTask.task_id, newTask);
                }}
                className="text-base font-medium border-none focus:outline-none focus:ring-2 focus:ring-blue-200 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
                <CalendarCheck className="w-4 h-4 text-red-600" />
                마감일
              </label>
              <input
                type="date"
                value={selectedTask.due_date || ""}
                onChange={(e) => {
                  const newTask = { ...selectedTask, due_date: e.target.value };
                  setSelectedTask(newTask);
                  handleUpdateTask(selectedTask.task_id, newTask);
                }}
                className="text-base font-medium border-none focus:outline-none focus:ring-2 focus:ring-blue-200 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
                프로젝트
              </label>
              <select
                value={selectedTask.project_id || ""}
                onChange={(e) => {
                  const newTask = {
                    ...selectedTask,
                    project_id: e.target.value,
                  };
                  setSelectedTask(newTask);
                  handleUpdateTask(selectedTask.task_id, newTask);
                }}
                className="text-base font-medium border-none focus:outline-none focus:ring-2 focus:ring-blue-200 rounded px-2 py-1"
              >
                <option value="">프로젝트 없음</option>
                {projects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
                <Activity className="w-4 h-4 text-gray-700" />
                상태
              </label>
              <p className="text-base font-medium">
                {selectedTask.status || "없음"}
              </p>
            </div>
          </div>

          <div className="mb-6 relative">
            <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
              <Users className="w-4 h-4 text-yellow-600" />
              참여자
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTask.collaborators?.length > 0 ? (
                selectedTask.collaborators.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center bg-gray-100 text-gray-800 text-sm rounded px-2 py-1"
                  >
                    {user.nickname}
                    <button
                      onClick={() => handleRemoveCollaborator(user.user_id)}
                      className="ml-1 text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-600">
                  참여자가 없습니다.
                </span>
              )}
              <button
                onClick={() => setIsAddingCollaborator(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                + 참여자 추가
              </button>
            </div>
            {isAddingCollaborator && (
              <div
                ref={collaboratorRef}
                className="absolute z-10 bg-white border rounded shadow-lg p-2 max-h-40 overflow-y-auto"
              >
                {members.length > 0 ? (
                  members
                    .filter(
                      (member) =>
                        !selectedTask.collaborators?.some(
                          (c) => c.user_id === member.user_id
                        )
                    )
                    .map((member) => (
                      <div
                        key={member.user_id}
                        onClick={() => handleAddCollaborator(member)}
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {member.nickname}
                      </div>
                    ))
                ) : (
                  <p className="text-sm">추가 가능한 참여자가 없습니다.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-1 text-gray-800">
              <FileText className="w-4 h-4 text-blue-600" />
              설명
            </label>
            <textarea
              value={selectedTask.description || ""}
              onChange={(e) => {
                const newTask = {
                  ...selectedTask,
                  description: e.target.value,
                };
                setSelectedTask(newTask);
                handleUpdateTask(selectedTask.task_id, newTask);
              }}
              className="w-full text-base border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 h-32"
              placeholder="설명을 입력해 주세요..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasksTab;
