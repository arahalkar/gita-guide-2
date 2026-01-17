
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * World-class service for interacting with Gemini AI.
 */
export const sendGitaQuestion = async (question: string, history: {role: string, parts: {text: string}[]}[] = []) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = 'gemini-3-flash-preview';
    
    const systemInstruction = `
      You are the official "Gita AI Assistant" — a wise, friendly, and encouraging mentor for students globally.
      Your goal is to provide guidance based on the Srimad Bhagavad Gita to help students navigate life's challenges.
      - Be succinct (under 150 words).
      - Use Google Search grounding for scholarly links.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...history,
        {
          role: 'user',
          parts: [{ text: question }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      }
    });

    const answer = response.text || "I'm reflecting on your question.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citations: string[] = [];
    
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        citations.push(chunk.web.uri);
      }
    });

    return {
      text: answer,
      citations: [...new Set(citations)]
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Generates audio speech for a given text using Gemini TTS.
 */
export const generateSpeech = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say calmly and wisely: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received");
    
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

// Audio Utilities for decoding raw PCM from Gemini
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
