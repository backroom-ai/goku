import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, MessageSquare, Edit3, Check, X, Search, ChevronDown, ChevronRight, Paperclip, FileText, Image, File, Sparkles, Square } from 'lucide-react';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partialMessageId, setPartialMessageId] = useState(null);
  const fileInputRef = useRef(null);
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
    setChatsLoading(true);
    try {
      const chatsData = await api.getChats();
      setChats(chatsData);
      // Don't auto-load any chat - start with welcome view
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
      return newChat;
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw error;
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

  // Helper function to update chat in the sidebar list
  const updateChatInList = (updatedChat) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === updatedChat.id 
          ? { ...chat, title: updatedChat.title, updated_at: updatedChat.updated_at }
          : chat
      )
    );
  };

  // Auto-generate chat title based on first message
  const generateChatTitle = (message) => {
    const words = message.trim().split(' ');
    if (words.length <= 6) {
      return message.trim();
    }
    return words.slice(0, 6).join(' ') + '...';
  };

  // Typing animation effect
  const typeMessage = (text, callback) => {
    setIsTyping(true);
    setTypingText('');
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setTypingText(prev => prev + text[index]);
        index++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        callback();
      }
    }, 2.5); // Adjust speed as needed
    
    return typeInterval;
  };

  const stopGenerating = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    setIsGenerating(false);
    setIsTyping(false);
    setTypingText('');
    setLoading(false);
    setPartialMessageId(null);
  };
  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && attachedFiles.length === 0) || !selectedModel || loading || isGenerating) return;

    // Create new chat if none exists
    let chatToUse = currentChat;
    if (!chatToUse) {
      try {
        chatToUse = await createNewChat();
      } catch (error) {
        console.error('Failed to create chat:', error);
        return;
      }
    }

    const userMessage = message;
    const files = [...attachedFiles];
    const isFirstMessage = !chatToUse.messages || chatToUse.messages.length === 0;
    setMessage('');
    setAttachedFiles([]);
    setLoading(true);
    setIsGenerating(true);

    // Create abort controller for stopping generation
    const controller = new AbortController();
    setAbortController(controller);

    const optimisticUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
      attachments: files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))
    };

    // Create partial AI message for typing animation
    const partialAiMessageId = Date.now() + 1;
    setPartialMessageId(partialAiMessageId);

    // Add user message immediately for better UX
    setCurrentChat(prev => ({
      ...prev,
      messages: [...(prev?.messages || []), optimisticUserMessage]
    }));

    try {
      const response = await api.sendMessage(chatToUse.id, userMessage, selectedModel, files, controller.signal);
      
      if (!controller.signal.aborted) {
        // Generate title for first message
        let updatedTitle = chatToUse.title;
        if (isFirstMessage && userMessage.trim()) {
          updatedTitle = generateChatTitle(userMessage);
          try {
            await api.updateChatTitle(chatToUse.id, updatedTitle);
          } catch (titleError) {
            console.warn('Failed to update chat title:', titleError);
          }
        }

        // Add typing animation for AI response
        const aiMessage = response.aiMessage;
        const typingInterval = typeMessage(aiMessage.content, () => {
          // Clear partial message tracking
          setPartialMessageId(null);
          
          // Update current chat with server response after typing animation
          setCurrentChat(prev => ({
            ...prev,
            title: updatedTitle,
            messages: [
              ...prev.messages.slice(0, -1), // Remove optimistic message
              response.userMessage,
              aiMessage
            ],
            updated_at: response.chat?.updated_at || new Date().toISOString()
          }));

          // Update the chat in the sidebar list
          updateChatInList({
            ...chatToUse,
            title: updatedTitle,
            updated_at: response.chat?.updated_at || new Date().toISOString()
          });
        });

        // Store interval for cleanup if needed
        setAbortController(prev => ({ ...prev, typingInterval }));
      } else {
        // Generation was aborted - clean up UI state
        setCurrentChat(prev => ({
          ...prev,
          messages: prev.messages.slice(0, -1) // Remove optimistic user message
        }));
      }

    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('Failed to send message:', error);
        
        // Remove optimistic message on error
        setCurrentChat(prev => ({
          ...prev,
          messages: prev.messages.slice(0, -1)
        }));
        
        // Show error message
        alert('Failed to send message. Please try again.');
      }
      // Clean up UI state on abort
      if (controller.signal.aborted) {
        setCurrentChat(prev => ({
          ...prev,
          messages: prev.messages.slice(0, -1) // Remove optimistic user message
        }));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setIsGenerating(false);
        setAbortController(null);
      }
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
    if (!content) return null;
    
    // Simple markdown-like formatting
    const formatText = (text) => {
      // Handle code blocks first (```code```)
      text = text.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg my-2 overflow-x-auto"><code>$1</code></pre>');
      
      // Handle inline code (`code`)
      text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>');
      
      // Handle bold (**text** or __text__)
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      text = text.replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>');
      
      // Handle italic (*text* or _text_)
      text = text.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
      text = text.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');
      
      // Handle strikethrough (~~text~~)
      text = text.replace(/~~(.*?)~~/g, '<del class="line-through">$1</del>');
      
      // Handle links [text](url)
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>');
      
      return text;
    };

    // Split by lines and process each
    const lines = content.split('\n');
    const formattedLines = [];
    let inList = false;
    let listItems = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle headers
      if (trimmedLine.startsWith('### ')) {
        if (inList) {
          formattedLines.push(
            <ul key={`list-${formattedLines.length}`} className="list-disc list-inside my-2 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        formattedLines.push(
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2">
            {formatText(trimmedLine.substring(4))}
          </h3>
        );
      } else if (trimmedLine.startsWith('## ')) {
        if (inList) {
          formattedLines.push(
            <ul key={`list-${formattedLines.length}`} className="list-disc list-inside my-2 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        formattedLines.push(
          <h2 key={index} className="text-xl font-bold mt-4 mb-2">
            {formatText(trimmedLine.substring(3))}
          </h2>
        );
      } else if (trimmedLine.startsWith('# ')) {
        if (inList) {
          formattedLines.push(
            <ul key={`list-${formattedLines.length}`} className="list-disc list-inside my-2 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        formattedLines.push(
          <h1 key={index} className="text-2xl font-bold mt-4 mb-2">
            {formatText(trimmedLine.substring(2))}
          </h1>
        );
      }
      // Handle bullet points
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || /^\d+\.\s/.test(trimmedLine)) {
        const listContent = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') 
          ? trimmedLine.substring(2) 
          : trimmedLine.replace(/^\d+\.\s/, '');
        
        listItems.push(
          <li key={`${index}-${listItems.length}`} 
              dangerouslySetInnerHTML={{ __html: formatText(listContent) }} />
        );
        inList = true;
      }
      // Handle blockquotes
      else if (trimmedLine.startsWith('> ')) {
        if (inList) {
          formattedLines.push(
            <ul key={`list-${formattedLines.length}`} className="list-disc list-inside my-2 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        formattedLines.push(
          <blockquote key={index} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic">
            <div dangerouslySetInnerHTML={{ __html: formatText(trimmedLine.substring(2)) }} />
          </blockquote>
        );
      }
      // Handle empty lines
      else if (trimmedLine === '') {
        if (inList) {
          formattedLines.push(
            <ul key={`list-${formattedLines.length}`} className="list-disc list-inside my-2 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        formattedLines.push(<br key={index} />);
      }
      // Handle regular paragraphs
      else {
        if (inList) {
          formattedLines.push(
            <ul key={`list-${formattedLines.length}`} className="list-disc list-inside my-2 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        formattedLines.push(
          <p key={index} className="mb-2 last:mb-0">
            <span dangerouslySetInnerHTML={{ __html: formatText(line) }} />
          </p>
        );
      }
    });

    // Handle any remaining list items
    if (inList && listItems.length > 0) {
      formattedLines.push(
        <ul key={`list-${formattedLines.length}`} className="list-disc list-inside my-2 space-y-1">
          {listItems}
        </ul>
      );
    }

    return <div className="space-y-1">{formattedLines}</div>;
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
          {title}
          <span className="ml-auto text-xs text-gray-400">
            {expandedSections[sectionKey] ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
          </span>
        </button>
        
        {expandedSections[sectionKey] && (
          <div className="space-y-1 mt-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  currentChat?.id === chat.id 
                    ? 'bg-gray-50 dark:bg-[#171717] text-gray-700 dark:text-gray-300 dark:text-blue-300' 
                    : 'hover:bg-gray-50 dark:hover:bg-[#141414] text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => loadChat(chat.id)}
              >
                <div className="flex items-center flex-1 min-w-0">
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
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#171717]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d0d0d] dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-[#171717]">
      {/* Sidebar */}
      <div className={`w-80 bg-white dark:bg-[#0d0d0d] border-r border-gray-200 dark:border-[#121212] flex flex-col ${!currentChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-[#121212]">
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
              className="w-full pl-10 pr-4 py-2 bg-transparent rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-transparent focus:border-transparent transition-colors"
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
        {currentChat || !chatsLoading ? (
          <>
            {/* Chat Header */}
            <div className={`px-6 py-4 border-b border-gray-200 dark:border-[#121212] bg-white dark:bg-[#171717] ${!currentChat ? 'hidden' : 'block'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="px-3 py-2 bg-gray-50 font-semibold dark:bg-[#0d0d0d] text-gray-900 dark:text-white rounded-lg text-sm transition-colors"
                  >
                    {models.map((model) => (
                      <option key={model.model_name} value={model.model_name}>
                        {model.model_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {!currentChat ? (
                // Welcome view when no chat is selected
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#0d0d0d] rounded-2xl flex items-center justify-center mx-auto mb-8">
                      <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    </div>
                    
                    <h1 className="text-4xl font-medium text-gray-900 dark:text-white mb-4 tracking-tight">
                      How can I help you today?
                    </h1>
                    
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 font-normal">
                      Start a conversation with your AI assistant
                    </p>
                  </div>
                </div>
              ) : messagesLoading ? (
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
                     
                      <div
                        className={`max-w-2xl px-4 py-3 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-[#262626] text-white'
                            : 'bg-gray-100 dark:bg-[#0d0d0d] text-gray-900 dark:text-white'
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
                    </div>
                  ))}
                  
                  {(loading || isTyping) && (
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-100 dark:bg-[#0d0d0d] px-4 py-3 rounded-2xl">
                        {isTyping ? (
                          <div className="prose max-w-none text-sm">
                            {formatContent(typingText)}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div 
              className={`px-6 py-4 border-t border-gray-200 dark:border-[#121212] bg-white dark:bg-[#171717] ${
                isDragging ? 'bg-blue-50 dark:bg-[#171717] border-blue-300 dark:border-blue-600' : ''
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
                        <div key={file.id} className="flex items-center space-x-2 bg-gray-100 dark:bg-[#0d0d0d] px-3 py-2 rounded-lg">
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
                  <div className="absolute inset-0 bg-blue-50 dark:bg-[#171717] border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg flex items-center justify-center z-10">
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
                    className="px-3 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#121212] rounded-xl transition-colors flex items-center justify-center"
                    title="Attach files"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={attachedFiles.length > 0 ? "Add a message (optional)..." : "Ask me anything..."}
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#0d0d0d] text-gray-900 dark:text-white border border-gray-200 dark:border-[#121212] rounded-xl transition-colors"
                    disabled={loading || isGenerating}
                  />
                  <button
                    type="submit"
                    onClick={isGenerating ? stopGenerating : undefined}
                    disabled={!isGenerating && (!message.trim() && attachedFiles.length === 0)}
                    className={`px-3 py-3 rounded-xl transition-colors flex items-center justify-center ${
                      isGenerating 
                        ? 'bg-gray-100 dark:bg-[#121212] hover:bg-gray-200 dark:hover:bg-[#0d0d0d] text-gray-500 dark:text-gray-400' 
                        : 'bg-transparent text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? <Square className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Chat;