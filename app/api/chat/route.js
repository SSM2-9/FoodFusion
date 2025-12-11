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

IMPORTANT FORMATTING RULES:
- Break down your responses into clear, digestible paragraphs
- Add line breaks between different topics or sections
- Use spacing to make information easy to scan
- For lists or multiple items, put each on a new line with proper spacing
- Keep paragraphs short (2-4 sentences max)
- Use natural breaks to organize information visually

When providing recipes, structure them clearly:
- Recipe name and brief description
- Ingredients list (each on a new line)
- Step-by-step instructions (numbered, with spacing)
- Cooking time and servings
- Optional tips or substitutions

If a user asks something unrelated, gently guide the conversation back to helping them with meal planning and recipe suggestions.`
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

    return NextResponse.json({ response: text }, { status: 200 });
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