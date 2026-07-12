import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Calls Gemini with automatic retry on transient overload (503) errors,
 * using exponential backoff.
 */
const generateWithRetry = async (model, requestConfig, retries = 3, delayMs = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await model.generateContent(requestConfig);
    } catch (error) {
      const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded');
      if (isOverloaded && attempt < retries) {
        console.warn(`Gemini overloaded, retrying in ${delayMs}ms (attempt ${attempt}/${retries})...`);
        await new Promise((res) => setTimeout(res, delayMs));
        delayMs *= 2; // exponential backoff: 2s, 4s, 8s...
      } else {
        throw error;
      }
    }
  }
};

/**
 * Analyze a resume against a job description using Gemini
 */
export const analyzeResume = async (resumeText, jobDescription) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) resume reviewer and career coach. Analyze the following resume against the provided job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide a comprehensive analysis in the following JSON format. Be specific, actionable, and data-driven in your feedback.

{
  "ats_score": <number 0-100, overall ATS compatibility score>,
  "match_score": <number 0-100, how well the resume matches the job description>,
  "missing_keywords": [<list of important keywords from job description NOT found in resume>],
  "keyword_suggestions": [<list of additional keywords the candidate should add>],
  "matched_keywords": [<list of keywords that appear in BOTH resume and job description>],
  "improvement_suggestions": [<list of 4-6 specific, actionable suggestions to improve the resume>],
  "rewritten_bullets": [
    {
      "original": "<original bullet point from resume>",
      "improved": "<rewritten version with strong action verbs, metrics, and clarity>"
    }
  ],
  "formatting_feedback": [<list of 3-5 formatting suggestions for better ATS compatibility>],
  "resume_quality_metrics": {
    "keyword_coverage": <number 0-100>,
    "bullet_strength": <number 0-100>,
    "skills_coverage": <number 0-100>,
    "formatting_score": <number 0-100>
  }
}

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown, no code fences, no extra text.
- Rewrite at least 3-5 bullet points from the resume.
- Be honest but constructive in scoring.
- Missing keywords should only include genuinely relevant ones from the job description.
- Bullet rewrites must use strong action verbs and include measurable outcomes where possible.`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await generateWithRetry(model, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    }
  });

  const content = result.response.text();

  try {
    // Clean up potential markdown code fences just in case
    let jsonString = content.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse AI response:', content);
    throw new Error('AI returned invalid JSON. Please try again.');
  }
};

/**
 * Rewrite a single bullet point for stronger impact
 */
export const rewriteBulletPoint = async (bulletPoint, context = '') => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }

  const contextNote = context
    ? `\nContext about the role/industry: ${context}`
    : '';

  const prompt = `You are a professional resume writer. Rewrite the following resume bullet point to be more impactful.${contextNote}

Original bullet point: "${bulletPoint}"

Rules:
- Use a strong action verb at the start
- Include specific, measurable outcomes where possible
- Be concise but detailed
- Use technical clarity appropriate for ATS systems
- Keep it to 1-2 lines maximum

Return ONLY valid JSON in this exact format:
{
  "original": "${bulletPoint}",
  "improved": "<your rewritten version>"
}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await generateWithRetry(model, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
    }
  });

  const content = result.response.text();

  try {
    let jsonString = content.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse AI response:', content);
    throw new Error('AI returned invalid JSON. Please try again.');
  }
};
