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
      .replace(/Ingredients:/gi, '\n\nIngredients:\n')
      .replace(/Instructions:/gi, '\n\nInstructions:\n')
      .replace(/Cooking Time:/gi, '\n\nCooking Time:')
      .replace(/Servings:/gi, '\nServings:')
      .replace(/Tips?:/gi, '\n\nTips:')
      .replace(/Substitutions?:/gi, '\n\nSubstitutions:')
      .replace(/(\d+)\.\s+/g, '\n$1. ') // Add line break before numbered steps
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks (more than 2)
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