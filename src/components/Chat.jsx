import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, MessageSquare, Bot, User, Edit3, Check, X, Search, ChevronDown, ChevronRight, Sparkles, Zap, Cpu, Wrench } from 'lucide-react';
import api from '../utils/api';

const Chat = () => {
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
  const [expandedSections, setExpandedSections] = useState({
    today: true,
    yesterday: true,
    pastChats: true
  });
  const messagesEndRef = useRef(null);

  // AI Model Icon Mapping
  const getModelIcon = (modelName, provider) => {
    if (modelName?.toLowerCase().includes('gpt') || provider === 'openai') {
      return <Sparkles className="w-4 h-4" />;
    }
    if (provider === 'groq') {
      return <Zap className="w-4 h-4" />;
    }
    if (provider === 'claude') {
      return <Cpu className="w-4 h-4" />;
    }
    if (provider === 'ollama') {
      return <Bot className="w-4 h-4" />; // Using Bot as llama substitute
    }
    if (provider === 'n8n') {
      return <Wrench className="w-4 h-4" />;
    }
    return <Bot className="w-4 h-4" />;
  };

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

  const categorizeChats = (chats) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const categories = {
      today: [],
      yesterday: [],
      pastChats: []
    };

    chats.forEach(chat => {
      const chatDate = new Date(chat.updated_at);
      const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

      if (chatDay.getTime() === today.getTime()) {
        categories.today.push(chat);
      } else if (chatDay.getTime() === yesterday.getTime()) {
        categories.yesterday.push(chat);
      } else {
        categories.pastChats.push(chat);
      }
    });

    return categories;
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categorizedChats = categorizeChats(filteredChats);

  const renderChatSection = (title, chats, sectionKey) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-4 animate-slide-in">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 rounded-xl hover:bg-white/30 dark:hover:bg-dark-700/30 backdrop-blur-sm group"
        >
          <div className="transform transition-transform duration-200 group-hover:scale-110">
            {expandedSections[sectionKey] ? (
              <ChevronDown className="w-4 h-4 mr-3" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-3" />
            )}
          </div>
          <span className="tracking-wide">{title}</span>
          <span className="ml-auto text-xs bg-gray-200 dark:bg-dark-600 px-2 py-1 rounded-full">
            {chats.length}
          </span>
        </button>
        
        {expandedSections[sectionKey] && (
          <div className="space-y-1 mt-2 animate-slide-in">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-0.5 ${
                  currentChat?.id === chat.id 
                    ? 'bg-gradient-to-r from-primary-500/20 to-purple-500/20 backdrop-blur-sm text-primary-700 dark:text-primary-300 shadow-lift dark:shadow-lift-dark border border-primary-200/50 dark:border-primary-700/50' 
                    : 'hover:bg-white/40 dark:hover:bg-dark-700/40 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:shadow-lift dark:hover:shadow-lift-dark'
                }`}
                onClick={() => loadChat(chat.id)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <MessageSquare className="w-4 h-4 mr-3 flex-shrink-0 opacity-60" />
                  <div className="min-w-0 flex-1">
                    {editingChatId === chat.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="flex-1 text-sm bg-white/80 dark:bg-dark-700/80 backdrop-blur-sm border border-gray-300/50 dark:border-dark-600/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
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
                          className="text-green-600 hover:text-green-700 p-1 rounded-lg hover:bg-green-100/50 dark:hover:bg-green-900/20 transition-all duration-200 transform hover:scale-110"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTitleCancel();
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/20 transition-all duration-200 transform hover:scale-110"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium truncate tracking-wide">
                        {chat.title}
                      </p>
                    )}
                  </div>
                </div>
                {editingChatId !== chat.id && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTitleEdit(chat.id, chat.title);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-dark-600/50 backdrop-blur-sm transition-all duration-200 transform hover:scale-110"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50/50 dark:hover:bg-red-900/20 backdrop-blur-sm transition-all duration-200 transform hover:scale-110"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (chatsLoading) {
    return (
      <div className="flex h-full">
        <div className="w-80 backdrop-blur-xl bg-white/20 dark:bg-dark-800/20 border-r border-white/20 dark:border-dark-700/20 flex flex-col shadow-glass dark:shadow-glass-dark">
          <div className="p-6 border-b border-white/20 dark:border-dark-700/20">
            <div className="w-full h-10 bg-gray-200/50 dark:bg-dark-700/50 rounded-xl animate-pulse-soft backdrop-blur-sm"></div>
          </div>
          <div className="flex-1 p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200/50 dark:bg-dark-700/50 rounded-xl animate-pulse-soft backdrop-blur-sm"></div>
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
    <div className="flex h-full">
      {/* Glassmorphism Sidebar */}
      <div className="w-80 backdrop-blur-xl bg-white/20 dark:bg-dark-800/20 border-r border-white/20 dark:border-dark-700/20 flex flex-col shadow-glass dark:shadow-glass-dark">
        {/* Header */}
        <div className="p-6 border-b border-white/20 dark:border-dark-700/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-wide">
              Conversations
            </h2>
            <button
              onClick={createNewChat}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/30 dark:hover:bg-dark-700/30 backdrop-blur-sm rounded-xl transition-all duration-200 transform hover:scale-110 hover:-translate-y-0.5 shadow-lift dark:shadow-lift-dark"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Enhanced Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/40 dark:bg-dark-700/40 backdrop-blur-sm border border-white/30 dark:border-dark-600/30 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 shadow-lift dark:shadow-lift-dark tracking-wide"
            />
          </div>
        </div>

        {/* Chat List with Custom Scrollbar */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-dark-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-dark-500">
          {renderChatSection('Today', categorizedChats.today, 'today')}
          {renderChatSection('Yesterday', categorizedChats.yesterday, 'yesterday')}
          {renderChatSection('Past chats', categorizedChats.pastChats, 'pastChats')}
          
          {filteredChats.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4 opacity-50" />
              <p className="text-sm text-gray-500 dark:text-gray-400 tracking-wide">
                {chats.length === 0 ? 'No conversations yet' : 'No matching conversations'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col backdrop-blur-xl bg-white/10 dark:bg-dark-900/10">
        {currentChat ? (
          <>
            {/* Glassmorphism Chat Header */}
            <div className="px-6 py-4 border-b border-white/20 dark:border-dark-700/20 backdrop-blur-xl bg-white/20 dark:bg-dark-900/20 shadow-glass dark:shadow-glass-dark">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-wide">
                    {currentChat.title}
                  </h1>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="px-4 py-2 bg-white/40 dark:bg-dark-800/40 backdrop-blur-sm text-gray-900 dark:text-white border border-white/30 dark:border-dark-700/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 shadow-lift dark:shadow-lift-dark tracking-wide"
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
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-dark-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-dark-500">
              {messagesLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4 animate-pulse-soft">
                      <div className="w-8 h-8 bg-gray-200/50 dark:bg-dark-700/50 rounded-full backdrop-blur-sm"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200/50 dark:bg-dark-700/50 rounded-xl backdrop-blur-sm"></div>
                        <div className="h-4 bg-gray-200/50 dark:bg-dark-700/50 rounded-xl w-3/4 backdrop-blur-sm"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                  {currentChat.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-4 animate-slide-in ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lift dark:shadow-lift-dark">
                          {getModelIcon(msg.model_used, models.find(m => m.model_name === msg.model_used)?.provider)}
                        </div>
                      )}
                      
                      <div
                        className={`max-w-2xl px-6 py-4 rounded-2xl backdrop-blur-sm shadow-lift dark:shadow-lift-dark transition-all duration-200 hover:shadow-xl dark:hover:shadow-2xl transform hover:-translate-y-0.5 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                            : 'bg-white/60 dark:bg-dark-800/60 text-gray-900 dark:text-white border border-white/30 dark:border-dark-700/30'
                        }`}
                      >
                        <div className="prose max-w-none text-sm tracking-wide leading-relaxed">
                          {formatContent(msg.content)}
                        </div>
                        {msg.model_used && (
                          <div className={`mt-3 text-xs flex items-center space-x-2 ${
                            msg.role === 'user' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {getModelIcon(msg.model_used, models.find(m => m.model_name === msg.model_used)?.provider)}
                            <span>{models.find(m => m.model_name === msg.model_used)?.display_name || msg.model_used}</span>
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lift dark:shadow-lift-dark">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex items-start space-x-4 animate-slide-in">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center shadow-lift dark:shadow-lift-dark">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/60 dark:bg-dark-800/60 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/30 dark:border-dark-700/30 shadow-lift dark:shadow-lift-dark">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Enhanced Message Input */}
            <div className="px-6 py-4 border-t border-white/20 dark:border-dark-700/20 backdrop-blur-xl bg-white/20 dark:bg-dark-900/20 shadow-glass dark:shadow-glass-dark">
              <div className="max-w-4xl mx-auto">
                <form onSubmit={sendMessage} className="flex space-x-4">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-6 py-4 bg-white/40 dark:bg-dark-800/40 backdrop-blur-sm text-gray-900 dark:text-white border border-white/30 dark:border-dark-700/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 shadow-lift dark:shadow-lift-dark tracking-wide"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="px-6 py-4 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lift dark:shadow-lift-dark transform hover:scale-105 hover:-translate-y-0.5 disabled:hover:scale-100 disabled:hover:translate-y-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto animate-fade-in">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lift dark:shadow-lift-dark animate-float">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 tracking-wide">
                No conversation selected
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 tracking-wide">
                Choose a conversation from the sidebar or start a new one.
              </p>
              <button
                onClick={createNewChat}
                className="px-6 py-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 font-medium shadow-lift dark:shadow-lift-dark transform hover:scale-105 hover:-translate-y-0.5 tracking-wide"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;