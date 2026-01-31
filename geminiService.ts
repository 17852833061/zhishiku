
import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMaterial = async (content: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `请分析以下素材内容，并返回其对应的分类、领域和相关标签。
    素材内容: "${content}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description: "分类，必须是以下之一: 案例, 金句, 政策, 人物, 其他",
          },
          domain: {
            type: Type.STRING,
            description: "领域，必须是以下之一: 政治, 经济, 文化, 社会, 生态, 科技",
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-5个描述性的关键词标签",
          }
        },
        required: ["category", "domain", "tags"]
      }
    }
  });

  try {
    // response.text is a property, not a method
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
};
