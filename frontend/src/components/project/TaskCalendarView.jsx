// TaskCalendarView.jsx
import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { updateTask } from "../../api/taskApi";
import { CalendarDays, Users } from "lucide-react";

// 연하고 밝은 색상 팔레트
const colorPalette = [
  "#8da4f1", // 연보라 → 진한 블루톤
  "#a5c5e8", // 하늘 → 더 선명하게
  "#a9d3c5", // 연녹 → 살짝 더 진하게
  "#d9b4a3", // 살구 → 더 대비 있게
  "#d3cbc2", // 모래색 → 어둡게 조정
  "#d5c5c5", // 연핑크 → 살짝 강조
  "#b9e2cc", // 민트 → 대비 높임
  "#e9c78a", // 노랑 → 진한 머스터드
  "#b0b0e8", // 연보라 → 명도 낮춤
  "#e3b9cb", // 핑크 → 붉은기 추가
  "#b8dee8", // 블루톤 → 청량감 유지하며 강화
  "#f0c9a6", // 주황 → 살짝 더 톤 다운
  "#c9e0b4", // 연두 → 채도 약간 증가
  "#dab8e0", // 보라 → 살짝 진하게
  "#b8e8d4", // 연민트 → 조금 더 채도 높임
];


// 색상 랜덤화 및 중복 방지 함수
const getRandomColors = (count) => {
  const shuffled = [...colorPalette].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, colorPalette.length));
};

const TaskCalendarView = ({ tasks = [], projects = [], onTaskClick , Blacksmith }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [members, setMembers] = useState([]);
  const [taskColors, setTaskColors] = useState([]);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const slideRef = useRef(null);
  const collaboratorRef = useRef(null);

  useEffect(() => {
    console.log("Tasks received:", tasks);
    console.log("Projects received:", projects);
  }, [tasks, projects]);

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const taskCount = tasks.length;
    const randomColors = getRandomColors(taskCount);
    setTaskColors(randomColors);
  }, [tasks]);

  useEffect(() => {
  if (!tasks || taskColors.length === 0) return;
  const mapped = tasks
    .filter((task) => projects.some((proj) => proj.project_id === task.project_id))
    .map((task, index) => {
      const bg = taskColors[index % taskColors.length]; // ✅ 먼저 정의
      const textColor = getTextColor(bg);               // ✅ 텍스트 색상 계산

      return {
        id: String(task.task_id),
        title: task.title,
        start: task.start_date || task.due_date,
        end: task.due_date
          ? new Date(new Date(task.due_date).getTime() + 86400000)
              .toISOString()
              .slice(0, 10)
          : undefined,
        extendedProps: {
          ...task,
          bgColor: bg,
          textColor: textColor,
        },
        backgroundColor: bg,
        borderColor: bg,
      };
    });
  setCalendarEvents(mapped);
}, [tasks, taskColors, projects]);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEventClick = (info) => {
    const task = info.event.extendedProps;
    setSelectedTask(task);
    if (onTaskClick) onTaskClick(task);
  };

  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      const taskData = {
        ...updatedData,
        status: updatedData.due_date ? "예정" : "완료됨",
      };
      const res = await updateTask(taskId, taskData);
      setSelectedTask(res);
      const updatedTasks = tasks.map((task) =>
        task.task_id === res.task_id ? res : task
      );
      setCalendarEvents(
        updatedTasks
          .filter((task) =>
            projects.some((proj) => proj.project_id === task.project_id)
          )
          .map((task, index) => ({
            id: String(task.task_id),
            title: task.title,
            start: task.start_date || task.due_date,
            end: task.due_date
              ? new Date(new Date(task.due_date).getTime() + 86400000)
                  .toISOString()
                  .slice(0, 10)
              : undefined,
            extendedProps: task,
            backgroundColor: taskColors[index % taskColors.length],
            borderColor: taskColors[index % taskColors.length],
          }))
      );
    } catch (err) {
      console.error("작업 수정 실패", err);
      alert("작업 수정에 실패했습니다.");
    }
  };

const getTextColor = (bgColor) => {
  const c = bgColor.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160 ? "#000000" : "#ffffff";
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

  const handleDatesSet = (dateInfo) => {
    setCurrentViewDate(dateInfo.view.currentStart);
  };

  useEffect(() => {
    if (selectedTask && selectedTask.project_id) {
      const fetchMembers = async () => {
        try {
          const res = await (
            await import("../../api/projectApi")
          ).getProjectMembers(selectedTask.project_id);
          setMembers(res);
        } catch (err) {
          console.error("멤버 불러오기 실패", err);
        }
      };
      fetchMembers();
    }
  }, [selectedTask]);

  return (
    <div className="relative w-full">
      {tasks.length === 0 && (
        <p className="text-gray-500">작업 데이터를 로드 중입니다...</p>
      )}
      {projects.length === 0 && (
        <p className="text-gray-500">
          프로젝트 데이터를 로드하지 못했습니다. 부모 컴포넌트를 확인하세요.
        </p>
      )}

      <h2 className="text-2xl font-bold mb-4 text-gray-800 px-6 flex items-center gap-2">
        <CalendarDays size={20} className="text-gray-600" />
        내 작업 캘린더
      </h2>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek,dayGridDay",
        }}
        locale="ko"
        height="auto"
        events={calendarEvents}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        dayMaxEvents={3}
        displayEventTime={false}
        eventClassNames={({ backgroundColor }) =>
  `text-black text-[11px] px-2 py-1 rounded-md shadow-md cursor-pointer transition-all hover:opacity-90 border font-medium`
}
        dayCellClassNames="border-gray-100 hover:bg-gray-50 transition-all text-[12px] h-[100px]"
        eventContent={(eventInfo) => {
           const textColor = eventInfo.event.extendedProps?.textColor ?? "#000000"; // 기본값 검정

   return (
    <div
      className="flex items-center gap-1"
      style={{
        color: textColor,
        fontSize: "13px", // ✅ 기존 11px → 13px로 키움
        fontWeight: 500,
      }}
    >
      <span className="truncate">{eventInfo.event.title}</span>
      {eventInfo.event.extendedProps.collaborators?.length > 0 && (
        <span className="flex items-center text-[9px] bg-white text-gray-600 rounded-full px-1 py-0.5 gap-1 ml-1">
          <Users size={10} />
          {eventInfo.event.extendedProps.collaborators.length}
        </span>
      )}
    </div>
  );
}}
        customButtons={{
          today: {
            text: "오늘",
            click: function () {
              this.getCalendar().today();
            },
          },
        }}
        titleFormat={{ year: "numeric", month: "long" }}
        buttonText={{
          today: "오늘",
          month: "월",
          week: "주",
          day: "일",
        }}
        dayHeaderClassNames="text-gray-600 font-medium text-[12px]"
        eventBorderColor="transparent"
      />

      {selectedTask && (
        <div
          ref={slideRef}
          className="w-[500px] bg-white border-l shadow-xl p-6 fixed right-0 top-0 h-full overflow-y-auto transition-transform duration-300 transform translate-x-0 z-20"
        >
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setSelectedTask(null)}
              className="text-gray-500 hover:text-black text-2xl"
            >
              ×
            </button>
            <button
              onClick={() => {
                if (window.confirm("정말 이 작업을 삭제하시겠습니까?")) {
                  setSelectedTask(null);
                }
              }}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              작업 삭제
            </button>
          </div>
          <div className="mb-6">
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
              <p className="text-sm text-gray-500 mb-1">📅 시작일</p>
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
              <p className="text-sm text-gray-500 mb-1">📅 마감일</p>
              <input
                type="date"
                value={selectedTask.due_date || ""}
                onChange={(e) => {
                  const newTask = {
                    ...selectedTask,
                    due_date: e.target.value,
                  };
                  setSelectedTask(newTask);
                  handleUpdateTask(selectedTask.task_id, newTask);
                }}
                className="text-base font-medium border-none focus:outline-none focus:ring-2 focus:ring-blue-200 rounded px-2 py-1"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">📁 프로젝트</p>
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
          </div>
          <div className="mb-6 relative">
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
              <Users size={14} className="text-gray-500" />
              참여자
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTask.collaborators?.map((user) => (
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
              ))}
              <button
                onClick={() => setIsAddingCollaborator(true)}
                className="text-sm text-blue-500 hover:underline"
              >
                + 참여자 추가
              </button>
            </div>
            {isAddingCollaborator && (
              <div
                ref={collaboratorRef}
                className="absolute z-10 bg-white border rounded shadow-lg p-2 max-h-40 overflow-y-auto"
              >
                {members
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
                  ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm text-gray-500 mb-1">📄 설명</h3>
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
              className="w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-200 rounded px-3 py-2 text-base h-32"
              placeholder="설명을 입력하세요..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCalendarView;