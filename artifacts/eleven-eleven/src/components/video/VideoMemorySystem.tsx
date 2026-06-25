/**
 * VideoMemorySystem.tsx — نظام ذكريات الفيديو السينمائية
 * يعرض مقاطع فيديو عند معالم محددة (كل 20-40 لغز)
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { generateFractureCinematicScenes } from '../../core/echoFractureArc';
import { generatePreludeCinematicScenes } from '../../core/echoTransformationPreludeArc';
import { generateArchitectCinematicScenes } from '../../core/echoArchitectArc';
import { generateSignalCinematicScenes } from '../../core/echoSignalArc';

export const VideoMemorySystem: React.FC = () => {
  const { solvedPuzzles, time, echo } = useGameStore();
  const [showVideo, setShowVideo] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<{id: string; title: string; milestone: number; url: string; description: string} | null>(null);

  // قائمة ذكريات الفيديو
  const videoMemories = [
    {
      id: 'vm1',
      title: 'الاستيقاظ الأول',
      milestone: 20,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // placeholder - will be replaced with actual video
      description: 'أول ذكرى واضحة - صوت لينا يتصل بك من خلال الضباب.'
    },
    {
      id: 'vm2',
      title: 'الغرفة البيضاء',
      milestone: 40,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'تذكر الغرفة البيضاء - المكان الذي بدأ فيه كل شيء.'
    },
    {
      id: 'vm3',
      title: 'المراقب',
      milestone: 60,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'أول لقاء مع المراقب - الكيان الذي يراقب من خلال الكاميرات.'
    },
    {
      id: 'vm4',
      title: 'الإشارة',
      milestone: 80,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'اكتشاف الإشارة - الرسالة التي أرسلتها لينا من العالم الآخر.'
    },
    {
      id: 'vm5',
      title: 'المهندس',
      milestone: 100,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'الحقيقة عن كينجا - المهندس الذي صمم النظام.'
    },
    {
      id: 'vm6',
      title: 'الزهرة',
      milestone: 120,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'معنى الزهرة - رمز الأمل والذاكرة.'
    },
    {
      id: 'vm7',
      title: '11:11',
      milestone: 140,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'أهمية الوقت 11:11 - اللحظة التي يتكسر فيها النظام.'
    },
    {
      id: 'vm8',
      title: 'الصدى',
      milestone: 160,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'من هو صدى حقاً - الحقيقة عن شخصيتك.'
    },
    {
      id: 'vm9',
      title: 'الخروج',
      milestone: 180,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'طريق الخروج - كيف يمكن الهروب من النظام.'
    },
    {
      id: 'vm10',
      title: 'الحقيقة النهائية',
      milestone: 200,
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'الحقيقة الكاملة عن 11.11 - ما يحدث عندما تتذكر كل شيء.'
    }
  ];

  // Add Prelude Arc Cinematic Scenes (230-333)
  const preludeScenes = generatePreludeCinematicScenes().map((scene, index) => ({
    id: `prelude_vm${index + 1}`,
    title: scene.title,
    milestone: scene.triggerPuzzle,
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // placeholder
    description: scene.description
  }));

  videoMemories.push(...preludeScenes);

  // Add Fracture Arc Cinematic Scenes (350-500)
  const fractureScenes = generateFractureCinematicScenes().map((scene, index) => ({
    id: `fracture_vm${index + 1}`,
    title: scene.title,
    milestone: scene.triggerPuzzle,
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // placeholder
    description: scene.description
  }));

  videoMemories.push(...fractureScenes);

  // Add Architect Arc Cinematic Scenes (520-666)
  const architectScenes = generateArchitectCinematicScenes().map((scene, index) => ({
    id: `architect_vm${index + 1}`,
    title: scene.title,
    milestone: scene.triggerPuzzle,
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // placeholder
    description: scene.description
  }));

  videoMemories.push(...architectScenes);

  // Add Signal Arc Cinematic Scenes (690-888)
  const signalScenes = generateSignalCinematicScenes().map((scene, index) => ({
    id: `signal_vm${index + 1}`,
    title: scene.title,
    milestone: scene.triggerPuzzle,
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // placeholder
    description: scene.description
  }));

  videoMemories.push(...signalScenes);

  // تحقق من معالم الفيديو
  useEffect(() => {
    const videoMemory = videoMemories.find(vm => solvedPuzzles >= vm.milestone && solvedPuzzles < vm.milestone + 5);
    if (videoMemory && !showVideo) {
      setCurrentVideo(videoMemory);
      setShowVideo(true);
    }
  }, [solvedPuzzles]);

  const handleClose = () => {
    setShowVideo(false);
    setCurrentVideo(null);
  };

  if (!showVideo || !currentVideo) return null;

  return (
    <div className="video-memory-overlay" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      gap: '1rem'
    }}>
      <div className="video-memory-header" style={{
        textAlign: 'center',
        color: 'var(--accent)'
      }}>
        <h2 style={{fontSize: '1.5rem', fontWeight: 700}}>🎬 ذكرى فيديو</h2>
        <h3 style={{fontSize: '1.1rem', marginTop: '0.5rem'}}>{currentVideo.title}</h3>
        <p style={{fontSize: '0.7rem', color: 'rgba(224,220,212,0.5)', marginTop: '0.3rem'}}>{currentVideo.description}</p>
      </div>

      <div className="video-memory-content" style={{
        width: '100%',
        maxWidth: '800px',
        aspectRatio: '16/9',
        background: '#000',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <iframe
          width="100%"
          height="100%"
          src={currentVideo.url}
          title={currentVideo.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="video-memory-info" style={{
        textAlign: 'center',
        fontSize: '0.7rem',
        color: 'rgba(224,220,212,0.4)'
      }}>
        <p>معلم: {currentVideo.milestone} لغزاً · {solvedPuzzles}/{currentVideo.milestone}</p>
        <p>مرحلة الوقت: {time.phase} · حالة الصدى: {echo.mood}</p>
      </div>

      <button onClick={handleClose} style={{
        padding: '0.75rem 2rem',
        background: 'rgba(200,120,90,0.2)',
        border: '1px solid rgba(200,120,90,0.4)',
        color: 'var(--accent)',
        fontSize: '0.8rem',
        cursor: 'pointer',
        fontFamily: 'inherit',
        borderRadius: '4px',
        transition: 'all 0.2s ease'
      }} onMouseOver={(e) => {
        e.currentTarget.style.background = 'rgba(200,120,90,0.3)';
        e.currentTarget.style.border = '1px solid rgba(200,120,90,0.6)';
      }} onMouseOut={(e) => {
        e.currentTarget.style.background = 'rgba(200,120,90,0.2)';
        e.currentTarget.style.border = '1px solid rgba(200,120,90,0.4)';
      }}>
        إغلاق وتابع اللعب ▶
      </button>
    </div>
  );
};

export default VideoMemorySystem;