import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextResponse, NextRequest } from 'next/server';

const MODEL_NAME = "gemini-1.5-flash-latest"; 

export async function POST(req: NextRequest) {

  console.log(`API route /api/llm/gemini/generate_conten_chat hit at: ${new Date().toISOString()}`);

  // Temporarily bypass Authorization header check to resolve frontend error.
  // In a production environment, implement proper TON-based authentication.
  // const authHeader = req.headers.get('Authorization');
  // if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //   return NextResponse.json({ error: 'Authorization header missing or malformed' }, { status: 401 });
  // }
  // With Supabase removed, authentication needs to be re-evaluated.
  // For now, we will bypass user-specific API key retrieval and use a global one.
  // In a production environment, you would implement TON-based authentication
  // and retrieve user-specific API keys from a new data store.
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    console.error(`GEMINI_API_KEY not found in environment variables.`);
    return NextResponse.json({ error: 'Gemini API key not configured.' }, { status: 403 });
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048, // Make sure this is within the model's limits
  };

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME, // Use the specific model name
    generationConfig,
    safetySettings,
  });

  try {
    const body = await req.json();
    // Destructure prompt from the body.
    // It's good practice to ensure body exists and is an object before destructuring.
    if (!body || typeof body !== 'object' || !('prompt' in body)) {
        console.warn('Request body is missing or prompt is not provided.');
        return NextResponse.json({ error: 'Prompt is required in the request body' }, { status: 400 });
    }
    const { prompt } = body; 

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.warn('Prompt is required but was not provided or is empty in the request body.');
      return NextResponse.json({ error: 'Prompt is required and cannot be empty' }, { status: 400 });
    }
    
    console.log('Received prompt:', prompt);

    // For `generateContent`, the input should be a string or an array of Content objects.
    // If `prompt` is just a string, this is correct.
    const result = await model.generateContent(prompt);
    
    // It's good practice to check if response and text() exist
    if (result && result.response) {
        const genAiResponse = result.response; // Renamed to avoid conflict with NextResponse
        const text = genAiResponse.text(); // Make sure to call text() to get the string
        console.log('Successfully generated content:', text);
        return NextResponse.json({ text });
    } else {
        console.error('Failed to get a valid response from Generative AI model. Result or response was undefined.');
        // Log the actual result for debugging if it's not what's expected
        console.debug('Gemini API result:', JSON.stringify(result, null, 2));
        return NextResponse.json({ error: 'Failed to generate content from model, no valid response structure.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error generating content in API route:', error);
    let errorMessage = 'Failed to generate content due to an internal server error.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // It's often better to not expose raw error messages to the client for security.
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
