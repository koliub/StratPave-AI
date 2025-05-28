import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";
import { app as firebaseApp } from "../lib/firebase";

// Initialize Gemini API
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

// Define roadmap schema
const roadmapSchema = Schema.object({
  properties: {
    projectTitle: Schema.string(),
    roadmap: Schema.array({
      items: Schema.object({
        properties: {
          id: Schema.string(),
          title: Schema.string(),
          description: Schema.string(),
        },
        optionalProperties: ["description"],
      }),
    }),
  },
});

// Create model instance
const model = getGenerativeModel(ai, {
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: roadmapSchema,
  },
});

// Input interfaces
interface GenerateRoadmapInput {
  prompt: string;
}

interface GenerateSubRoadmapInput {
  projectTitle: string;
  parentNode: { title: string; description: string };
  nextNode?: { title: string; description: string };
}

// Utility to validate and return response text
const extractValidJson = (text: string | undefined): string | null =>
  text && text.trim().startsWith("{") ? text : null;

// Generate main roadmap
export async function generateRoadmap({ prompt }: GenerateRoadmapInput): Promise<string | null> {
  console.log("generateRoadmap input:", prompt);

  const fullPrompt = `You are an expert project planner. Based on the user's project idea, generate a step-by-step roadmap.
Each step should be an actionable item.
User's project idea: "${prompt}"`;

  try {
    const result = await model.generateContent(fullPrompt);
    const responseText = extractValidJson(result.response.text());

    console.log("Generated roadmap JSON output:", responseText);
    return responseText;
  } catch (error) {
    console.error("Error generating roadmap:", error);
    return null;
  }
}

// Generate sub-roadmap
export async function generateSubRoadmap(input: GenerateSubRoadmapInput): Promise<string | null> {
  console.log("generateSubRoadmap input:", input);

  const { projectTitle, parentNode, nextNode } = input;

  const prompt = `Generate sub-roadmap points for the step "${parentNode.title}"${
    parentNode.description ? ` with the description "${parentNode.description}".` : ""
  } for the overall project "${projectTitle}". ${
    nextNode
      ? `Consider that the next step is "${nextNode.title}"${
          nextNode.description ? ` with description "${nextNode.description}".` : ""
        } and ensure your points don't overlap with that.`
      : ""
  }`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = extractValidJson(result.response.text());

    console.log("Generated roadmap JSON output:", responseText);
    return responseText;
  } catch (error) {
    console.error("Error generating sub-roadmap:", error);
    return null;
  }
}
