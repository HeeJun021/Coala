// src/pages/mypage/MyPageSetting.jsx
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import PrivacyCard from "../../components/mypage/PrivacyCard";
import NotificationCard from "../../components/NotificationCard";

const MyPageSetting = () => {
  const { userData } = useOutletContext();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // 실제 API가 구현되면 이 부분을 활성화하세요.
        // const response = await fetch(`/api/user/${userData.user_id}/settings`);
        // const data = await response.json();
        // setSettings(data);

        // API가 없으므로 임시 목업 데이터를 사용합니다.
        const mockSettings = {
          privacy: { show_email: true, show_activity: false },
          notifications: { email_on_mention: true, push_on_message: false },
        };
        setSettings(mockSettings);

      } catch (error) {
        console.error("설정 데이터를 불러오는 중 오류 발생:", error);
      }
    };
    
    // userData가 로드된 후에 설정을 불러옵니다.
    if (userData) {
      fetchSettings();
    }
  }, [userData]); // userData가 변경될 때마다 effect를 다시 실행합니다.

  const handleSaveSettings = async (updatedSettings) => {
    try {
      // 실제 API가 구현되면 이 부분을 활성화하세요.
      // const response = await fetch(`/api/user/${userData.user_id}/settings`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(updatedSettings),
      // });
      // if (!response.ok) throw new Error("설정 저장에 실패했습니다.");
      
      console.log("저장될 설정:", updatedSettings);
      alert("설정이 저장되었습니다.");
      
      // 로컬 상태를 업데이트하여 UI에 즉시 반영합니다.
      setSettings(prev => ({...prev, ...updatedSettings}));

    } catch (error) {
      console.error("설정을 저장하는 중 오류 발생:", error);
      alert("설정 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    // ✅ 전체 레이아웃 컨테이너 (MyPageModify와 동일)
    <div className="relative min-h-screen">
      
      {/* ✅ 본문: 좌측 패딩으로 사이드바 공간 확보 (MyPageModify와 동일) */}
      <div className="w-full min-h-screen pt-4 pl-[164px]">
        {/* 본문 카드 컨테이너: 통일 규격 (max-w-5xl로 수정) */}
        <div className="max-w-5xl mx-auto mt-3 bg-white shadow-xl rounded-2xl border border-gray-300 p-7">
          {/* 상단 제목 (MyPageModify와 동일한 스타일) */}
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              계정 설정
            </h1>
          </header>

          {/* 콘텐츠 블럭들 (MyPageModify와 동일한 구조) */}
          <main className="flex flex-col gap-6">
            {/* 개인정보 보호 설정 카드 */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              {settings && <PrivacyCard settings={settings.privacy} onSave={handleSaveSettings} />}
            </section>

            {/* 알림 설정 카드 */}
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              {settings && <NotificationCard settings={settings.notifications} onSave={handleSaveSettings} />}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MyPageSetting;