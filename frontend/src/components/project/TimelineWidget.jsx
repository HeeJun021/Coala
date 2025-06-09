import React, { useState, useEffect, useRef, useCallback } from "react";
import { getMyTasks, updateTask, deleteTask } from "../../api/taskApi";
import { format, addDays, addYears, differenceInDays, parseISO, isValid, getDaysInMonth, startOfMonth, lastDayOfMonth, addMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { getProjectMembers } from "../../api/projectApi";

const TimelineWidget = ({ project }) => {
  const [tasks, setTasks] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [hoveredTask, setHoveredTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [draggedDates, setDraggedDates] = useState({ start: null, end: null });
  const [dragStartOffset, setDragStartOffset] = useState(0);
  const [pixelPerDay, setPixelPerDay] = useState((window.innerWidth - 160) / 120);
  const [members, setMembers] = useState([]);
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, width: 0 });
  const [localResizeDates, setLocalResizeDates] = useState({ taskId: null, start: null, end: null });
  const [monthHeaders, setMonthHeaders] = useState([]);
  const timelineRef = useRef(null);
  const contentRef = useRef(null);
  const slideRef = useRef(null);
  const collaboratorRef = useRef(null);

  const parsedCreatedAt = project?.created_at ? parseISO(project.created_at) : parseISO('2025-06-07T19:47:00Z');
  const [timelineStartDate, setTimelineStartDate] = useState(
    isValid(parsedCreatedAt) ? startOfMonth(parsedCreatedAt) : startOfMonth(new Date("2025-06-07T19:47:00+09:00"))
  );
  const [timelineEndDate, setTimelineEndDate] = useState(lastDayOfMonth(addYears(timelineStartDate, 1)));
  const totalDays = differenceInDays(timelineEndDate, timelineStartDate) + 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = Math.max(0, differenceInDays(today, timelineStartDate));
  const todayLeft = todayOffset * pixelPerDay;

  const getMonthHeaders = useCallback(() => {
    const months = [];
    let currentMonth = format(timelineStartDate, "yyyy-MM");
    let currentDate = timelineStartDate;
    let cumulativeDays = 0;

    while (currentDate <= timelineEndDate) {
      const month = format(currentDate, "yyyy-MM");
      if (month !== currentMonth) {
        const startDate = parseISO(currentMonth + "-01");
        const daysInMonth = getDaysInMonth(startDate);
        const monthWidth = daysInMonth * pixelPerDay;

        months.push({
          month: format(startDate, "yyyy년 M월", { locale: ko }),
          startDays: cumulativeDays,
          days: daysInMonth,
          width: monthWidth,
          startDate,
          endDate: addDays(startDate, daysInMonth - 1),
        });

        cumulativeDays += daysInMonth;
        currentMonth = month;
      }
      currentDate = addDays(currentDate, 1);
    }

    const lastStartDate = parseISO(currentMonth + "-01");
    const remainingDays = differenceInDays(timelineEndDate, lastStartDate) + 1;
    const lastMonthWidth = remainingDays * pixelPerDay;
    months.push({
      month: format(lastStartDate, "yyyy년 M월", { locale: ko }),
      startDays: cumulativeDays,
      days: remainingDays,
      width: lastMonthWidth,
      startDate: lastStartDate,
      endDate: timelineEndDate,
    });

    return months;
  }, [timelineStartDate, timelineEndDate, pixelPerDay]);

  useEffect(() => {
    const updatePixelPerDay = () => {
      setPixelPerDay((window.innerWidth - 160) / 120);
    };
    window.addEventListener("resize", updatePixelPerDay);
    return () => window.removeEventListener("resize", updatePixelPerDay);
  }, []);

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
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [project.project_id]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  useEffect(() => {
    const syncScroll = () => {
      if (timelineRef.current && contentRef.current) {
        const scrollLeft = timelineRef.current.scrollLeft;
        contentRef.current.querySelectorAll('.task-section').forEach((section) => {
          section.style.transform = `translateX(-${scrollLeft}px)`;
        });
      }
    };
    const timelineEl = timelineRef.current;
    if (timelineEl) {
      timelineEl.addEventListener("scroll", syncScroll);
    }
    return () => {
      if (timelineEl) {
        timelineEl.removeEventListener("scroll", syncScroll);
      }
    };
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      if (selectedTask && selectedTask.project_id) {
        try {
          const res = await getProjectMembers(selectedTask.project_id);
          setMembers(res || []);
        } catch (err) {
          console.error("Failed to fetch members:", err);
          setMembers([]);
        }
      }
    };
    fetchMembers();
  }, [selectedTask]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMonthHeaders(getMonthHeaders());
  }, [timelineStartDate, timelineEndDate, pixelPerDay, getMonthHeaders]);

  const scrollToTask = (taskId) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const barEl = document.getElementById(`task-bar-${taskId}`);
        const scrollContainer = document.querySelector(".overflow-x-auto");

        if (!barEl || !scrollContainer) {
          console.warn("❌ 작업 바 또는 스크롤 컨테이너를 찾을 수 없음:", taskId);
          return;
        }

        const barLeft = barEl.getBoundingClientRect().left;
        const barWidth = barEl.offsetWidth;
        const containerLeft = scrollContainer.getBoundingClientRect().left;
        const containerWidth = scrollContainer.clientWidth;

        const scrollTarget = scrollContainer.scrollLeft + (barLeft - containerLeft) - (containerWidth / 2) + (barWidth / 2);

        scrollContainer.scrollTo({
          left: scrollTarget,
          behavior: "smooth",
        });

        console.log("✅ 스크롤 이동됨:", scrollTarget);
      });
    });
  };

const getTaskPosition = (task, isDragging = false) => {
  const start = isDragging
    ? draggedDates.start && isValid(draggedDates.start)
      ? draggedDates.start
      : timelineStartDate
    : localResizeDates.taskId === task.task_id && localResizeDates.start
    ? localResizeDates.start
    : task.start_date && isValid(parseISO(task.start_date))
    ? parseISO(task.start_date)
    : timelineStartDate;
  const end = isDragging
    ? draggedDates.end && isValid(draggedDates.end)
      ? draggedDates.end
      : addDays(start, 1)
    : localResizeDates.taskId === task.task_id && localResizeDates.end
    ? localResizeDates.end
    : task.due_date && isValid(parseISO(task.due_date))
    ? parseISO(task.due_date)
    : addDays(start, 1);
  const daysFromStart = Math.max(differenceInDays(start, timelineStartDate), 0);
  const duration = Math.max(differenceInDays(end, start) + 1, 1);
  const width = duration * pixelPerDay;
  return { left: daysFromStart * pixelPerDay, width: Math.max(width, 10) };
};

const sections = [
  { key: "todo", label: "할 일", status: "예정", color: "bg-blue-200 border-blue-400 text-blue-900" },
  { key: "inprogress", label: "진행 중", status: "진행중", color: "bg-yellow-200 border-yellow-400 text-yellow-900" },
  { key: "done", label: "완료", status: "완료됨", color: "bg-green-200 border-green-400 text-green-900" },
];

const getSectionTasks = (status) => {
  return tasks.filter((task) => task.status === status);
};

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.setData("text/plain", task.task_id);
    const originalStart = task.start_date && isValid(parseISO(task.start_date)) ? parseISO(task.start_date) : timelineStartDate;
    const originalEnd = task.due_date && isValid(parseISO(task.due_date)) ? parseISO(task.due_date) : addDays(originalStart, 1);
    setDraggedDates({ start: originalStart, end: originalEnd });
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const sidebarWidth = document.querySelector('.flex-shrink-0.w-40')?.getBoundingClientRect().width || 160;
      const offsetX = e.clientX - rect.left - sidebarWidth;
      const taskStartDays = Math.max(differenceInDays(originalStart, timelineStartDate), 0);
      const taskStartPixels = taskStartDays * pixelPerDay;
      setDragStartOffset(offsetX - taskStartPixels);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (draggedTask && timelineRef.current && !isResizing) {
      const rect = timelineRef.current.getBoundingClientRect();
      const sidebarWidth = document.querySelector('.flex-shrink-0.w-40')?.getBoundingClientRect().width || 160;
      const offsetX = e.clientX - rect.left - sidebarWidth + timelineRef.current.scrollLeft;
      const adjustedOffsetX = offsetX - dragStartOffset;

      const timelineWidth = timelineRef.current.clientWidth;
      const edgeThreshold = timelineWidth * 0.2;
      const maxScrollSpeed = 50;
      let scrollSpeed = 0;

      if (offsetX < edgeThreshold) {
        scrollSpeed = -maxScrollSpeed * (1 - Math.min(offsetX / edgeThreshold, 1));
      } else if (offsetX > timelineWidth - edgeThreshold) {
        scrollSpeed = maxScrollSpeed * (1 - Math.min((timelineWidth - offsetX) / edgeThreshold, 1));
      }

      if (scrollSpeed !== 0) {
        const newScrollLeft = Math.max(
          0,
          Math.min(timelineRef.current.scrollLeft + scrollSpeed, totalDays * pixelPerDay - timelineWidth)
        );
        timelineRef.current.scrollLeft = newScrollLeft;
      }

      const originalStart = draggedTask.start_date && isValid(parseISO(draggedTask.start_date)) ? parseISO(draggedTask.start_date) : timelineStartDate;
      const originalEnd = draggedTask.due_date && isValid(parseISO(draggedTask.due_date)) ? parseISO(draggedTask.due_date) : addDays(originalStart, 1);
      const originalDuration = Math.max(differenceInDays(originalEnd, originalStart) + 1, 1);

      const daysOffset = Math.round(adjustedOffsetX / pixelPerDay);
      const maxOffsetDays = totalDays - originalDuration;
      const clampedOffsetDays = Math.max(0, Math.min(daysOffset, maxOffsetDays));

      const newStart = addDays(timelineStartDate, clampedOffsetDays);
      const newEnd = addDays(newStart, originalDuration - 1);

      if (isValid(newStart) && isValid(newEnd)) {
        setDraggedDates({ start: newStart, end: newEnd });
        const tooltipLeft = Math.max(0, clampedOffsetDays * pixelPerDay);
        const tooltipWidth = originalDuration * pixelPerDay;
        setTooltipPosition({ left: tooltipLeft, width: tooltipWidth });
      }
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (draggedTask && timelineRef.current && !isResizing) {
      const rect = timelineRef.current.getBoundingClientRect();
      const sidebarWidth = document.querySelector('.flex-shrink-0.w-40')?.getBoundingClientRect().width || 160;
      const offsetX = e.clientX - rect.left - sidebarWidth + timelineRef.current.scrollLeft;
      const adjustedOffsetX = offsetX - dragStartOffset;

      const originalStart = draggedTask.start_date && isValid(parseISO(draggedTask.start_date)) ? parseISO(draggedTask.start_date) : timelineStartDate;
      const originalEnd = draggedTask.due_date && isValid(parseISO(draggedTask.due_date)) ? parseISO(draggedTask.due_date) : addDays(originalStart, 1);
      const originalDuration = Math.max(differenceInDays(originalEnd, originalStart) + 1, 1);

      const daysOffset = Math.round(adjustedOffsetX / pixelPerDay);
      const newStart = addDays(timelineStartDate, Math.max(0, Math.min(daysOffset, totalDays - originalDuration)));
      const newEnd = addDays(newStart, originalDuration - 1);

      const newStartISO = newStart.toISOString().split("T")[0];
      const newEndISO = newEnd.toISOString().split("T")[0];

      if (isValid(newStart) && isValid(newEnd) && differenceInDays(newEnd, timelineEndDate) <= 0 && newStart <= newEnd) {
        try {
          const updatedTask = { ...draggedTask, status: newStatus, start_date: newStartISO, due_date: newEndISO };
          const res = await updateTask(draggedTask.task_id, updatedTask);
          const resultTask = { ...res, status: newStatus };
           setTasks((prev) =>
    prev.map((task) => (task.task_id === resultTask.task_id ? resultTask : task))
  );

          updateDependentTasks(draggedTask.task_id, resultTask);
  if (selectedTask && selectedTask.task_id === draggedTask.task_id) {
    setSelectedTask(null);
  }
} catch (err) {
  console.error("작업 상태 업데이트 실패:", err);
}
      }
      setDraggedTask(null);
      setDraggedDates({ start: null, end: null });
      setDragStartOffset(0);
      setTooltipPosition({ left: 0, width: 0 });
    }
  };

  const updateDependentTasks = async (taskId, updatedTask) => {
    const dependentTasks = tasks.filter((task) => task.dependencies?.includes(taskId));
    for (const task of dependentTasks) {
      const originalStart = task.start_date && isValid(parseISO(task.start_date)) ? parseISO(task.start_date) : timelineStartDate;
      const originalEnd = task.due_date && isValid(parseISO(task.due_date)) ? parseISO(task.due_date) : addDays(originalStart, 1);
      const originalDuration = Math.max(differenceInDays(originalEnd, originalStart) + 1, 1);

      const newStart = addDays(parseISO(updatedTask.due_date), 1);
      const newEnd = addDays(newStart, originalDuration - 1);

      const newStartISO = newStart.toISOString().split("T")[0];
      const newEndISO = newEnd.toISOString().split("T")[0];

      try {
        const res = await updateTask(task.task_id, { ...task, start_date: newStartISO, due_date: newEndISO });
        setTasks((prev) => prev.map((t) => (t.task_id === res.task_id ? res : t)));
        if (selectedTask && selectedTask.task_id === task.task_id) {
          setSelectedTask(res);
        }
      } catch (err) {
        console.error("의존 작업 업데이트 실패:", err);
      }
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const updatedStatus = task.status === "완료됨" ? "예정" : "완료됨";
      const updatedTask = { ...task, status: updatedStatus };
      const res = await updateTask(task.task_id, updatedTask);
      setTasks((prev) => prev.map((t) => (t.task_id === res.task_id ? res : t)));
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

  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      const taskData = {
        ...updatedData,
        status: updatedData.status || (updatedData.due_date ? "예정" : "완료됨"),
      };
      const res = await updateTask(taskId, taskData);
      setTasks((prev) => prev.map((task) => (task.task_id === res.task_id ? res : task)));
      setSelectedTask(res);
      setLocalResizeDates({ taskId: null, start: null, end: null }); // Reset after final update
    } catch (err) {
      console.error("Failed to update task:", err);
      alert("작업 수정에 실패했습니다.");
    }
  };

  const getHoverOrDragDates = () => {
    const task = draggedTask || hoveredTask;
    if (!task) return { start: null, end: null, left: 0, width: 0 };
    const isDragging = !!draggedTask;
    const { left, width } = getTaskPosition(task, isDragging);
    const start = isDragging
      ? draggedDates.start
      : localResizeDates.taskId === task.task_id && localResizeDates.start
      ? localResizeDates.start
      : task.start_date && isValid(parseISO(task.start_date)) ? parseISO(task.start_date) : timelineStartDate;
    const end = isDragging
      ? draggedDates.end
      : localResizeDates.taskId === task.task_id && localResizeDates.end
      ? localResizeDates.end
      : task.due_date && isValid(parseISO(task.due_date)) ? parseISO(task.due_date) : addDays(start, 1);
    return { start, end, left, width };
  };

  const handleTaskClick = (task) => {
    if (!isResizing && !draggedTask) {
      setSelectedTask(task.task_id === selectedTask?.task_id ? null : task);
      scrollToTask(task.task_id);
    }
  };

  const handleResizeStart = (e, task, direction) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any click or propagation events during resize

    setIsResizing(true);
    const startX = e.clientX;
    const initialStartDate = new Date(task.start_date);
    const initialDueDate = new Date(task.due_date);
    const taskBar = document.getElementById(`task-bar-${task.task_id}`);
    let currentLeft = taskBar ? taskBar.offsetLeft : 0;
    let currentWidth = taskBar ? taskBar.offsetWidth : 10; // 최소 너비 10px

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const daysDiff = Math.round(deltaX / pixelPerDay);

      if (daysDiff === 0) return;

      let newStartDate = new Date(initialStartDate);
      let newDueDate = new Date(initialDueDate);
      let newLeft = currentLeft;
      let newWidth = currentWidth;

      if (direction === 'start') {
        newStartDate.setDate(initialStartDate.getDate() + daysDiff);
        if (newStartDate < initialDueDate) {
          newLeft = currentLeft + (daysDiff * pixelPerDay);
          newWidth = currentWidth - (daysDiff * pixelPerDay);
          if (newWidth < 10) {
            newWidth = 10;
            newLeft = currentLeft + (currentWidth - 10);
          }
          if (taskBar) {
            taskBar.style.left = `${newLeft}px`;
            taskBar.style.width = `${newWidth}px`;
          }
          if (newStartDate < timelineStartDate) {
            setTimelineStartDate(startOfMonth(newStartDate));
          }
        }
      } else if (direction === 'end') {
        newDueDate.setDate(initialDueDate.getDate() + daysDiff);
        if (newDueDate > initialStartDate) {
          newWidth = currentWidth + (daysDiff * pixelPerDay);
          if (newWidth < 10) newWidth = 10;
          if (taskBar) {
            taskBar.style.width = `${newWidth}px`;
          }
          if (newDueDate > timelineEndDate) {
            setTimelineEndDate(lastDayOfMonth(addMonths(newDueDate, 1)));
          }
        }
      }

      const tooltipLeft = Math.max(0, newLeft);
      const tooltipWidth = Math.max(10, newWidth);
      setTooltipPosition({ left: tooltipLeft, width: tooltipWidth });
      setLocalResizeDates({ taskId: task.task_id, start: newStartDate, end: newDueDate });
    };

    const onMouseUp = async () => {
      setIsResizing(false);
      if (taskBar) {
        const finalLeftDays = Math.round((taskBar.offsetLeft - currentLeft) / pixelPerDay);
        const finalWidthDays = Math.round(taskBar.offsetWidth / pixelPerDay);
        const finalStartDate = addDays(initialStartDate, finalLeftDays);
        const finalEndDate = addDays(finalStartDate, finalWidthDays - 1);

        if (isValid(finalStartDate) && isValid(finalEndDate) && finalStartDate <= finalEndDate) {
          const newTimelineStart = finalStartDate < timelineStartDate ? startOfMonth(finalStartDate) : timelineStartDate;
          const newTimelineEnd = finalEndDate > timelineEndDate ? lastDayOfMonth(addMonths(finalEndDate, 1)) : timelineEndDate;
          setTimelineStartDate(newTimelineStart);
          setTimelineEndDate(newTimelineEnd);

          try {
            const updatedTask = {
              ...task,
              start_date: format(finalStartDate, 'yyyy-MM-dd'),
              due_date: format(finalEndDate, 'yyyy-MM-dd')
            };
            const res = await updateTask(task.task_id, updatedTask);
            setTasks((prev) => prev.map((t) => (t.task_id === res.task_id ? res : t)));
            if (selectedTask && selectedTask.task_id === task.task_id) {
              setSelectedTask(null); // 모달을 닫기 위해 null로 설정
            }
          } catch (err) {
            console.error("작업 업데이트 실패:", err);
            alert("작업 수정에 실패했습니다. 원래 상태로 복구됩니다.");
            taskBar.style.left = `${currentLeft}px`;
            taskBar.style.width = `${currentWidth}px`;
          }
        }
      }
      setTooltipPosition({ left: 0, width: 0 });
      setLocalResizeDates({ taskId: null, start: null, end: null });
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const { start: startDate, end: endDate, left: hoverTooltipLeft, width: hoverTooltipWidth } = getHoverOrDragDates();

  return (
    <div className="flex w-full px-0 py-6 bg-gray-50">
      <div className="flex-1 min-h-screen bg-white rounded-lg overflow-hidden relative">
        <div className="flex flex-col h-full">
          <div className="overflow-x-auto" style={{ width: '100%' }}>
            <div className="min-w-max relative">
              {/* 날짜 헤더 */}
              <div
                ref={timelineRef}
                className="flex flex-col sticky top-0 bg-white z-0 border-b border-gray-300"
                style={{ height: '80px' }}
              >
                <div
                  className="absolute z-40"
                  style={{
                    top: '-8px', // 헤더보다 살짝 위에 표시
                    left: `${todayLeft + 160 - 8}px`, // ▼ 중앙 정렬 (삼각형 너비 고려)
                  }}
                >
                  <div className="text-emerald-500 text-lg leading-none">▼</div>
                </div>
                <div
                  className="absolute w-[2px] bg-emerald-500/40 z-30"
                  style={{
                    top: 0,
                    left: `${todayLeft + 160}px`,
                    height: `${80 + sections.reduce((sum, section) => sum + (getSectionTasks(section.status).length * 40 + 80), 0)}px`,
                  }}
                ></div>
                {/* 상단: 월 표시 */}
                <div className="flex" style={{ height: '40px' }}>
                  <div className="flex-shrink-0 w-40"></div>
                  <div
                    className="relative flex"
                    style={{
                      width: `${totalDays * pixelPerDay}px`,
                      minWidth: `${totalDays * pixelPerDay}px`,
                    }}
                  >
                    {(draggedTask || hoveredTask) && (
                      <div
                        className="absolute text-xs font-medium bg-blue-600 text-white px-3 py-1 rounded-full flex items-center justify-center z-20"
                        style={{
                          top: '6px',
                          left: draggedTask ? `${tooltipPosition.left}px` : `${hoverTooltipLeft}px`,
                          width: draggedTask ? `${tooltipPosition.width}px` : `${hoverTooltipWidth}px`,
                          minWidth: '120px',
                        }}
                      >
                        {`${format(draggedTask ? draggedDates.start : startDate, "M월 d일", { locale: ko })} - ${format(draggedTask ? draggedDates.end : endDate, "M월 d일", { locale: ko })}`}
                      </div>
                    )}
                    {monthHeaders.map((header, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 text-center text-sm font-semibold text-gray-700 relative"
                        style={{
                          width: `${header.width}px`,
                          minWidth: `${header.width}px`,
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {header.month}
                        {index > 0 && (
                          <div
                            className="absolute bg-gray-300"
                            style={{
                              top: 0,
                              bottom: 0,
                              left: 0,
                              width: '1px',
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 하단: 주차 표시 */}
                <div className="flex border-t border-gray-200" style={{ height: '40px' }}>
                  <div className="flex-shrink-0 w-40 flex items-center justify-center text-xs text-gray-500 border-r border-gray-200">
                    주차
                  </div>
                  <div className="relative flex">
                    {Array.from({ length: totalDays }).map((_, i) => {
                      if (i % 7 !== 0) return null;
                      const weekNum = Math.floor(i / 7) + 1;
                      return (
                        <div
                          key={i}
                          className="flex-shrink-0 border-r border-gray-100 text-center text-xs text-gray-500 flex items-center justify-center"
                          style={{
                            width: `${pixelPerDay * 7}px`,
                            minWidth: `${pixelPerDay * 7}px`,
                            height: '100%',
                          }}
                        >
                          {weekNum}주차
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* 타스크 바디 */}
              <div ref={contentRef} style={{ width: `${totalDays * pixelPerDay + 200}px` }}>
                {isMobile ? (
                  sections.map((section) => {
                    const sectionTasks = getSectionTasks(section.status);
                    return (
                      <div
                        key={section.key}
                        className="p-4 border-b"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, section.status)}
                      >
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">
                          {section.label} ({sectionTasks.length})
                        </h3>
                        {sectionTasks.map((task) => (
                          <div
                            key={task.task_id}
                            className={`p-3 my-2 rounded-lg ${section.color} cursor-pointer px-4 shadow-sm hover:shadow-md transition-all duration-200`}
                            onMouseEnter={() => setHoveredTask(task)}
                            onMouseLeave={() => setHoveredTask(null)}
                            onClick={() => handleTaskClick(task)}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task)}
                          >
                            <div className="text-sm font-medium">{task.title}</div>
                            <div className="text-xs text-gray-600">
                              {localResizeDates.taskId === task.task_id && localResizeDates.start
                                ? format(localResizeDates.start, 'yyyy-MM-dd')
                                : task.start_date || format(timelineStartDate, 'yyyy-MM-dd')} - 
                              {localResizeDates.taskId === task.task_id && localResizeDates.end
                                ? format(localResizeDates.end, 'yyyy-MM-dd')
                                : task.due_date || format(addDays(timelineStartDate, 1), 'yyyy-MM-dd')}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })
                ) : (
                  sections.map((section) => {
                    const sectionTasks = getSectionTasks(section.status);
                    const sectionHeight = 80 + sectionTasks.length * 40;
                    return (
                      <div
                        key={section.key}
                        className="border-t border-gray-300 task-section"
                        style={{ height: `${sectionHeight}px` }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, section.status)}
                      >
                        <div className="flex h-full">
                          <div className="w-40 flex-shrink-0 py-3 px-4 bg-gray-100 text-sm font-semibold text-gray-800 flex items-center">
                            {section.label} <span className="ml-2 text-xs text-gray-500">({sectionTasks.length})</span>
                          </div>
                          <div className="relative p-3" style={{ width: '100%', overflowX: 'hidden' }}>
                            <div
                              className="absolute"
                              style={{ width: `${totalDays * pixelPerDay}px`, left: '0' }}
                            >
                              {sectionTasks.map((task, taskIndex) => {
                                const { left, width } = getTaskPosition(task);
                                return (
                                  <div key={task.task_id} style={{ position: 'relative', marginTop: `${taskIndex * 36}px` }}>
                                    <div
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, task)}
                                      onMouseEnter={() => setHoveredTask(task)}
                                      onMouseLeave={() => setHoveredTask(null)}
                                      onClick={(e) => {
                                        if (!isResizing && !draggedTask) {
                                          handleTaskClick(task);
                                        }
                                      }}
                                      className={`absolute h-8 rounded-lg ${section.color} px-3 py-1 text-xs font-medium flex items-center cursor-move hover:shadow-md transition-all duration-200 z-[1] group`}
                                      style={{
                                        left: `${left}px`,
                                        width: `${width}px`,
                                        backgroundColor: section.color.split(' ')[0],
                                        border: `1px solid ${section.color.split(' ')[1]}`,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                      }}
                                      id={`task-bar-${task.task_id}`}
                                    >
                                      <div
                                        className="absolute left-0 top-0 h-full w-2 bg-gray-400/50 rounded-l cursor-ew-resize opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-mono"
                                        onMouseDown={(e) => handleResizeStart(e, task, 'start')}
                                      >
                                        ||
                                      </div>

                                      <span className="truncate flex-1 whitespace-nowrap">{task.title}</span>
                                      <div
                                        className="absolute right-0 top-0 h-full w-2 bg-gray-400/50 rounded-r cursor-ew-resize opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-mono"
                                        onMouseDown={(e) => handleResizeStart(e, task, 'end')}
                                      >
                                        ||
                                      </div>

                                      {task.dependencies?.length > 0 && (
                                        <svg className="absolute -left-2 top-2 w-4 h-4" viewBox="0 0 20 20">
                                          <path d="M10 0 L15 5 L10 17" fill="none" stroke="gray" strokeWidth="2" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {!isMobile && (
                  <div className="mt-12 px-4">
                    <div className="bg-yellow-100 p-4 rounded-xl shadow-md space-y-4 w-full max-w-md">
                      📌 작업 미리보기
                      {sections.map((section) => {
                        const sectionTasks = getSectionTasks(section.status);
                        return (
                          <div key={section.key}>
                            <div className="flex items-center my-4">
                              <div className="flex-grow h-px bg-gray-400" />
                              <span className="mx-3 text-sm font-bold text-gray-700 whitespace-nowrap">
                                {section.label}
                              </span>
                              <div className="flex-grow h-px bg-gray-400" />
                            </div>
                            {sectionTasks.length > 0 ? (
                              <ul className="space-y-1">
                                {sectionTasks.map((task) => (
                                  <li
                                    key={task.task_id}
                                    className="text-sm text-gray-700 hover:bg-yellow-200 rounded px-2 py-1 cursor-pointer"
                                    onClick={() => scrollToTask(task.task_id)}
                                  >
                                    {task.title}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-500">작업 없음</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedTask && (
        <div
          ref={slideRef}
          className="w-[500px] bg-white border-l shadow-2xl rounded-lg p-8 fixed right-0 top-0 h-full overflow-y-auto z-30"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setSelectedTask(null)}
              className="text-gray-600 hover:text-gray-900 text-xl font-bold"
            >
              ✗
            </button>
            <button
              onClick={() => handleDeleteTask(selectedTask.task_id)}
              className="text-red-600 hover:bg-red-100 rounded px-3 py-1 text-sm font-semibold"
            >
              작업 삭제
            </button>
          </div>
          <div className="mb-6 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedTask.status === "완료됨"}
              onChange={() => handleToggleComplete(selectedTask)}
              className="h-5 w-5 accent-blue-600 rounded"
            />
            <input
              type="text"
              value={selectedTask.title}
              onChange={(e) => {
                const newTask = { ...selectedTask, title: e.target.value };
                setSelectedTask(newTask);
                handleUpdateTask(selectedTask.task_id, newTask);
              }}
              className="text-lg font-semibold border-none bg-gray-100 focus:ring-blue-500 rounded px-3 py-2 w-full"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">📅 시작일</p>
              <input
                type="date"
                value={selectedTask.start_date || ""}
                onChange={(e) => {
                  const newTask = { ...selectedTask, start_date: e.target.value };
                  setSelectedTask(newTask);
                  handleUpdateTask(selectedTask.task_id, newTask);
                }}
                className="text-sm border-none bg-gray-100 rounded px-2 py-1 w-full focus:ring-blue-500"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">📅 마감일</p>
              <input
                type="date"
                value={selectedTask.due_date || ""}
                onChange={(e) => {
                  const newTask = { ...selectedTask, due_date: e.target.value };
                  setSelectedTask(newTask);
                  handleUpdateTask(selectedTask.task_id, newTask);
                }}
                className="text-sm border-none bg-gray-100 rounded px-2 py-1 w-full focus:ring-blue-500"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">📖 프로젝트</p>
              <select
                value={selectedTask.project_id || ""}
                onChange={(e) => {
                  const newTask = { ...selectedTask, project_id: e.target.value };
                  setSelectedTask(newTask);
                  handleUpdateTask(selectedTask.task_id, newTask);
                }}
                className="text-sm border-none bg-gray-100 rounded px-2 py-1 w-full focus:ring-blue-500"
              >
                <option value="">프로젝트 없음</option>
                {[{ project_id: project?.project_id, name: project?.name }].map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">🚦 상태</p>
              <p className="text-sm font-semibold text-gray-700">{selectedTask.status || "없음"}</p>
            </div>
          </div>
          <div className="mb-6 relative">
            <p className="text-xs font-medium text-gray-500 mb-2">👥 참여자</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTask.collaborators?.length > 0 ? (
                selectedTask.collaborators.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center bg-gray-100 text-gray-800 text-xs font-medium rounded-md px-3 py-1"
                  >
                    {user.nickname}
                    <button
                      onClick={() => handleRemoveCollaborator(user.user_id)}
                      className="ml-2 text-blue-600 hover:text-red-600"
                    >
                      ✗
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-500">참여자가 없습니다.</span>
              )}
              <button
                onClick={() => setIsAddingCollaborator(true)}
                className="text-xs text-blue-600 hover:bg-blue-100 rounded px-2 py-1"
              >
                + 참여자 추가
              </button>
            </div>
            {isAddingCollaborator && (
              <div
                ref={collaboratorRef}
                className="absolute z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-h-48 overflow-y-auto"
              >
                {members.length > 0 ? (
                  members
                    .filter(
                      (member) =>
                        !selectedTask.collaborators?.some((c) => c.user_id === member.user_id)
                    )
                    .map((member) => (
                      <div
                        key={member.user_id}
                        onClick={() => handleAddCollaborator(member)}
                        className="px-3 py-2 hover:bg-blue-50 rounded cursor-pointer text-sm text-gray-700"
                      >
                        {member.nickname}
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-gray-500">추가 가능한 참여자가 없습니다.</p>
                )}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">📄 설명</h3>
            <textarea
              value={selectedTask.description || ""}
              onChange={(e) => {
                const newTask = { ...selectedTask, description: e.target.value };
                setSelectedTask(newTask);
                handleUpdateTask(selectedTask.task_id, newTask);
              }}
              className="w-full text-sm border border-gray-200 rounded-lg py-3 focus:ring-blue-500 focus:border-blue-500 h-40 resize-none"
              placeholder="설명을 입력해 주세요..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineWidget;