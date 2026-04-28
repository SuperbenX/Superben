
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a bedtime story based on a user's prompt.
 */
export async function generateSleepStory(topic: string): Promise<string> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a very slow, calming, descriptive, and slightly boring bedtime story about: ${topic}. 
    Focus on sensory details like soft sounds, gentle movements, and fading light. 
    The goal is to make the listener fall asleep. Max 300 words.`,
    config: {
      temperature: 0.7,
      topP: 0.95,
    },
  });
  return response.text || "I'm sorry, I couldn't weave a story right now. Try resting your eyes.";
}

/**
 * Converts text to speech using Gemini's TTS model.
 * Default: Kore (Gentle/Sexy female voice)
 */
export async function textToSpeech(text: string, voiceName: 'Kore' | 'Zephyr' = 'Kore'): Promise<string | undefined> {
  const ai = getAIClient();
  try {
    const prompt = voiceName === 'Kore'
      ? `请以温柔、性感、知性且富有磁性的女性嗓音，用自然平稳且稍带磁性的语速朗读：${text}`
      : `请以沉稳、儒雅、平和的男性嗓音，用自然平稳的语速朗读：${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (err) {
    console.error("TTS Error:", err);
    return undefined;
  }
}

/**
 * Provides personalized sleep advice.
 */
export async function getSleepAdvice(query: string): Promise<string> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      systemInstruction: "You are a world-class sleep scientist and therapist. Provide concise, scientifically-backed, and empathetic advice to help the user improve their sleep quality.",
      temperature: 1,
    }
  });
  return response.text || "Rest is the best medicine. Try disconnecting from screens for an hour before bed.";
}
