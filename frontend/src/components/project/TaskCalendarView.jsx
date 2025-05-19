import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const TaskCalendarView = ({ tasks = [], onTaskClick }) => {
  // 작업을 날짜 기준으로 그룹화 (YYYY-MM-DD)
  const groupedByDate = tasks.reduce((acc, task) => {
    const key = task.due_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  // 달력 셀에 표시할 내용 구성
  const tileContent = ({ date }) => {
    const key = date.toISOString().split("T")[0];
    const tasksForDate = groupedByDate[key];
    if (!tasksForDate) return null;

    return (
      <ul className="mt-1 space-y-0.5 text-[10px]">
        {tasksForDate.map((task) => (
          <li
            key={task.task_id}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task);
            }}
            className="truncate cursor-pointer text-blue-600 hover:underline"
          >
            • {task.title}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <Calendar
        tileContent={tileContent}
        formatShortWeekday={(locale, date) =>
          ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
        }
        locale="ko-KR"
      />
    </div>
  );
};

export default TaskCalendarView;