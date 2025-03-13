import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createQuiz } from "../api/quizApi";

const PracticeQuiz = () => {

    // ✅ API 요청 중 로딩 상태
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const difficultyMap = {
        "Lv.1": 1,
        "Lv.2": 2,
        "Lv.3": 3,
      };

    // ✅ 문제 유형 체크 여부 관리
    const [selectedTypes, setSelectedTypes] = useState({
        ox: true,
        short: true,
        multiple: true
    });

    // ✅ 문제 개수 & 난이도 관리
    const [settings, setSettings] = useState({
        ox: { count: 5, difficulty: "Lv.1" },
        short: { count: 5, difficulty: "Lv.1" },
        multiple: { count: 5, difficulty: "Lv.1" }
    });

    // ✅ 문제 유형 체크박스 핸들러
    const handleTypeChange = (type) => {
        setSelectedTypes((prev) => ({
        ...prev,
        [type]: !prev[type]
        }));
    };

    // ✅ 문제 개수 & 난이도 변경 핸들러
    const handleSettingChange = (type, field, value) => {
        setSettings((prev) => ({
        ...prev,
        [type]: { ...prev[type], [field]: value }
        }));
    };

    // ✅  "퀴즈 풀기" 버튼 클릭 시 퀴즈 생성 API 호출
    const handleStartQuiz = async () => {
        setLoading(true);
        try {
        const quizPayload = {
            title: "사용자 연습 퀴즈",
            quiz_type: "practice", // ✅ 연습 퀴즈로 설정
            time_limit: null, // 연습 퀴즈는 시간 제한 없음
            settings: Object.keys(selectedTypes)
                .filter((type) => selectedTypes[type]) // 체크된 문제 유형만 포함
                .map((type) => ({
                    question_type: type === "ox" ? 1 : type === "short" ? 2 : 3,
                    difficulty: difficultyMap[settings[type].difficulty],
                    question_count: settings[type].count
                }))
        };

        console.log("📡 퀴즈 생성 요청:", quizPayload); // ✅ API 요청 전 확인

        const newQuiz = await createQuiz(quizPayload);
        console.log("✅ 퀴즈 생성 완료:", newQuiz); // ✅ 생성된 퀴즈 확인

        if (newQuiz && newQuiz.quiz_id) {
          navigate(`/quizsolve/${newQuiz.quiz_id}`);
        } else {
          alert("퀴즈 생성은 되었지만 id를 찾을 수 없습니다.")
        }

        alert("퀴즈가 생성되었습니다!"); // ✅ 퀴즈 생성 성공 알림
        } catch (error) {
            console.error("🚨 퀴즈 생성 실패:", error);
            alert("퀴즈 생성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="flex justify-start items-start w-full">
      {/* ✅ 퀴즈 설정 박스 */}
      <div className="bg-white p-6 flex-1 shadow-lg rounded-lg w-[700px] mt-10">
        {/* ✅ 타이틀 */}
        <h2 className="text-2xl font-bold mb-6">연습 퀴즈 설정</h2>

        {/* ✅ 문제 유형 선택 */}
        <div className="flex items-center gap-6 mb-6">
          <span className="text-lg font-semibold">문제 유형</span>
          {["ox", "short", "multiple"].map((type) => (
            <label key={type} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTypes[type]}
                onChange={() => handleTypeChange(type)}
                className="hidden"
              />
              <div
                className={`px-4 py-2 rounded-lg border-2 ${
                  selectedTypes[type] ? "bg-accent text-white border-navbar" : "bg-gray-200 border-gray-400"
                } transition-all`}
              >
                {type === "ox" ? "O/X" : type === "short" ? "단답형" : "선택형"}
              </div>
            </label>
          ))}
        </div>

        {/* ✅ 문제 개수 & 난이도 설정 */}
        <div className="grid grid-cols-3 gap-6 w-full">
          {["ox", "short", "multiple"].map((type) => (
            <div
              key={type}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedTypes[type] ? "border-navbar-500" : "border-gray-300 bg-gray-100 opacity-50"
              }`}
            >
              <h3 className="text-md font-semibold mb-3">
                {type === "ox" ? "O/X" : type === "short" ? "단답형" : "선택형"}
              </h3>

              {/* 문제 개수 드롭다운 */}
              <label className="block mb-2">
                <span className="text-sm">문제 개수</span>
                <select
                  className="w-full p-2 mt-1 border rounded-lg"
                  value={settings[type].count}
                  onChange={(e) => handleSettingChange(type, "count", Number(e.target.value))}
                  disabled={!selectedTypes[type]} // ✅ 체크 안 하면 비활성화
                >
                  {[2, 3, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}개
                    </option>
                  ))}
                </select>
              </label>

              {/* 난이도 드롭다운 */}
              <label className="block">
                <span className="text-sm">난이도</span>
                <select
                  className="w-full p-2 mt-1 border rounded-lg"
                  value={settings[type].difficulty}
                  onChange={(e) => handleSettingChange(type, "difficulty", e.target.value)}
                  disabled={!selectedTypes[type]} // ✅ 체크 안 하면 비활성화
                >
                  {["Lv.1", "Lv.2", "Lv.3"].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
        </div>
        <div className="flex pt-4 justify-end">
            <button 
            className="px-6 py-2 bg-accent text-white font-semibold rounded-lg shadow-lg hover:bg-green-600 transition-all"
            onClick={handleStartQuiz}
            disabled={loading}>
            {loading ? "생성 중..." : "퀴즈 풀기"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeQuiz;
