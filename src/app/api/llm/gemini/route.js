import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenerativeAI } from '@google/generative-ai';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (message && message.text) {
      const chatId = message.chat.id;
      const userMessage = message.text;

      const chat = model.startChat({
        // ... (konfigurasi history dan generationConfig sama seperti sebelumnya)
        generationConfig: {
          maxOutputTokens: 250,
        },
      });

      const result = await chat.sendMessage(userMessage);
      const geminiResponse = await result.response;
      const textResponse = geminiResponse.text();

      // Mengirim balasan
      const bot = new TelegramBot(TELEGRAM_BOT_TOKEN); // Hanya untuk mengirim
      await bot.sendMessage(chatId, textResponse);

      return NextResponse.json({ status: 'success', response: textResponse });
    } else {
      return NextResponse.json({ status: 'no message text' });
    }
  } catch (error) {
    console.error('Error processing message:', error);
    if (error.response && error.response.data) {
      console.error('Telegram API Error:', error.response.data);
    }
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}