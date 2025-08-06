import axios from 'axios';
import pool from '../config/database.js';

class AIAdapter {
  constructor(config) {
    this.config = config;
  }

  async sendMessage(messages, options = {}) {
    throw new Error('sendMessage method must be implemented');
  }
}

class OpenAIAdapter extends AIAdapter {
  async sendMessage(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 4096, systemPrompt } = options;
    let newtemperature = parseFloat(temperature);
    
    const formattedMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

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
}

class ClaudeAdapter extends AIAdapter {
  async sendMessage(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 4096, systemPrompt } = options;
    let newtemperature = parseFloat(temperature);
    
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.config.model_name,
          messages,
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
}

class GroqAdapter extends AIAdapter {
  async sendMessage(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 4096, systemPrompt } = options;
    let newtemperature = parseFloat(temperature);
    
    const formattedMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

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
}

class OllamaAdapter extends AIAdapter {
  async sendMessage(messages, options = {}) {
    const { temperature = 0.7, systemPrompt } = options;
    let newtemperature = parseFloat(temperature);
    
    try {
      const prompt = systemPrompt 
        ? `${systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
        : messages.map(m => `${m.role}: ${m.content}`).join('\n');

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
}

class N8NAdapter extends AIAdapter {
  async sendMessage(messages, options = {}) {
    const { systemPrompt } = options;
    const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    
    try {
      const response = await axios.post(
        this.config.api_endpoint,
        {
          messages,
          systemPrompt,
          sessionId,
          chatInput: latestMessage.content,
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

    return await adapter.sendMessage(messages, finalOptions);
  } catch (error) {
    console.error('AI adapter error:', error);
    throw error;
  }
};