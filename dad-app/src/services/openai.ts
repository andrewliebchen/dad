import OpenAI from 'openai';
import { getSystemPrompt } from './prompts/dad';

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

if (!API_KEY) {
  throw new Error('OpenAI API key is not configured. Please check your .env file.');
}

const openai = new OpenAI({
  apiKey: API_KEY,
});

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const generateDadResponse = async (userMessage: string, conversationHistory: Message[] = []) => {
  try {
    const messages: Message[] = [
      { role: 'system', content: getSystemPrompt() },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating Dad response:', error);
    throw error;
  }
}; 