import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import MyPageSidebar from '../Layout/MyPageSideBar';
import PrivacyCard from '../components/PrivacyCard';
import NotificationCard from '../components/NotificationCard';

const MyPageSetting = () => {
    const { userData } = useOutletContext();
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/user/settings');
                const data = await response.json();
                setSettings(data);
            } catch (error) {
                console.error('설정 데이터를 불러오는 중 오류 발생:', error);
            }
        };
        fetchSettings();
    }, []);

    const handleSaveSettings = async (updatedSettings) => {
        try {
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedSettings),
            });
            if (!response.ok) {
                throw new Error('설정 저장에 실패했습니다.');
            }
            alert('설정이 저장되었습니다.');
        } catch (error) {
            console.error('설정을 저장하는 중 오류 발생:', error);
        }
    };

    return (
        <div className="flex min-h-screen">
            <div className="w-[250px]">
                <MyPageSidebar userData={userData} />
            </div>
            <div className="flex-1 p-6 ml-10">
                <header className="p-6">
                    <h1 className="text-2xl font-bold text-left">개인정보 보호 설정</h1>
                </header>

                <main className="flex flex-col items-start gap-6">
                    <PrivacyCard settings={settings} onSave={handleSaveSettings} />
                    <NotificationCard settings={settings} onSave={handleSaveSettings} />
                </main>
            </div>
        </div>
    );
};

export default MyPageSetting;
