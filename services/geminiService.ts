
import { GoogleGenAI } from "@google/genai";

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
