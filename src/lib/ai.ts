// AI utilities for emotion detection and toxicity analysis
// These use simple pattern matching for demo, can be enhanced with actual AI APIs

type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'stressed' | 'anxious';

const emotionPatterns: Record<Emotion, RegExp[]> = {
  happy: [
    /\b(happy|joy|excited|amazing|wonderful|great|awesome|love|fantastic|brilliant)\b/i,
    /[😊😄😃🥰❤️💕🎉✨]/,
  ],
  sad: [
    /\b(sad|depressed|down|lonely|crying|miss|hurt|heartbroken|disappointed)\b/i,
    /[😢😭😔💔😞]/,
  ],
  angry: [
    /\b(angry|mad|furious|hate|annoyed|frustrated|pissed|rage)\b/i,
    /[😠😡🤬]/,
  ],
  stressed: [
    /\b(stressed|overwhelmed|exhausted|tired|burned out|can't cope|too much)\b/i,
    /[😫😩😤]/,
  ],
  anxious: [
    /\b(anxious|worried|nervous|scared|afraid|panic|anxiety|fear)\b/i,
    /[😰😨😱]/,
  ],
  neutral: [],
};

const toxicPatterns = [
  /\b(kill|die|hate|stupid|idiot|dumb|loser|ugly|fat|retard)\b/i,
  /\b(fuck|shit|damn|ass|bitch)\b/i,
  /threatening|harass|bully/i,
];

export const analyzeEmotion = async (text: string): Promise<Emotion> => {
  // Check each emotion pattern
  for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
    if (emotion === 'neutral') continue;
    
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return emotion as Emotion;
      }
    }
  }
  
  return 'neutral';
};

export const detectToxicity = async (
  text: string
): Promise<{ isToxic: boolean; reason?: string }> => {
  const lowerText = text.toLowerCase();
  
  for (const pattern of toxicPatterns) {
    if (pattern.test(lowerText)) {
      return {
        isToxic: true,
        reason: 'Message contains potentially harmful language',
      };
    }
  }
  
  return { isToxic: false };
};

export const getSupportiveResponse = (emotion: Emotion): string | null => {
  const responses: Record<Exclude<Emotion, 'neutral' | 'happy'>, string[]> = {
    sad: [
      "I notice you might be feeling down. Remember, it's okay to feel this way. Would you like to take a moment to breathe?",
      "I'm here for you. Sometimes talking helps. Take your time.",
      "It's okay to feel sad. Would you like some suggestions for self-care?",
    ],
    angry: [
      "I sense some frustration. Take a deep breath - in for 4 seconds, hold for 4, out for 4.",
      "Strong emotions are valid. Would stepping away for a moment help?",
      "It's okay to feel this way. Let's take a moment before continuing.",
    ],
    stressed: [
      "You seem overwhelmed. Remember to take breaks. Your wellbeing matters most.",
      "One thing at a time. Would you like to try a quick breathing exercise?",
      "It's okay to step back. You don't have to respond right away.",
    ],
    anxious: [
      "I notice some worry in your words. Remember, you're in a safe space here.",
      "Take a moment to ground yourself. Look around and name 5 things you can see.",
      "It's okay to feel anxious. Would you like some calming suggestions?",
    ],
  };

  if (emotion === 'neutral' || emotion === 'happy') return null;
  
  const emotionResponses = responses[emotion];
  return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
};

export const getBreathingExercise = () => ({
  title: "4-7-8 Breathing Exercise",
  steps: [
    { instruction: "Breathe in slowly", duration: 4 },
    { instruction: "Hold your breath", duration: 7 },
    { instruction: "Breathe out slowly", duration: 8 },
  ],
  repetitions: 3,
});
