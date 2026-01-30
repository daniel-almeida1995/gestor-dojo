import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children?: React.ReactNode;
  isDark?: boolean;
}

export const PullToRefresh = ({ onRefresh, children, isDark = false }: PullToRefreshProps) => {
  const [startPoint, setStartPoint] = useState<number>(0);
  const [pullChange, setPullChange] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const threshold = 80;

  const initTouch = (e: React.TouchEvent) => {
    // Only enable pull to refresh if we are at the top of the page
    if (window.scrollY === 0 && contentRef.current && contentRef.current.scrollTop === 0) {
      setStartPoint(e.targetTouches[0].clientY);
    }
  };

  const touchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !refreshing && startPoint > 0) {
      const pull = e.targetTouches[0].clientY - startPoint;
      if (pull > 0) {
        // Add resistance to the pull
        setPullChange(pull < 200 ? pull : 200 + (pull - 200) * 0.2);
        // Prevent default browser refresh only if we are actually pulling
        if (e.cancelable && pull > 10) e.preventDefault(); 
      }
    }
  };

  const endTouch = async () => {
    if (pullChange > threshold) {
      setRefreshing(true);
      setPullChange(60); // Snap to loading position
      
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);
      
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullChange(0);
      }
    } else {
      setPullChange(0);
    }
    setStartPoint(0);
  };

  return (
    <div 
      ref={contentRef}
      className="min-h-screen relative"
      onTouchStart={initTouch}
      onTouchMove={touchMove}
      onTouchEnd={endTouch}
    >
      {/* Refresh Indicator */}
      <div 
        className={`absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none transition-all duration-200 z-10`}
        style={{ 
          height: pullChange > 0 ? `${pullChange}px` : '0px',
          opacity: pullChange > 0 ? 1 : 0
        }}
      >
        <div className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-primary'}`}>
          {refreshing ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <ArrowDown 
              size={20} 
              style={{ transform: `rotate(${pullChange > threshold ? 180 : 0}deg)`, transition: 'transform 0.2s' }} 
            />
          )}
        </div>
      </div>

      {/* Main Content with transform */}
      <div 
        style={{ 
          transform: `translateY(${refreshing ? 60 : pullChange > 0 ? pullChange * 0.4 : 0}px)`,
          transition: refreshing ? 'transform 0.2s' : 'none' // Instant follow on drag, smooth snap on release
        }}
      >
        {children}
      </div>
    </div>
  );
};