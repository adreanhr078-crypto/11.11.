/**
 * App.tsx — نقطة الدخول الرئيسية
 * تجمع كل الأنظمة: Echo، الألغاز، الأزهار، الذاكرة، الوقت، الكيانات
 */

import React, { useEffect } from 'react';
import { DashboardPage } from './components/DashboardPage';
import { useGameStore } from './stores/gameStore';
import './styles/eleven-theme.css';

export default function App() {
  // تفعيل دورة الوقت
  const actions = useGameStore(s => s.actions);

  useEffect(() => {
    // تحديث الوقت كل 30 ثانية
    const interval = setInterval(() => {
      actions.advanceTime();
    }, 30000);
    return () => clearInterval(interval);
  }, [actions]);

  return (
    <div className="app-container" dir="rtl">
      <DashboardPage />
    </div>
  );
}