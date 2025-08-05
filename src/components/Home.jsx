import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Send, MessageSquare, BarChart3, Activity, ArrowRight } from 'lucide-react';
import AIOrb from './AIOrb';

const Home = ({ onNavigateToChat, onCreateNewChat }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickStart = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const userMessage = message.trim();
    setMessage('');
    
    try {
      // Create new chat with the message
      const newChat = await onCreateNewChat(userMessage);
      
      // Navigate to the chat immediately
      onNavigateToChat(newChat.id, userMessage);
    } catch (error) {
      console.error('Failed to create chat:', error);
      setMessage(userMessage); // Restore message on error
    }
  };

  const exampleCards = [
    {
      title: "Code Review",
      description: "Review my JavaScript code for best practices",
      icon: "💻",
      prompt: "Please review this JavaScript code and suggest improvements for best practices, performance, and readability."
    },
    {
      title: "Creative Writing",
      description: "Help me write a compelling story",
      icon: "✍️",
      prompt: "Help me write a creative short story about a mysterious discovery in an old library."
    },
    {
      title: "Data Analysis",
      description: "Analyze trends in my dataset",
      icon: "📊",
      prompt: "Help me analyze data trends and create insights from my dataset. What patterns should I look for?"
    },
    {
      title: "Learning Assistant",
      description: "Explain complex concepts simply",
      icon: "🎓",
      prompt: "Explain quantum computing in simple terms that a beginner can understand."
    }
  ];

  const quickActions = [
    {
      title: 'New Chat',
      description: 'Start a fresh conversation',
      icon: MessageSquare,
      action: () => onNavigateToChat(),
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700'
    },
    {
      title: 'Usage Stats',
      description: 'View your activity',
      icon: BarChart3,
      action: () => console.log('Usage stats'),
      color: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700'
    },
    {
      title: 'System Status',
      description: 'Check AI availability',
      icon: Activity,
      action: () => console.log('System status'),
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700'
    }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">TBridge</h1>
        <p className="text-gray-600 mt-1">Your intelligent AI assistant</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* AI Orb and Greeting */}
          <div className="text-center mb-12">
            <div className="mb-8">
              <AIOrb size={120} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {getGreeting()}, {user?.firstName || user?.email?.split('@')[0] || 'there'}!
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              What's on your mind?
            </p>

            {/* Quick Start Input */}
            <form onSubmit={handleQuickStart} className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full px-6 py-4 text-lg bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 pr-14"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Example Cards */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
              Try these examples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exampleCards.map((card, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setMessage(card.prompt);
                    handleQuickStart({ preventDefault: () => {} });
                  }}
                  className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <span className="text-2xl">{card.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {card.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
              Quick actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${action.color}`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">
                      {action.title}
                    </h4>
                    <p className="text-sm opacity-80">
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