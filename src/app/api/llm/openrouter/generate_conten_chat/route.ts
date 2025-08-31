import { NextResponse, NextRequest } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || 'https://t.me/Tanara_bot';

// Define available models as a constant to resolve the 'Cannot find name availableModels' error.
// This list can be expanded or fetched dynamically if needed.
const availableModels: string[] = [
  "google/gemini-flash-1.5",
  "openai/gpt-4o",
  "anthropic/claude-3-opus-20240229",
  // Add other models supported by OpenRouter as needed
];

export async function POST(req: NextRequest) {

  console.log(`API route /api/llm/openrouter/generate_conten_chat hit at: ${new Date().toISOString()}`);

  if (!OPENROUTER_API_KEY) {
    console.error(`OPENROUTER_API_KEY not found in environment variables.`);
    return NextResponse.json({ error: 'OpenRouter API key not configured.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
        console.warn('Request body is missing or invalid.');
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Destructure prompt and model from the request body.
    // 'selectedModel' will resolve the 'Cannot find name selectedModel' error.
    // The 'model' parameter in the fetch call will now use this variable.
    const { prompt, model: selectedModel } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.warn('Prompt is required but was not provided or is empty in the request body.');
      return NextResponse.json({ error: 'Prompt is required and cannot be empty' }, { status: 400 });
    }
    
    console.log('Received prompt:', prompt);
    console.log('Selected model:', selectedModel); // Log the selected model

    // Use the selectedModel from the request body, with a default if not provided.
    // This also addresses the 'Parameter 'model' implicitly has an 'any' type' error
    // by ensuring 'model' is explicitly handled.
    const modelToUse = selectedModel && typeof selectedModel === 'string' && availableModels.includes(selectedModel)
      ? selectedModel
      : "google/gemini-flash-1.5"; // Default model

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": YOUR_SITE_URL,
        "X-Title": "Tanara",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": modelToUse, // Use the determined model
        "messages": [
          { "role": "user", "content": prompt }
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
        console.log('Successfully generated content:', text);
        return NextResponse.json({ text });
    } else {
        console.error('Failed to get a valid response from OpenRouter API. Result or response was undefined.');
        console.debug('OpenRouter API result:', JSON.stringify(data, null, 2));
        return NextResponse.json({ error: 'Failed to generate content from model, no valid response structure.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error generating content in API route:', error);
    let errorMessage = 'Failed to generate content due to an internal server error.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
