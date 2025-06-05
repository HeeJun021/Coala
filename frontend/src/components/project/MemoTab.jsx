import React, { useState, useRef, useEffect } from "react";
import apiClient from "../../api/apiClient";
import { getMyMemos, createMemo, updateMemo, deleteMemo } from "../../api/taskApi";

const MemoTab = () => {
  const [memos, setMemos] = useState([]);
  const [activeMemoId, setActiveMemoId] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectionRange, setSelectionRange] = useState(null);
  const toolbarRef = useRef(null);
  const blockRefs = useRef({});
  const [toolbarPosition, setToolbarPosition] = useState(null);

  const activeMemo = memos.find((memo) => memo.memo_id === activeMemoId) || null;

  useEffect(() => {
    const fetchMemos = async () => {
      try {
        const response = await getMyMemos();
        setMemos(response || []);
        if (response.length > 0) setActiveMemoId(response[0].memo_id);
      } catch (error) {
        console.error("Failed to fetch memos:", error);
        setMemos([]);
      }
    };
    fetchMemos();
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
    el.style.height = el.scrollHeight + "px";
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
      console.error("Failed to update memo:", error);
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
        console.error("Failed to update memo:", error);
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
      console.error("Failed to update memo:", error);
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
      if (styleObj.code) styleString += "font-family:monospace;background:#eee;padding:2px 4px;";
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
    const text = firstBlock.text || "Untitled";
    return text.length > 15 ? text.slice(0, 15) + "..." : text;
  };

  const handleAddMemo = async () => {
    try {
      const response = await createMemo({
        blocks: [
          { id: 1, type: "h1", text: "New Memo", styles: { bold: true } },
          { id: 2, type: "p", text: "", styles: {} },
        ],
      });
      setMemos((prev) => [...prev, response]);
      setActiveMemoId(response.memo_id);
    } catch (error) {
      console.error("Failed to create memo:", error);
      alert("메모 추가에 실패했습니다.");
    }
  };

  const handleDeleteMemo = async (memoId) => {
    if (window.confirm("정말 이 메모를 삭제하시겠습니까?")) {
      try {
        await deleteMemo(memoId);
        setMemos((prev) => prev.filter((memo) => memo.memo_id !== memoId));
        if (activeMemoId === memoId) {
          setActiveMemoId(memos[0]?.memo_id || null);
        }
      } catch (error) {
        console.error("Failed to delete memo:", error);
        alert("메모 삭제에 실패했습니다.");
      }
    }
  };

  return (
    <div className="flex w-full h-screen">
      <div className="w-60 bg-gray-100 border-r border-gray-300 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">My Memos</h2>
        {memos.length === 0 ? (
          <p className="text-sm text-gray-500">메모가 없습니다.</p>
        ) : (
          memos.map((memo) => (
            <div
              key={memo.memo_id}
              className={`cursor-pointer mb-2 p-2 rounded hover:bg-gray-200 text-sm flex justify-between items-center ${
                memo.memo_id === activeMemoId ? "bg-white font-semibold" : ""
              }`}
              onClick={() => setActiveMemoId(memo.memo_id)}
            >
              <span>{getMemoTitle(memo.blocks)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMemo(memo.memo_id);
                }}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Delete
              </button>
            </div>
          ))
        )}
        <button
          className="text-sm text-blue-600 mt-4 hover:underline"
          onClick={handleAddMemo}
        >
          + New Memo
        </button>
      </div>
      <div className="flex-1 flex justify-center items-start p-12 relative">
        {activeMemo && (
          <div className="w-full max-w-3xl">
            {toolbarPosition && (
              <div
                ref={toolbarRef}
                className="absolute z-50 flex gap-2 bg-white shadow border rounded px-3 py-1"
                style={{
                  top: `${toolbarPosition.top}px`,
                  left: `${toolbarPosition.left}px`,
                  transform: "translateX(-50%)",
                }}
              >
                <button onClick={() => applyStyle("bold", true)} className="font-bold">B</button>
                <button onClick={() => applyStyle("italic", true)} className="italic">I</button>
                <button onClick={() => applyStyle("underline", true)} className="underline">U</button>
                <button onClick={() => applyStyle("code", true)} className="font-mono text-sm bg-gray-200 px-1">Code</button>
                <select
                  onChange={(e) => applyStyle("fontSize", e.target.value)}
                  className="text-sm border px-1"
                  defaultValue=""
                >
                  <option disabled value="">Font Size</option>
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
                  className="text-sm border px-1"
                  defaultValue=""
                >
                  <option disabled value="">Font</option>
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
                  className="text-sm border px-1"
                  defaultValue=""
                >
                  <option disabled value="">Color</option>
                  <option value="#000000">Black</option>
                  <option value="#FF0000">Red</option>
                  <option value="#0000FF">Blue</option>
                  <option value="#008000">Green</option>
                  <option value="#FFFF00">Yellow</option>
                  <option value="#800080">Purple</option>
                </select>
                <select
                  onChange={(e) => applyStyle("backgroundColor", e.target.value)}
                  className="text-sm border px-1"
                  defaultValue=""
                >
                  <option disabled value="">Background</option>
                  <option value="transparent">None</option>
                  <option value="#FFEEEE">Light Red</option>
                  <option value="#E0E0FF">Light Blue</option>
                  <option value="#EEFFEE">Light Green</option>
                  <option value="#FFFFEE">Light Yellow</option>
                  <option value="#FFE0FF">Light Purple</option>
                </select>
              </div>
            )}
            {activeMemo.blocks.map((block) => (
              <div key={block.id} className={`mb-2 ${block.type === "h1" ? "text-2xl font-bold" : "text-base"}`}>
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
                  placeholder={block.type === "h1" ? "Memo Title" : "Type something..."}
                  className={`w-full bg-transparent outline-none resize-none break-words whitespace-pre-wrap overflow-hidden ${
                    block.type === "h1" ? "font-bold text-2xl" : "text-base leading-relaxed"
                  }`}
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
  );
};

export default MemoTab;