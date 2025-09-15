import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { FaEllipsisV } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  deleteStudyExample,
  deleteStudyMaterial,
  fetchStudyExamples,
  fetchStudyMaterialById,
  fetchStudyMaterialSummary,
  updateStudyExample,
  updateStudyMaterial
} from "../api/adminApi";
import { fetchLanguages } from "../api/studyMaterialsApi";

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

  const navigate = useNavigate();

  // 📌 데이터 로드
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

  useEffect(() => {
    fetchMaterials();
    fetchLanguagesData();
  }, [fetchMaterials, fetchLanguagesData]);

  // 📌 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".dropdown")) setDropdownOpenId(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // 📌 Drag&Drop
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(materials);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const updatedMaterials = items.map((item, index) => ({ ...item, order: index + 1 }));
    setMaterials(updatedMaterials);

    try {
      const updatePayload = updatedMaterials.map((item) => ({
        id: item.material_id || item.example_id,
        order: item.order,
        is_example: !!item.example_id,
      }));
      await axios.post(
        `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/admin/study-materials/update-order`,
        { materials: updatePayload }
      );
    } catch (err) {
      console.error("순서 업데이트 실패:", err);
      setError("순서 업데이트 실패: " + err.message);
      fetchMaterials();
    }
  };

  // 📌 CRUD 핸들러
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

  // 📌 섹션 관리
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
      newSections[index][field] =
        typeof value === "object"
          ? value
          : { question: "", options: [], correct_answer: "", explanation: "" };
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
      const response = await axios.post(uploadUrl, uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateSection(index, "content", response.data.image_path);
      setError("");
    } catch (err) {
      console.error("이미지 업로드 실패:", err.response?.data || err.message);
      setError(`이미지 업로드 실패: ${err.message}`);
    }
  };

  // 📌 저장
  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !formData.language_id) {
      setError("제목, 본문, 언어를 입력하세요.");
      return;
    }
    try {
      const payload = {
        language_id: formData.language_id,
        title: formData.title,
        content: formData.content,
        sections: formData.sections,
        is_example: formData.is_example,
      };
      if (isEditMode) {
        if (formData.is_example) {
          await updateStudyExample(formData.id, payload);
          alert("예제가 수정되었습니다.");
        } else {
          await updateStudyMaterial(formData.id, payload);
          alert("학습자료가 수정되었습니다.");
        }
      } else {
        const url = formData.is_example
          ? `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/admin/examples/create`
          : `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/admin/study-materials/create`;
        await axios.post(url, payload);
        alert(`${formData.is_example ? "예제" : "학습자료"}가 추가되었습니다.`);
      }
      setFormData({ id: null, language_id: 1, title: "", content: "", sections: [], is_example: false });
      setShowForm(false);
      setIsEditMode(false);
      fetchMaterials();
    } catch (err) {
      console.error("저장 실패:", err);
      setError("저장 실패: " + err.message);
    }
  };

  // 📌 프리뷰 이동
  const handlePreview = (material) => {
    if (material.is_example) {
      navigate(`/admin/materials/view?category=${language}&exampleId=${material.example_id}`);
    } else {
      navigate(`/admin/materials/view?category=${language}&id=${material.material_id}`);
    }
  };

  return (
    <div className="p-6 bg-[#f9fafb] min-h-screen">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-[1100px] w-full mx-auto">
        <h1 className="text-2xl font-bold mb-6">📚 학습자료 관리</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* 언어 관리 */}
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.label}>{lang.label}</option>
            ))}
          </select>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => {
              setShowForm(!showForm);
              setIsEditMode(false);
              setFormData({ id: null, language_id: 1, title: "", content: "", sections: [], is_example: false });
            }}
          >
            {showForm ? "폼 닫기" : "새 자료 추가"}
          </button>
        </div>

        {/* 목록 (카드형) */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="materials">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="grid gap-6">
                {materials.length === 0 ? (
                  <p className="text-gray-500">데이터가 없습니다.</p>
                ) : (
                  materials.map((material, index) => (
                    <Draggable
                      key={`${material.is_example ? "example" : "material"}-${material.material_id || material.example_id}`}
                      draggableId={`${material.is_example ? "example" : "material"}-${material.material_id || material.example_id}`}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white rounded-lg shadow p-6 relative hover:shadow-lg transition cursor-pointer"
                          onClick={() => handlePreview(material)}
                        >
                          <h2 className="text-xl font-bold text-gray-900">{material.title}</h2>
                          <p className="text-sm text-gray-600 mt-1">{material.is_example ? "예제" : "학습자료"}</p>
                          <p className="text-sm text-gray-500 mt-1">조회수 {material.read_count || 0}</p>

                          {/* 드롭다운 */}
                          <div className="absolute top-4 right-4 dropdown">
                            <button
                              className="text-gray-600 hover:text-black"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpenId(
                                  dropdownOpenId === (material.material_id || material.example_id)
                                    ? null
                                    : (material.material_id || material.example_id)
                                );
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
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* 추가/수정 폼 */}
        {showForm && (
          <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              {isEditMode ? `수정: ${formData.title}` : `새 ${formData.is_example ? "예제" : "학습자료"} 추가`}
            </h2>

            {/* 기본 입력 */}
            <div className="mb-4">
              <label className="block mb-1">타입:</label>
              <select
                value={formData.is_example}
                onChange={(e) => setFormData({ ...formData, is_example: e.target.value === "true" })}
                className="px-3 py-2 border rounded"
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
                className="px-3 py-2 border rounded"
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
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">내용:</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            {/* 섹션 관리 */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">섹션</h3>
              {formData.sections.map((section, index) => (
                <div key={index} className="mb-4 p-4 bg-white rounded shadow">
                  <label className="block mb-1">섹션 타입:</label>
                  <select
                    value={section.type}
                    onChange={(e) => updateSection(index, "type", e.target.value)}
                    className="px-3 py-2 border rounded mb-2"
                  >
                    <option value="">선택</option>
                    <option value="text">텍스트</option>
                    <option value="code">코드</option>
                    <option value="image">이미지</option>
                    <option value="quiz">퀴즈</option>
                    <option value="definition">정의</option>
                    <option value="video">비디오</option>
                  </select>

                  {/* 타입별 UI */}
                  {section.type === "text" && (
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(index, "content", e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    />
                  )}
                  {section.type === "code" && (
                    <>
                      <input
                        type="text"
                        placeholder="코드 제목"
                        value={section.title}
                        onChange={(e) => updateSection(index, "title", e.target.value)}
                        className="w-full px-3 py-2 border rounded mb-2"
                      />
                      <textarea
                        placeholder="코드 내용"
                        value={section.content}
                        onChange={(e) => updateSection(index, "content", e.target.value)}
                        className="w-full px-3 py-2 border rounded mb-2"
                      />
                      <input
                        type="text"
                        placeholder="문제 설명"
                        value={section.problem_description}
                        onChange={(e) => updateSection(index, "problem_description", e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </>
                  )}
                  {section.type === "image" && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0], index)}
                        className="mb-2"
                      />
                      {section.content && (
                        <img
                          src={`${process.env.REACT_APP_API_URL || "http://localhost:8000"}${section.content}`}
                          alt="미리보기"
                          className="max-w-xs mt-2 rounded"
                        />
                      )}
                    </>
                  )}
                  {section.type === "quiz" && (
                    <>
                      <input
                        type="text"
                        placeholder="질문"
                        value={section.content.question || ""}
                        onChange={(e) => updateSection(index, "content", { ...section.content, question: e.target.value })}
                        className="w-full px-3 py-2 border rounded mb-2"
                      />
                      <input
                        type="text"
                        placeholder="옵션 (쉼표로 구분)"
                        value={section.content.options ? section.content.options.join(",") : ""}
                        onChange={(e) => updateSection(index, "content", {
                          ...section.content,
                          options: e.target.value.split(",").map((opt) => opt.trim())
                        })}
                        className="w-full px-3 py-2 border rounded mb-2"
                      />
                      <input
                        type="text"
                        placeholder="정답"
                        value={section.content.correct_answer || ""}
                        onChange={(e) => updateSection(index, "content", { ...section.content, correct_answer: e.target.value })}
                        className="w-full px-3 py-2 border rounded mb-2"
                      />
                      <input
                        type="text"
                        placeholder="설명"
                        value={section.content.explanation || ""}
                        onChange={(e) => updateSection(index, "content", { ...section.content, explanation: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                      />
                    </>
                  )}

                  <button
                    className="mt-3 text-red-600"
                    onClick={() =>
                      setFormData({ ...formData, sections: formData.sections.filter((_, i) => i !== index) })
                    }
                  >
                    섹션 삭제
                  </button>
                </div>
              ))}
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={addSection}
              >
                섹션 추가
              </button>
            </div>

            {/* 저장 버튼 */}
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={handleSubmit}
            >
              {isEditMode ? "수정 저장" : "저장"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterialManagementPage;
