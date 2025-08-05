import React from 'react';

const AIOrb = ({ size = 120 }) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div 
        className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"
        style={{ 
          width: size * 1.4, 
          height: size * 1.4,
          animationDuration: '3s'
        }}
      />
      
      {/* Middle ring */}
      <div 
        className="absolute rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 animate-spin"
        style={{ 
          width: size * 1.2, 
          height: size * 1.2,
          animationDuration: '8s'
        }}
      />
      
      {/* Core orb */}
      <div 
        className="relative rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl animate-pulse"
        style={{ 
          width: size, 
          height: size,
          animationDuration: '2s'
        }}
      >
        {/* Inner highlight */}
        <div 
          className="absolute top-4 left-4 rounded-full bg-white/30 blur-sm"
          style={{ 
            width: size * 0.3, 
            height: size * 0.3 
          }}
        />
        
        {/* Floating particles */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/60 rounded-full animate-ping"
              style={{
                top: `${20 + (i * 10)}%`,
                left: `${15 + (i * 12)}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Rotating outer ring */}
      <div 
        className="absolute rounded-full border-2 border-blue-300/40 animate-spin"
        style={{ 
          width: size * 1.6, 
          height: size * 1.6,
          animationDuration: '12s',
          animationDirection: 'reverse'
        }}
      >
        <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full transform -translate-x-1/2 -translate-y-1" />
        <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full transform -translate-x-1/2 translate-y-1" />
      </div>
    </div>
  );
};

export default AIOrb;