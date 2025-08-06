import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Send, MessageSquare, BarChart3, Activity, ArrowRight, Sparkles, Zap, Brain, Code } from 'lucide-react';
import AIOrb from './AIOrb';

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
      color: "from-blue-500 to-cyan-500",
      prompt: "Please review this code and suggest improvements for best practices, performance, and readability."
    },
    {
      title: "Creative Writing",
      description: "Help me write compelling stories and content",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
      prompt: "Help me write a creative short story about a mysterious discovery in an old library."
    },
    {
      title: "Data Analysis",
      description: "Analyze trends and create insights from data",
      icon: BarChart3,
      color: "from-green-500 to-emerald-500",
      prompt: "Help me analyze data trends and create insights from my dataset. What patterns should I look for?"
    },
    {
      title: "Learning Assistant",
      description: "Explain complex concepts in simple terms",
      icon: Brain,
      color: "from-orange-500 to-red-500",
      prompt: "Explain quantum computing in simple terms that a beginner can understand."
    }
  ];

  const quickActions = [
    {
      title: 'New Chat',
      description: 'Start a fresh conversation',
      icon: MessageSquare,
      action: () => onNavigateToChat(),
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Usage Stats',
      description: 'View your activity',
      icon: BarChart3,
      action: () => console.log('Usage stats'),
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'System Status',
      description: 'Check AI availability',
      icon: Activity,
      action: () => console.log('System status'),
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-800">
      {/* Header */}
      <div className="p-6 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-dark-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              TBridge
            </h1>
            <p className="text-gray-600 dark:text-dark-400 mt-1">Your intelligent AI assistant</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-dark-400">Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-12">
          {/* AI Orb and Greeting */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-8">
              <AIOrb size={120} state="idle" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-dark-100 mb-4">
              {getGreeting()}, {user?.firstName || user?.email?.split('@')[0] || 'there'}! 👋
            </h2>
            <p className="text-xl text-gray-600 dark:text-dark-400 mb-8">
              What would you like to explore today?
            </p>

            {/* Quick Start Input */}
            <form onSubmit={handleQuickStart} className="max-w-2xl mx-auto mb-12">
              <div className="relative group">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isCreating}
                  className="w-full px-6 py-4 text-lg bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-700 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 dark:focus:ring-primary-900/20 transition-all duration-200 pr-14 text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 shadow-sm group-hover:shadow-md disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isCreating}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                >
                  {isCreating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Example Cards */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-6 text-center">
              Try these examples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exampleCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setMessage(card.prompt);
                      handleQuickStart({ preventDefault: () => {} });
                    }}
                    className="p-6 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg transition-all duration-200 text-left group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center shadow-sm`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-dark-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {card.title}
                        </h4>
                        <p className="text-gray-600 dark:text-dark-400 text-sm">
                          {card.description}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 dark:text-dark-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors transform group-hover:translate-x-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100 mb-6 text-center">
              Quick actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="p-6 bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 group"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-dark-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-dark-400">
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