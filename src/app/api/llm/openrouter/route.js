import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || 'https://t.me/Tanara_bot'; // Ganti dengan URL situs Anda atau nama bot Anda

export async function POST(request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ status: 'error', message: 'OpenRouter API Key is not provided.' }, { status: 400 });
    }

    if (message && message.text) {
      const chatId = message.chat.id;
      const userMessage = message.text;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": YOUR_SITE_URL, // Ganti dengan URL situs Anda
          "X-Title": "Tanara", // Ganti dengan nama aplikasi Anda
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemini-flash-1.5", // Ganti dengan model yang Anda inginkan
          "messages": [
            { "role": "user", "content": userMessage }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenRouter API Error:', errorData);
        return NextResponse.json({ status: 'error', message: 'Error from OpenRouter API' }, { status: response.status });
      }

      const data = await response.json();
      const textResponse = data.choices[0].message.content;

      // Mengirim balasan
      const bot = new TelegramBot(TELEGRAM_BOT_TOKEN); // Hanya untuk mengirim
      await bot.sendMessage(chatId, textResponse);

      return NextResponse.json({ status: 'success', response: textResponse });
    } else {
      return NextResponse.json({ status: 'no message text' });
    }
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
