import { ai, MODELS } from "../lib/gemini";
import { Type } from "@google/genai";
import { Incident, AIRating, CopilotOutput } from "../types";

export const aiService = {
  async analyzeIncident(title: string, description: string): Promise<AIRating> {
    if (!ai) throw new Error("AI not initialized");

    const prompt = `Analyze this incident and provide a categorization and priority score (0-100). 
    Title: ${title}
    Description: ${description}`;

    const response = await ai.models.generateContent({
      model: MODELS.flash,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityScore: { type: Type.NUMBER, description: "0-100 score based on impact and urgency" },
            suggestedOrder: { type: Type.NUMBER, description: "Relative priority order (1 being highest)" },
            category: { type: Type.STRING, enum: ['IT', 'Network', 'Security', 'Hardware', 'Software', 'Other'] },
          },
          required: ["priorityScore", "suggestedOrder", "category"],
        },
      },
    });

    return JSON.parse(response.text);
  },

  async generateCopilot(incident: Incident): Promise<CopilotOutput> {
    if (!ai) throw new Error("AI not initialized");

    const prompt = `Generate a resolution copilot for this incident:
    Title: ${incident.title}
    Description: ${incident.description}
    Severity: ${incident.severity}
    Category: ${incident.category}`;

    const response = await ai.models.generateContent({
      model: MODELS.flash,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Concise summary of the issue" },
            steps: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Step-by-step resolution guide" 
            },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Proactive recommendations to prevent recurrence" 
            },
          },
          required: ["summary", "steps", "recommendations"],
        },
      },
    });

    return JSON.parse(response.text);
  },

  async getRecommendations(currentIncident: Incident, pastIncidents: Incident[]): Promise<Incident[]> {
    if (!ai || pastIncidents.length === 0) return [];

    const pastText = pastIncidents.map(inc => `[ID: ${inc.id}] ${inc.title}: ${inc.description.slice(0, 100)}...`).join('\n');
    
    const prompt = `Given the current incident:
    Title: ${currentIncident.title}
    Description: ${currentIncident.description}
    
    And these past incidents:
    ${pastText}
    
    Return the IDs of the 3 most similar past incidents that could help resolve the current one.`;

    const response = await ai.models.generateContent({
      model: MODELS.flash,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            similarIds: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
          },
          required: ["similarIds"],
        },
      },
    });

    const { similarIds } = JSON.parse(response.text);
    return pastIncidents.filter(inc => similarIds.includes(inc.id));
  }
};
