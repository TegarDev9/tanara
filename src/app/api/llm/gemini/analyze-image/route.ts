import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part, HarmProbability, FinishReason } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const MODEL_NAME = "gemini-1.5-flash-latest"; // Updated model name

export async function POST(req: Request) {
  console.log("API Route: /api/llm/gemini/analyze-image invoked.");

  // Authentication logic (Supabase JWT verification) removed.
  // If authentication is required, it needs to be re-implemented using TON-based methods.
  // For now, this route will be publicly accessible.

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in environment variables.');
    return NextResponse.json({ error: 'Kunci API Gemini tidak dikonfigurasi di server.' }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const generationConfig = {
    temperature: 0.7, 
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME, // Uses "gemini-2.5-flash"
    generationConfig,
    safetySettings,
  });

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

    const imagePart: Part = {
      inlineData: {
        data: imageData, 
        mimeType: mimeType, 
      },
    };
    const textPart: Part = {
        text: prompt,
    };

    const parts = [textPart, imagePart]; 

    console.log("Mengirim permintaan ke Gemini API dengan prompt dan gambar...");
    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    
    const responseCandidate = result.response?.candidates?.[0];

    if (responseCandidate?.content?.parts?.[0]?.text) {
      const text = responseCandidate.content.parts[0].text;
      console.log("Berhasil menerima respons dari Gemini API.");
      return NextResponse.json({ text });
    } else {
      console.error('Struktur respons tidak terduga atau konten diblokir dari Gemini API:', JSON.stringify(result.response, null, 2));
      
      const promptFeedback = result.response?.promptFeedback;
      if (promptFeedback?.blockReason) {
        const blockMessage = promptFeedback.blockReasonMessage || "Konten diblokir karena pengaturan keamanan (prompt).";
        console.error(`Konten diblokir oleh Gemini (promptFeedback): ${promptFeedback.blockReason} - ${blockMessage}`);
        return NextResponse.json({ error: `Analisis AI diblokir: ${blockMessage} (Alasan: ${promptFeedback.blockReason})` }, { status: 400 });
      }
      
      if (responseCandidate?.finishReason === FinishReason.SAFETY) {
        let safetyMessage = "Analisis AI diblokir karena pengaturan keamanan (finishReason: SAFETY).";
        if (responseCandidate.safetyRatings && responseCandidate.safetyRatings.length > 0) {
          const problematicRatings = responseCandidate.safetyRatings
            .filter(rating => 
              rating.probability === HarmProbability.HIGH || 
              rating.probability === HarmProbability.MEDIUM 
            )
            .map(rating => `${rating.category.replace('HARM_CATEGORY_', '')} (Probabilitas: ${HarmProbability[rating.probability]})`)
            .join(', ');
          
          if (problematicRatings) {
            safetyMessage = `Analisis AI diblokir karena kategori keamanan berikut: ${problematicRatings}.`;
          }
        }
        console.error(safetyMessage);
        return NextResponse.json({ error: safetyMessage }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Gagal mendapatkan teks dari respons AI atau format respons tidak valid.' }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('Error di /api/llm/gemini/analyze-image:', error);
    let errorMessage = 'Gagal memproses permintaan di backend.';
    const statusCode = 500;

    if (error instanceof Error) {
        errorMessage = error.message;
        if (error.name === 'GoogleGenerativeAIResponseError' || error.message.includes('[GoogleGenerativeAI Error]')) {
            errorMessage = `Error dari Gemini API: ${error.message}`;
        }
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
