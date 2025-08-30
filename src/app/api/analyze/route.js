import { PortfolioSentimentManager } from '../../../lib/tradingSentimentAnalysis'; // Adjust path if necessary

export async function GET() {
  const portfolioManager = new PortfolioSentimentManager();
  // Example symbols - you might want to fetch these dynamically or from config
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA']; 

  try {
    const portfolioAnalysis = await portfolioManager.analyzePortfolioSentiment(symbols);
    return new Response(JSON.stringify(portfolioAnalysis), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API analysis failed:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze portfolio' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
