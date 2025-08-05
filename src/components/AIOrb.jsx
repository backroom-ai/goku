import React from 'react';

const AIOrb = ({ size = 120, isListening = false }) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Sound wave rings */}
      <div 
        className={`absolute rounded-full border-2 border-blue-400/30 animate-ping ${isListening ? 'animate-pulse' : ''}`}
        style={{ 
          width: size * 1.8, 
          height: size * 1.8,
          animationDuration: '2s'
        }}
      />
      
      {/* Second wave ring */}
      <div 
        className={`absolute rounded-full border-2 border-purple-400/20 animate-ping ${isListening ? 'animate-pulse' : ''}`}
        style={{ 
          width: size * 1.5, 
          height: size * 1.5,
          animationDuration: '2.5s',
          animationDelay: '0.3s'
        }}
      />
      
      {/* Third wave ring */}
      <div 
        className={`absolute rounded-full border border-blue-300/15 animate-ping ${isListening ? 'animate-pulse' : ''}`}
        style={{ 
          width: size * 2.2, 
          height: size * 2.2,
          animationDuration: '3s',
          animationDelay: '0.6s'
        }}
      />
      
      {/* Core voice orb */}
      <div 
        className={`relative rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl transition-all duration-300 ${
          isListening ? 'animate-pulse scale-110' : 'animate-pulse'
        }`}
        style={{ 
          width: size, 
          height: size,
          animationDuration: isListening ? '1s' : '3s'
        }}
      >
        {/* Voice indicator highlight */}
        <div 
          className="absolute top-3 left-3 rounded-full bg-white/40 blur-sm"
          style={{ 
            width: size * 0.25, 
            height: size * 0.25 
          }}
        />
        
        {/* Sound wave particles */}
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-60">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-white/70 rounded-full ${
                isListening ? 'animate-bounce' : 'animate-ping'
              }`}
              style={{
                top: `${15 + (i * 8)}%`,
                left: `${20 + (i * 8)}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: isListening ? '0.8s' : '2s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIOrb;