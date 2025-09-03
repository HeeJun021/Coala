import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProjects } from "../../api/projectApi";
import { getMyTasks, updateTask } from "../../api/taskApi";
import apiClient from "../../api/apiClient";

const DashboardTab = ({ project, onProjectSelect, setShowCreateProjectModal }) => {
  const navigate = useNavigate();
  const [taskFilter, setTaskFilter] = useState("예정");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [userName, setUserName] = useState("사용자");

  const today = new Date().toLocaleDateString("ko-KR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getMyProjects();
        setProjects(res || []);
      } catch (err) {
        console.error("프로젝트 불러오기 실패", err);
        setProjects([]);
      }
    };

    const fetchTasks = async () => {
      try {
        const res = await getMyTasks();
        setTasks(res || []);
      } catch (err) {
        console.error("작업 불러오기 실패", err);
        setTasks([]);
      }
    };

    const fetchUser = async () => {
      try {
        const res = await apiClient.get("/users/me");
        setUserName(res.data.nickname || "사용자");
      } catch (err) {
        console.error("사용자 정보 불러오기 실패", err);
      }
    };

    fetchProjects();
    fetchTasks();
    fetchUser();
  }, []);

  const handleToggleComplete = async (task) => {
    try {
      const updatedStatus = task.status === "완료됨" ? "예정" : "완료됨";
      const updatedTask = { ...task, status: updatedStatus };
      const res = await updateTask(task.task_id, updatedTask);
      setTasks((prev) =>
        prev.map((t) => (t.task_id === res.task_id ? res : t))
      );
    } catch (err) {
      console.error("작업 상태 업데이트 실패", err);
    }
  };

    const getActiveTaskCountsByProject = (allTasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const map = new Map(); // project_id -> { active, done }
    for (const t of allTasks || []) {
      const pid = t.project_id;
      if (!pid) continue;

      const due = t.due_date ? new Date(t.due_date) : null;
      const isDone = t.status === "완료됨";
      const isOverdueUnfinished = !isDone && due && due < today;

      const shouldCountInActive = isDone || !isOverdueUnfinished;

      if (!map.has(pid)) map.set(pid, { active: 0, done: 0 });
      const obj = map.get(pid);
      if (shouldCountInActive) obj.active += 1;
      if (isDone) obj.done += 1;
    }
    return map;
  };

  const computeProgress = (counts) => {
    if (!counts || counts.active === 0) return 0;
    return Math.min(100, Math.round((counts.done / counts.active) * 100));
  };

  const countsMap = getActiveTaskCountsByProject(tasks);

  const filteredTasks = tasks.filter((task) => {
    const due = task.due_date ? new Date(task.due_date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (task.status === "완료됨") {
      return taskFilter === "완료됨";
    }

    if (due && due < today && task.status !== "완료됨") {
      return taskFilter === "마감일 지남";
    }

    return taskFilter === "예정" && task.status !== "완료됨";
  });

  return (
    <div className="bg-[#f9f9f970] min-h-screen py-10 px-6">
      <div className="max-w-screen-lg mx-auto space-y-10">
        <div>
          <p className="text-gray-500 text-sm">{today}</p>
          <h1 className="text-3xl font-bold mt-1">{userName}님, 안녕하세요 👋</h1>
          <p className="text-gray-600 mt-1 text-sm">작업을 계획하고 생산성을 높여보세요.</p>
        </div>

        <section className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">🧑‍💻</div>
              <h2 className="text-lg font-semibold">내 작업 </h2>
            </div>
            <button
              onClick={() => navigate("/team-project", { state: { tab: "my-tasks" } })}
              className="text-sm text-blue-600 hover:underline"
            >
              모두 보기 →
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            {["예정", "마감일 지남", "완료됨"].map((filter) => (
              <button
                key={filter}
                onClick={() => setTaskFilter(filter)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  taskFilter === filter
                    ? "bg-black text-white border-black"
                    : "text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <ul className="space-y-2 text-sm">
  {filteredTasks.length > 0 ? (
    filteredTasks.map((task) => (
      <li key={task.task_id} className="flex justify-between items-center">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={task.status === "완료됨"}
            onChange={() => handleToggleComplete(task)}
            className="accent-blue-600 mt-1"
          />
          <div>
            <div className="font-medium text-sm text-gray-800">{task.title}</div>
            <div className="text-xs text-gray-500">
              {task.project_name || "프로젝트 없음"} ·{" "}
              {task.collaborators?.map((c) => c.nickname).join(", ") || "협업자 없음"}
            </div>
          </div>
        </div>
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {task.start_date && task.due_date
            ? `${task.start_date} ~ ${task.due_date}`
            : "미정"}
        </span>
      </li>
    ))
  ) : (
    <p className="text-gray-400">해당 작업이 없습니다.</p>
  )}
</ul>
        </section>
        <section className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">프로젝트</h2>
            <button
              onClick={() => setShowCreateProjectModal(true)}
              className="text-sm border px-3 py-1 rounded hover:bg-gray-100"
            >
              + 프로젝트 생성
            </button>
          </div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.length > 0 ? (
              projects.map((proj) => {
                const counts = countsMap.get(proj.project_id);
                const progress = computeProgress(counts);

                return (
                  <div
                    key={proj.project_id}
                    onClick={() => onProjectSelect?.(proj.project_id)}
                    className="border rounded-lg p-4 hover:shadow-sm cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                      {proj.name}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      진행률: {progress}%{" "}
                      {counts?.active ? (
                        <span className="ml-1 text-gray-400">
                          (완료 {counts.done} / 활성 {counts.active})
                        </span>
                      ) : (
                        <span className="ml-1 text-gray-400">(활성 작업 없음)</span>
                      )}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400">프로젝트가 없습니다.</p>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4"> 위젯</h2>
          <p className="text-gray-500 text-sm">
            프로젝트 통계, 커밋 기록, 이슈 현황 등 위젯을 이곳에 추가할 수 있습니다.
          </p>
          <button className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm">
            + 위젯 추가
          </button>
        </section>
      </div>
    </div>
  );
};

export default DashboardTab;