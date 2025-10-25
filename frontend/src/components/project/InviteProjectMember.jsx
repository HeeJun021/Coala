// src/components/InviteProjectMember.jsx
import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { searchUsers, getRecommendedUsers } from "../../api/followApi"; // ✅ 추천 API 추가

const InviteProjectMember = ({
  selectedFriend,
  setSelectedFriend,
  onClose,
  onInvite,
  projectId,
}) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  
  useEffect(() => {
    // ⬇️ 3. projectId가 없으면 추천 API를 호출하지 않도록 방어
    if (!search.trim() && !projectId) {
      console.warn("projectId가 제공되지 않아 추천 목록을 불러올 수 없습니다.");
      setResults([]);
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        let res = [];
        if (!search.trim()) {
          // ✅ 검색어 없으면 맞팔 or 추천 유저 목록 표시
          // ⬇️ 2. API 호출 시 projectId 전달
          res = await getRecommendedUsers(projectId);
        } else {
          // ✅ 검색어 있으면 검색 결과 표시
          res = await searchUsers(search.trim());
        }
        setResults(res);
      } catch (err) {
        console.error("❌ 유저 불러오기 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, projectId]); // ⬇️ 4. useEffect 의존성 배열에 projectId 추가

  const handleSelect = (user) => {
    if (selectedFriend?.id === user.user_id) {
      setSelectedFriend(null);
    } else {
      setSelectedFriend({ id: user.user_id, nickname: user.nickname });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-[400px] max-h-[500px] rounded-lg shadow-lg p-5 relative"
      >
        {/* 헤더 */}
        <div className="text-center font-semibold text-lg mb-4">프로젝트 멤버 초대</div>
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          <FaTimes />
        </button>

        {/* 검색 입력 */}
        <input
          type="text"
          placeholder="사용자 검색 (닉네임)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:border-green-600 font-medium text-gray-800 mb-3"
        />




        {/* 결과 영역 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isLoading ? "loading" : `results-${search.trim()}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="h-[240px] overflow-y-auto space-y-2 pr-1"
          >
            {isLoading ? (
              <div className="text-center text-sm text-gray-500 mt-4">
                불러오는 중...
              </div>
            ) : results.length === 0 ? (
              <div className="text-center text-sm text-gray-500 mt-4">
                {search.trim()
                  ? "검색 결과가 없습니다."
                  : "추천할 유저가 없습니다."}
              </div>
            ) : (
              results.map((user) => {
                const profileSrc =
                  user.profile_image_url || user.profile_image || "/default-avatar.png";
                return (
                  <div
                    key={user.user_id}
                    className={`flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100 cursor-pointer ${
                      selectedFriend?.id === user.user_id ? "bg-blue-100" : ""
                    }`}
                    onClick={() => handleSelect(user)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={profileSrc}
                        alt="profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-800">
                        {user.nickname}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      readOnly
                      checked={selectedFriend?.id === user.user_id}
                    />
                  </div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>

        {/* 프로젝트 초대 버튼 */}
        <button
          onClick={onInvite}
          disabled={!selectedFriend}
          className={`w-full mt-4 py-2 rounded text-sm font-medium ${
            selectedFriend
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-100 text-gray-500 cursor-not-allowed"
          }`}
        >
          프로젝트 초대
        </button>
      </motion.div>
    </div>
  );
};

export default InviteProjectMember;
