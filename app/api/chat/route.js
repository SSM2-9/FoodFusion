import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("API Key is missing");
    return NextResponse.json({ error: "API Key is missing" }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "You are a chatbot designed to help people with making delicious recipes"
  });

  try {
    const data = await req.json();

    // Construct the conversation history
    const conversationHistory = data.map(message => message.content).join("\n\n");

    const prompt = `${model.systemInstruction}\n\nHere's what has been discussed so far:\n${conversationHistory}\n`;

    // Generate response using the AI model
    const result = await model.generateContent(prompt);

    // Extract the relevant text
    const text = typeof result.response.text === 'function' ? await result.response.text() : result.response.text || "No content returned";

    // Return the assistant's response as a string
    return NextResponse.json({ response: text }, { status: 200 });
  } catch (error) {
    console.error("Error in API Call:", error.message);
    console.error("Full Error Details:", error);
    return NextResponse.json({ error: "Error generating response" }, { status: 500 });
  }
}
