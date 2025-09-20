import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { updateTask } from "../../api/taskApi";

import {
  CalendarDays,
  CalendarCheck,
  FolderKanban,
  Palette,
  Users,
  FileText,
} from "lucide-react";

import { colorPalette, getRandomColor, getTextColor } from "../../utils/colorUtils";

const TaskCalendarView = ({ tasks = [], projects = [], onTaskClick, title }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [members, setMembers] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const slideRef = useRef(null);
  const collaboratorRef = useRef(null);
const calendarRef = useRef(null);

  useEffect(() => {
    console.log("Tasks received:", tasks);
    console.log("Projects received:", projects);
  }, [tasks, projects]);

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const mapped = tasks
      .filter((task) => projects.some((proj) => proj.project_id === task.project_id))
      .map((task) => {
        const bg = task.color || "#8da4f1";
        const textColor = getTextColor(bg);

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
  }, [tasks, projects]);

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
          .map((task) => {
            const bg = task.color || "#8da4f1";
            const textColor = getTextColor(bg);
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
          })
      );
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
    const updatedCollaborators = selectedTask.collaborators.filter(
      (c) => c.user_id !== userId
    );
    const newTask = { ...selectedTask, collaborators: updatedCollaborators };
    setSelectedTask(newTask);
    handleUpdateTask(selectedTask.task_id, newTask);
  };

  const handleColorChange = (color) => {
    if (!selectedTask) return;
    const newTask = { ...selectedTask, color: color || getRandomColor() };
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
    <div className="relative w-full h-full">
      {tasks.length === 0 && (
        <p className="text-gray-500">작업 데이터를 로드 중입니다...</p>
      )}
      {projects.length === 0 && (
        <p className="text-gray-500">
          프로젝트 데이터를 로드하지 못했습니다. 부모 컴포넌트를 확인하세요.
        </p>
      )}

      <h2 className="text-2xl font-bold mb-4 text-gray-800 px-6 flex items-center gap-2">
  <CalendarDays size={20} className="text-blue-500" />
  {title || "내 작업 캘린더"}
  </h2>

      <FullCalendar
        ref={calendarRef}
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
          const textColor = eventInfo.event.extendedProps?.textColor ?? "#000000";
          return (
            <div
              className="flex items-center gap-1"
              style={{
                color: textColor,
                fontSize: "13px",
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
      if (calendarRef.current) {
        calendarRef.current.getApi().today();
      }
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
    className="w-[500px] bg-white border-l shadow-xl p-6 fixed right-0 top-0 h-full overflow-y-auto transition-transform duration-300 transform translate-x-0 z-50"
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
        <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
          <CalendarCheck className="w-4 h-4 text-green-600" />
          시작일
        </label>
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
      <div>
        <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
          <Palette className="w-4 h-4 text-pink-600" />
          색상
        </label>
        <select
          value={selectedTask.color || ""}
          onChange={(e) => handleColorChange(e.target.value)}
          className="text-base font-medium border-none focus:outline-none focus:ring-2 focus:ring-blue-200 rounded px-2 py-1 w-full"
        >
          <option value="">랜덤 색상</option>
          {colorPalette.map((color) => (
            <option
              key={color}
              value={color}
              style={{
                backgroundColor: color,
                color: getTextColor(color),
              }}
            >
              {color}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="mb-6 relative">
      <label className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-1">
        <Users className="w-4 h-4 text-yellow-600" />
        참여자
      </label>
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
      <label className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-1">
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