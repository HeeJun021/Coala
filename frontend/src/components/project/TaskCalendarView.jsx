import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { updateTask } from "../../api/taskApi";

// 연하고 밝은 색상 팔레트
const colorPalette = [
  "#a3bffa", // 연한 파란색
  "#c4d7ed", // 연한 회청색
  "#d1e7dd", // 연한 민트
  "#e6d8d1", // 연한 살구
  "#e8e1d6", // 연한 베이지
  "#f0e6e6", // 연한 핑크
  "#e0f2e9", // 연한 초록
  "#f5e8c7", // 연한 노랑
  "#e0e0f8", // 연한 보라
  "#f2e8f0", // 연한 라벤더
  "#e0f0f8", // 연한 청록
  "#f8ece0", // 연한 오렌지
  "#e8f0e0", // 연한 라임
  "#f0e8f2", // 연한 자주
  "#e0f8f0", // 연한 터코이즈
];

// 색상 랜덤화 및 중복 방지 함수
const getRandomColors = (count) => {
  const shuffled = [...colorPalette].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, colorPalette.length));
};

const TaskCalendarView = ({ tasks = [], projects = [], onTaskClick }) => {
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
    const mapped = tasks.map((task, index) => ({
      id: String(task.task_id),
      title: task.title,
      start: task.start_date || task.due_date,
      end: task.due_date ? new Date(new Date(task.due_date).getTime() + 86400000).toISOString().slice(0, 10) : undefined,
      extendedProps: task,
      backgroundColor: taskColors[index % taskColors.length],
      borderColor: taskColors[index % taskColors.length],
    }));
    setCalendarEvents(mapped);
  }, [tasks, taskColors]);

  const thisMonthTasks = tasks.filter((task) => {
    const due = task.due_date ? new Date(task.due_date) : null;
    return (
      due &&
      due.getMonth() === currentViewDate.getMonth() &&
      due.getFullYear() === currentViewDate.getFullYear()
    );
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (slideRef.current && !slideRef.current.contains(event.target)) {
        setSelectedTask(null);
      }
      if (collaboratorRef.current && !collaboratorRef.current.contains(event.target)) {
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
      const taskData = { ...updatedData, status: updatedData.due_date ? "예정" : "완료됨" };
      const res = await updateTask(taskId, taskData);
      setSelectedTask(res);
      const updatedTasks = tasks.map((task) => (task.task_id === res.task_id ? res : task));
      setCalendarEvents(updatedTasks.map((task, index) => ({
        id: String(task.task_id),
        title: task.title,
        start: task.start_date || task.due_date,
        end: task.due_date ? new Date(new Date(task.due_date).getTime() + 86400000).toISOString().slice(0, 10) : undefined,
        extendedProps: task,
        backgroundColor: taskColors[index % taskColors.length],
        borderColor: taskColors[index % taskColors.length],
      })));
    } catch (err) {
      console.error("작업 수정 실패", err);
      alert("작업 수정에 실패했습니다.");
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
    const updatedCollaborators = selectedTask.collaborators.filter((c) => c.user_id !== userId);
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
          const res = await (await import("../../api/projectApi")).getProjectMembers(selectedTask.project_id);
          setMembers(res);
        } catch (err) {
          console.error("멤버 불러오기 실패", err);
        }
      };
      fetchMembers();
    }
  }, [selectedTask]);

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-md w-full max-w-[1100px] mx-auto relative">
      {tasks.length === 0 && (
        <p className="text-gray-500">작업 데이터를 로드 중입니다...</p>
      )}
      {projects.length === 0 && (
        <p className="text-gray-500">프로젝트 데이터를 로드하지 못했습니다. 부모 컴포넌트를 확인하세요.</p>
      )}

      <div className="absolute top-6 right-6 w-[300px] bg-gray-50 rounded-lg p-4 shadow-sm z-10">
        <h3 className="text-lg font-semibold mb-3">📋 이 달의 작업 ({thisMonthTasks.length})</h3>
        {thisMonthTasks.length > 0 ? (
          <ul className="space-y-2 max-h-[200px] overflow-y-auto">
            {thisMonthTasks.map((task) => {
              const taskIndex = tasks.findIndex((t) => t.task_id === task.task_id);
              const color = taskColors[taskIndex % taskColors.length];
              return (
                <li key={task.task_id} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-800" style={{ color }}>{task.title}</span>
                  <span className="text-gray-500">{task.due_date || "미정"}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">이 달에 예정된 작업이 없습니다.</p>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-6 text-gray-800">📅 내 작업 캘린더</h2>

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
        eventClassNames="text-white px-2 py-1 rounded-lg shadow-sm text-sm cursor-pointer transition-all hover:opacity-90"
        dayCellClassNames="border-gray-100 hover:bg-gray-50 transition-all"
        eventContent={(eventInfo) => (
          <div className="flex items-center gap-2">
            <span className="truncate">{eventInfo.event.title}</span>
            {eventInfo.event.extendedProps.collaborators?.length > 0 && (
              <span className="text-xs bg-white text-gray-600 rounded-full px-2 py-0.5">
                👥 {eventInfo.event.extendedProps.collaborators.length}
              </span>
            )}
          </div>
        )}
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
        dayHeaderClassNames="text-gray-600 font-medium"
        eventBorderColor="transparent"
        eventTextColor="#ffffff"
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
                  const newTask = { ...selectedTask, start_date: e.target.value };
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
                  const newTask = { ...selectedTask, due_date: e.target.value };
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
                  const newTask = { ...selectedTask, project_id: e.target.value };
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
            <p className="text-sm text-gray-500 mb-1">👥 참여자</p>
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
                      !selectedTask.collaborators?.some((c) => c.user_id === member.user_id)
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
                const newTask = { ...selectedTask, description: e.target.value };
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