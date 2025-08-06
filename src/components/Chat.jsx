import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, MessageSquare, Bot, User, Edit3, Check, X, Search, ChevronDown, ChevronRight, Paperclip, FileText, Image, File } from 'lucide-react';
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
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
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
    if ((!message.trim() && attachedFiles.length === 0) || !currentChat || !selectedModel || loading) return;

    const userMessage = message;
    const files = [...attachedFiles];
    setMessage('');
    setAttachedFiles([]);
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
      const response = await api.sendMessage(currentChat.id, userMessage, selectedModel, files);
      
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    const validFiles = files.filter(file => {
      // Allow common file types (max 10MB each)
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'text/plain',
        'text/csv',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File type "${file.type}" is not supported.`);
        return false;
      }
      
      return true;
    });

    const newFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />;
    if (fileType.includes('document') || fileType.includes('word')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      <div className="mb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {expandedSections[sectionKey] ? (
            <ChevronDown className="w-4 h-4 mr-2" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-2" />
          )}
          {title}
          <span className="ml-auto text-xs text-gray-400">
            {chats.length}
          </span>
        </button>
        
        {expandedSections[sectionKey] && (
          <div className="space-y-1 mt-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  currentChat?.id === chat.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => loadChat(chat.id)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <MessageSquare className="w-4 h-4 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    {editingChatId === chat.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="flex-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="text-green-600 hover:text-green-700 p-1"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTitleCancel();
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium truncate">
                        {chat.title}
                      </p>
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
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 rounded"
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
      <div className="flex h-full bg-white dark:bg-gray-900">
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex-1 p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chats
            </h2>
            <button
              onClick={createNewChat}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderChatSection('Today', categorizedChats.today, 'today')}
          {renderChatSection('Yesterday', categorizedChats.yesterday, 'yesterday')}
          {renderChatSection('Past chats', categorizedChats.pastChats, 'pastChats')}
          
          {filteredChats.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {chats.length === 0 ? 'No chats yet' : 'No matching chats'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentChat.title}
                  </h1>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messagesLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6">
                  {currentChat.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-4 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-2xl px-4 py-3 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                      >
                        <div className="prose max-w-none text-sm">
                          {formatContent(msg.content)}
                        </div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((attachment, index) => (
                              <div key={index} className={`flex items-center space-x-2 text-xs p-2 rounded ${
                                msg.role === 'user' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                              }`}>
                                {getFileIcon(attachment.type)}
                                <span className="truncate">{attachment.name}</span>
                                <span className="text-xs opacity-75">({formatFileSize(attachment.size)})</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.model_used && (
                          <div className={`mt-2 text-xs ${
                            msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {msg.model_used}
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
                        <div className="flex items-center space-x-1">
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

            {/* Message Input */}
            <div 
              className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${
                isDragging ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="max-w-3xl mx-auto">
                {/* Attached Files */}
                {attachedFiles.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Attached files:</div>
                    <div className="flex flex-wrap gap-2">
                      {attachedFiles.map((file) => (
                        <div key={file.id} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                          {getFileIcon(file.type)}
                          <span className="text-sm truncate max-w-32">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drag and Drop Overlay */}
                {isDragging && (
                  <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg flex items-center justify-center z-10">
                    <div className="text-center">
                      <Paperclip className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-blue-600 dark:text-blue-400 font-medium">Drop files here to attach</p>
                    </div>
                  </div>
                )}

                <form onSubmit={sendMessage} className="flex space-x-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    accept=".txt,.csv,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex items-center justify-center"
                    title="Attach files"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={attachedFiles.length > 0 ? "Add a message (optional)..." : "Type a message..."}
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || (!message.trim() && attachedFiles.length === 0)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No chat selected
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose a conversation from the sidebar or start a new one.
              </p>
              <button
                onClick={createNewChat}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
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