import React, { useState, useRef } from "react";
import Draggable from "react-draggable";
import {
  Settings2,
  Table,
  GitCompareArrows,
  History,
  Settings,
} from "lucide-react";
import SnapshotHistoryModal from "../modal/SnapshotHistoryModal";

const relationOptions = [
  { label: "1:1 (필수 - 필수)", value: { relation_type: "1:1", participation_source: "required", participation_target: "required" }},
  { label: "1:1 (필수 - 선택)", value: { relation_type: "1:1", participation_source: "required", participation_target: "optional" }},
  { label: "1:N (필수 - 필수)", value: { relation_type: "1:N", participation_source: "required", participation_target: "required" }},
  { label: "1:N (필수 - 선택)", value: { relation_type: "1:N", participation_source: "required", participation_target: "optional" }},
  { label: "1:N (선택 - 선택)", value: { relation_type: "1:N", participation_source: "optional", participation_target: "optional" }},
];

const FloatingToolButton = ({
  erdId,
  onAddTable,
  onAddRelation,
  onStartDragging,
  onStopDragging,
  fetchErdDetail,
  showToast,
}) => {
  const [open, setOpen] = useState(false);
  const [relationMenuOpen, setRelationMenuOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const wasDragging = useRef(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const handleMainClick = () => {
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }
    setOpen((prev) => !prev);
    setRelationMenuOpen(false);
  };

  return (
    <>
      <Draggable
        nodeRef={containerRef}
        defaultPosition={{ x: 25, y: 25 }}
        onStart={() => {
          wasDragging.current = false;
          onStartDragging?.();
        }}
        onDrag={() => {
          wasDragging.current = true;
        }}
        onStop={() => {
          setTimeout(() => (wasDragging.current = false), 50);
          onStopDragging?.();
        }}
      >
        <div
          ref={containerRef}
          className="z-30 fixed"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          {/* 메인 버튼 */}
          <button
            ref={buttonRef}
            onClick={handleMainClick}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Settings2 size={22} className="text-white" />
          </button>

          {/* 확장 메뉴 */}
          {open && (
            <div className="absolute left-0 mt-2 bg-[#2a2a3c] text-white rounded-md shadow-lg w-48 py-2 z-50 space-y-1">
              <button
                onClick={() => {
                  onAddTable?.();
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm"
              >
                <Table size={16} className="text-cyan-400" />
                테이블 추가
              </button>

              <div
                className="relative group"
                onMouseEnter={() => setRelationMenuOpen(true)}
                onMouseLeave={() => setRelationMenuOpen(false)}
              >
                <button className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm">
                  <GitCompareArrows size={16} className="text-pink-400" />
                  관계 추가 ▸
                </button>

                {relationMenuOpen && (
                  <div className="absolute left-full top-0 bg-[#2a2a3c] border-l border-gray-700 rounded-md shadow-lg w-64 z-50">
                    {relationOptions.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => {
                          onAddRelation?.(option.value);
                          setOpen(false);
                          setRelationMenuOpen(false);
                        }}
                        className="block w-full text-left px-3 py-1 hover:bg-[#3a3a4c] text-sm"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowHistoryModal(true);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm"
              >
                <History size={16} className="text-yellow-400" />
                히스토리
              </button>

              <button className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm">
                <Settings size={16} className="text-gray-400" />
                설정
              </button>
            </div>
          )}
        </div>
      </Draggable>

      {showHistoryModal && (
        <SnapshotHistoryModal
          erdId={erdId}
          onClose={() => setShowHistoryModal(false)}
          fetchErdDetail={fetchErdDetail}
          showToast={showToast}
        />
      )}
    </>
  );
};

export default FloatingToolButton;
