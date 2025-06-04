import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part, HarmProbability, FinishReason } from '@google/generative-ai'; // Added HarmProbability and FinishReason
import { NextResponse } from 'next/server';
import * as jose from 'jose'; // Import jose

const MODEL_NAME = "gemini-1.0-flash"; // Corrected model name as per previous context, ensure this is what you intend. Gemini 2.0 flash might be "gemini-2.0-flash-latest"

// Helper function to verify JWT
async function verifyToken(token: string): Promise<jose.JWTPayload | null> {
  const publicKeyPem = process.env.TELEGRAM_AUTH_JWT_PUBLIC_KEY;
  if (!publicKeyPem) {
    console.error('Public key for JWT verification not found in environment variables.');
    return null;
  }

  try {
    const publicKey = await jose.importSPKI(publicKeyPem, 'RS256');
    // Update expected issuer and audience to match what your Supabase function sets
    const { payload } = await jose.jwtVerify(token, publicKey, {
      issuer: 'urn:supabase:telegram-auth', 
      audience: 'urn:web3auth:client', 
    });
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function POST(req: Request) {
  console.log("Backend API route /api/llm/gemini/analyze-image hit");

  // --- JWT Authentication Check ---
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Akses ditolak. Token otorisasi tidak ada.' }, { status: 401 });
  }
  const token = authHeader.substring(7); // Remove "Bearer " prefix
  const decodedToken = await verifyToken(token);

  if (!decodedToken) {
    return NextResponse.json({ error: 'Akses ditolak. Token otorisasi tidak valid atau kedaluwarsa.' }, { status: 401 });
  }
  // Optional: You can use decodedToken.sub (which should be the Telegram user ID) for logging or further checks
  console.log(`Authorized access for user: ${decodedToken.sub}`);
  // --- End JWT Authentication Check ---

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('API key not found in environment variables.');
    return NextResponse.json({ error: 'Kunci API tidak dikonfigurasi di server.' }, { status: 500 });
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
    model: MODEL_NAME,
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
      return NextResponse.json({ error: 'Data gambar dan tipe mime diperlukan' }, { status: 400 });
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

    if (responseCandidate && 
        responseCandidate.content &&
        responseCandidate.content.parts &&
        responseCandidate.content.parts.length > 0 &&
        typeof responseCandidate.content.parts[0].text === 'string') {
      
      const text = responseCandidate.content.parts[0].text;
      console.log("Berhasil menerima respons dari Gemini API.");
      return NextResponse.json({ text });
    } else {
      // Penanganan jika tidak ada teks yang valid atau konten diblokir
      console.error('Struktur respons tidak terduga atau konten diblokir dari Gemini API:', JSON.stringify(result.response, null, 2));
      
      const promptFeedback = result.response?.promptFeedback;
      if (promptFeedback?.blockReason) {
        const blockMessage = promptFeedback.blockReasonMessage || "Konten diblokir karena pengaturan keamanan (prompt).";
        console.error(`Konten diblokir oleh Gemini (promptFeedback): ${promptFeedback.blockReason} - ${blockMessage}`);
        return NextResponse.json({ error: `Analisis AI diblokir: ${blockMessage} (Alasan: ${promptFeedback.blockReason})` }, { status: 400 });
      }
      
      // Periksa finishReason dari kandidat
      // Gunakan enum FinishReason dari library
      if (responseCandidate?.finishReason === FinishReason.SAFETY) {
        let safetyMessage = "Analisis AI diblokir karena pengaturan keamanan (finishReason: SAFETY).";
        if (responseCandidate.safetyRatings && responseCandidate.safetyRatings.length > 0) {
          // Buat pesan yang lebih detail dari safetyRatings
          const problematicRatings = responseCandidate.safetyRatings
            .filter(rating => 
              // Anda mungkin ingin menyesuaikan logika ini berdasarkan threshold yang Anda set
              // Biasanya, jika finishReason adalah SAFETY, setidaknya satu kategori telah melanggar threshold
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
      
      // Fallback error jika tidak ada alasan blokir yang jelas tetapi konten tidak ada
      return NextResponse.json({ error: 'Gagal mendapatkan teks dari respons AI atau format respons tidak valid.' }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('Error di /api/analyze-image:', error);
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