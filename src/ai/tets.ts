import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";

import { app } from "../lib/firebase";

// Use the initialized FirebaseApp from firebase.ts
const firebaseApp = app;

// Initialize the Gemini Developer API backend service
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

// Provide a JSON schema object for a roadmap.
// It's an array of steps, each with an id, title, and description.
// Provide a JSON schema object for a roadmap.
// It's an array of steps, each with an id, title, and description,
// and also includes a project title.
const roadmapSchema = Schema.object({
  properties: {
    projectTitle: Schema.string(), // Added projectTitle property
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


// Create a `GenerativeModel` instance with a model that supports your use case.
const model = getGenerativeModel(ai, {
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: roadmapSchema, // Use the roadmap schema
  },
});

// Define an interface for the input to generateRoadmap
interface GenerateRoadmapInput {
  prompt: string;
  parentNode?: {
    id: string;
    title: string;
    description?: string;
  };
}

// Modify the generateRoadmap function to accept structured input
export async function generateRoadmap(input: GenerateRoadmapInput): Promise<string | null> {
  // Add a console log here to show when the function is called and with what input
  console.log("generateRoadmap function called with input:", input);

  let prompt = input.prompt;

  // If generating a sub-roadmap, add context about the parent node to the prompt
  if (input.parentNode) {
    prompt = `Generate a detailed sub-roadmap for the step "${input.parentNode.title}"` +
             (input.parentNode.description ? ` with the description "${input.parentNode.description}".` : ".") +
             ` The overall project goal is: "${input.prompt}"\n\nSub-roadmap details:`;
  }

  try {
    const result = await model.generateContent(prompt);
    const jsonResponse = result.response.text();

    // Basic validation to ensure the response is not empty and is likely JSON
    if (!jsonResponse || !jsonResponse.trim().startsWith("{")) {
      console.error("AI model returned an invalid or empty response:", jsonResponse);
      return null;
    }

    // Add a console log here to show the generated JSON output
    console.log("Generated roadmap JSON output:", jsonResponse);

    return jsonResponse;

  } catch (error) {
    console.error("Error generating roadmap:", error);
    return null;
  }
}
