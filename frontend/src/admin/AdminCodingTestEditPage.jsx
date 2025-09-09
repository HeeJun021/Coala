import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchAdminCodingTestDetail,
  updateAdminCodingTest,
  addTestcase,
  updateTestcase,
  deleteTestcase,
  addConstraint,
  updateConstraint,
  deleteConstraint,
  upsertStarterCode,
} from "../api/adminCodingtestApi";

const AdminCodingTestEditPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);

  // ---------------- 문제 기본 정보 ----------------
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: 1,
    category: "",
    input_format: "",
    output_format: "",
    time_limit: 2,
    memory_limit: 256,
  });

  // ---------------- 테스트케이스 ----------------
  const [testcases, setTestcases] = useState([]);
  const [newTestcase, setNewTestcase] = useState({
    test_type: "basic",
    example_input: "",
    example_output: "",
    is_hidden: false,
  });
  const [editingTestcaseId, setEditingTestcaseId] = useState(null);
  const [editingTestcase, setEditingTestcase] = useState({});

  // ---------------- 제약조건 ----------------
  const [constraints, setConstraints] = useState([]);
  const [newConstraint, setNewConstraint] = useState({
    variable_name: "",
    min_value: null,
    max_value: null,
    constraint_text: "",
  });
  const [editingConstraintId, setEditingConstraintId] = useState(null);
  const [editingConstraint, setEditingConstraint] = useState({});

  // ---------------- 스타터 코드 ----------------
  const [starterCodes, setStarterCodes] = useState({});
  const [newStarterCode, setNewStarterCode] = useState({
    language: "python",
    code: "",
  });

  // ✅ 문제 상세 불러오기
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAdminCodingTestDetail(testId);
        setForm({
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          category: data.category || "",
          input_format: data.input_format || "",
          output_format: data.output_format || "",
          time_limit: data.time_limit,
          memory_limit: data.memory_limit,
        });
        setTestcases(data.testcases || []);
        setConstraints(data.constraints || []);
        setStarterCodes(
          (data.starter_codes || []).reduce((acc, code) => {
            acc[code.language] = code.code;
            return acc;
          }, {})
        );
      } catch (err) {
        console.error("문제 불러오기 실패:", err);
        alert("문제를 불러오는 중 오류가 발생했습니다.");
        navigate("/admin/codingtest");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [testId, navigate]);

  // ✅ 문제 저장
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateAdminCodingTest(testId, form);
      alert("문제가 수정되었습니다.");
      navigate("/admin/codingtest");
    } catch (err) {
      console.error("문제 수정 실패:", err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  // ---------------- 테스트케이스 ----------------
  const handleAddTestcase = async () => {
    try {
      const res = await addTestcase(testId, newTestcase);
      setTestcases([...testcases, res]);
      setNewTestcase({ test_type: "basic", example_input: "", example_output: "", is_hidden: false });
    } catch {
      alert("테스트케이스 추가 실패");
    }
  };

  const handleEditTestcase = (tc) => {
    setEditingTestcaseId(tc.test_case_id);
    setEditingTestcase({ ...tc });
  };

  const handleSaveTestcase = async () => {
    try {
      const res = await updateTestcase(editingTestcaseId, editingTestcase);
      setTestcases(testcases.map((tc) => (tc.test_case_id === editingTestcaseId ? res : tc)));
      setEditingTestcaseId(null);
    } catch {
      alert("테스트케이스 수정 실패");
    }
  };

  const handleDeleteTestcase = async (id) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    try {
      await deleteTestcase(id);
      setTestcases(testcases.filter((tc) => tc.test_case_id !== id));
    } catch {
      alert("삭제 실패");
    }
  };

  // ---------------- 제약조건 ----------------
  const handleAddConstraint = async () => {
    try {
      const res = await addConstraint(testId, newConstraint);
      setConstraints([...constraints, res]);
      setNewConstraint({ variable_name: "", min_value: null, max_value: null, constraint_text: "" });
    } catch {
      alert("제약조건 추가 실패");
    }
  };

  const handleEditConstraint = (c) => {
    setEditingConstraintId(c.constraint_id);
    setEditingConstraint({ ...c });
  };

  const handleSaveConstraint = async () => {
    try {
      const res = await updateConstraint(editingConstraintId, editingConstraint);
      setConstraints(constraints.map((c) => (c.constraint_id === editingConstraintId ? res : c)));
      setEditingConstraintId(null);
    } catch {
      alert("제약조건 수정 실패");
    }
  };

  const handleDeleteConstraint = async (id) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    try {
      await deleteConstraint(id);
      setConstraints(constraints.filter((c) => c.constraint_id !== id));
    } catch {
      alert("삭제 실패");
    }
  };

  // ---------------- 스타터 코드 ----------------
  const handleSaveStarterCode = async () => {
    try {
      const res = await upsertStarterCode(testId, newStarterCode);
      setStarterCodes({ ...starterCodes, [res.language]: res.code });
      alert("스타터 코드 저장 완료");
    } catch {
      alert("스타터 코드 저장 실패");
    }
  };

  if (loading) return <div className="p-8">불러오는 중...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">코딩 테스트 문제 수정</h1>

      {/* 탭 */}
      <div className="flex gap-4 border-b mb-6">
        {["info", "testcases", "constraints", "starter"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 ${
              activeTab === tab ? "border-b-2 border-green-600 font-semibold" : "text-gray-500"
            }`}
          >
            {tab === "info" ? "기본 정보" : tab === "testcases" ? "테스트케이스" : tab === "constraints" ? "제약조건" : "스타터 코드"}
          </button>
        ))}
      </div>

      {/* 기본 정보 */}
      {activeTab === "info" && (
        <form onSubmit={handleSave} className="space-y-4">
          <input name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border px-3 py-2 rounded" />
          <textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={6} className="w-full border px-3 py-2 rounded" />
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">저장</button>
        </form>
      )}

      {/* 테스트케이스 */}
      {activeTab === "testcases" && (
        <div>
          <ul className="mb-4">
            {testcases.map((tc) => (
              <li key={tc.test_case_id} className="border p-2 mb-2">
                {editingTestcaseId === tc.test_case_id ? (
                  <div>
                    <input value={editingTestcase.example_input} onChange={(e) => setEditingTestcase({ ...editingTestcase, example_input: e.target.value })} className="border px-2 py-1 mr-2" />
                    <input value={editingTestcase.example_output} onChange={(e) => setEditingTestcase({ ...editingTestcase, example_output: e.target.value })} className="border px-2 py-1 mr-2" />
                    <button onClick={handleSaveTestcase} className="text-green-600 mr-2">저장</button>
                    <button onClick={() => setEditingTestcaseId(null)} className="text-gray-500">취소</button>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span>[{tc.test_type}] {tc.example_input} → {tc.example_output}</span>
                    <div>
                      <button onClick={() => handleEditTestcase(tc)} className="text-blue-600 mr-2">수정</button>
                      <button onClick={() => handleDeleteTestcase(tc.test_case_id)} className="text-red-600">삭제</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <input placeholder="입력값" value={newTestcase.example_input} onChange={(e) => setNewTestcase({ ...newTestcase, example_input: e.target.value })} className="border px-2 py-1 mr-2" />
          <input placeholder="출력값" value={newTestcase.example_output} onChange={(e) => setNewTestcase({ ...newTestcase, example_output: e.target.value })} className="border px-2 py-1 mr-2" />
          <button onClick={handleAddTestcase} className="px-3 py-1 bg-blue-500 text-white rounded">추가</button>
        </div>
      )}

      {/* 제약조건 */}
      {activeTab === "constraints" && (
        <div>
          <ul className="mb-4">
            {constraints.map((c) => (
              <li key={c.constraint_id} className="border p-2 mb-2">
                {editingConstraintId === c.constraint_id ? (
                  <div>
                    <input value={editingConstraint.variable_name} onChange={(e) => setEditingConstraint({ ...editingConstraint, variable_name: e.target.value })} className="border px-2 py-1 mr-2" />
                    <input value={editingConstraint.constraint_text} onChange={(e) => setEditingConstraint({ ...editingConstraint, constraint_text: e.target.value })} className="border px-2 py-1 mr-2" />
                    <button onClick={handleSaveConstraint} className="text-green-600 mr-2">저장</button>
                    <button onClick={() => setEditingConstraintId(null)} className="text-gray-500">취소</button>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span>{c.variable_name} → {c.constraint_text}</span>
                    <div>
                      <button onClick={() => handleEditConstraint(c)} className="text-blue-600 mr-2">수정</button>
                      <button onClick={() => handleDeleteConstraint(c.constraint_id)} className="text-red-600">삭제</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <input placeholder="변수명" value={newConstraint.variable_name} onChange={(e) => setNewConstraint({ ...newConstraint, variable_name: e.target.value })} className="border px-2 py-1 mr-2" />
          <input placeholder="설명" value={newConstraint.constraint_text} onChange={(e) => setNewConstraint({ ...newConstraint, constraint_text: e.target.value })} className="border px-2 py-1 mr-2" />
          <button onClick={handleAddConstraint} className="px-3 py-1 bg-blue-500 text-white rounded">추가</button>
        </div>
      )}

      {/* 스타터 코드 */}
      {activeTab === "starter" && (
        <div>
          <select value={newStarterCode.language} onChange={(e) => setNewStarterCode({ ...newStarterCode, language: e.target.value })} className="border px-2 py-1 mr-2">
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
          </select>
          <textarea value={newStarterCode.code} onChange={(e) => setNewStarterCode({ ...newStarterCode, code: e.target.value })} rows={6} className="w-full border px-2 py-1 mb-2" />
          <button onClick={handleSaveStarterCode} className="px-3 py-1 bg-green-600 text-white rounded">저장</button>
        </div>
      )}
    </div>
  );
};

export default AdminCodingTestEditPage;
