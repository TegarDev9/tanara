//lib/tradingSentimentAnalysis.js
import OpenAI from 'openai';
import axios from 'axios';

// Initialize services
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Financial data providers
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;
const FINANCIAL_MODELS = {
  sentiment: 'openai/gpt-4o',           // Best for nuanced financial sentiment
  quick: 'openai/gpt-4o-mini',         // Fast analysis for real-time trading
  specialized: 'anthropic/claude-3-sonnet' // Excellent for complex market analysis
};

export class TradingSentimentAnalyzer {
  constructor() {
    this.sentimentCache = new Map();
    this.priceCache = new Map();
    this.signalHistory = [];
  }

  // Get real-time stock data
  async getStockData(symbol) {
    const cacheKey = `${symbol}_${Date.now() - (Date.now() % 300000)}`; // 5-min cache
    
    if (this.priceCache.has(cacheKey)) {
      return this.priceCache.get(cacheKey);
    }

    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
      );
      
      const quote = response.data['Global Quote'];
      const stockData = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        timestamp: new Date().toISOString()
      };
      
      this.priceCache.set(cacheKey, stockData);
      return stockData;
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      return null;
    }
  }

  // Financial news sentiment analysis
  async analyzeFinancialSentiment(text, symbol, model = 'sentiment') {
    const selectedModel = FINANCIAL_MODELS[model];
    
    try {
      const completion = await openai.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `You are a professional financial sentiment analyst specializing in ${symbol} stock analysis. 
            Analyze the provided text and respond with ONLY a JSON object:
            {
              "sentiment": "bullish|bearish|neutral",
              "confidence": 0.85,
              "score": 0.7,
              "impact": "high|medium|low",
              "timeframe": "immediate|short-term|medium-term|long-term",
              "key_factors": ["factor1", "factor2"],
              "trading_signal": "buy|sell|hold",
              "risk_level": "low|medium|high",
              "price_target_direction": "up|down|sideways",
              "volatility_expectation": "low|medium|high"
            }
            
            Consider:
            - Market context and sector trends
            - Financial metrics and company fundamentals
            - Regulatory and economic implications
            - Technical analysis compatibility
            - Risk-reward ratio`
          },
          {
            role: 'user',
            content: `Analyze this financial content for ${symbol}: "${text}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 300,
      });

     const messageContent = completion.choices[0].message.content;
return JSON.parse(messageContent);

    } catch (error) {
      console.error('Financial sentiment analysis error:', error);
      throw error;
    }
  }

  // Multi-source sentiment aggregation
  async aggregateMarketSentiment(symbol, sources) {
    const sentimentResults = [];
    
    for (const source of sources) {
      try {
        const sentiment = await this.analyzeFinancialSentiment(
          source.content, 
          symbol,
          source.priority === 'high' ? 'sentiment' : 'quick'
        );
        
        sentimentResults.push({
          ...sentiment,
          source: source.type,
          timestamp: source.timestamp,
          weight: this.getSourceWeight(source.type)
        });
      } catch (error) {
        console.error(`Error analyzing ${source.type}:`, error);
      }
    }

    return this.calculateWeightedSentiment(sentimentResults);
  }

  // Calculate weighted sentiment score
  calculateWeightedSentiment(results) {
    if (results.length === 0) return null;

    const weights = {
      'earnings_call': 0.3,
      'financial_news': 0.25,
      'sec_filing': 0.2,
      'analyst_report': 0.15,
      'social_media': 0.1
    };

    let totalScore = 0;
    let totalWeight = 0;
    let signals = { buy: 0, sell: 0, hold: 0 };
    let riskLevels = { low: 0, medium: 0, high: 0 };

    results.forEach(result => {
      const weight = weights[result.source] || 0.1;
      totalScore += result.score * weight;
      totalWeight += weight;
      
      signals[result.trading_signal] += weight;
      riskLevels[result.risk_level] += weight;
    });

    const avgScore = totalScore / totalWeight;
    const dominantSignal = Object.keys(signals).reduce((a, b) => 
      signals[a] > signals[b] ? a : b
    );
    const dominantRisk = Object.keys(riskLevels).reduce((a, b) => 
      riskLevels[a] > riskLevels[b] ? a : b
    );

    return {
      aggregated_sentiment: avgScore > 0.6 ? 'bullish' : avgScore < 0.4 ? 'bearish' : 'neutral',
      confidence: Math.min(0.95, totalWeight),
      score: avgScore,
      trading_signal: dominantSignal,
      risk_level: dominantRisk,
      source_count: results.length,
      timestamp: new Date().toISOString()
    };
  }

  getSourceWeight(sourceType) {
    const weights = {
      'earnings_call': 0.3,
      'financial_news': 0.25,
      'sec_filing': 0.2,
      'analyst_report': 0.15,
      'social_media': 0.1
    };
    return weights[sourceType] || 0.05;
  }

  // Generate trading signals with risk management
  async generateTradingSignal(symbol) {
    try {
      // Get current stock data
      const stockData = await this.getStockData(symbol);
      if (!stockData) throw new Error('Unable to fetch stock data');

      // Simulate news sources (in production, integrate with news APIs)
      const mockNewsSources = [
        {
          type: 'financial_news',
          content: `${symbol} reports strong quarterly earnings beating estimates by 15%. Revenue growth of 12% year-over-year driven by expanding market share.`,
          timestamp: new Date().toISOString(),
          priority: 'high'
        },
        {
          type: 'analyst_report',
          content: `Analyst upgrades ${symbol} to Buy rating with price target of $${(stockData.price * 1.15).toFixed(2)}. Citing strong fundamentals and market position.`,
          timestamp: new Date().toISOString(),
          priority: 'medium'
        }
      ];

      // Analyze sentiment from multiple sources
      const aggregatedSentiment = await this.aggregateMarketSentiment(symbol, mockNewsSources);
      
      // Combine with technical indicators
      const technicalSignal = this.calculateTechnicalSignal(stockData);
      
      // Generate final trading recommendation
      const tradingRecommendation = this.generateRecommendation(
        stockData,
        aggregatedSentiment,
        technicalSignal
      );

      return {
        symbol: symbol,
        current_price: stockData.price,
        sentiment_analysis: aggregatedSentiment,
        technical_analysis: technicalSignal,
        recommendation: tradingRecommendation,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Error generating trading signal for ${symbol}:`, error);
      return null;
    }
  }

  // Simple technical analysis
  calculateTechnicalSignal(stockData) {
    // Simplified technical analysis based on price change
    const changePercent = stockData.changePercent;
    
    let technicalSentiment = 'neutral';
    let strength = 'medium';
    
    if (changePercent > 3) {
      technicalSentiment = 'bullish';
      strength = 'strong';
    } else if (changePercent > 1) {
      technicalSentiment = 'bullish';
      strength = 'medium';
    } else if (changePercent < -3) {
      technicalSentiment = 'bearish';
      strength = 'strong';
    } else if (changePercent < -1) {
      technicalSentiment = 'bearish';
      strength = 'medium';
    }

    return {
      signal: technicalSentiment,
      strength: strength,
      change_percent: changePercent,
      volume_indicator: stockData.volume > 1000000 ? 'high' : 'normal'
    };
  }

  // Generate final recommendation
  generateRecommendation(stockData, sentiment, technical) {
    const sentimentWeight = 0.6;
    const technicalWeight = 0.4;

    // Convert sentiments to scores
    const sentimentScore = this.sentimentToScore(sentiment.aggregated_sentiment);
    const technicalScore = this.sentimentToScore(technical.signal);

    // Calculate weighted score
    const finalScore = (sentimentScore * sentimentWeight) + (technicalScore * technicalWeight);

    // Determine action
    let action = 'hold';
    let conviction = 'low';
    
    if (finalScore > 0.65 && sentiment.confidence > 0.7) {
      action = 'buy';
      conviction = 'high';
    } else if (finalScore > 0.55) {
      action = 'buy';
      conviction = 'medium';
    } else if (finalScore < 0.35 && sentiment.confidence > 0.7) {
      action = 'sell';
      conviction = 'high';
    } else if (finalScore < 0.45) {
      action = 'sell';
      conviction = 'medium';
    }

    return {
      action: action,
      conviction: conviction,
      score: finalScore,
      risk_assessment: sentiment.risk_level,
      target_price: this.calculateTargetPrice(stockData.price, finalScore),
      stop_loss: this.calculateStopLoss(stockData.price, action),
      position_size: this.recommendPositionSize(conviction, sentiment.risk_level)
    };
  }

  sentimentToScore(sentiment) {
    const scores = {
      'bullish': 0.8,
      'neutral': 0.5,
      'bearish': 0.2
    };
    return scores[sentiment] || 0.5;
  }

  calculateTargetPrice(currentPrice, score) {
    const multiplier = score > 0.6 ? 1.1 : score < 0.4 ? 0.9 : 1.0;
    return parseFloat((currentPrice * multiplier).toFixed(2));
  }

  calculateStopLoss(currentPrice, action) {
    const stopLossPercent = action === 'buy' ? 0.95 : 1.05;
    return parseFloat((currentPrice * stopLossPercent).toFixed(2));
  }

  recommendPositionSize(conviction, riskLevel) {
    const baseSize = {
      'low': 0.02,    // 2% of portfolio
      'medium': 0.05, // 5% of portfolio
      'high': 0.08    // 8% of portfolio
    };

    const riskAdjustment = {
      'low': 1.2,
      'medium': 1.0,
      'high': 0.7
    };

    return baseSize[conviction] * riskAdjustment[riskLevel];
  }

  // Crypto sentiment analysis extension
  async analyzeCryptoSentiment(cryptoSymbol, text) {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a cryptocurrency market analyst specializing in ${cryptoSymbol}. 
          Analyze sentiment considering:
          - Regulatory developments and compliance
          - Technical adoption and network metrics
          - Market manipulation and whale activity
          - Social media influence and viral trends
          - DeFi and ecosystem developments
          
          Respond with JSON format including crypto-specific factors.`
        },
        {
          role: 'user',
          content: `Analyze this crypto content: "${text}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const messageContent = completion.choices[0].message.content;
return JSON.parse(messageContent);

  }
}

// Portfolio-level sentiment analysis
export class PortfolioSentimentManager {
  constructor() {
    this.analyzer = new TradingSentimentAnalyzer();
    this.portfolio = [];
  }

  async analyzePortfolioSentiment(symbols) {
    const results = [];
    
    for (const symbol of symbols) {
      try {
        const analysis = await this.analyzer.generateTradingSignal(symbol);
        if (analysis) {
          results.push(analysis);
        }
        
        // Rate limiting - avoid hitting API limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error analyzing ${symbol}:`, error);
      }
    }

    return {
      portfolio_sentiment: this.calculatePortfolioSentiment(results),
      individual_analyses: results,
      timestamp: new Date().toISOString()
    };
  }

  calculatePortfolioSentiment(analyses) {
    if (analyses.length === 0) return null;

    const sentimentCounts = { bullish: 0, neutral: 0, bearish: 0 };
    const actionCounts = { buy: 0, hold: 0, sell: 0 };
    let avgConfidence = 0;
    let totalRisk = 0;

    analyses.forEach(analysis => {
      sentimentCounts[analysis.sentiment_analysis.aggregated_sentiment]++;
      actionCounts[analysis.recommendation.action]++;
      avgConfidence += analysis.sentiment_analysis.confidence;
      
      const riskScore = { low: 0.2, medium: 0.5, high: 0.8 };
      totalRisk += riskScore[analysis.recommendation.risk_assessment];
    });

    const count = analyses.length;
    const dominantSentiment = Object.keys(sentimentCounts).reduce((a, b) => 
      sentimentCounts[a] > sentimentCounts[b] ? a : b
    );
    const dominantAction = Object.keys(actionCounts).reduce((a, b) => 
      actionCounts[a] > actionCounts[b] ? a : b
    );

    return {
      overall_sentiment: dominantSentiment,
      recommended_action: dominantAction,
      confidence: avgConfidence / count,
      risk_level: totalRisk / count > 0.6 ? 'high' : totalRisk / count > 0.4 ? 'medium' : 'low',
      distribution: {
        sentiment: sentimentCounts,
        actions: actionCounts
      }
    };
  }
}

// Usage example
async function runTradingAnalysis() {
  const portfolioManager = new PortfolioSentimentManager();
  
  // Analyze a portfolio of stocks
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
  
  try {
    const portfolioAnalysis = await portfolioManager.analyzePortfolioSentiment(symbols);
    
    console.log('=== PORTFOLIO SENTIMENT ANALYSIS ===');
    console.log('Overall Sentiment:', portfolioAnalysis.portfolio_sentiment.overall_sentiment);
    console.log('Recommended Action:', portfolioAnalysis.portfolio_sentiment.recommended_action);
    console.log('Confidence:', (portfolioAnalysis.portfolio_sentiment.confidence * 100).toFixed(1) + '%');
    console.log('Risk Level:', portfolioAnalysis.portfolio_sentiment.risk_level);
    
    console.log('\n=== INDIVIDUAL STOCK ANALYSIS ===');
    portfolioAnalysis.individual_analyses.forEach(analysis => {
      console.log(`\n${analysis.symbol}:`);
      console.log(`  Current Price: $${analysis.current_price}`);
      console.log(`  Sentiment: ${analysis.sentiment_analysis.aggregated_sentiment}`);
      console.log(`  Action: ${analysis.recommendation.action.toUpperCase()}`);
      console.log(`  Conviction: ${analysis.recommendation.conviction}`);
      console.log(`  Target Price: $${analysis.recommendation.target_price}`);
      console.log(`  Stop Loss: $${analysis.recommendation.stop_loss}`);
      console.log(`  Position Size: ${(analysis.recommendation.position_size * 100).toFixed(1)}%`);
    });
    
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

// Run the analysis
runTradingAnalysis();
