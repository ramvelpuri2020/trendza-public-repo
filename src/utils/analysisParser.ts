import { ScoreBreakdown, StyleTip } from "@/types/styleTypes";

interface AnalysisResult {
  breakdown: ScoreBreakdown[];
  tips: StyleTip[];
  overallScore?: number;
  summary?: string;
}

const categoryEmojis: Record<string, string> = {
  "Aura": "✨",
  "Drip Quality": "💎", 
  "Potential": "🚀",
  "Color Coordination": "🎨",
  "Attractiveness": "🔥",
  // Keep some traditional ones as fallback
  "Fit & Proportion": "📏",
  "Style Coherence": "✨",
  "Accessories": "💍",
  "Outfit Creativity": "🌟",
  "Trend Awareness": "📱",
};

export const parseAnalysis = (rawAnalysis: string | undefined): AnalysisResult => {
  if (!rawAnalysis) {
    return {
      breakdown: [],
      tips: [],
      overallScore: 70,
      summary: generateFallbackSummary(70)
    };
  }
  
  console.log('🔍 Starting analysis parsing...', rawAnalysis.substring(0, 200));
  
  const breakdown: ScoreBreakdown[] = [];
  const tips: StyleTip[] = [];
  
  // Extract overall score
  const overallScoreMatch = rawAnalysis?.match(/\*\*Overall Score:\*\*\s*(\d+)/i);
  const fallbackScore = rawAnalysis ? extractFallbackScore(rawAnalysis) : undefined;
  const overallScore = overallScoreMatch && overallScoreMatch[1] ? parseInt(overallScoreMatch[1], 10) : (fallbackScore || 70);
  
  // Extract summary
  const summaryMatch = rawAnalysis?.match(/\*\*Summary:\*\*([\s\S]*?)(?=\*\*|$)/i);
  const summary = summaryMatch && summaryMatch[1] ? summaryMatch[1].trim() : generateFallbackSummary(overallScore || 70);
  
  // Extract category scores
  const categoryRegex = /\*\*(Aura|Drip Quality|Potential|Color Coordination|Attractiveness):\*\*\s*(\d+)/gi;
  let match;
  while (rawAnalysis && (match = categoryRegex.exec(rawAnalysis)) !== null) {
    const category = match[1]?.trim();
    const scoreStr = match[2];
    if (category && scoreStr) {
      const score = parseInt(scoreStr, 10);
      if (!isNaN(score)) {
        breakdown.push({
          category,
          score,
          emoji: categoryEmojis[category] || "✅",
          details: ''
        });
      }
    }
  }

  // Add fallback categories if none found
  if (breakdown.length === 0) {
    console.log('⚠️ No categories found, adding fallback breakdown');
    addFallbackBreakdown(breakdown, overallScore || 70);
  }

  // Extract tips using our robust extraction
  if (rawAnalysis) {
    extractAllTips(rawAnalysis, tips);
  }

  // NO FALLBACK BULLSHIT - if AI doesn't give tips, that's it
  console.log('✅ Analysis parsing complete:', {
    overallScore,
    breakdownCount: breakdown.length,
    tipsCount: tips.length,
    summaryLength: summary?.length || 0
  });

  return { 
    breakdown, 
    tips, 
    overallScore,
    summary
  };
};

function generateFallbackSummary(score?: number): string {
  const scoreValue = score || 75;
  
  if (scoreValue >= 85) {
    return "Great style choices! Your outfit shows excellent coordination and a strong sense of personal aesthetic. You're making confident style decisions that work well together.";
  } else if (scoreValue >= 70) {
    return "Solid style foundation with good color choices and fit. There's potential to elevate this look with a few strategic adjustments.";
  } else {
    return "Good base pieces with room for improvement. Focus on fit, color coordination, and adding one statement piece to elevate your style.";
  }
}

function addFallbackBreakdown(breakdown: ScoreBreakdown[], baseScore: number): void {
  const categories = [
    { name: "Aura", emoji: "✨" },
    { name: "Drip Quality", emoji: "💎" },
    { name: "Potential", emoji: "🚀" },
    { name: "Color Coordination", emoji: "🎨" },
    { name: "Attractiveness", emoji: "🔥" }
  ];
  
  categories.forEach(({ name, emoji }) => {
    // Add some variation around the base score (more conservative)
    const variation = Math.floor(Math.random() * 16) - 8; // -8 to +8
    const score = Math.max(40, Math.min(85, baseScore + variation));
    
    breakdown.push({
      category: name,
      score,
      emoji,
      details: ''
    });
  });
}

// Fallback score extraction for when the standard regex fails
function extractFallbackScore(text: string): number | undefined {
  // Try different formats that might appear in the text - updated for /100 scale
  const patterns = [
    /overall score.*?(\d+)/i,
    /total score.*?(\d+)/i,
    /score.*?(\d+).*?100/i,
    /score.*?(\d+).*?10/i,
    /rating.*?(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const score = parseInt(match[1], 10);
      if (!isNaN(score) && score >= 0 && score <= 100) {
        return score;
      }
      // Also handle legacy /10 scores by converting them
      if (!isNaN(score) && score >= 0 && score <= 10) {
        return score * 10; // Convert /10 to /100
      }
    }
  }
  
  return undefined;
}



function extractAllTips(text: string, tips: StyleTip[]): void {
  console.log('🔍 Extracting tips from AI response...');
  console.log('🔍 Full text to parse:', text.substring(0, 500));
  
  // Find the Style Tips section - more flexible pattern
  const tipsSectionMatch = text.match(/\*\*Style Tips:\*\*([\s\S]*?)(?=\*\*[A-Z]|$)/i);
  if (!tipsSectionMatch) {
    console.log('⚠️ No Style Tips section found in AI response');
    // Try alternative pattern
    const altMatch = text.match(/Style Tips:([\s\S]*?)(?=\*\*|$)/i);
    if (altMatch) {
      console.log('✅ Found alternative Style Tips section');
      const tipsContent = altMatch[1];
      if (tipsContent) {
        extractTipsFromContent(tipsContent, tips);
      }
    }
    return;
  }
  
  const tipsContent = tipsSectionMatch[1];
  if (!tipsContent) {
    console.log('⚠️ No content found in Style Tips section');
    return;
  }
  
  extractTipsFromContent(tipsContent, tips);
}

function extractTipsFromContent(tipsContent: string, tips: StyleTip[]): void {
  console.log('📋 Found Style Tips section with', tipsContent.length, 'characters');
  console.log('📋 Tips content:', tipsContent);
  
  // Extract tips with bullet points - handle both formats
  const lines = tipsContent.split('\n').filter(line => line.trim().startsWith('•'));
  
  console.log('🔍 Found bullet lines:', lines.length, lines);
  
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Handle both formats: • **Category:** tip text AND • Category: tip text
    let match = line.match(/•\s*\*\*([^*]+)\*\*:?\s*(.*)/);
    if (!match) {
      // Try simpler format: • Category: tip text
      match = line.match(/•\s*([^:]+):\s*(.*)/);
    }
    
    if (match && match[1] && match[2]) {
      const category = match[1].trim().replace(':', ''); // Remove colon
      const tipText = match[2].trim();
      
      console.log('🎯 Found tip:', { category, tipText, length: tipText.length });
      
      if (category && tipText && tipText.length > 5) { // Lowered from 15 to 5
        tips.push({
          category: category,
          tip: tipText,
          level: 'intermediate'
        });
      }
    }
  }
  
  console.log(`✅ Extracted ${tips.length} tips from AI response`);
}


