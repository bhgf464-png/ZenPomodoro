import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getMindfulnessTip = async (phase: string): Promise<string> => {
  if (!apiKey) return "Take a deep breath and relax.";

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      You are a calm, minimalist productivity assistant.
      The user is currently in the "${phase}" phase of a Pomodoro timer.
      Provide a single, short (under 20 words), soothing, and actionable mindfulness tip or productivity quote relevant to this phase.
      Do not use emojis. Keep the tone premium and serene.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || "Breathe in, breathe out.";
  } catch (error) {
    console.error("Error fetching tip:", error);
    return "Focus on the present moment.";
  }
};
