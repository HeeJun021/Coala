// ✅ Asana 스타일: 날짜순 그룹 + 완료 여부 + 작업 생성자 포함 수신함
import React, { useState, useEffect } from "react";
import { getMyTasks } from "../../api/taskApi";
import { getProjectActivity } from "../../api/projectApi";

const formatDateLabel = (date) => {
  const today = new Date();
  const d = new Date(date);
  const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));

  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  if (diff < 7) return `${diff}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
};

const groupByDate = (notifications) => {
  const grouped = {};
  notifications.forEach((n) => {
    const key = new Date(n.date).toDateString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(n);
  });
  return Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0]));
};

const InboxTab = ({ projects = [] }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [tasks, projectActivity] = await Promise.all([
          getMyTasks(),
          Promise.all(projects.map((project) => getProjectActivity(project.project_id))),
        ]);

        const taskNotifications = tasks.map((task) => ({
          id: `task-${task.task_id}`,
          type: "task",
          content: task.title,
          date: task.created_at,
          projectId: task.project_id,
          completed: task.completed,
          creator: task.creator_nickname || "시스템",
          projectName: projects.find((p) => p.project_id === task.project_id)?.name || "알 수 없음",
        }));

        const activityNotifications = projectActivity.flat().map((activity) => ({
          id: `activity-${activity.id}`,
          type: "activity",
          content: activity.text,
          date: activity.date,
          projectId: activity.project_id,
          completed: false,
          creator: activity.actor_nickname || "시스템",
          projectName: projects.find((p) => p.project_id === activity.project_id)?.name || "알 수 없음",
        }));

        const all = [...taskNotifications, ...activityNotifications].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setNotifications(all);
      } catch (err) {
        console.error("알림 로딩 실패", err);
      }
    };

    if (projects.length > 0) fetchNotifications();
  }, [projects]);

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.type === filter;
  });

  const grouped = groupByDate(filtered);

  return (
    <div className="px-10 py-8 w-full max-w-[1000px] mx-auto">
      <h2 className="text-[28px] font-bold text-gray-900 mb-6">수신함</h2>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "all", label: "전체" },
          { key: "task", label: "작업" },
          { key: "activity", label: "활동" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
              filter === key
                ? "bg-green-600 text-white border-green-600"
                : "text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-20">알림이 없습니다.</p>
      ) : (
        <div className="space-y-10">
          {grouped.map(([dateKey, items]) => (
            <div key={dateKey}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                {formatDateLabel(dateKey)}
              </h3>
              <ul className="space-y-5">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className="flex justify-between items-start group hover:bg-gray-50 rounded-lg px-4 py-3 border border-gray-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg pt-0.5">
                        {n.type === "task" ? (n.completed ? "✅" : "📋") : "📜"}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${
                          n.completed ? "line-through text-gray-400" : "text-gray-800"
                        }`}>{n.content}</p>
                        <p className="text-xs text-gray-500">
                          프로젝트: {n.projectName} • 생성자: {n.creator}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 pt-1 whitespace-nowrap">
                      {new Date(n.date).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-16 text-center text-sm text-gray-400 hover:underline cursor-pointer">
        모든 알림 보관</div>
    </div>
  );
};

export default InboxTab;
