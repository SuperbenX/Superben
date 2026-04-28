
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AudioItem } from '../types';
import { getAudioItems } from '../services/storage';

interface DeepDiveProps {
  onPlay: (item: AudioItem, skipRitual?: boolean, isDeepDive?: boolean) => void;
}

const DeepDive: React.FC<DeepDiveProps> = ({ onPlay }) => {
  const [dragY, setDragY] = useState(0);
  const [isSinking, setIsSinking] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);
  const threshold = window.innerHeight * 0.45;

  // 清理所有定时器
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => window.clearTimeout(timer));
    };
  }, []);

  // 1. 生成深海粉尘与浮游生物 (Parallax 增强)
  const particles = useMemo(() => 
    Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (i % 5 === 0 ? 3 : 1.5) + 0.5,
      driftX: (Math.random() - 0.5) * 50,
      driftY: (Math.random() - 0.5) * 30,
      speedFactor: 0.2 + Math.random() * 0.8, // 视差速度因子
      isBioluminescent: i % 8 === 0 
    })), []
  );

  // 2. 生成动态光束
  const rays = useMemo(() => 
    Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      left: 10 + i * 20 + (Math.random() - 0.5) * 10,
      width: 15 + Math.random() * 25,
      rotate: -15 + Math.random() * 30,
      opacity: 0.03 + Math.random() * 0.05,
    })), []
  );

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isSinking) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startY.current = clientY;
    setIsActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isActive || isSinking) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = Math.max(0, clientY - startY.current);
    // 使用非线性阻尼，让拉动感更真实
    const dampedY = Math.pow(deltaY, 0.95); 
    setDragY(dampedY);
  };

  const handleTouchEnd = () => {
    if (!isActive || isSinking) return;
    setIsActive(false);
    if (dragY > threshold) {
      triggerDeepDive();
    } else {
      setDragY(0);
    }
  };

  const triggerDeepDive = () => {
    // 1. 立即触发视觉上的加速下沉位移 (利用 CSS transition 完成)
    setDragY(window.innerHeight);
    
    // 2. 健壮的触感反馈处理
    // 添加 200ms 延迟，确保视觉位移已启动且用户手指已离开，避免误触震动感
    const hapticTimer = window.setTimeout(() => {
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          // 使用更高级的触感序列：[短震, 间隔, 稍长震] 模拟“入水”的阻力感
          navigator.vibrate([20, 10, 40]);
        }
      } catch (e) {
        console.warn('Haptic feedback ignored by browser');
      }
    }, 200);

    // 3. 在位移动画执行中段平滑开启全黑遮罩 (Sinking Overlay)
    // 此时用户看到界面完全滑出视野，进入虚无
    const sinkingTimer = window.setTimeout(() => {
      setIsSinking(true);
    }, 450);

    // 4. 状态彻底切换与音频启动
    // 设置在 2.2s 后（确保遮罩已完全淡入且环境已安静）
    const transitionTimer = window.setTimeout(() => {
      const allItems = getAudioItems();
      const nightWakePool = allItems.filter(i => i.category === '无剧情放映室');
      const finalPool = nightWakePool.length > 0 ? nightWakePool : allItems;
      const randomItem = finalPool[Math.floor(Math.random() * finalPool.length)];
      
      // 触发音频播放，进入播放器视图
      onPlay(randomItem, true, true);
      
      // 5. 此时 DeepDive 组件已被 Player 覆盖，静默重置其状态
      // 增加冗余延迟确保 Player 已经成功 Mount
      const resetTimer = window.setTimeout(() => {
        setIsSinking(false);
        setDragY(0);
      }, 1000);
      timersRef.current.push(resetTimer);
    }, 2200);

    // 跟踪所有定时器以便在 Unmount 时清理
    timersRef.current.push(hapticTimer, sinkingTimer, transitionTimer);
  };

  // 动态计算视觉参数 (0-1)
  const progress = Math.min(1, dragY / threshold);
  
  // 核心视觉反馈映射
  const blurAmount = progress * 25; // 模糊半径
  const brightness = 1 - progress * 0.8; // 亮度衰减
  const vignetteOpacity = 0.2 + progress * 0.75; // 暗角强度
  const vignetteSize = 100 - progress * 50; // 暗角范围收缩

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen flex flex-col items-center justify-start bg-[#050507] overflow-hidden select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* 1. 环境层：实时响应拖动的模糊与亮度 */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, transparent 0%, rgba(0,0,0,${vignetteOpacity}) ${vignetteSize}%)`,
          filter: `blur(${blurAmount}px) brightness(${brightness})`,
          transition: isActive ? 'none' : 'filter 0.8s cubic-bezier(0.15, 0.85, 0.35, 1), background 0.8s ease',
          willChange: 'filter, background'
        }}
      >
        <div className="absolute top-[20%] left-[-10%] w-[120vw] h-[100vh] bg-indigo-500/[0.03] rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[100vw] h-[80vh] bg-teal-500/[0.02] rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '-4s' }}></div>
      </div>

      {/* 2. 光束层：随着进度消失 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {rays.map(ray => (
          <div 
            key={ray.id}
            className="absolute top-[-20%] h-[150%] bg-gradient-to-b from-white/10 via-transparent to-transparent"
            style={{
              left: `${ray.left}%`,
              width: `${ray.width}px`,
              transform: `rotate(${ray.rotate + (progress * 5)}deg) translateY(${progress * -50}px)`,
              opacity: ray.opacity * (1 - progress),
              transition: isActive ? 'none' : 'all 1s cubic-bezier(0.2, 0.8, 0.2, 1)',
              filter: 'blur(30px)'
            }}
          />
        ))}
      </div>

      {/* 3. 粒子层：视差位移模拟水下阻力 */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(p => (
          <div 
            key={p.id}
            className={`absolute rounded-full ${p.isBioluminescent ? 'bg-indigo-300/30 shadow-[0_0_12px_rgba(165,180,252,0.5)]' : 'bg-white/10'}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: (0.1 + progress * 0.4),
              transform: `translate(${progress * p.driftX}px, ${progress * p.driftY - (dragY * 0.1 * p.speedFactor)}px)`,
              transition: isActive ? 'none' : 'transform 1.2s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 1s ease'
            }}
          />
        ))}
      </div>

      {/* 4. 交互引导线 */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col items-center"
        style={{ 
          transform: `translateY(${dragY}px)`, 
          transition: isActive ? 'none' : 'transform 1.2s cubic-bezier(0.2, 0.85, 0.3, 1)' 
        }}
      >
        <div className="w-full h-[2px] relative">
          <div className="absolute inset-0 bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent blur-[3px]"></div>
        </div>
        
        <div className="mt-16 flex flex-col items-center gap-6" style={{ opacity: 1 - progress }}>
           {[0.15, 0.08, 0.04].map((op, i) => (
             <div key={i} className="w-[1px] bg-white rounded-full" style={{ height: `${24 - i * 8}px`, opacity: op }}></div>
           ))}
        </div>
      </div>

      {/* 5. 文字信息：根据进度反馈 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className={`transition-all duration-1000 ${isSinking ? 'opacity-0 scale-90 blur-2xl' : 'opacity-100'}`}>
          <div className="flex flex-col items-center text-center gap-12">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
              </div>
              <div className="absolute inset-0 border border-white/5 rounded-full scale-150 opacity-10 animate-pulse"></div>
            </div>
            
            <div className="space-y-6">
               <h3 className="text-[12px] font-bold text-white/30 tracking-[1.2em] uppercase ml-[1.2em]">向下划动</h3>
               <p className="text-[11px] text-white/10 tracking-[0.6em] uppercase ml-[0.6em] transition-all duration-500" 
                  style={{ 
                    opacity: progress > 0.1 ? 0.9 : 0.2,
                    transform: `translateY(${progress * -10}px)`
                  }}>
                 {progress > 0.85 ? '即将抵达深处' : progress > 0.3 ? '意识正在剥离' : '沉入深潜模式'}
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* 状态指示器 */}
      <div className={`absolute bottom-32 transition-all duration-700 flex flex-col items-center gap-4 ${dragY > threshold * 0.8 && !isSinking ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>
          <p className="text-[10px] text-white font-bold tracking-[0.6em] uppercase ml-[0.6em]">松开指尖 入梦</p>
      </div>

      {/* 沉降遮罩层 (Sinking Overlay) */}
      <div 
        className="fixed inset-0 z-[100] bg-black pointer-events-none transition-opacity duration-[1500ms] ease-in-out" 
        style={{ opacity: isSinking ? 1 : 0 }}
      ></div>
    </div>
  );
};

export default DeepDive;
