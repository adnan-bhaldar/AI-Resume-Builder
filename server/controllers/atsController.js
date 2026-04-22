import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

export const checkATS = async (req, res) => {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
        return res.status(400).json({ success: false, message: "Resume text and job description are required." });
    }

    const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer. Analyze the resume against the job description.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "score": <number 0-100>,
  "summary": "<2-sentence overall assessment>",
  "matchedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "formattingTips": [
    { "type": "error|warning|success", "tip": "<actionable tip>" }
  ],
  "sectionScores": {
    "keywords": <0-100>,
    "formatting": <0-100>,
    "relevance": <0-100>,
    "impact": <0-100>
  }
}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}
`;

    try {
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
        });

        const raw = completion.choices[0].message.content.trim();

        // Strip markdown fences if present
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

        const result = JSON.parse(cleaned);
        res.json({ success: true, result });
    } catch (error) {
        console.error("ATS check error:", error.message);
        res.status(500).json({ success: false, message: "ATS analysis failed. Please try again." });
    }
};