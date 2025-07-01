import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

/**
 * 특정 사용자 ID를 기반으로 사용자 정보를 가져오는 커스텀 훅
 * @param {number|string} userId - 사용자 고유 ID
 * @returns {object} { user, loading, error }
 */
const useUserProfile = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.get(`/users/${userId}`);

        if (res?.data) {
          console.log("사용자 정보 불러옴:", res.data);
          setUser(res.data);
        } else {
          console.warn("사용자 정보 응답 없음 또는 비어 있음");
          setUser(null);
        }
      } catch (err) {
        console.error("사용자 정보 요청 실패:", err);
        setError(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
};

export default useUserProfile;
