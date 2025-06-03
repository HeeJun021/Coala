import React, { useState, useEffect, useRef } from "react";
import { getMyTasks, updateTask, createTask } from "../../api/taskApi";
import { format, addDays, addYears, differenceInDays, parseISO, isValid } from "date-fns";
import { ko } from "date-fns/locale";
import { List, WindowScroller } from "react-virtualized";
import "react-virtualized/styles.css";
import TaskDetailModal from "./TaskDetailModal";

const TimelineWidget = ({ project }) => {
  const [tasks, setTasks] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", start_date: "", due_date: "", status: "예정", dependencies: [], assignee: "" });
  const [selectedTask, setSelectedTask] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const timelineRef = useRef(null);
  const wsRef = useRef(null);

  // 데이터 로드 및 실시간 동기화
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const allTasks = await getMyTasks();
        const projectTasks = allTasks.filter((task) => task.project_id === project.project_id);
        setTasks(projectTasks || []);
      } catch (err) {
        console.error("작업 로드 실패:", err);
        alert("작업을 불러오지 못했습니다.");
      }
    };
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000); // 30초마다 폴링
    return () => clearInterval(interval);
  }, [project.project_id]);

  // 반응형 디자인 감지
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 타임라인 휠 스크롤
  useEffect(() => {
    const handleWheel = (e) => {
      if (timelineRef.current) {
        e.preventDefault();
        timelineRef.current.scrollLeft += e.deltaY;
      }
    };
    const timelineEl = timelineRef.current;
    if (timelineEl) {
      timelineEl.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (timelineEl) {
        timelineEl.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  // 날짜 계산
  const parsedCreatedAt = project?.created_at ? parseISO(project.created_at) : new Date();
  const timelineStartDate = isValid(parsedCreatedAt) ? parsedCreatedAt : new Date();
  const timelineEndDate = addYears(timelineStartDate, 1); // 프로젝트 생성일 + 1년
  const getTimelineDates = () => {
    const totalDays = differenceInDays(timelineEndDate, timelineStartDate);
    return Array.from({ length: totalDays }, (_, i) => addDays(timelineStartDate, i));
  };
  const timelineDates = getTimelineDates();

  // 월별 헤더 계산
  const getMonthHeaders = () => {
    const months = [];
    let currentMonth = format(timelineStartDate, "yyyy-MM");
    let currentDate = timelineStartDate;
    let dayCount = 0;
    while (currentDate <= timelineEndDate) {
      const month = format(currentDate, "yyyy-MM");
      if (month !== currentMonth) {
        months.push({ month: format(parseISO(currentMonth), "M월", { locale: ko }), start: dayCount });
        currentMonth = month;
      }
      dayCount++;
      currentDate = addDays(currentDate, 1);
    }
    months.push({ month: format(parseISO(currentMonth), "M월", { locale: ko }), start: dayCount });
    return months;
  };
  const monthHeaders = getMonthHeaders();

  // 작업 위치 계산
  const getTaskPosition = (task) => {
    const start = task.start_date && isValid(parseISO(task.start_date)) ? parseISO(task.start_date) : timelineStartDate;
    const end = task.due_date && isValid(parseISO(task.due_date)) ? parseISO(task.due_date) : addDays(start, 1);
    const daysFromStart = differenceInDays(start, timelineStartDate);
    const duration = Math.max(differenceInDays(end, start), 1);
    const pixelPerDay = (window.innerWidth - 40 - 160) / 120; // 4개월(120일) 기준
    return { left: daysFromStart * pixelPerDay, width: duration * pixelPerDay };
  };

  // 오늘 날짜 계산 (현재는 2025-06-03 17:50 KST 기준)
  const today = new Date("2025-06-03");

  // 섹션 정의
  const sections = [
    { key: "todo", label: "할 일", status: "예정", color: "bg-blue-100 border-blue-300 text-blue-800" },
    { key: "inprogress", label: "수행 중", status: "수행 중", color: "bg-yellow-100 border-yellow-300 text-yellow-800" },
    { key: "done", label: "완료", status: "완료됨", color: "bg-green-100 border-green-300 text-green-800" },
  ];

  // 섹션별 작업 필터링
  const getSectionTasks = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  // 드래그 이벤트
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.setData("text/plain", task.task_id);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (draggedTask) {
      const pixelPerDay = (window.innerWidth - 40 - 160) / 120;
      const daysOffset = Math.floor((e.clientX - timelineRef.current.getBoundingClientRect().left - 160) / pixelPerDay);
      const newStart = addDays(timelineStartDate, daysOffset).toISOString().split("T")[0];
      const duration = differenceInDays(parseISO(draggedTask.due_date || newStart), parseISO(draggedTask.start_date || newStart));
      const newEnd = addDays(parseISO(newStart), duration).toISOString().split("T")[0];
      try {
        const updatedTask = { ...draggedTask, status: newStatus, start_date: newStart, due_date: newEnd };
        const res = await updateTask(draggedTask.task_id, updatedTask);
        setTasks((prev) => prev.map((t) => (t.task_id === res.task_id ? res : t)));
        updateDependentTasks(draggedTask.task_id, res);
      } catch (err) {
        console.error("작업 상태 업데이트 실패:", err);
      }
      setDraggedTask(null);
    }
  };

  // 작업 기간 조정
  const handleResize = async (taskId, newStart, newEnd) => {
    const task = tasks.find((t) => t.task_id === taskId);
    if (task && newEnd > newStart) {
      try {
        const updatedTask = { ...task, start_date: newStart, due_date: newEnd };
        const res = await updateTask(taskId, updatedTask);
        setTasks((prev) => prev.map((t) => (t.task_id === res.task_id ? res : t)));
        updateDependentTasks(taskId, res);
      } catch (err) {
        console.error("작업 기간 조정 실패:", err);
      }
    }
  };

  // 의존성 관리
  const updateDependentTasks = (taskId, updatedTask) => {
    const dependentTasks = tasks.filter((task) => task.dependencies?.includes(taskId));
    dependentTasks.forEach(async (task) => {
      const newStart = addDays(parseISO(updatedTask.due_date), 1).toISOString().split("T")[0];
      const duration = differenceInDays(parseISO(task.due_date), parseISO(task.start_date));
      const newEnd = addDays(parseISO(newStart), duration).toISOString().split("T")[0];
      try {
        const res = await updateTask(task.task_id, { ...task, start_date: newStart, due_date: newEnd });
        setTasks((prev) => prev.map((t) => (t.task_id === res.task_id ? res : t)));
      } catch (err) {
        console.error("의존 작업 업데이트 실패:", err);
      }
    });
  };

  // 새 작업 추가
  const handleAddTask = async () => {
    if (!newTask.title || !newTask.start_date || !newTask.due_date) {
      alert("제목, 시작 날짜, 마감 날짜는 필수입니다.");
      return;
    }
    try {
      const taskData = {
        ...newTask,
        project_id: project.project_id,
        dependencies: newTask.dependencies || [],
      };
      const res = await createTask(taskData);
      setTasks((prev) => [...prev, res]);
      setNewTask({ title: "", start_date: "", due_date: "", status: "예정", dependencies: [], assignee: "" });
      setSelectedTask(null);
    } catch (err) {
      console.error("작업 추가 실패:", err);
      alert("작업을 추가하지 못했습니다.");
    }
  };

  // 다중 선택 및 작업 클릭
  const handleTaskClick = (e, task) => {
    if (e.metaKey || e.ctrlKey) {
      setSelectedTasks((prev) =>
        prev.includes(task.task_id)
          ? prev.filter((id) => id !== task.task_id)
          : [...prev, task.task_id]
      );
    } else {
      setSelectedTask(task.task_id === selectedTask?.task_id ? null : task);
    }
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        alert("다중 작업 이동 기능은 구현 중입니다.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 가상화 렌더링
  const rowRenderer = ({ index, key, style }) => {
    const section = sections[index];
    const sectionTasks = getSectionTasks(section.status);
    return (
      <div key={key} style={style} className="border-t border-gray-200">
        <div
          className="flex h-full"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, section.status)}
        >
          <div className="w-40 flex-shrink-0 py-2 px-4 bg-gray-50 text-sm font-medium text-gray-700">
            {section.label}
          </div>
          <div className="relative flex-1 min-h-[80px] p-2">
            {sectionTasks.map((task, taskIndex) => {
              const { left, width } = getTaskPosition(task);
              return (
                <div key={task.task_id} style={{ position: "relative", marginTop: `${taskIndex * 24}px` }}>
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={(e) => handleTaskClick(e, task)}
                    onMouseEnter={(e) => {
                      const start = task.start_date && isValid(parseISO(task.start_date)) ? parseISO(task.start_date) : timelineStartDate;
                      const end = task.due_date && isValid(parseISO(task.due_date)) ? parseISO(task.due_date) : addDays(start, 1);
                      e.currentTarget.title = `${format(start, "yyyy-MM-dd")} ~ ${format(end, "yyyy-MM-dd")}`;
                    }}
                    className={`absolute h-8 rounded ${section.color} px-2 py-1 text-xs flex items-center cursor-move hover:opacity-80 transition ${
                      selectedTasks.includes(task.task_id) ? "ring-2 ring-blue-500" : ""
                    }`}
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                      top: "16px",
                      zIndex: 10,
                    }}
                    onDragEnd={(e) => {
                      if (draggedTask) {
                        const pixelPerDay = (window.innerWidth - 40 - 160) / 120;
                        const daysOffset = Math.floor((e.clientX - timelineRef.current.getBoundingClientRect().left - 160) / pixelPerDay);
                        const newStart = addDays(timelineStartDate, daysOffset).toISOString().split("T")[0];
                        const duration = differenceInDays(parseISO(draggedTask.due_date || newStart), parseISO(draggedTask.start_date || newStart));
                        const newEnd = addDays(parseISO(newStart), duration).toISOString().split("T")[0];
                        handleResize(draggedTask.task_id, newStart, newEnd);
                      }
                    }}
                  >
                    <span className="truncate">{task.title}</span>
                    <div
                      className="w-4 h-4 ml-2 cursor-col-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const originalStart = parseISO(task.start_date || new Date().toISOString());
                        const originalEnd = parseISO(task.due_date || addDays(originalStart, 1).toISOString());
                        const pixelPerDay = (window.innerWidth - 40 - 160) / 120;
                        const handleMouseMove = (moveEvent) => {
                          const diff = Math.floor((moveEvent.clientX - startX) / pixelPerDay);
                          const newEnd = addDays(originalEnd, diff).toISOString().split("T")[0];
                          const newStart = addDays(originalStart, diff).toISOString().split("T")[0];
                          handleResize(task.task_id, newStart, newEnd);
                        };
                        const handleMouseUp = () => {
                          document.removeEventListener("mousemove", handleMouseMove);
                          document.removeEventListener("mouseup", handleMouseUp);
                        };
                        document.addEventListener("mousemove", handleMouseMove);
                        document.addEventListener("mouseup", handleMouseUp);
                      }}
                    />
                    {task.dependencies?.length > 0 && (
                      <svg className="absolute -left-4 top-2 w-4 h-4" viewBox="0 0 20 20">
                        <path d="M10 0 L15 5 L10 10" fill="none" stroke="gray" strokeWidth="2" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex-1 min-h-screen bg-gray-100 pl-0 pr-6 py-6">
        <div className="bg-white rounded-lg shadow-sm h-full">
          <div className="flex flex-col h-full">
            {/* 상단 월 헤더와 오늘 날짜 선 */}
            <div
              ref={timelineRef}
              className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 sticky top-0 bg-white z-10"
            >
              <div className="flex-shrink-0 w-40"></div>
              <div className="relative flex">
                {monthHeaders.map((header, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 text-center text-sm font-semibold text-gray-500 border-l border-gray-200"
                    style={{ minWidth: `${(window.innerWidth - 40 - 160) / 4}px` }}
                  >
                    {header.month}
                  </div>
                ))}
                {/* 오늘 날짜 선 */}
                {timelineDates.some(date => differenceInDays(date, today) === 0) && (
                  <div
                    className="absolute h-full bg-blue-500 w-0.5"
                    style={{
                      left: `${differenceInDays(today, timelineStartDate) * ((window.innerWidth - 40 - 160) / 120)}px`,
                      top: 0,
                    }}
                  ></div>
                )}
              </div>
            </div>

            {/* 작업 영역 */}
            {isMobile ? (
              <div className="flex-1 overflow-y-auto">
                {sections.map((section) => (
                  <div key={section.key} className="p-4">
                    <h3 className="text-sm font-medium text-gray-700">{section.label}</h3>
                    {getSectionTasks(section.status).map((task) => (
                      <div
                        key={task.task_id}
                        className={`p-2 my-2 rounded ${section.color} cursor-pointer`}
                        onClick={() => handleTaskClick(null, task)}
                        onMouseEnter={(e) => {
                          const start = task.start_date && isValid(parseISO(task.start_date)) ? parseISO(task.start_date) : timelineStartDate;
                          const end = task.due_date && isValid(parseISO(task.due_date)) ? parseISO(task.due_date) : addDays(start, 1);
                          e.currentTarget.title = `${format(start, "yyyy-MM-dd")} ~ ${format(end, "yyyy-MM-dd")}`;
                        }}
                      >
                        <div className="text-sm">{task.title}</div>
                        <div className="text-xs text-gray-600">
                          {task.start_date} ~ {task.due_date}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <WindowScroller ref={wsRef}>
                {({ height, isScrolling, onChildScroll, scrollTop }) => (
                  <List
                    autoHeight
                    height={height}
                    isScrolling={isScrolling}
                    onScroll={onChildScroll}
                    scrollTop={scrollTop}
                    rowCount={sections.length}
                    rowHeight={({ index }) => {
                      const sectionTasks = getSectionTasks(sections[index].status);
                      return Math.max(100, sectionTasks.length * 24 + 16); // 최소 100px, 작업마다 24px
                    }}
                    rowRenderer={rowRenderer}
                    width={window.innerWidth - 40}
                  />
                )}
              </WindowScroller>
            )}

            {/* 작업 추가 버튼 */}
            <div className="p-4">
              <button
                onClick={() => setSelectedTask({ ...newTask, project_id: project.project_id })}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
              >
                작업 추가
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default TimelineWidget;