'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronRight, ChevronLeft, Sparkles, MessageSquare, Users, Gift, Search, Bell } from 'lucide-react';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  action?: {
    label: string;
    href: string;
  };
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'welcome',
    title: '歡迎來到家族中心',
    description: '這是一個專為家庭設計的線上空間，讓家人們可以隨時聯繫、分享生活點滴。',
    icon: <Sparkles className="w-12 h-12 text-yellow-500" />,
  },
  {
    id: 'chat',
    title: '即時聊天',
    description: '使用即時聊天功能與家人即時溝通。可以發送文字、圖片和表情貼圖，還能@提及家人。',
    icon: <MessageSquare className="w-12 h-12 text-green-500" />,
    highlight: '/chat',
  },
  {
    id: 'family',
    title: '家族管理',
    description: '查看和管理家族成員，設置管理員權限，邀請新成員加入。',
    icon: <Users className="w-12 h-12 text-blue-500" />,
    highlight: '/families',
  },
  {
    id: 'search',
    title: '全局搜索',
    description: '快速搜索家族、成員、聊天記錄和公告，不遺漏任何重要信息。',
    icon: <Search className="w-12 h-12 text-purple-500" />,
    highlight: '/search',
  },
  {
    id: 'birthday',
    title: '生日提醒',
    description: '再也不會忘記家人的生日！系統會提前提醒，讓你及時送上祝福。',
    icon: <Gift className="w-12 h-12 text-pink-500" />,
    highlight: '/plugins/birthday?familyId=1',
  },
  {
    id: 'notifications',
    title: '消息通知',
    description: '隨時掌握家族動態，第一時間收到新消息和公告提醒。',
    icon: <Bell className="w-12 h-12 text-red-500" />,
  },
];

interface OnboardingGuideProps {
  onComplete?: () => void;
}

export default function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // 檢查是否已經看過引導
    const hasSeenGuide = localStorage.getItem('onboarding_completed');
    if (!hasSeenGuide) {
      // 延遲顯示，讓頁面先加載
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleAction = (href: string) => {
    handleComplete();
    router.push(href);
  };

  if (!isVisible) return null;

  const currentStepData = GUIDE_STEPS[currentStep];
  const progress = ((currentStep + 1) / GUIDE_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
        onClick={handleSkip}
      />

      {/* 引導卡片 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[slideUp_0.4s_ease-out]">
        {/* 頂部裝飾 */}
        <div className="h-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500" />
        
        {/* 關閉按鈕 */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 內容區域 */}
        <div className="p-8 text-center">
          {/* 圖標 */}
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
            {currentStepData.icon}
          </div>

          {/* 標題 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {currentStepData.title}
          </h2>

          {/* 描述 */}
          <p className="text-gray-600 leading-relaxed mb-6">
            {currentStepData.description}
          </p>

          {/* 操作按鈕 */}
          {currentStepData.action && (
            <button
              onClick={() => handleAction(currentStepData.action!.href)}
              className="mb-6 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:scale-105"
            >
              {currentStepData.action.label}
            </button>
          )}
        </div>

        {/* 底部導航 */}
        <div className="px-8 pb-8">
          {/* 進度條 */}
          <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 步驟指示器 */}
          <div className="flex items-center justify-between">
            {/* 上一步 */}
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                currentStep === 0 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              上一步
            </button>

            {/* 步驟指示點 */}
            <div className="flex items-center gap-2">
              {GUIDE_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentStep 
                      ? 'w-6 bg-green-500' 
                      : index < currentStep 
                      ? 'bg-green-300' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* 下一步 */}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              {currentStep === GUIDE_STEPS.length - 1 ? '完成' : '下一步'}
              {currentStep !== GUIDE_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* 跳過按鈕 */}
          <button
            onClick={handleSkip}
            className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600"
          >
            稍後再說
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
}

// 鉤子：用於在其他地方觸發引導
export function useOnboarding() {
  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
  };

  const isOnboardingCompleted = () => {
    return localStorage.getItem('onboarding_completed') === 'true';
  };

  return { resetOnboarding, isOnboardingCompleted };
}
