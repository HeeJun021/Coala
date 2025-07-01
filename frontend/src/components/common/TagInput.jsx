import React, { useState } from "react";
import {
  Atom,
  Server,
  Feather,
  Boxes,
  TerminalSquare,
  Cloud,
  FileCode,
  Settings,
  Database,
  Globe,
  X,
} from "lucide-react";

// 자동완성 + 아이콘 렌더링용 데이터
export const techStackOptions = [
  { label: "React", icon: <Atom size={16} className="text-cyan-500" /> },
  { label: "Next.js", icon: <Globe size={16} className="text-black" /> },
  { label: "Node.js", icon: <Server size={16} className="text-green-600" /> },
  {
    label: "TypeScript",
    icon: <FileCode size={16} className="text-blue-500" />,
  },
  { label: "Python", icon: <Feather size={16} className="text-yellow-500" /> },
  {
    label: "FastAPI",
    icon: <TerminalSquare size={16} className="text-emerald-600" />,
  },
  { label: "Django", icon: <Settings size={16} className="text-green-800" /> },
  { label: "MySQL", icon: <Database size={16} className="text-blue-700" /> },
  {
    label: "PostgreSQL",
    icon: <Database size={16} className="text-indigo-700" />,
  },
  { label: "MongoDB", icon: <Boxes size={16} className="text-green-700" /> },
  {
    label: "TailwindCSS",
    icon: <Feather size={16} className="text-sky-400" />,
  },
  { label: "Docker", icon: <Cloud size={16} className="text-sky-500" /> },
  { label: "AWS", icon: <Cloud size={16} className="text-orange-400" /> },
];

const TagInput = ({
  tags,
  setTags,
  placeholder = "Enter and press Enter",
  max = 10,
  suggestions = [],
  onBlur,
  onTagsChange,
}) => {
  const [input, setInput] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (highlightIndex >= 0 && filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[highlightIndex]);
      } else {
        addTag(input.trim());
      }
      setInput("");
      setFilteredSuggestions([]);
      setHighlightIndex(-1);
    }

    if (e.key === "ArrowDown") {
      setHighlightIndex((prev) =>
        Math.min(prev + 1, filteredSuggestions.length - 1)
      );
    }

    if (e.key === "ArrowUp") {
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    }

    if (e.key === "Escape") {
      setFilteredSuggestions([]);
      setHighlightIndex(-1);
    }
  };

  const addTag = (newTag) => {
    const label = typeof newTag === "string" ? newTag : newTag.label;
    if (!label || tags.includes(label) || tags.length >= max) return;
    const updatedTags = [...tags, label];
    setTags(updatedTags);
    onTagsChange?.(updatedTags); 
  };

  const handleRemove = (index) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    setTags(updatedTags);
    onTagsChange?.(updatedTags);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (value.trim()) {
      const filtered = suggestions.filter(
        (s) =>
          s.label.toLowerCase().includes(value.toLowerCase()) &&
          !tags.includes(s.label)
      );
      setFilteredSuggestions(filtered);
      setHighlightIndex(-1);
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleSuggestionClick = (tag) => {
    addTag(tag);
    setInput("");
    setFilteredSuggestions([]);
    setHighlightIndex(-1);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded px-3 py-2 min-h-[44px] focus-within:border-green-600 transition">
        {tags.map((tag, idx) => {
          const matched = suggestions.find((s) => s.label === tag);
          return (
            <span
              key={idx}
              className="bg-green-100 text-green-700 text-sm px-2 py-1 rounded flex items-center gap-1"
            >
              {matched?.icon}
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="hover:text-red-500"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur} // ✅ 추가
          className="flex-grow min-w-[100px] border-none outline-none text-sm"
          placeholder={tags.length === 0 ? placeholder : ""}
        />
      </div>

      {filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-200 w-full mt-1 rounded shadow max-h-48 overflow-y-auto">
          {filteredSuggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(item)}
              className={`px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100 ${
                highlightIndex === index ? "bg-gray-100" : ""
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagInput;
