import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Send, MessageSquare, BarChart3, Activity, ArrowRight, Sparkles, Zap, Brain, Code, Plus } from 'lucide-react';

const Home = ({ onNavigateToChat, onCreateNewChat }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

  const exampleCards = [
    {
      title: "Code Review",
      description: "Review my code for best practices and improvements",
      icon: Code,
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      prompt: "Please review this code and suggest improvements for best practices, performance, and readability."
    },
    {
      title: "Creative Writing",
      description: "Help me write compelling stories and content",
      icon: Sparkles,
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      prompt: "Help me write a creative short story about a mysterious discovery in an old library."
    },
    {
      title: "Data Analysis",
      description: "Analyze trends and create insights from data",
      icon: BarChart3,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      prompt: "Help me analyze data trends and create insights from my dataset. What patterns should I look for?"
    },
    {
      title: "Learning Assistant",
      description: "Explain complex concepts in simple terms",
      icon: Brain,
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      prompt: "Explain quantum computing in simple terms that a beginner can understand."
    }
  ];

  const quickActions = [
    {
      title: 'New Chat',
      description: 'Start a fresh conversation',
      icon: MessageSquare,
      action: () => onNavigateToChat(),
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Usage Stats',
      description: 'View your activity',
      icon: BarChart3,
      action: () => console.log('Usage stats'),
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      title: 'System Status',
      description: 'Check AI availability',
      icon: Activity,
      action: () => console.log('System status'),
      gradient: 'from-purple-500 to-violet-600'
    }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Floating Header */}
      <div className="relative p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              TBridge
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Your intelligent AI companion</p>
          </div>
          <div className="flex items-center space-x-3 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-sm"></div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            {/* Gradient Orb Replacement */}
            <div className="relative mb-12">
              <div className="w-32 h-32 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute inset-4 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute inset-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              {getGreeting()}, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.firstName || user?.email?.split('@')[0] || 'there'}</span>! 
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              What would you like to explore today? Ask me anything or choose from the suggestions below.
            </p>

            {/* Enhanced Quick Start Input */}
            <form onSubmit={handleQuickStart} className="max-w-3xl mx-auto mb-16">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 blur-sm"></div>
                <div className="relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    disabled={isCreating}
                    className="w-full px-8 py-6 text-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 pr-16 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 shadow-xl disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || isCreating}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    {isCreating ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Example Cards */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Try these examples
              </h3>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exampleCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setMessage(card.prompt);
                      handleQuickStart({ preventDefault: () => {} });
                    }}
                    className="group p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-3xl hover:border-slate-300/50 dark:hover:border-slate-600/50 hover:shadow-2xl transition-all duration-500 text-left transform hover:-translate-y-2"
                  >
                    <div className="flex items-start space-x-6">
                      <div className={`w-16 h-16 bg-gradient-to-r ${card.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl text-slate-900 dark:text-white mb-3 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                          {card.title}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-all duration-300 transform group-hover:translate-x-2" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Quick actions
              </h3>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="group p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-3 hover:border-slate-300/50 dark:hover:border-slate-600/50"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-r ${action.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {action.title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;