import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Send, MessageSquare, Plus, Sparkles } from 'lucide-react';

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
    "Help me write a professional email",
    "Explain quantum computing simply",
    "Review my code for improvements",
    "Create a project timeline",
    "Brainstorm marketing ideas",
    "Summarize this document"
  ];

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#171717] transition-colors duration-200">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#0d0d0d] rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            
            <h1 className="text-4xl font-medium text-gray-900 dark:text-white mb-4 tracking-tight">
              Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'there'}
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-24 font-normal">
              How can I help you today?
            </p>

          {/* Example Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-28">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => {
                  setMessage(prompt);
                  handleQuickStart({ preventDefault: () => {} });
                }}
                className="p-4 text-left bg-gray-50 dark:bg-[#0d0d0d] hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-[#121212] rounded-xl transition-colors duration-200 group"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {prompt}
                </span>
              </button>
            ))}
          </div>

            {/* Input Section */}
            <form onSubmit={handleQuickStart}>
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isCreating}
                  className="w-full px-6 py-4 text-base bg-gray-50 dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#121212] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-14 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isCreating}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-transparent text-gray-500 dark:text-gray-400 disabled:opacity-50 rounded-lg disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
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
        </div>
      </div>
    </div>
  );
};

export default Home;