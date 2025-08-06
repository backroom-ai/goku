import axios from 'axios';
import pool from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';
import FormData from 'form-data';

class AIAdapter {
  constructor(config) {
    this.config = config;
  }

  async sendMessage(messages, options = {}) {
    throw new Error('sendMessage method must be implemented');
  }

  // Helper method to read file content
  async readFileContent(filePath) {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }

  // Helper method to determine if file is an image
  isImageFile(mimeType) {
    return mimeType && mimeType.startsWith('image/');
  }

  // Helper method to extract text from PDF (basic implementation)
  async extractTextFromPDF(filePath) {
    // Note: You'll need to install a PDF parsing library like 'pdf-parse'
    // npm install pdf-parse
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return `[PDF file: ${path.basename(filePath)} - content could not be extracted]`;
    }
  }
}

class OpenAIAdapter extends AIAdapter {
  async sendMessage(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 4096, systemPrompt, attachments = [] } = options;
    let newtemperature = parseFloat(temperature);
    
    // Check if we need to use the Assistants API for file processing
    if (attachments && attachments.length > 0 && this.requiresAssistantsAPI(attachments)) {
      return await this.sendMessageWithAssistants(messages, options);
    }
    
    // Use regular Chat Completions API for images and simple cases
    const processedMessages = await this.processMessagesWithAttachments(messages, attachments);
    
    const formattedMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...processedMessages]
      : processedMessages;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.config.model_name,
          messages: formattedMessages,
          temperature: newtemperature,
          max_tokens: maxTokens,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        tokensUsed: response.data.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  requiresAssistantsAPI(attachments) {
    // Use Assistants API for document processing (PDF, DOCX, etc.)
    return attachments.some(att => 
      att.type === 'application/pdf' ||
      att.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      att.type === 'text/plain' ||
      att.type === 'application/json' ||
      att.type === 'text/csv'
    );
  }

  async sendMessageWithAssistants(messages, options) {
    const { temperature = 0.7, maxTokens = 4096, systemPrompt, attachments = [] } = options;
    
    try {
      // Upload files to OpenAI
      const uploadedFiles = await this.uploadFiles(attachments);
      
      // Create assistant
      const assistant = await this.createAssistant(systemPrompt, uploadedFiles);
      
      // Create thread
      const threadResponse = await axios.post(
        'https://api.openai.com/v1/threads',
        {},
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );
      
      const threadId = threadResponse.data.id;
      
      // Add message to thread
      const lastMessage = messages[messages.length - 1];
      await axios.post(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          role: 'user',
          content: lastMessage.content || 'Please analyze the attached files.',
          attachments: uploadedFiles.map(file => ({
            file_id: file.id,
            tools: [{ type: 'file_search' }]
          }))
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );
      
      // Run the assistant
      const runResponse = await axios.post(
        `https://api.openai.com/v1/threads/${threadId}/runs`,
        {
          assistant_id: assistant.id,
          temperature: parseFloat(temperature),
          max_completion_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );
      
      // Wait for completion
      const runId = runResponse.data.id;
      await this.waitForRunCompletion(threadId, runId);
      
      // Get messages
      const messagesResponse = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );
      
      // Clean up
      await this.cleanup(assistant.id, uploadedFiles);
      
      const assistantMessage = messagesResponse.data.data.find(msg => msg.role === 'assistant');
      
      return {
        content: assistantMessage?.content[0]?.text?.value || 'No response generated',
        tokensUsed: 0 // Assistants API doesn't return token usage in the same way
      };
      
    } catch (error) {
      console.error('OpenAI Assistants API error:', error.response?.data || error.message);
      throw new Error(`OpenAI Assistants API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async uploadFiles(attachments) {
    const uploadedFiles = [];
    
    for (const attachment of attachments) {
      try {
        const fileBuffer = await this.readFileContent(attachment.path);
        
        const formData = new FormData();
        
        // For Node.js, we need to pass a readable stream or buffer with proper options
        formData.append('file', fileBuffer, {
          filename: attachment.name,
          contentType: attachment.type,
        });
        formData.append('purpose', 'assistants');
        
        const uploadResponse = await axios.post(
          'https://api.openai.com/v1/files',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              ...formData.getHeaders() // This gets the proper multipart headers
            }
          }
        );
        
        uploadedFiles.push(uploadResponse.data);
        console.log(`Successfully uploaded file: ${attachment.name}`);
      } catch (error) {
        console.error(`Error uploading file ${attachment.name}:`, error.response?.data || error.message);
      }
    }
    
    return uploadedFiles;
  }

  async createAssistant(systemPrompt, uploadedFiles) {
    const tools = [{ type: 'file_search' }];
    
    const assistantData = {
      name: 'File Analysis Assistant',
      instructions: systemPrompt || 'You are a helpful assistant that can analyze and extract information from files.',
      tools: tools,
      model: this.config.model_name,
      tool_resources: {
        file_search: {
          vector_stores: [{
            file_ids: uploadedFiles.map(f => f.id)
          }]
        }
      }
    };
    
    const response = await axios.post(
      'https://api.openai.com/v1/assistants',
      assistantData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );
    
    return response.data;
  }

  async waitForRunCompletion(threadId, runId, maxWaitTime = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const statusResponse = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );
      
      const status = statusResponse.data.status;
      
      if (status === 'completed') {
        return;
      } else if (status === 'failed' || status === 'cancelled' || status === 'expired') {
        throw new Error(`Run ${status}: ${statusResponse.data.last_error?.message || 'Unknown error'}`);
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Run timed out');
  }

  async cleanup(assistantId, uploadedFiles) {
    // Delete assistant
    try {
      await axios.delete(
        `https://api.openai.com/v1/assistants/${assistantId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );
    } catch (error) {
      console.warn('Error deleting assistant:', error.message);
    }
    
    // Delete uploaded files
    for (const file of uploadedFiles) {
      try {
        await axios.delete(
          `https://api.openai.com/v1/files/${file.id}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
          }
        );
      } catch (error) {
        console.warn(`Error deleting file ${file.id}:`, error.message);
      }
    }
  }

  async processMessagesWithAttachments(messages, attachments) {
    if (!attachments || attachments.length === 0) {
      return messages;
    }

    // Process the latest message (which should have the attachments)
    const processedMessages = [...messages];
    const lastMessage = processedMessages[processedMessages.length - 1];
    
    if (lastMessage && lastMessage.role === 'user') {
      const content = [];
      
      // Add text content if exists
      if (lastMessage.content && lastMessage.content.trim()) {
        content.push({
          type: 'text',
          text: lastMessage.content
        });
      }

      // Process each attachment (only for images in Chat Completions API)
      for (const attachment of attachments) {
        if (this.isImageFile(attachment.type)) {
          // Handle images for vision models
          try {
            const imageBuffer = await this.readFileContent(attachment.path);
            const base64Image = imageBuffer.toString('base64');
            
            content.push({
              type: 'image_url',
              image_url: {
                url: `data:${attachment.type};base64,${base64Image}`,
                detail: 'high'
              }
            });
          } catch (error) {
            console.error('Error processing image:', error);
            content.push({
              type: 'text',
              text: `[Error processing image: ${attachment.name}]`
            });
          }
        }
      }

      lastMessage.content = content;
    }

    return processedMessages;
  }
}

class ClaudeAdapter extends AIAdapter {
  async sendMessage(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 4096, systemPrompt, attachments = [] } = options;
    let newtemperature = parseFloat(temperature);
    
    // Process messages with attachments
    const processedMessages = await this.processMessagesWithAttachments(messages, attachments);
    
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.config.model_name,
          messages: processedMessages,
          system: systemPrompt,
          temperature: newtemperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'x-api-key': process.env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.content[0].text,
        tokensUsed: response.data.usage?.input_tokens + response.data.usage?.output_tokens || 0
      };
    } catch (error) {
      console.error('Claude API error:', error.response?.data || error.message);
      throw new Error(`Claude API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async processMessagesWithAttachments(messages, attachments) {
    if (!attachments || attachments.length === 0) {
      return messages;
    }

    const processedMessages = [...messages];
    const lastMessage = processedMessages[processedMessages.length - 1];
    
    if (lastMessage && lastMessage.role === 'user') {
      const content = [];
      
      // Add text content if exists
      if (lastMessage.content && lastMessage.content.trim()) {
        content.push({
          type: 'text',
          text: lastMessage.content
        });
      }

      // Process each attachment
      for (const attachment of attachments) {
        if (this.isImageFile(attachment.type)) {
          // Claude supports images
          try {
            const imageBuffer = await this.readFileContent(attachment.path);
            const base64Image = imageBuffer.toString('base64');
            
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: attachment.type,
                data: base64Image
              }
            });
          } catch (error) {
            console.error('Error processing image:', error);
            content.push({
              type: 'text',
              text: `[Error processing image: ${attachment.name}]`
            });
          }
        } else if (attachment.type === 'application/pdf') {
          // Handle PDF files
          try {
            const pdfText = await this.extractTextFromPDF(attachment.path);
            content.push({
              type: 'text',
              text: `Content from PDF file "${attachment.name}":\n\n${pdfText}`
            });
          } catch (error) {
            content.push({
              type: 'text',
              text: `[PDF file "${attachment.name}" attached - content extraction failed]`
            });
          }
        } else {
          // Handle other file types as text if possible
          try {
            const fileContent = await this.readFileContent(attachment.path);
            const textContent = fileContent.toString('utf8');
            content.push({
              type: 'text',
              text: `Content from file "${attachment.name}":\n\n${textContent}`
            });
          } catch (error) {
            content.push({
              type: 'text',
              text: `[File "${attachment.name}" of type ${attachment.type} attached - cannot display content]`
            });
          }
        }
      }

      lastMessage.content = content;
    }

    return processedMessages;
  }
}

class GroqAdapter extends AIAdapter {
  async sendMessage(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 4096, systemPrompt, attachments = [] } = options;
    let newtemperature = parseFloat(temperature);
    
    // Process messages with attachments (similar to OpenAI format)
    const processedMessages = await this.processMessagesWithAttachments(messages, attachments);
    
    const formattedMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...processedMessages]
      : processedMessages;

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: this.config.model_name,
          messages: formattedMessages,
          temperature: newtemperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        tokensUsed: response.data.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error('Groq API error:', error.response?.data || error.message);
      throw new Error(`Groq API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async processMessagesWithAttachments(messages, attachments) {
    if (!attachments || attachments.length === 0) {
      return messages;
    }

    // Note: Groq may not support vision models, so we'll handle files as text
    const processedMessages = [...messages];
    const lastMessage = processedMessages[processedMessages.length - 1];
    
    if (lastMessage && lastMessage.role === 'user') {
      let content = lastMessage.content || '';
      
      // Process each attachment as text
      for (const attachment of attachments) {
        if (attachment.type === 'application/pdf') {
          try {
            const pdfText = await this.extractTextFromPDF(attachment.path);
            content += `\n\nContent from PDF file "${attachment.name}":\n${pdfText}`;
          } catch (error) {
            content += `\n\n[PDF file "${attachment.name}" attached - content extraction failed]`;
          }
        } else if (this.isImageFile(attachment.type)) {
          content += `\n\n[Image file "${attachment.name}" attached - image analysis not supported in this model]`;
        } else {
          try {
            const fileContent = await this.readFileContent(attachment.path);
            const textContent = fileContent.toString('utf8');
            content += `\n\nContent from file "${attachment.name}":\n${textContent}`;
          } catch (error) {
            content += `\n\n[File "${attachment.name}" of type ${attachment.type} attached - cannot display content]`;
          }
        }
      }

      lastMessage.content = content;
    }

    return processedMessages;
  }
}

class OllamaAdapter extends AIAdapter {
  async sendMessage(messages, options = {}) {
    const { temperature = 0.7, systemPrompt, attachments = [] } = options;
    let newtemperature = parseFloat(temperature);
    
    // Process messages with attachments
    const processedMessages = await this.processMessagesWithAttachments(messages, attachments);
    
    try {
      const prompt = systemPrompt 
        ? `${systemPrompt}\n\n${processedMessages.map(m => `${m.role}: ${m.content}`).join('\n')}`
        : processedMessages.map(m => `${m.role}: ${m.content}`).join('\n');

      const response = await axios.post(
        `${process.env.OLLAMA_URL}/api/generate`,
        {
          model: this.config.model_name.replace('ollama-', ''),
          prompt,
          temperature: newtemperature,
          stream: false
        }
      );

      return {
        content: response.data.response,
        tokensUsed: 0 // Ollama doesn't provide token counts
      };
    } catch (error) {
      console.error('Ollama API error:', error.message);
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }

  async processMessagesWithAttachments(messages, attachments) {
    if (!attachments || attachments.length === 0) {
      return messages;
    }

    // Ollama handles attachments as text in the prompt
    const processedMessages = [...messages];
    const lastMessage = processedMessages[processedMessages.length - 1];
    
    if (lastMessage && lastMessage.role === 'user') {
      let content = lastMessage.content || '';
      
      // Process each attachment
      for (const attachment of attachments) {
        if (attachment.type === 'application/pdf') {
          try {
            const pdfText = await this.extractTextFromPDF(attachment.path);
            content += `\n\nContent from PDF file "${attachment.name}":\n${pdfText}`;
          } catch (error) {
            content += `\n\n[PDF file "${attachment.name}" attached - content extraction failed]`;
          }
        } else if (this.isImageFile(attachment.type)) {
          // Check if the Ollama model supports vision
          if (this.config.model_name.includes('vision') || this.config.model_name.includes('llava')) {
            // For vision-capable models, you'd need to implement base64 encoding
            content += `\n\n[Image file "${attachment.name}" attached for analysis]`;
          } else {
            content += `\n\n[Image file "${attachment.name}" attached - image analysis not supported in this model]`;
          }
        } else {
          try {
            const fileContent = await this.readFileContent(attachment.path);
            const textContent = fileContent.toString('utf8');
            content += `\n\nContent from file "${attachment.name}":\n${textContent}`;
          } catch (error) {
            content += `\n\n[File "${attachment.name}" of type ${attachment.type} attached - cannot display content]`;
          }
        }
      }

      lastMessage.content = content;
    }

    return processedMessages;
  }
}

class N8NAdapter extends AIAdapter {
  async sendMessage(messages, options = {}) {
    const { systemPrompt, attachments = [] } = options;
    const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    
    try {
      // Process attachments for N8N webhook
      const processedAttachments = await this.processAttachmentsForN8N(attachments);
      
      const response = await axios.post(
        this.config.api_endpoint,
        {
          messages,
          systemPrompt,
          sessionId,
          chatInput: latestMessage.content,
          attachments: processedAttachments,
          ...options
        }
      );

      return {
        content: response.data.output || response.data.content,
        tokensUsed: response.data.tokensUsed || 0
      };
    } catch (error) {
      console.error('N8N Webhook error:', error.message);
      throw new Error(`N8N Webhook error: ${error.message}`);
    }
  }

  async processAttachmentsForN8N(attachments) {
    if (!attachments || attachments.length === 0) {
      return [];
    }

    const processedAttachments = [];

    for (const attachment of attachments) {
      try {
        if (this.isImageFile(attachment.type)) {
          const imageBuffer = await this.readFileContent(attachment.path);
          const base64Image = imageBuffer.toString('base64');
          
          processedAttachments.push({
            name: attachment.name,
            type: attachment.type,
            data: base64Image,
            encoding: 'base64'
          });
        } else {
          const fileContent = await this.readFileContent(attachment.path);
          const textContent = fileContent.toString('utf8');
          
          processedAttachments.push({
            name: attachment.name,
            type: attachment.type,
            data: textContent,
            encoding: 'utf8'
          });
        }
      } catch (error) {
        console.error(`Error processing attachment ${attachment.name}:`, error);
        processedAttachments.push({
          name: attachment.name,
          type: attachment.type,
          error: 'Failed to process file'
        });
      }
    }

    return processedAttachments;
  }
}

export const createAdapter = (modelConfig) => {
  switch (modelConfig.provider) {
    case 'openai':
      return new OpenAIAdapter(modelConfig);
    case 'claude':
      return new ClaudeAdapter(modelConfig);
    case 'groq':
      return new GroqAdapter(modelConfig);
    case 'ollama':
      return new OllamaAdapter(modelConfig);
    case 'n8n':
      return new N8NAdapter(modelConfig);
    default:
      throw new Error(`Unsupported AI provider: ${modelConfig.provider}`);
  }
};

export const sendMessage = async (modelName, messages, options = {}) => {
  try {
    // Get model configuration from database
    const result = await pool.query(
      'SELECT * FROM model_configs WHERE model_name = $1 AND enabled = true',
      [modelName]
    );

    if (result.rows.length === 0) {
      throw new Error(`Model ${modelName} not found or not enabled`);
    }

    const modelConfig = result.rows[0];
    const adapter = createAdapter(modelConfig);
    
    // Merge default options with provided options
    const finalOptions = {
      temperature: options.temperature || modelConfig.default_temperature,
      maxTokens: options.maxTokens || modelConfig.max_tokens,
      systemPrompt: options.systemPrompt || modelConfig.system_prompt,
      attachments: options.attachments || [],
      ...options
    };

    console.log('Sending message with options:', finalOptions);

    return await adapter.sendMessage(messages, finalOptions);
  } catch (error) {
    console.error('AI adapter error:', error);
    throw error;
  }
};