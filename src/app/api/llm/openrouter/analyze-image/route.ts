import { NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || 'https://t.me/Tanara_bot'; // Ganti dengan URL situs Anda atau nama bot Anda

export async function POST(req: Request) {
  console.log("API Route: /api/llm/openrouter/analyze-image invoked.");

  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY not found in environment variables.');
    return NextResponse.json({ error: 'Kunci API OpenRouter tidak dikonfigurasi di server.' }, { status: 500 });
  }

  try {
    let body;
    try {
        body = await req.json();
    } catch (parseError) {
        console.error("Gagal parsing request body sebagai JSON:", parseError);
        return NextResponse.json({ error: 'Format body permintaan tidak valid. Harap kirim JSON.' }, { status: 400 });
    }
    
    const { prompt, imageData, mimeType } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt diperlukan' }, { status: 400 });
    }
    if (!imageData || !mimeType) {
      return NextResponse.json({ error: 'Data gambar (imageData) dan tipe mime (mimeType) diperlukan' }, { status: 400 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": YOUR_SITE_URL,
        "X-Title": "Tanara",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-flash-1.5", // Or another multimodal model
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": prompt
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": `data:${mimeType};base64,${imageData}`
                }
              }
            ]
          }
        ],
        "max_tokens": 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API Error:', errorData);
      return NextResponse.json({ error: 'Error from OpenRouter API', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    if (text) {
      console.log("Berhasil menerima respons dari OpenRouter API.");
      return NextResponse.json({ text });
    } else {
      console.error('Struktur respons tidak terduga dari OpenRouter API:', JSON.stringify(data, null, 2));
      return NextResponse.json({ error: 'Gagal mendapatkan teks dari respons AI atau format respons tidak valid.' }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('Error di /api/llm/openrouter/analyze-image:', error);
    let errorMessage = 'Gagal memproses permintaan di backend.';
    const statusCode = 500;

    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
