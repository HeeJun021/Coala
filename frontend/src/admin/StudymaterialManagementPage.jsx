import React, { useEffect, useState, useCallback } from "react";
import { fetchStudyMaterialSummary, deleteStudyMaterial, fetchStudyMaterialById, fetchStudyExamples, updateStudyMaterial, updateStudyExample, deleteStudyExample } from "../api/adminApi";
import { fetchLanguages } from "../api/studyMaterialsApi";
import { FaEllipsisV } from "react-icons/fa";
import axios from "axios";

const StudyMaterialManagementPage = () => {
  const [materials, setMaterials] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [language, setLanguage] = useState("HTML");
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    language_id: 1,
    title: "",
    content: "",
    sections: [],
    is_example: false,
  });
  const [error, setError] = useState("");

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetchStudyMaterialSummary(language);
      setMaterials(res);
    } catch (err) {
      console.error("학습자료 목록 조회 실패:", err);
      setError("학습자료 목록 조회 실패: " + err.message);
    }
  }, [language]);

  const fetchLanguagesData = useCallback(async () => {
    try {
      const data = await fetchLanguages();
      setLanguages(data.map((lang) => ({ value: lang.language_id, label: lang.language })));
    } catch (err) {
      console.error("언어 목록 조회 실패:", err);
      setError("언어 목록 조회 실패: " + err.message);
    }
  }, []);

  const handleEdit = async (id, isExample) => {
    try {
      let data;
      if (isExample) {
        const examples = await fetchStudyExamples(language);
        data = examples.find((ex) => ex.example_id === id);
      } else {
        data = await fetchStudyMaterialById(language, id);
      }
      if (data) {
        setFormData({
          id: isExample ? data.example_id : data.material_id,
          language_id: data.language_id || 1,
          title: data.title || "",
          content: data.content || "",
          sections: data.sections || [],
          is_example: isExample,
        });
        setIsEditMode(true);
        setShowForm(true);
      } else {
        setError("데이터를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("데이터 조회 실패:", err);
      setError("데이터 조회 실패: " + err.message);
    }
  };

  const handleDelete = async (id, isExample) => {
    const confirmed = window.confirm("정말로 이 항목을 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      if (isExample) {
        await deleteStudyExample(id);
      } else {
        await deleteStudyMaterial(id);
      }
      alert("삭제되었습니다.");
      fetchMaterials();
    } catch (err) {
      console.error("삭제 실패:", err);
      setError("삭제 실패: " + err.message);
    }
  };

  const handleClickOutside = useCallback((e) => {
    if (!e.target.closest(".dropdown")) {
      setDropdownOpenId(null);
    }
  }, []);

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [
        ...formData.sections,
        { type: "", content: "", description: "", style: "", title: "", problem_description: "" },
      ],
    });
  };

  const updateSection = (index, field, value) => {
    const newSections = [...formData.sections];
    if (field === "content" && newSections[index].type === "quiz") {
      newSections[index][field] = typeof value === "object" ? value : { question: "", options: [], correct_answer: "", explanation: "" };
    } else {
      newSections[index][field] = value;
    }
    setFormData({ ...formData, sections: newSections });
  };

  const handleImageUpload = async (file, index) => {
    if (!file) {
      setError("이미지 파일을 선택하세요.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("이미지 파일은 5MB 이하여야 합니다.");
      return;
    }
    const uploadData = new FormData();
    uploadData.append("file", file);
    const uploadUrl = `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/admin/upload/image`;
    try {
      console.log("이미지 업로드 요청:", { url: uploadUrl, file: { name: file.name, size: file.size, type: file.type } });
      const response = await axios.post(uploadUrl, uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("이미지 업로드 성공:", response.data);
      updateSection(index, "content", response.data.image_path);
      setError("");
    } catch (err) {
      console.error("이미지 업로드 실패:", err.response?.data || err.message);
      setError(`이미지 업로드 실패: ${err.response?.status || "알 수 없음"} - ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !formData.language_id) {
      setError("제목, 본문, 언어를 입력하세요.");
      return;
    }
    for (const section of formData.sections) {
      if (section.type === "quiz") {
        if (!section.content?.question || !section.content?.options || section.content.options.length < 2 || !section.content?.correct_answer) {
          setError("퀴즈 섹션은 질문, 최소 2개 옵션, 정답이 필요합니다.");
          return;
        }
        if (!section.content.options.includes(section.content.correct_answer)) {
          setError("퀴즈 정답은 옵션 중 하나여야 합니다.");
          return;
        }
      }
      if (section.type === "image" && !section.content) {
        setError("이미지 섹션에 이미지를 업로드하세요.");
        return;
      }
    }
    try {
      const payload = {
        language_id: formData.language_id,
        title: formData.title,
        content: formData.content,
        sections: formData.sections,
      };
      console.log("제출 payload:", JSON.stringify(payload, null, 2));
      if (isEditMode) {
        if (formData.is_example) {
          await updateStudyExample(formData.id, payload);
          alert("예제가 수정되었습니다.");
        } else {
          await updateStudyMaterial(formData.id, payload);
          alert("학습자료가 수정되었습니다.");
        }
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:8000"}/admin/study-materials/create`, {
          ...payload,
          is_example: formData.is_example,
        });
        alert(`${formData.is_example ? "예제" : "학습자료"}가 추가되었습니다.`);
      }
      setFormData({
        id: null,
        language_id: 1,
        title: "",
        content: "",
        sections: [],
        is_example: false,
      });
      setShowForm(false);
      setIsEditMode(false);
      fetchMaterials();
    } catch (err) {
      console.error(`${isEditMode ? "수정" : "추가"} 실패:`, err.response?.data || err.message);
      setError(`${isEditMode ? "수정" : "추가"} 실패: ${err.response?.status || "알 수 없음"} - ${err.response?.data?.detail || err.message}`);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchLanguagesData();
  }, [fetchMaterials, fetchLanguagesData]);

  useEffect(() => {
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [handleClickOutside]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">학습자료 관리</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-1 border rounded"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.label}>{lang.label}</option>
          ))}
        </select>
        <button
          className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => {
            setShowForm(!showForm);
            setIsEditMode(false);
            setFormData({
              id: null,
              language_id: 1,
              title: "",
              content: "",
              sections: [],
              is_example: false,
            });
          }}
        >
          {showForm ? "폼 닫기" : "새 자료 추가"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-4">
            {isEditMode ? `수정: ${formData.title}` : `새 ${formData.is_example ? "예제" : "학습자료"} 추가`}
          </h2>
          <div className="mb-4">
            <label className="block mb-1">타입:</label>
            <select
              value={formData.is_example}
              onChange={(e) => setFormData({ ...formData, is_example: e.target.value === "true" })}
              className="px-3 py-1 border rounded"
              disabled={isEditMode}
            >
              <option value="false">학습자료</option>
              <option value="true">예제</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">언어:</label>
            <select
              value={formData.language_id}
              onChange={(e) => setFormData({ ...formData, language_id: parseInt(e.target.value) })}
              className="px-3 py-1 border rounded"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">제목:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1">내용:</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-1 border rounded"
            />
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">섹션</h3>
            {formData.sections.map((section, index) => (
              <div key={index} className="mb-4 p-4 bg-white rounded shadow">
                <label className="block mb-1">섹션 타입:</label>
                <select
                  value={section.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    const newSection = { ...section, type: newType };
                    if (newType === "quiz" && !section.content?.question) {
                      newSection.content = { question: "", options: [], correct_answer: "", explanation: "" };
                    }
                    updateSection(index, "type", newType);
                  }}
                  className="px-3 py-1 border rounded mb-2"
                >
                  <option value="">선택</option>
                  <option value="text">텍스트</option>
                  <option value="code">코드</option>
                  <option value="image">이미지</option>
                  <option value="quiz">퀴즈</option>
                  <option value="definition">정의</option>
                  <option value="video">비디오</option>
                </select>
                {section.type === "text" && (
                  <div>
                    <label className="block mb-1">내용:</label>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(index, "content", e.target.value)}
                      className="w-full px-3 py-1 border rounded"
                    />
                  </div>
                )}
                {section.type === "code" && (
                  <>
                    <label className="block mb-1">코드 제목:</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(index, "title", e.target.value)}
                      className="w-full px-3 py-1 border rounded mb-2"
                    />
                    <label className="block mb-1">코드 내용:</label>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(index, "content", e.target.value)}
                      className="w-full px-3 py-1 border rounded mb-2"
                    />
                    <label className="block mb-1">문제 설명:</label>
                    <input
                      type="text"
                      value={section.problem_description}
                      onChange={(e) => updateSection(index, "problem_description", e.target.value)}
                      className="w-full px-3 py-1 border rounded"
                    />
                  </>
                )}
                {section.type === "image" && (
                  <>
                    <label className="block mb-1">이미지 업로드 (최대 5MB):</label>
                    {section.content && section.content.startsWith("http") && (
                      <p className="text-red-500 mb-2">유효하지 않은 외부 URL({section.content})이 감지되었습니다. 새 이미지를 업로드하여 교체하세요.</p>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], index)}
                      className="mb-2"
                    />
                    {section.content && (
                      <img
                        src={section.content.startsWith("http") ? section.content : `${process.env.REACT_APP_API_URL || "http://localhost:8000"}${section.content}`}
                        alt="Preview"
                        className="max-w-xs mt-2"
                        onError={(e) => {
                          console.error(`이미지 로드 실패: ${section.content}`);
                          e.target.src = "/fallback-image.png";
                        }}
                      />
                    )}
                    <label className="block mb-1">설명:</label>
                    <input
                      type="text"
                      value={section.description}
                      onChange={(e) => updateSection(index, "description", e.target.value)}
                      className="w-full px-3 py-1 border rounded"
                    />
                  </>
                )}
                {section.type === "quiz" && (
                  <>
                    <label className="block mb-1">질문:</label>
                    <input
                      type="text"
                      value={section.content.question || ""}
                      onChange={(e) => updateSection(index, "content", { ...section.content, question: e.target.value })}
                      className="w-full px-3 py-1 border rounded mb-2"
                    />
                    <label className="block mb-1">옵션 (쉼표로 구분):</label>
                    <input
                      type="text"
                      value={section.content.options ? section.content.options.join(",") : ""}
                      onChange={(e) =>
                        updateSection(index, "content", { ...section.content, options: e.target.value.split(",").map((opt) => opt.trim()) })
                      }
                      className="w-full px-3 py-1 border rounded mb-2"
                    />
                    <label className="block mb-1">정답:</label>
                    <input
                      type="text"
                      value={section.content.correct_answer || ""}
                      onChange={(e) => updateSection(index, "content", { ...section.content, correct_answer: e.target.value })}
                      className="w-full px-3 py-1 border rounded mb-2"
                    />
                    <label className="block mb-1">설명:</label>
                    <input
                      type="text"
                      value={section.content.explanation || ""}
                      onChange={(e) => updateSection(index, "content", { ...section.content, explanation: e.target.value })}
                      className="w-full px-3 py-1 border rounded"
                    />
                  </>
                )}
                {section.type === "definition" && (
                  <>
                    <label className="block mb-1">정의 (JSON 형식):</label>
                    <textarea
                      value={JSON.stringify(section.content, null, 2)}
                      onChange={(e) => {
                        try {
                          updateSection(index, "content", JSON.parse(e.target.value));
                        } catch {
                          setError("유효한 JSON 형식이 아닙니다.");
                        }
                      }}
                      className="w-full px-3 py-1 border rounded"
                    />
                  </>
                )}
                {section.type === "video" && (
                  <>
                    <label className="block mb-1">비디오 URL:</label>
                    <input
                      type="text"
                      value={section.content}
                      onChange={(e) => updateSection(index, "content", e.target.value)}
                      className="w-full px-3 py-1 border rounded mb-2"
                    />
                    <label className="block mb-1">설명:</label>
                    <input
                      type="text"
                      value={section.description}
                      onChange={(e) => updateSection(index, "description", e.target.value)}
                      className="w-full px-3 py-1 border rounded"
                    />
                  </>
                )}
                <label className="block mb-1">스타일:</label>
                <input
                  type="text"
                  value={section.style}
                  onChange={(e) => updateSection(index, "style", e.target.value)}
                  className="w-full px-3 py-1 border rounded"
                />
                <button
                  className="mt-2 text-red-600"
                  onClick={() => setFormData({
                    ...formData,
                    sections: formData.sections.filter((_, i) => i !== index),
                  })}
                >
                  섹션 삭제
                </button>
              </div>
            ))}
            <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={addSection}>
              섹션 추가
            </button>
          </div>
          <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleSubmit}>
            {isEditMode ? "수정 저장" : "저장"}
          </button>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full table-auto text-left">
          <thead className="bg-navbar text-white">
            <tr>
              <th className="px-4 py-3">유형</th>
              <th className="px-4 py-3">제목</th>
              <th className="px-4 py-3">조회수</th>
              <th className="px-4 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-3 text-center">데이터가 없습니다.</td>
              </tr>
            ) : (
              materials.map((material) => (
                <tr key={`${material.is_example ? "example" : "material"}-${material.material_id || material.example_id}`} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{material.is_example ? "예제" : "학습자료"}</td>
                  <td className="px-4 py-3">{material.title}</td>
                  <td className="px-4 py-3">{material.read_count || 0}</td>
                  <td className="px-4 py-3 text-center relative dropdown">
                    <button
                      className="text-gray-600 hover:text-black"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpenId(dropdownOpenId === (material.material_id || material.example_id) ? null : (material.material_id || material.example_id));
                      }}
                    >
                      <FaEllipsisV />
                    </button>
                    {dropdownOpenId === (material.material_id || material.example_id) && (
                      <div className="absolute right-0 mt-2 bg-white border rounded shadow-md z-10 w-32">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-100 text-blue-600"
                          onClick={() => handleEdit(material.material_id || material.example_id, material.is_example)}
                        >
                          수정
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-red-100 text-red-600"
                          onClick={() => handleDelete(material.material_id || material.example_id, material.is_example)}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudyMaterialManagementPage;