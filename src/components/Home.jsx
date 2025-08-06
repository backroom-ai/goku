import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Send, Sparkles, Zap, Cpu, Bot, Wrench } from 'lucide-react';

const Home = ({ onNavigateToChat, onCreateNewChat }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleQuickStart = async (e) => {
    e.preventDefault();
    if (!message.trim() || isCreating) return;
    
    const userMessage = message.trim();
    setMessage('');
    setIsCreating(true);
    
    try {
      const newChat = await onCreateNewChat(userMessage);
      onNavigateToChat(newChat.id, userMessage);
    } catch (error) {
      console.error('Failed to create chat:', error);
      setMessage(userMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const examplePrompts = [
    {
      text: "Help me write a professional email",
      icon: <Sparkles className="w-5 h-5" />,
      gradient: "from-blue-500 to-purple-500"
    },
    {
      text: "Explain quantum computing simply",
      icon: <Cpu className="w-5 h-5" />,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      text: "Review my code for improvements",
      icon: <Bot className="w-5 h-5" />,
      gradient: "from-green-500 to-blue-500"
    },
    {
      text: "Create a project timeline",
      icon: <Wrench className="w-5 h-5" />,
      gradient: "from-orange-500 to-red-500"
    },
    {
      text: "Brainstorm marketing ideas",
      icon: <Zap className="w-5 h-5" />,
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      text: "Summarize this document",
      icon: <Sparkles className="w-5 h-5" />,
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <div className="flex-1 flex flex-col backdrop-blur-xl bg-gradient-to-br from-white/10 via-blue-50/20 to-purple-50/20 dark:from-dark-900/10 dark:via-dark-800/20 dark:to-dark-900/20 transition-all duration-200">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-3xl mx-auto animate-fade-in">
          {/* Welcome Section */}
          <div className="text-center mb-16">
            {/* Animated Gradient Orb */}
            <div className="relative mx-auto mb-12 w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-purple-500 to-pink-500 rounded-full animate-float opacity-80 blur-xl"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lift dark:shadow-lift-dark animate-pulse-soft">
                <Sparkles className="w-12 h-12 text-white animate-float" />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-primary-600 to-purple-600 dark:from-white dark:via-primary-400 dark:to-purple-400 bg-clip-text text-transparent mb-6 tracking-tight leading-tight">
              Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'there'}
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-16 font-normal tracking-wide">
              How can I help you today?
            </p>

            {/* Enhanced Input Section */}
            <form onSubmit={handleQuickStart} className="mb-16">
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isCreating}
                  className="w-full px-8 py-6 text-lg bg-white/40 dark:bg-dark-800/40 backdrop-blur-xl border border-white/30 dark:border-dark-700/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 pr-16 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 shadow-glass dark:shadow-glass-dark tracking-wide"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isCreating}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white rounded-xl disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lift dark:shadow-lift-dark transform hover:scale-105 hover:-translate-y-1 disabled:hover:scale-100 disabled:hover:-translate-y-1/2"
                >
                  {isCreating ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Enhanced Example Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => {
                  setMessage(prompt.text);
                  handleQuickStart({ preventDefault: () => {} });
                }}
                className="group p-6 text-left bg-white/30 dark:bg-dark-800/30 backdrop-blur-xl hover:bg-white/50 dark:hover:bg-dark-700/50 border border-white/20 dark:border-dark-700/20 rounded-2xl transition-all duration-200 shadow-glass dark:shadow-glass-dark hover:shadow-lift dark:hover:shadow-lift-dark transform hover:scale-[1.02] hover:-translate-y-1 animate-slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${prompt.gradient} rounded-xl flex items-center justify-center shadow-lift dark:shadow-lift-dark group-hover:scale-110 transition-transform duration-200`}>
                    <div className="text-white">
                      {prompt.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200 tracking-wide leading-relaxed">
                      {prompt.text}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;