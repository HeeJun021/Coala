import React, { useState, useRef, useEffect } from "react";
import { getMyMemos, createMemo, updateMemo, deleteMemo } from "../../api/taskApi";

const MemoTab = ({ projectId = "1210447408078814" }) => {
  const [memos, setMemos] = useState([]);
  const [activeMemoId, setActiveMemoId] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectionRange, setSelectionRange] = useState(null);
  const toolbarRef = useRef(null);
  const blockRefs = useRef({});
  const [toolbarPosition, setToolbarPosition] = useState(null);

  const activeMemo = memos.find((memo) => memo.memo_id === activeMemoId) || null;

  useEffect(() => {
    const fetchProjectMemos = async () => {
      try {
        const response = await getMyMemos();
        setMemos(response || []);
        if (response.length > 0) setActiveMemoId(response[0].memo_id);
      } catch (error) {
        console.error("메모를 불러오지 못했습니다:", error);
        alert("메모를 불러오지 못했습니다.");
        setMemos([]);
      }
    };
    fetchProjectMemos();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setToolbarPosition(null);
        setSelectionRange(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const autoResizeTextarea = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleBlockChange = async (blockId, text) => {
    if (!activeMemo) return;
    const updatedBlocks = activeMemo.blocks.map((b) =>
      b.id === blockId ? { ...b, text } : b
    );
    try {
      const response = await updateMemo(activeMemo.memo_id, { blocks: updatedBlocks });
      setMemos((prev) =>
        prev.map((memo) =>
          memo.memo_id === activeMemo.memo_id ? response : memo
        )
      );
    } catch (error) {
      console.error("메모를 업데이트하지 못했습니다:", error);
      alert("메모를 업데이트하지 못했습니다.");
    }
  };

  const handleBlockKeyDown = async (e, blockId) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const newId = Math.max(...activeMemo.blocks.map((b) => b.id), 0) + 1;
      const updatedBlocks = [
        ...activeMemo.blocks.slice(0, activeMemo.blocks.findIndex((b) => b.id === blockId) + 1),
        { id: newId, type: "p", text: "", styles: {} },
        ...activeMemo.blocks.slice(activeMemo.blocks.findIndex((b) => b.id === blockId) + 1),
      ];
      try {
        const response = await updateMemo(activeMemo.memo_id, { blocks: updatedBlocks });
        setMemos((prev) =>
          prev.map((memo) =>
            memo.memo_id === activeMemo.memo_id ? response : memo
          )
        );
        setSelectedBlockId(newId);
        setTimeout(() => blockRefs.current[newId]?.focus(), 0);
      } catch (error) {
        console.error("메모를 업데이트하지 못했습니다:", error);
        alert("메모를 업데이트하지 못했습니다.");
      }
    } else if (e.key === "Backspace" && blockRefs.current[blockId].value === "") {
      e.preventDefault();
      const blockIndex = activeMemo.blocks.findIndex((b) => b.id === blockId);
      if (blockIndex > 0) {
        const updatedBlocks = activeMemo.blocks.filter((b) => b.id !== blockId);
        try {
          const response = await updateMemo(activeMemo.memo_id, { blocks: updatedBlocks });
          setMemos((prev) =>
            prev.map((memo) =>
              memo.memo_id === activeMemo.memo_id ? response : memo
            )
          );
          const prevBlockId = activeMemo.blocks[blockIndex - 1].id;
          setSelectedBlockId(prevBlockId);
          setTimeout(() => {
            const prevTextarea = blockRefs.current[prevBlockId];
            prevTextarea.focus();
            prevTextarea.selectionStart = prevTextarea.value.length;
            prevTextarea.selectionEnd = prevTextarea.value.length;
          }, 0);
        } catch (error) {
          console.error("메모를 업데이트하지 못했습니다:", error);
          alert("메모를 업데이트하지 못했습니다.");
        }
      }
    }
  };

  const handleSelection = (blockId) => {
    const selection = window.getSelection();
    if (!selection.rangeCount || !selection.toString().trim()) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect) return;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const top = rect.top + scrollY - 40;
    const left = rect.left + scrollX + rect.width / 2;
    setToolbarPosition({ top, left });
    setSelectedBlockId(blockId);
    setSelectionRange({ start: range.startOffset, end: range.endOffset });
  };

  const applyStyle = async (style, value) => {
    if (!selectedBlockId || !selectionRange || !activeMemo) return;
    const block = activeMemo.blocks.find((b) => b.id === selectedBlockId);
    const { start, end } = selectionRange;
    const styleKey = `${start}-${end}`;
    const updatedStyles = {
      ...block.styles,
      [styleKey]: { ...block.styles[styleKey], [style]: value },
    };
    const updatedBlocks = activeMemo.blocks.map((b) =>
      b.id === selectedBlockId ? { ...b, styles: updatedStyles } : b
    );
    try {
      const response = await updateMemo(activeMemo.memo_id, { blocks: updatedBlocks });
      setMemos((prev) =>
        prev.map((memo) =>
          memo.memo_id === activeMemo.memo_id ? response : memo
        )
      );
      setToolbarPosition(null);
      setSelectionRange(null);
    } catch (error) {
      console.error("메모를 업데이트하지 못했습니다:", error);
      alert("메모를 업데이트하지 못했습니다.");
    }
  };

  const renderStyledText = (text, styles) => {
    if (!styles || Object.keys(styles).length === 0) return text;
    const fragments = [];
    let cursor = 0;
    const sortedRanges = Object.entries(styles)
      .map(([range, styleObj]) => {
        const [start, end] = range.split("-").map(Number);
        return { start, end, styleObj };
      })
      .sort((a, b) => a.start - b.start);
    for (const { start, end, styleObj } of sortedRanges) {
      if (cursor < start) fragments.push(text.slice(cursor, start));
      let styled = text.slice(start, end);
      let styleString = "";
      if (styleObj.fontSize) styleString += `font-size:${styleObj.fontSize}px;`;
      if (styleObj.fontFamily) styleString += `font-family:${styleObj.fontFamily};`;
      if (styleObj.bold) styleString += "font-weight:bold;";
      if (styleObj.italic) styleString += "font-style:italic;";
      if (styleObj.underline) styleString += "text-decoration:underline;";
      if (styleObj.code) styleString += "font-family:monospace;background:#f5f5f5;padding:2px 4px;";
      if (styleObj.color) styleString += `color:${styleObj.color};`;
      if (styleObj.backgroundColor) styleString += `background-color:${styleObj.backgroundColor};`;
      fragments.push(`<span style="${styleString}">${styled}</span>`);
      cursor = end;
    }
    if (cursor < text.length) fragments.push(text.slice(cursor));
    return fragments.join("");
  };

  const getMemoTitle = (blocks) => {
    const firstBlock = blocks.find((block) => block.type === "h1") || { text: "" };
    const text = firstBlock.text || "제목 없음";
    return text.length > 20 ? text.slice(0, 20) + "..." : text;
  };

  const getMemoPreview = (blocks) => {
    const firstParagraph = blocks.find((block) => block.type === "p" && block.text) || { text: "" };
    const text = firstParagraph.text || "";
    return text.length > 30 ? text.slice(0, 30) + "..." : text;
  };

  const handleAddMemo = async () => {
    try {
      const response = await createMemo({
        project_id: projectId,
        blocks: [
          { id: 1, type: "h1", text: "새 메모", styles: { bold: true } },
          { id: 2, type: "p", text: "", styles: {} },
        ],
      });
      setMemos((prev) => [...prev, response]);
      setActiveMemoId(response.memo_id);
    } catch (error) {
      console.error("메모를 생성하지 못했습니다:", error);
      alert("메모를 생성하지 못했습니다.");
    }
  };

  const handleDeleteMemo = async (memoId) => {
    if (window.confirm("이 메모를 정말 삭제하시겠습니까?")) {
      try {
        await deleteMemo(memoId);
        setMemos((prev) => prev.filter((memo) => memo.memo_id !== memoId));
        if (activeMemoId === memoId) {
          setActiveMemoId(memos[0]?.memo_id || null);
        }
      } catch (error) {
        console.error("메모를 삭제하지 못했습니다:", error);
        alert("메모를 삭제하지 못했습니다.");
      }
    }
  };

  return (
    <div className="flex w-full h-screen font-sans">
      <div className="w-[250px] bg-gray-100 border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">메모</h2>
        {memos.length === 0 ? (
          <p className="text-sm text-gray-500">메모가 없습니다.</p>
        ) : (
          memos.map((memo) => (
            <div
              key={memo.memo_id}
              className={`cursor-pointer mb-2 p-3 rounded hover:bg-gray-200 text-sm flex flex-col ${
                memo.memo_id === activeMemoId ? "bg-white font-medium" : ""
              }`}
              onClick={() => setActiveMemoId(memo.memo_id)}
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-medium">{getMemoTitle(memo.blocks)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMemo(memo.memo_id);
                  }}
                  className="text-red-500 hover:text-red-600 text-xs"
                  aria-label="메모 삭제"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-1">{getMemoPreview(memo.blocks)}</p>
            </div>
          ))
        )}
        <button
          className="text-sm text-blue-600 mt-4 hover:text-blue-700 font-medium"
          onClick={handleAddMemo}
        >
          + 새 메모
        </button>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="bg-white p-2 border-b flex justify-center items-center space-x-2">
          <button
            onClick={() => applyStyle("bold", true)}
            className="px-2 py-1 hover:bg-gray-100 rounded"
            aria-label="굵게"
          >
            <span className="font-bold">B</span>
          </button>
          <button
            onClick={() => applyStyle("italic", true)}
            className="px-2 py-1 hover:bg-gray-100 rounded"
            aria-label="기울임"
          >
            <span className="italic">I</span>
          </button>
          <button
            onClick={() => applyStyle("underline", true)}
            className="px-2 py-1 hover:bg-gray-100 rounded"
            aria-label="밑줄"
          >
            <span className="underline">U</span>
          </button>
          <button
            onClick={() => applyStyle("code", true)}
            className="px-2 py-1 hover:bg-gray-100 rounded font-mono text-xs"
            aria-label="코드"
          >
            코드
          </button>
          <select
            onChange={(e) => applyStyle("fontSize", e.target.value)}
            className="text-sm border-gray-200 px-1 rounded"
            aria-label="글꼴 크기"
            defaultValue=""
          >
            <option disabled value="">크기</option>
            <option value="10">10</option>
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="20">20</option>
            <option value="24">24</option>
            <option value="28">28</option>
            <option value="32">32</option>
            <option value="36">36</option>
          </select>
          <select
            onChange={(e) => applyStyle("fontFamily", e.target.value)}
            className="text-sm border-gray-200 px-1 rounded"
            aria-label="글꼴"
            defaultValue=""
          >
            <option disabled value="">글꼴</option>
            <option value="Arial">Arial</option>
            <option value="Courier New">Courier New</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Roboto Mono">Roboto Mono</option>
          </select>
          <select
            onChange={(e) => applyStyle("color", e.target.value)}
            className="text-sm border-gray-200 px-1 rounded"
            aria-label="글자 색상"
            defaultValue=""
          >
            <option disabled value="">색상</option>
            <option value="#000000">검정</option>
            <option value="#FF0000">빨강</option>
            <option value="#0000FF">파랑</option>
            <option value="#008000">초록</option>
            <option value="#FFFF00">노랑</option>
            <option value="#800080">보라</option>
          </select>
          <select
            onChange={(e) => applyStyle("backgroundColor", e.target.value)}
            className="text-sm border-gray-200 px-1 rounded"
            aria-label="배경 색상"
            defaultValue=""
          >
            <option disabled value="">배경</option>
            <option value="transparent">없음</option>
            <option value="#FFEEEE">연한 빨강</option>
            <option value="#E0E0FF">연한 파랑</option>
            <option value="#EEFFEE">연한 초록</option>
            <option value="#FFFFEE">연한 노랑</option>
            <option value="#FFE0FF">연한 보라</option>
          </select>
        </div>
        <div className="flex-1 flex justify-center items-start p-4 bg-white">
          {activeMemo && (
            <div className="w-full max-w-[720px]">
              {toolbarPosition && (
                <div
                  ref={toolbarRef}
                  className="absolute z-50 flex gap-1 bg-white shadow-sm border border-gray-200 rounded px-2 py-1"
                  style={{
                    top: `${toolbarPosition.top}px`,
                    left: `${toolbarPosition.left}px`,
                    transform: "translateX(-50%)",
                  }}
                  role="toolbar"
                  aria-label="텍스트 서식 툴바"
                >
                  <button
                    onClick={() => applyStyle("bold", true)}
                    className="px-2 py-1 hover:bg-gray-100 rounded"
                    aria-label="굵게"
                  >
                    <span className="font-bold">B</span>
                  </button>
                  <button
                    onClick={() => applyStyle("italic", true)}
                    className="px-2 py-1 hover:bg-gray-100 rounded"
                    aria-label="기울임"
                  >
                    <span className="italic">I</span>
                  </button>
                  <button
                    onClick={() => applyStyle("underline", true)}
                    className="px-2 py-1 hover:bg-gray-100 rounded"
                    aria-label="밑줄"
                  >
                    <span className="underline">U</span>
                  </button>
                  <button
                    onClick={() => applyStyle("code", true)}
                    className="px-2 py-1 hover:bg-gray-100 rounded font-mono text-xs"
                    aria-label="코드"
                  >
                    코드
                  </button>
                  <select
                    onChange={(e) => applyStyle("fontSize", e.target.value)}
                    className="text-sm border-gray-200 px-1 rounded"
                    aria-label="글꼴 크기"
                    defaultValue=""
                  >
                    <option disabled value="">크기</option>
                    <option value="10">10</option>
                    <option value="12">12</option>
                    <option value="14">14</option>
                    <option value="16">16</option>
                    <option value="18">18</option>
                    <option value="20">20</option>
                    <option value="24">24</option>
                    <option value="28">28</option>
                    <option value="32">32</option>
                    <option value="36">36</option>
                  </select>
                  <select
                    onChange={(e) => applyStyle("fontFamily", e.target.value)}
                    className="text-sm border-gray-200 px-1 rounded"
                    aria-label="글꼴"
                    defaultValue=""
                  >
                    <option disabled value="">글꼴</option>
                    <option value="Arial">Arial</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Roboto Mono">Roboto Mono</option>
                  </select>
                  <select
                    onChange={(e) => applyStyle("color", e.target.value)}
                    className="text-sm border-gray-200 px-1 rounded"
                    aria-label="글자 색상"
                    defaultValue=""
                  >
                    <option disabled value="">색상</option>
                    <option value="#000000">검정</option>
                    <option value="#FF0000">빨강</option>
                    <option value="#0000FF">파랑</option>
                    <option value="#008000">초록</option>
                    <option value="#FFFF00">노랑</option>
                    <option value="#800080">보라</option>
                  </select>
                  <select
                    onChange={(e) => applyStyle("backgroundColor", e.target.value)}
                    className="text-sm border-gray-200 px-1 rounded"
                    aria-label="배경 색상"
                    defaultValue=""
                  >
                    <option disabled value="">배경</option>
                    <option value="transparent">없음</option>
                    <option value="#FFEEEE">연한 빨강</option>
                    <option value="#E0E0FF">연한 파랑</option>
                    <option value="#EEFFEE">연한 초록</option>
                    <option value="#FFFFEE">연한 노랑</option>
                    <option value="#FFE0FF">연한 보라</option>
                  </select>
                </div>
              )}
              {activeMemo.blocks.map((block, index) => (
                <div
                  key={block.id}
                  className={`mb-1 ${
                    block.type === "h1" ? "text-2xl font-semibold text-gray-800" : "text-base text-gray-700"
                  }`}
                >
                  <textarea
                    ref={(el) => {
                      blockRefs.current[block.id] = el;
                      autoResizeTextarea(el);
                    }}
                    value={block.text}
                    onChange={(e) => {
                      handleBlockChange(block.id, e.target.value);
                      autoResizeTextarea(blockRefs.current[block.id]);
                    }}
                    onInput={() => autoResizeTextarea(blockRefs.current[block.id])}
                    onKeyDown={(e) => handleBlockKeyDown(e, block.id)}
                    onSelect={() => handleSelection(block.id)}
                    placeholder={index === activeMemo.blocks.length - 1 ? (block.type === "h1" ? "메모 제목" : "내용을 입력하세요...") : ""}
                    className={`w-full bg-transparent outline-none resize-none break-words whitespace-pre-wrap leading-snug ${
                      block.type === "h1" ? "text-2xl font-semibold" : "text-base"
                    }`}
                    aria-label={block.type === "h1" ? "메모 제목" : "메모 내용"}
                  />
                  <div
                    className="hidden"
                    dangerouslySetInnerHTML={{
                      __html: renderStyledText(block.text, block.styles),
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoTab;