//api/analyze-text
import { TradingSentimentAnalyzer } from '../../../lib/tradingSentimentAnalysis'; // Adjust path if necessary

export async function POST(request) {
  const { text, symbol = 'stock' } = await request.json(); // Get text and optional symbol from request body

  if (!text) {
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const analyzer = new TradingSentimentAnalyzer();

  try {
    // Using 'sentiment' model for general text analysis
    const analysis = await analyzer.analyzeFinancialSentiment(text, symbol, 'sentiment'); 
    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API text analysis failed:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze text' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
