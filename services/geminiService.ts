import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // In a real app, handle missing key gracefully
const ai = new GoogleGenAI({ apiKey });

export const getStyleAdvice = async (userQuery: string, context: string): Promise<string> => {
  if (!apiKey) {
    return "Erro: Chave de API não configurada.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Contexto: Você é um assistente virtual especialista de uma barbearia chamada BarberClass. 
      O cliente está perguntando: "${userQuery}".
      
      Informações da barbearia atual: ${context}
      
      Responda de forma curta, amigável e estilosa. Sugira serviços se apropriado. Maximo 2 parágrafos.`,
    });
    
    return response.text || "Desculpe, não consegui pensar em uma dica agora.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Ocorreu um erro ao consultar nosso especialista virtual. Tente novamente.";
  }
};