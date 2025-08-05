import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, MessageSquare, Bot, User, BarChart3, Activity, Zap } from 'lucide-react';
import api from '../utils/api';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [message, setMessage] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChats();
    loadModels();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const chatsData = await api.getChats();
      setChats(chatsData);
      if (chatsData.length > 0 && !currentChat) {
        loadChat(chatsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadModels = async () => {
    try {
      const modelsData = await api.getEnabledModels();
      setModels(modelsData);
      if (modelsData.length > 0 && !selectedModel) {
        setSelectedModel(modelsData[0].model_name);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadChat = async (chatId) => {
    try {
      const chatData = await api.getChat(chatId);
      setCurrentChat(chatData);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const newChat = await api.createChat();
      setChats([newChat, ...chats]);
      setCurrentChat({ ...newChat, messages: [] });
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await api.deleteChat(chatId);
      setChats(chats.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        if (chats.length > 1) {
          const remainingChats = chats.filter(chat => chat.id !== chatId);
          loadChat(remainingChats[0].id);
        } else {
          setCurrentChat(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentChat || !selectedModel || loading) return;

    const userMessage = message;
    setMessage('');
    setLoading(true);

    // Optimistically add user message to UI
    const optimisticUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };

    setCurrentChat(prev => ({
      ...prev,
      messages: [...prev.messages, optimisticUserMessage]
    }));

    try {
      const response = await api.sendMessage(currentChat.id, userMessage, selectedModel);
      
      // Replace optimistic message with real messages from server
      setCurrentChat(prev => ({
        ...prev,
        messages: [
          ...prev.messages.slice(0, -1), // Remove optimistic message
          response.userMessage,
          response.aiMessage
        ]
      }));

      // Update chat list
      loadChats();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setCurrentChat(prev => ({
        ...prev,
        messages: prev.messages.slice(0, -1)
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (content) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, index) => (
        <p key={index} className="mb-2 last:mb-0">
          {line}
        </p>
      ));
  };

  // Quick action cards for the home screen
  const quickActions = [
    {
      title: 'New Chat',
      description: 'Start a conversation with AI',
      icon: MessageSquare,
      action: createNewChat,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      title: 'Usage Stats',
      description: 'View your chat statistics',
      icon: BarChart3,
      action: () => console.log('Usage stats'),
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      title: 'System Status',
      description: 'Check AI model availability',
      icon: Activity,
      action: () => console.log('System status'),
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    }
  ];
  return (
    <div className="flex h-full">
      {/* Chat list sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                currentChat?.id === chat.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
              }`}
              onClick={() => loadChat(chat.id)}
            >
              <div className="flex items-center flex-1 min-w-0">
                <MessageSquare className={`w-4 h-4 mr-3 flex-shrink-0 ${
                  currentChat?.id === chat.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${
                    currentChat?.id === chat.id ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {chat.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(chat.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentChat.title}
                </h1>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {models.map((model) => (
                      <option key={model.model_name} value={model.model_name}>
                        {model.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              {currentChat.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-3xl p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div className={`prose max-w-none ${
                      msg.role === 'user' ? 'prose-invert' : ''
                    }`}>
                      {formatContent(msg.content)}
                    </div>
                    {msg.model_used && (
                      <div className={`mt-2 text-xs ${
                        msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        Model: {msg.model_used} • Tokens: {msg.tokens_used || 0}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="bg-white text-gray-900 p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={sendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-4xl mx-auto px-6">
              <Bot className="w-16 h-16 text-blue-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to TBridge
              </h2>
              <p className="text-lg text-gray-600 mb-12">
                Your intelligent AI assistant platform. Get started with one of the quick actions below.
              </p>
              
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${action.color}`}
                    >
                      <Icon className="w-8 h-8 mx-auto mb-4 text-gray-700" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;