import { GoogleGenAI } from '@google/genai'

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function generateAIResponse(prompt: string, systemInstruction?: string): Promise<string> {
  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  })

  return response.text ?? ''
}

export async function generateStructuredResponse<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
      maxOutputTokens: 4096,
      temperature: 0.3,
    },
  })

  const text = response.text ?? '[]'
  return JSON.parse(text) as T
}

export { genAI }
