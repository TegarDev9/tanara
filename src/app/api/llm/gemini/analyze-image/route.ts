import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part, HarmProbability, FinishReason } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import * as jose from 'jose';

const MODEL_NAME = "gemini-2.5-flash"; // Updated model name

// Helper function to verify JWT
async function verifyToken(token: string): Promise<jose.JWTPayload | null> {
  const publicKeyPemBase64 = process.env.SUPABASE_JWT_SECRET; 
  const supabaseAuthIssuer = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`;


  if (!publicKeyPemBase64) {
    console.error('JWT signing secret/public key (SUPABASE_JWT_SECRET or equivalent) not found in environment variables.');
    return null;
  }

  try {
    // If using HS256 (symmetric, with a secret - this is more common for Supabase JWTs by default)
    // Ensure SUPABASE_JWT_SECRET is the actual JWT secret from your Supabase project settings.
    const secret = new TextEncoder().encode(publicKeyPemBase64);
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: supabaseAuthIssuer,
      audience: 'authenticated', // Standard Supabase audience for user tokens
    });
    return payload;

  } catch (error: unknown) {
    console.error('JWT verification failed:', error instanceof Error ? error.message : String(error));
    if (error instanceof jose.errors.JWTExpired) {
        console.error('JWT has expired.');
    } else if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
        console.error('JWT signature verification failed. Check your SUPABASE_JWT_SECRET or public key.');
    } else if (error instanceof jose.errors.JWTClaimValidationFailed) {
        console.error(`JWT claim validation failed: ${error.message}. Check issuer and audience.`);
    }
    return null;
  }
}

export async function POST(req: Request) {
  console.log("API Route: /api/llm/gemini/analyze-image invoked.");

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Authorization header missing or not Bearer type.');
    return NextResponse.json({ error: 'Akses ditolak. Token otorisasi tidak ada atau format salah.' }, { status: 401 });
  }
  const token = authHeader.substring(7); 

  const decodedToken = await verifyToken(token);
  if (!decodedToken) {
    console.warn('JWT verification failed or token is invalid.');
    return NextResponse.json({ error: 'Akses ditolak. Token otorisasi tidak valid atau kedaluwarsa.' }, { status: 401 });
  }
  console.log(`Authorized access for user ID (sub): ${decodedToken.sub}`);

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
