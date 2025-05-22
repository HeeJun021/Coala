import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const DashboardTab = ({ project }) => {
  const navigate = useNavigate();
  const [taskFilter, setTaskFilter] = useState("예정");

  const userName = "한승민";
  const today = new Date().toLocaleDateString("ko-KR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const tasks = [
    { id: 1, title: "UI 디자인 개선", due: "2025-05-21", status: "예정" },
    { id: 2, title: "오답노트 연결", due: "2025-05-13", status: "마감일 지남" },
    { id: 3, title: "API 리팩토링", due: "2025-05-10", status: "완료됨" },
  ];

  const projects = [
    { id: 1, name: "교차 기능팀 프로젝트", slug: "cross-team", progress: 82 },
    { id: 2, name: "B 프로젝트", slug: "project-b", progress: 41 },
  ];

  const filteredTasks = tasks.filter((task) => task.status === taskFilter);

  return (
  <div className="bg-[#f9f9f9] min-h-screen py-10 px-6">
    <div className="max-w-screen-lg mx-auto space-y-10">
      {/* 👋 인사 */}
      <div>
        <p className="text-gray-500 text-sm">{today}</p>
        <h1 className="text-3xl font-bold mt-1">{userName}님, 안녕하세요 👋</h1>
        <p className="text-gray-600 mt-1 text-sm">작업을 계획하고 생산성을 높여보세요.</p>
      </div>

      {/* ✅ 내 작업 */}
      <section className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">🧑‍💻</div>
            <h2 className="text-lg font-semibold">내 작업 🔒</h2>
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
              <li key={task.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="accent-blue-600" />
                  <span>{task.title}</span>
                </div>
                <span className="text-gray-500 text-xs">{task.due}</span>
              </li>
            ))
          ) : (
            <p className="text-gray-400">해당 작업이 없습니다.</p>
          )}
        </ul>
      </section>

      {/* ✅ 프로젝트 */}
      <section className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">프로젝트</h2>
          <button
            onClick={() => alert("프로젝트 생성 기능 연결 예정")}
            className="text-sm border px-3 py-1 rounded hover:bg-gray-100"
          >
            + 프로젝트 생성
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/team-project/${proj.slug}`)}
              className="border rounded-lg p-4 hover:shadow-sm cursor-pointer transition"
            >
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                📁 {proj.name}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">진행률: {proj.progress}%</p>
            </div>
          ))}
        </div>
      </section>

      {/* ✅ 위젯 */}
      <section className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">📊 위젯</h2>
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
