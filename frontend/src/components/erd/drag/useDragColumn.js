import { useRef, useState } from "react";

export const useDragColumn = () => {
  const [dragIndex, setDragIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const draggingRef = useRef(false);

  const startDrag = (index) => {
    draggingRef.current = true;
    setDragIndex(index);
  };

  const endDrag = () => {
    draggingRef.current = false;
    setDragIndex(null);
    setHoverIndex(null);
  };

  return {
    dragIndex,
    hoverIndex,
    setHoverIndex,
    startDrag,
    endDrag,
    draggingRef,
  };
};
