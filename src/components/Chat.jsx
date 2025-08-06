import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, MessageSquare, Bot, User, Edit3, Check, X, Search, Settings, Share, MoreHorizontal, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';

const Chat = () => {
  const { theme } = useTheme();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [message, setMessage] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChats();
    loadModels();
    
    const handleNavigation = () => {
      const initialChatId = sessionStorage.getItem('navigateToChatId');
      const initialMessage = sessionStorage.getItem('initialMessage');
      
      if (initialChatId && initialMessage) {
        sessionStorage.removeItem('navigateToChatId');
        sessionStorage.removeItem('initialMessage');
        
        loadChat(initialChatId).then(() => {
          setMessage(initialMessage);
          setTimeout(() => {
            const form = document.querySelector('form');
            if (form) {
              form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
          }, 100);
        });
      }
    };
    
    handleNavigation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    setChatsLoading(true);
    try {
      const chatsData = await api.getChats();
      setChats(chatsData);
      if (chatsData.length > 0 && !currentChat) {
        loadChat(chatsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setChatsLoading(false);
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
    setMessagesLoading(true);
    try {
      const chatData = await api.getChat(chatId);
      setCurrentChat(chatData);
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setMessagesLoading(false);
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

  const updateChatTitle = async (chatId, newTitle) => {
    try {
      await api.updateChatTitle(chatId, newTitle);
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
      if (currentChat?.id === chatId) {
        setCurrentChat({ ...currentChat, title: newTitle });
      }
    } catch (error) {
      console.error('Failed to update chat title:', error);
    }
  };

  const handleTitleEdit = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const handleTitleSave = async (chatId) => {
    if (editingTitle.trim() && editingTitle !== chats.find(c => c.id === chatId)?.title) {
      await updateChatTitle(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleTitleCancel = () => {
    setEditingChatId(null);
    setEditingTitle('');
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
      
      setCurrentChat(prev => ({
        ...prev,
        messages: [
          ...prev.messages.slice(0, -1),
          response.userMessage,
          response.aiMessage
        ]
      }));

      loadChats();
    } catch (error) {
      console.error('Failed to send message:', error);
      setCurrentChat(prev => ({
        ...prev,
        messages: prev.messages.slice(0, -1)
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (content) => {
    return content
      .split('\n')
      .map((line, index) => (
        <p key={index} className="mb-2 last:mb-0">
          {line}
        </p>
      ));
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (chatsLoading) {
    return (
      <div className="flex h-full bg-gray-50 dark:bg-dark-900">
        <div className="w-80 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <div className="w-full h-12 bg-gray-200 dark:bg-dark-700 rounded-xl animate-pulse"></div>
          </div>
          <div className="flex-1 p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-dark-700 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Chat Sidebar */}
      <div className="w-80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Chats</h2>
            <button
              onClick={createNewChat}
              className="p-3 text-slate-500 dark:text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 blur-sm"></div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                currentChat?.id === chat.id 
                  ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-l-4 border-blue-500 shadow-lg' 
                  : 'hover:bg-white/60 dark:hover:bg-slate-700/60 hover:shadow-md'
              }`}
              onClick={() => loadChat(chat.id)}
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                  currentChat?.id === chat.id 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg' 
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  <MessageSquare className={`w-5 h-5 ${
                    currentChat?.id === chat.id ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  {editingChatId === chat.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 text-sm font-medium bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleTitleSave(chat.id);
                          if (e.key === 'Escape') handleTitleCancel();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTitleSave(chat.id);
                        }}
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTitleCancel();
                        }}
                        className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={`text-sm font-semibold truncate ${
                        currentChat?.id === chat.id 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {chat.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(chat.updated_at).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
              </div>
              {editingChatId !== chat.id && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTitleEdit(chat.id, chat.title);
                    }}
                    className="text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                      {currentChat.title}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">AI Assistant</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="appearance-none px-4 py-2 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 pr-10"
                    >
                      {models.map((model) => (
                        <option key={model.model_name} value={model.model_name}>
                          {model.display_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messagesLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4 animate-pulse">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {currentChat.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-4 animate-fade-in ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-3xl p-6 rounded-3xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : 'bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-700/50'
                        }`}
                      >
                        <div className={`prose max-w-none ${
                          msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'
                        }`}>
                          {formatContent(msg.content)}
                        </div>
                        {msg.model_used && (
                          <div className={`mt-3 text-xs font-medium ${
                            msg.role === 'user' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {msg.model_used} • {msg.tokens_used || 0} tokens
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
              {loading && (
                <div className="flex items-start space-x-4 animate-fade-in">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-900 dark:text-white p-6 rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <form onSubmit={sendMessage} className="flex space-x-4">
                <div className="flex-1 relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-20 blur-sm"></div>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    className="relative w-full px-6 py-4 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-600/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300 shadow-lg"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center hover:scale-105"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <MessageSquare className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                No chat selected
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Select a chat from the sidebar or create a new one to get started.
              </p>
              <button
                onClick={createNewChat}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold hover:scale-105"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors ${
                currentChat?.id === chat.id ? 'bg-primary-50 dark:bg-primary-900/20 border-r-2 border-primary-500' : ''
              }`}
              onClick={() => loadChat(chat.id)}
            >
              <div className="flex items-center flex-1 min-w-0">
                <MessageSquare className={`w-4 h-4 mr-3 flex-shrink-0 ${
                  currentChat?.id === chat.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-dark-500'
                }`} />
                <div className="min-w-0 flex-1">
                  {editingChatId === chat.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 text-sm font-medium bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-dark-100"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleTitleSave(chat.id);
                          if (e.key === 'Escape') handleTitleCancel();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTitleSave(chat.id);
                        }}
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTitleCancel();
                        }}
                        className="text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={`text-sm font-medium truncate ${
                        currentChat?.id === chat.id ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-dark-100'
                      }`}>
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-dark-400">
                        {new Date(chat.updated_at).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
              </div>
              {editingChatId !== chat.id && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTitleEdit(chat.id, chat.title);
                    }}
                    className="text-gray-400 dark:text-dark-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors p-1 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="text-gray-400 dark:text-dark-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-dark-800">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                    {currentChat.title}
                  </h1>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-dark-100 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {models.map((model) => (
                      <option key={model.model_name} value={model.model_name}>
                        {model.display_name}
                      </option>
                    ))}
                  </select>
                  <button className="p-2 text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-dark-900">
              {messagesLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 animate-fade-in">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-dark-700 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {currentChat.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-3 animate-slide-up ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-3xl p-4 rounded-2xl shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 border border-gray-200 dark:border-dark-700'
                        }`}
                      >
                        <div className={`prose max-w-none ${
                          msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'
                        }`}>
                          {formatContent(msg.content)}
                        </div>
                        {msg.model_used && (
                          <div className={`mt-2 text-xs ${
                            msg.role === 'user' ? 'text-primary-200' : 'text-gray-500 dark:text-dark-400'
                          }`}>
                            {msg.model_used} • {msg.tokens_used || 0} tokens
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-dark-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600 dark:text-dark-300" />
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
              {loading && (
                <div className="flex items-start space-x-3 animate-fade-in">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800">
              <form onSubmit={sendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-dark-100 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-dark-400 transition-colors"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-dark-900">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4">
                No chat selected
              </h2>
              <p className="text-gray-600 dark:text-dark-400 mb-8">
                Select a chat from the sidebar or create a new one to get started.
              </p>
              <button
                onClick={createNewChat}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;