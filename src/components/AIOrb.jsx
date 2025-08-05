import React, { useEffect, useState, useCallback } from 'react';

const AIOrb = ({ 
  size = 160, 
  state = 'idle'
}) => {
  const [animationTime, setAnimationTime] = useState(0);
  const [voicePattern, setVoicePattern] = useState(new Array(24).fill(0));
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [floatOffset, setFloatOffset] = useState(0);

  // Predefined voice patterns that simulate realistic speech
  const voicePatterns = {
    idle: () => voicePattern.map((_, i) => 0.1 + Math.sin(animationTime * 0.002 + i * 0.5) * 0.15),
    listening: () => voicePattern.map((_, i) => 0.2 + Math.sin(animationTime * 0.008 + i * 0.3) * 0.3),
    thinking: () => voicePattern.map((_, i) => {
      const base = 0.15 + Math.sin(animationTime * 0.003 + i * 0.4) * 0.2;
      const pulse = Math.sin(animationTime * 0.01) * 0.1;
      return base + pulse;
    }),
    speaking: () => {
      // Simulate realistic speech patterns with pauses and emphasis
      const phrases = [
        [0.8, 0.6, 0.9, 0.4, 0.7, 0.5, 0.2, 0.1], // "Hello there"
        [0.5, 0.8, 0.3, 0.9, 0.6, 0.4, 0.2, 0.1], // "How can I"
        [0.7, 0.9, 0.5, 0.8, 0.3, 0.6, 0.2, 0.1], // "help you today"
        [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], // pause
      ];
      
      const currentPattern = phrases[currentPhrase % phrases.length];
      const timeInPhrase = (animationTime * 0.01) % 8;
      const patternIndex = Math.floor(timeInPhrase);
      const intensity = currentPattern[patternIndex] || 0.1;
      
      return voicePattern.map((_, i) => {
        const baseIntensity = intensity + Math.random() * 0.2 - 0.1;
        const frequency = 0.3 + i * 0.02;
        return Math.max(0.05, baseIntensity * frequency);
      });
    }
  };

  // Update animations
  useEffect(() => {
    let animationFrameId;

    const animate = () => {
      setAnimationTime(prev => {
        const next = prev + 16;
        // Update pattern and floatOffset in one go
        setFloatOffset(f => f + 0.02);
        setVoicePattern(voicePatterns[state]());
        if (state === 'speaking' && next % 2000 < 16) {
          setCurrentPhrase(p => p + 1);
        }
        return next;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [state]); // <- only re-run when state changes


  const getStateColor = () => {
    switch (state) {
      case 'idle': return { primary: [99, 102, 241], secondary: [139, 92, 246] };
      case 'listening': return { primary: [34, 197, 94], secondary: [59, 130, 246] };
      case 'thinking': return { primary: [251, 191, 36], secondary: [245, 158, 11] };
      case 'speaking': return { primary: [239, 68, 68], secondary: [220, 38, 127] };
      default: return { primary: [99, 102, 241], secondary: [139, 92, 246] };
    }
  };

  const colors = getStateColor();
  const floatY = Math.sin(floatOffset) * 3;
  const breathe = 1 + Math.sin(animationTime * 0.002) * 0.05;

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ 
        width: size * 2.5, 
        height: size * 2.5,
        transform: `translateY(${floatY}px) scale(${breathe})`
      }}
    >
      {/* Outer energy field */}
      <div 
        className="absolute rounded-full opacity-40 animate-pulse"
        style={{
          width: size * 2.2,
          height: size * 2.2,
          background: `radial-gradient(circle, rgba(${colors.primary.join(',')}, 0.1) 0%, rgba(${colors.primary.join(',')}, 0.05) 50%, transparent 70%)`,
          filter: 'blur(10px)',
          animationDuration: state === 'speaking' ? '0.5s' : '2s'
        }}
      />

      {/* Rotating energy rings */}
      {[1.8, 1.5, 1.2].map((scale, index) => (
        <div
          key={index}
          className="absolute rounded-full border opacity-30"
          style={{
            width: size * scale,
            height: size * scale,
            borderColor: `rgba(${colors.secondary.join(',')}, 0.4)`,
            borderWidth: '1px',
            borderStyle: index % 2 === 0 ? 'dashed' : 'solid',
            animation: `spin ${8 + index * 2}s linear infinite ${index % 2 === 0 ? 'reverse' : 'normal'}`
          }}
        />
      ))}

      {/* Voice visualization spikes */}
      {voicePattern.map((intensity, i) => {
        const angle = (i * 15);
        const baseDistance = size * 0.75;
        const spikeLength = 10 + intensity * 40;
        const x = Math.cos(angle * Math.PI / 180) * baseDistance;
        const y = Math.sin(angle * Math.PI / 180) * baseDistance;
        
        return (
          <div
            key={i}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angle}deg)`,
              width: '2px',
              height: `${spikeLength}px`,
              background: `linear-gradient(to top, 
                transparent, 
                rgba(${colors.primary.join(',')}, ${intensity * 0.8}), 
                rgba(${colors.secondary.join(',')}, ${intensity})
              )`,
              borderRadius: '1px',
              boxShadow: `0 0 ${4 + intensity * 8}px rgba(${colors.primary.join(',')}, ${intensity * 0.6})`,
              transformOrigin: 'bottom center',
              filter: intensity > 0.5 ? 'brightness(1.2)' : 'none'
            }}
          />
        );
      })}

      {/* Core orb */}
      <div 
        className="relative rounded-full transition-all duration-300 ease-out"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 35%, 
            rgba(255, 255, 255, 0.3) 0%, 
            rgba(${colors.primary.join(',')}, 0.8) 30%, 
            rgba(${colors.secondary.join(',')}, 0.9) 70%, 
            rgba(${colors.primary.join(',')}, 1) 100%
          )`,
          boxShadow: `
            0 0 ${30}px rgba(${colors.primary.join(',')}, 0.6),
            0 0 ${60}px rgba(${colors.primary.join(',')}, 0.3),
            0 0 ${100}px rgba(${colors.secondary.join(',')}, 0.2),
            inset 0 ${size * 0.1}px ${size * 0.3}px rgba(255, 255, 255, 0.2),
            inset 0 -${size * 0.1}px ${size * 0.2}px rgba(0, 0, 0, 0.1)
          `,
          border: `2px solid rgba(${colors.primary.join(',')}, 0.4)`
        }}
      >

        {/* SVG Liquid Flow */}
        <svg
          className="absolute"
          style={{
            width: size * 0.8,
            height: size * 0.8,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            overflow: 'visible'
          }}
          viewBox="0 0 120 120"
        >
          <defs>
            <radialGradient id="liquidGradient" cx="0.3" cy="0.3" r="0.8">
              <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.6)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <filter id="liquidBlur">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          {/* Main liquid blob */}
          <path
            d={`M ${60 + Math.sin(animationTime * 0.003) * 8} ${30 + Math.cos(animationTime * 0.002) * 5}
               C ${80 + Math.sin(animationTime * 0.004) * 10} ${25 + Math.cos(animationTime * 0.003) * 8},
                 ${95 + Math.sin(animationTime * 0.002) * 6} ${60 + Math.cos(animationTime * 0.005) * 12},
                 ${75 + Math.sin(animationTime * 0.003) * 8} ${85 + Math.cos(animationTime * 0.004) * 10}
               C ${50 + Math.sin(animationTime * 0.005) * 12} ${95 + Math.cos(animationTime * 0.002) * 6},
                 ${25 + Math.sin(animationTime * 0.004) * 10} ${80 + Math.cos(animationTime * 0.003) * 8},
                 ${35 + Math.sin(animationTime * 0.002) * 6} ${45 + Math.cos(animationTime * 0.005) * 12} Z`}
            fill="url(#liquidGradient)"
            filter="url(#liquidBlur)"
            opacity="0.7"
          />

          {/* Secondary flowing shape */}
          <path
            d={`M ${40 + Math.sin(animationTime * 0.004 + 1) * 12} ${40 + Math.cos(animationTime * 0.003 + 1) * 8}
               C ${65 + Math.sin(animationTime * 0.005 + 1) * 10} ${30 + Math.cos(animationTime * 0.004 + 1) * 6},
                 ${85 + Math.sin(animationTime * 0.003 + 1) * 8} ${55 + Math.cos(animationTime * 0.006 + 1) * 12},
                 ${70 + Math.sin(animationTime * 0.004 + 1) * 10} ${75 + Math.cos(animationTime * 0.005 + 1) * 8}
               C ${45 + Math.sin(animationTime * 0.006 + 1) * 12} ${80 + Math.cos(animationTime * 0.003 + 1) * 6},
                 ${30 + Math.sin(animationTime * 0.005 + 1) * 8} ${65 + Math.cos(animationTime * 0.004 + 1) * 10},
                 ${40 + Math.sin(animationTime * 0.004 + 1) * 12} ${40 + Math.cos(animationTime * 0.003 + 1) * 8} Z`}
            fill="url(#liquidGradient)"
            filter="url(#liquidBlur)"
            opacity="0.5"
          />

          {/* Flowing tendril */}
          <path
            d={`M ${60} ${60}
               Q ${60 + Math.sin(animationTime * 0.006) * 20} ${40 + Math.cos(animationTime * 0.005) * 15},
                 ${80 + Math.sin(animationTime * 0.004) * 12} ${35 + Math.cos(animationTime * 0.007) * 10}
               Q ${85 + Math.sin(animationTime * 0.005) * 8} ${50 + Math.cos(animationTime * 0.006) * 12},
                 ${70 + Math.sin(animationTime * 0.007) * 15} ${65 + Math.cos(animationTime * 0.004) * 8}`}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="3"
            fill="none"
            filter="url(#liquidBlur)"
            opacity={0.3 + Math.sin(animationTime * 0.005) * 0.2}
          />

          {/* Another flowing tendril */}
          <path
            d={`M ${60} ${60}
               Q ${40 + Math.sin(animationTime * 0.005 + 2) * 15} ${50 + Math.cos(animationTime * 0.007 + 2) * 12},
                 ${25 + Math.sin(animationTime * 0.006 + 2) * 10} ${75 + Math.cos(animationTime * 0.004 + 2) * 8}
               Q ${30 + Math.sin(animationTime * 0.008 + 2) * 12} ${85 + Math.cos(animationTime * 0.005 + 2) * 6},
                 ${55 + Math.sin(animationTime * 0.006 + 2) * 8} ${80 + Math.cos(animationTime * 0.007 + 2) * 10}`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            fill="none"
            filter="url(#liquidBlur)"
            opacity={0.4 + Math.sin(animationTime * 0.006 + 2) * 0.2}
          />
        </svg>

        {/* Central bright core */}
        <div
          className="absolute rounded-full"
          style={{
            width: size * 0.15,
            height: size * 0.15,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle,
              rgba(255, 255, 255, 0.9) 0%,
              rgba(255, 255, 255, 0.6) 50%,
              transparent 100%
            )`,
            boxShadow: `0 0 ${20}px rgba(255, 255, 255, 0.8)`,
            filter: 'blur(1px)'
          }}
        />

        {/* Surface texture */}
        <div
          className="absolute inset-2 rounded-full opacity-20"
          style={{
            background: `conic-gradient(
              transparent 0deg,
              rgba(255, 255, 255, 0.3) 90deg,
              transparent 180deg,
              rgba(255, 255, 255, 0.2) 270deg,
              transparent 360deg
            )`,
            animation: 'spin 8s linear infinite'
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => {
        const particleAngle = (i * 60) + (animationTime * 0.01);
        const distance = 80 + Math.sin(animationTime * 0.003 + i) * 20;
        const x = Math.cos(particleAngle * Math.PI / 180) * distance;
        const y = Math.sin(particleAngle * Math.PI / 180) * distance;
        const intensity = state === 'speaking' ? 0.8 : 0.4;
        
        return (
          <div
            key={i}
            className="absolute rounded-full transition-all duration-100"
            style={{
              width: 3 + Math.sin(animationTime * 0.005 + i) * 2,
              height: 3 + Math.sin(animationTime * 0.005 + i) * 2,
              left: '50%',
              top: '50%',
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
              background: `rgba(${colors.primary.join(',')}, ${intensity})`,
              boxShadow: `0 0 ${6}px rgba(${colors.primary.join(',')}, ${intensity * 0.8})`,
              filter: 'blur(0.5px)'
            }}
          />
        );
      })}

      {/* State indicator */}
      {state !== 'idle' && (
        <div
          className="absolute text-xs font-medium px-3 py-1 rounded-full"
          style={{
            bottom: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            background: `rgba(${colors.primary.join(',')}, 0.2)`,
            color: `rgb(${colors.primary.join(',')})`,
            border: `1px solid rgba(${colors.primary.join(',')}, 0.3)`,
            backdropFilter: 'blur(10px)'
          }}
        >
          {state.charAt(0).toUpperCase() + state.slice(1)}
        </div>
      )}
    </div>
  );
};

export default AIOrb;
