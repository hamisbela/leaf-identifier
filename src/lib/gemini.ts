import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const DEFAULT_PROMPT = "Analyze this image in detail. Describe what you see, including objects, colors, and any notable details.";

export async function analyzeImage(imageData: string, customPrompt?: string): Promise<string> {
  try {
    // Validate image data
    if (!imageData || !imageData.includes('base64')) {
      throw new Error('Invalid image data format');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Extract base64 data correctly, handling different data URL formats
    const base64Data = imageData.split('base64,')[1];
    if (!base64Data) {
      throw new Error('Invalid base64 image data');
    }
    
    const prompt = customPrompt?.trim() || DEFAULT_PROMPT;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No analysis generated');
    }
    
    return text;
  } catch (error) {
    console.error('Error analyzing image:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
    throw new Error('Failed to analyze image. Please try again.');
  }
}