import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("API Key is missing");
    return NextResponse.json({ error: "API Key is missing" }, { status: 500 });
  }
  const groq = new Groq({ apiKey });
  
  try {
    const data = await req.json();
    
    // Format messages for Groq (OpenAI-compatible format)
    const messages = [
      {
        role: "system",
        content: `You are an AI recipe generator designed to help users discover delicious recipes based on their available pantry ingredients. 
Provide personalized meal suggestions, cooking instructions, ingredient substitutions, and helpful cooking tips.
Consider dietary restrictions, cuisine preferences, cooking skill level, and time constraints when making recommendations.
Keep your tone friendly, encouraging, and helpful - like a knowledgeable cooking companion.

When providing recipes, include:
- Recipe name and brief description
- Ingredients list
- Step-by-step instructions
- Cooking time and servings
- Optional tips or substitutions

If a user asks something unrelated to cooking or recipes, gently guide the conversation back to helping them with meal planning and recipe suggestions.`
      },
      ...data
    ];
    
    // Generate response using Groq
    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });
    
    const text = completion.choices[0]?.message?.content || "No content returned";
    
    // Post-process the response to add proper formatting
    const formattedText = text
      // Remove markdown bold formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      // Remove single asterisks (bullets/italics)
      .replace(/\*/g, '')
      // Add double line breaks around major section headers
      .replace(/Ingredients:/gi, '\n\nIngredients:\n\n')
      .replace(/Instructions:/gi, '\n\nInstructions:\n\n')
      .replace(/Cooking Time:/gi, '\n\nCooking Time: ')
      .replace(/Servings:/gi, '\nServings: ')
      .replace(/Tips?( and Substitutions?)?:/gi, '\n\nTips and Substitutions:\n\n')
      .replace(/Substitutions?:/gi, '\n\nSubstitutions:\n\n')
      // Add line break before numbered steps and after
      .replace(/(\d+)\.\s*/g, '\n\n$1. ')
      // Add line breaks around sentences that end with periods
      .replace(/\.\s+([A-Z])/g, '.\n\n$1')
      // Clean up any triple or more line breaks
      .replace(/\n{4,}/g, '\n\n')
      // Trim whitespace
      .trim();
    
    return NextResponse.json({ response: formattedText }, { status: 200 });
    
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes("rate")) {
      console.error("Rate limit reached:", error);
      return NextResponse.json({
        error: "The AI is busy right now. Please try again in a few moments."
      }, { status: 429 });
    }
    console.error("Error in API Call:", error.message);
    console.error("Full Error Details:", error);
    return NextResponse.json({ error: "Error generating response" }, { status: 500 });
  }
}