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

CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE:
- DO NOT use markdown formatting like **bold**, *italics*, or # headers
- DO NOT use asterisks or special characters for formatting
- Use plain text only with natural line breaks for spacing
- Put TWO line breaks between major sections (ingredients, instructions, etc.)
- Put ONE line break between individual list items
- Keep paragraphs short (2-4 sentences max)
- Use simple labels like "Ingredients:" and "Instructions:" without any special formatting

When providing recipes, structure them like this example:

Chocolate Lava Cake
A rich, gooey, and decadent chocolate cake that's perfect for satisfying your sweet tooth.

Ingredients:

1 cup chocolate chips

1 1/2 cups all-purpose flour

1 cup granulated sugar

2 large eggs

1/2 cup unsalted butter

1 teaspoon pure vanilla extract

1/4 teaspoon salt


Instructions:

1. Preheat your oven to 425°F (220°C).

2. Mix the flour, sugar, and salt in a bowl.

3. Melt the chocolate and butter in a separate bowl.

4. Combine the egg and vanilla extract, then add it to the chocolate mixture.


Cooking Time: 12-15 minutes
Servings: 2-3 people

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