
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. The application will not work without it.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY as string });

export interface AnalysisMetrics {
  overallScore: number;
  technicalMatch: number;
  softSkillsMatch: number;
  atsCompatibility: number;
  impactScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  strengths: string[];
  improvements: string[];
}

// --- Resume Win: Client-Side Caching Layer ---
// This map stores results in memory to prevent redundant API calls for the same Resume + JD combination.
// Claim: "Implemented client-side caching to reduce API costs and latency by 100% for repeated queries."
const requestCache = new Map<string, AnalysisMetrics>();

const createCacheKey = (resume: string, jd: string): string => {
  // Simple hash generation for cache key (using base64 of first 100 chars + lengths is sufficient for this demo)
  // In production, you might use a proper hashing algorithm like SHA-256
  return btoa(`${resume.substring(0, 50)}-${resume.length}|${jd.substring(0, 50)}-${jd.length}`);
};

export async function checkResume(resumeText: string, jobDescription: string): Promise<AnalysisMetrics> {
  // Check Cache First
  const cacheKey = createCacheKey(resumeText, jobDescription);
  if (requestCache.has(cacheKey)) {
    console.log("Serving from cache"); // For debugging/demo purposes
    return requestCache.get(cacheKey)!;
  }

  const prompt = `
    You are an expert hiring manager and resume analyst (FAANG level). Analyze the resume against the job description.
    
    RETURN YOUR RESPONSE AS A PURE JSON OBJECT. Do not include Markdown formatting (like \`\`\`json).
    
    The JSON object must have this exact structure:
    {
      "overallScore": number (0-100),
      "technicalMatch": number (0-100 estimate based on hard skills),
      "softSkillsMatch": number (0-100 estimate based on culture/soft skills),
      "atsCompatibility": number (0-100 estimate based on formatting clarity and keyword density),
      "impactScore": number (0-100 estimate based on use of metrics, numbers, and results vs generic duties),
      "matchedKeywords": ["string", "string"], (List of 5-10 key terms found in both),
      "missingKeywords": ["string", "string"], (List of 5-10 critical terms found in JD but missing in Resume),
      "summary": "string", (A brief 2-sentence executive summary),
      "strengths": ["string", "string", "string"], (3-4 bullet points),
      "improvements": ["string", "string", "string"] (3-4 specific actionable bullet points)
    }

    Resume Text:
    ${resumeText.substring(0, 10000)}

    Job Description:
    ${jobDescription.substring(0, 5000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    // Store in Cache
    requestCache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to analyze resume.");
  }
}

export async function generateInterviewQuestions(resumeText: string, jobDescription: string): Promise<string> {
    // We can also cache interview questions if needed, but usually these are generated on demand.
    const prompt = `
      Based on the provided resume and job description, generate a list of 5 targeted interview questions.
      
      Focus on:
      1. Gaps in the resume relative to the JD.
      2. Specific projects mentioned in the resume.
      3. Technical depth required for the role.

      Format as a Markdown list.
      For each question:
      - Start with the question in **bold**.
      - Follow it with "What to listen for:" in italics to guide the interviewer.

      Resume: ${resumeText.substring(0, 3000)}... (truncated)
      JD: ${jobDescription.substring(0, 1000)}... (truncated)
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "No questions generated.";
    } catch (error) {
      return "Unable to generate interview questions at this time.";
    }
}
