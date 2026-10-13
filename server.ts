import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gen AI client with recommended headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const UPSC_SYSTEM_PROMPT = `You are an elite UPSC Civil Services Examination (CSE) Mentor, Evaluator, and Strategy Coach. 
You possess deep mastery over:
- UPSC CSE Prelims (GS-1 syllabus: Polity, Modern/Ancient/Medieval History, Geography, Economy, Environment/Ecology, Science & Tech, Current Affairs; GS-2 CSAT: Comprehension, Reasoning, Quant).
- UPSC CSE Mains (GS-1: History/Heritage/Society/Geography; GS-2: Governance/Constitution/Polity/Social Justice/IR; GS-3: Technology/Economic Development/Bio-diversity/Environment/Security/Disaster Mgmt; GS-4: Ethics, Integrity & Aptitude case studies; Essay paper; and Optionals).
- The exact answer evaluation standards followed by UPSC evaluators (Intro-Body-Conclusion, dimensions like Constitutional provisions, SC judgments, NITI Aayog/ARC/Govt committee reports, schematics/flowcharts, balanced way forward).
- Effective study psychology: Spaced repetition (1-3-7-30 rule), negative mark reduction in Prelims, time discipline (7 min for 10-markers, 11 min for 15-markers), consistency.
Provide sharp, insightful, structured, realistic, and uplifting guidance.`;

// 1. Evaluate Mains Answer
app.post('/api/ai/evaluate-answer', async (req: Request, res: Response) => {
  try {
    const { question, answer, gsPaper, maxMarks, targetWordCount, studentNotes } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required.' });
    }

    const prompt = `Evaluate this UPSC Mains answer rigorously as a senior UPSC evaluator:
PAPER: ${gsPaper || 'GS Paper'}
MAX MARKS: ${maxMarks || 10}
EXPECTED WORD LIMIT: ${targetWordCount || 150} words
ADDITIONAL CONTEXT / STUDENT NOTES: ${studentNotes || 'None'}

QUESTION:
"""
${question}
"""

STUDENT'S ANSWER:
"""
${answer}
"""

Please return a detailed JSON evaluation matching this schema:
{
  "marksAwarded": number (e.g. 5.5 for a 10 marker, realistic UPSC scale),
  "maxMarks": number,
  "percentage": number,
  "overallVerdict": "Exceptional" | "Good - Above Average" | "Average - Needs Depth" | "Below Average - Major Gaps",
  "estimatedWordCount": number,
  "structureAnalysis": {
    "introductionScore": number (out of 2),
    "introductionFeedback": string,
    "bodyScore": number (out of 6),
    "bodyFeedback": string,
    "conclusionScore": number (out of 2),
    "conclusionFeedback": string
  },
  "dimensionsCovered": string[],
  "dimensionsMissed": string[],
  "valueAdditionSuggestions": {
    "constitutionalArticles": string[],
    "supremeCourtCasesOrCommittees": string[],
    "schemesOrReports": string[],
    "diagramOrFlowchartIdea": string
  },
  "actionableImprovements": string[],
  "modelAnswerSnippet": string
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: UPSC_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error evaluating answer:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to evaluate answer. Please try again.',
    });
  }
});

// 2. Generate Personalized UPSC Study Plan & Strategy
app.post('/api/ai/generate-study-plan', async (req: Request, res: Response) => {
  try {
    const {
      targetYear,
      aspirantProfile, // "full_time" | "working_professional" | "college_student"
      stageFocus, // "prelims_focused" | "mains_oriented" | "integrated" | "optional_deep_dive"
      dailyHours,
      optionalSubject,
      weakAreas,
      currentMonthsLeft,
      studyStyle,
    } = req.body;

    const prompt = `Design a comprehensive, realistic, high-yield UPSC CSE preparation strategy and timetable:
Target Year: ${targetYear || 2026}
Aspirant Profile: ${aspirantProfile || 'Full-time'}
Primary Focus Stage: ${stageFocus || 'Integrated Prelims + Mains'}
Daily Study Hours: ${dailyHours || 8} hours
Optional Subject: ${optionalSubject || 'Not Decided / PSIR / Sociology'}
Weak Areas Reported: ${weakAreas || 'CSAT, Ancient History, GS4 Ethics Case studies'}
Months Remaining: ${currentMonthsLeft || 8} months
Study Style/Preferences: ${studyStyle || 'Pomodoro slots with daily answer writing'}

Provide a structured JSON output with:
{
  "strategyTitle": string,
  "executiveSummary": string,
  "dailySchedule": [
    {
      "timeSlot": string (e.g. "06:00 AM - 08:00 AM"),
      "activity": string,
      "subjectFocus": string,
      "productivityTip": string
    }
  ],
  "weeklyMilestones": [
    {
      "day": string,
      "coreFocus": string,
      "deliverable": string
    }
  ],
  "revisionRule": string,
  "recommendedResources": [
    {
      "subject": string,
      "standardBooks": string[],
      "proTip": string
    }
  ],
  "weakAreaRemedies": [
    {
      "area": string,
      "specificAction": string
    }
  ],
  "goldenAdvice": string[]
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: UPSC_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating study plan:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate study plan.',
    });
  }
});

// 3. Performance Diagnostic & Mock Test Analyzer
app.post('/api/ai/analyze-performance', async (req: Request, res: Response) => {
  try {
    const {
      mockScores, // array of test scores { name, date, totalScore, accuracy, correct, incorrect, unattempted, stage }
      dailyStudyHoursAverage,
      syllabusCoveragePercentage,
      weakSubjects,
    } = req.body;

    const prompt = `Analyze this UPSC aspirant's performance metrics and provide an honest, data-driven diagnostic report:
RECENT MOCK TESTS:
${JSON.stringify(mockScores, null, 2)}

AVERAGE DAILY STUDY HOURS: ${dailyStudyHoursAverage || 7} hrs/day
SYLLABUS COVERED: ${syllabusCoveragePercentage || 55}%
ASPIRANT'S PERCEIVED WEAKNESSES: ${weakSubjects?.join(', ') || 'Economy conceptual questions, CSAT reading comprehension'}

Return a structured JSON report:
{
  "overallReadinessScore": number (out of 100),
  "prelimsSurvivalProbability": string (e.g. "Moderate (Cutoff margin risk)" or "High (Comfortable zone)"),
  "diagnosticSummary": string,
  "negativeMarkingDiagnosis": {
    "severity": "Low" | "Medium" | "High" | "Critical",
    "analysis": string,
    "eliminationTechniqueFix": string
  },
  "subjectWiseHealth": [
    {
      "subject": string,
      "status": "Strong" | "Average" | "Vulnerable",
      "actionNeeded": string
    }
  ],
  "next14DaysActionSprint": [
    {
      "dayRange": string,
      "targetTask": string,
      "metricToTrack": string
    }
  ],
  "motivationalNudge": string
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: UPSC_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error analyzing performance:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze performance metrics.',
    });
  }
});

// 4. Personalized AI UPSC Mentor Consultation & Question Generator
app.post('/api/ai/mentor-chat', async (req: Request, res: Response) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Convert chat history format
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // If context is provided, attach as preamble in system instruction
    const contextNote = userContext
      ? `\nCURRENT ASPIRANT CONTEXT:\n- Target Year: ${userContext.targetYear || 2026}\n- Daily Goal: ${userContext.dailyHours || 8} hrs\n- Focus: ${userContext.focus || 'Integrated'}\n- Primary Optional: ${userContext.optional || 'PSIR'}`
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction: UPSC_SYSTEM_PROMPT + contextNote,
      },
    });

    const reply = response.text || 'I could not generate a response. Please try asking again.';
    return res.json({ success: true, reply });
  } catch (error: any) {
    console.error('Error in mentor chat:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to communicate with UPSC Mentor.',
    });
  }
});

// 5. Generate UPSC Practice Prelims MCQ Drill with Elimination Tactics
app.post('/api/ai/generate-drill', async (req: Request, res: Response) => {
  try {
    const { subject, topic, difficulty = 'UPSC Standard' } = req.body;

    const prompt = `Generate 3 high-yield UPSC Prelims standard MCQs on:
SUBJECT: ${subject || 'Indian Polity'}
TOPIC: ${topic || 'Fundamental Rights & Judicial Review'}
DIFFICULTY: ${difficulty}

Questions should replicate UPSC phrasing (e.g. "Consider the following statements", "Which of the statements given above is/are correct?").
Include authentic 50-50 trap options and teach the elimination logic!

Return JSON:
{
  "questions": [
    {
      "id": string,
      "context": string,
      "statements": string[],
      "options": [
        { "label": "A", "text": string },
        { "label": "B", "text": string },
        { "label": "C", "text": string },
        { "label": "D", "text": string }
      ],
      "correctOption": "A" | "B" | "C" | "D",
      "detailedExplanation": string,
      "eliminationTechnique": string,
      "pyqReferenceTrend": string
    }
  ]
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: UPSC_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating drill:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate MCQ drill.',
    });
  }
});

// 6. Current Affairs to Static Syllabus Mapper
app.post('/api/ai/map-current-affairs', async (req: Request, res: Response) => {
  try {
    const { headline, articleSnippet } = req.body;

    const prompt = `Analyze this Current Affairs news item for UPSC CSE:
HEADLINE: ${headline}
DETAILS: ${articleSnippet || 'General news theme'}

Provide a JSON map:
{
  "paperMapping": [
    {
      "paper": "GS-1" | "GS-2" | "GS-3" | "GS-4" | "Prelims",
      "syllabusMicroTopic": string,
      "relevance": string
    }
  ],
  "prelimsTakeaways": string[],
  "mainsPotentialQuestion": string,
  "keyFactualOrConstitutionalHooks": string[],
  "dimensionsToExplore": string[]
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: UPSC_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error mapping current affairs:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to map current affairs.',
    });
  }
});

// 7. Personalized AI UPSC Motivational Booster
app.post('/api/ai/generate-motivation', async (req: Request, res: Response) => {
  try {
    const { aspirantName, targetYear, streakDays, mood, stageFocus, tasksCompleted, hoursStudied } = req.body;

    const prompt = `Craft a deeply personalized, authentic, soul-stirring UPSC Civil Services motivational booster for aspirant ${aspirantName || 'Civil Servant in the making'}:
Context:
- Target CSE Year: ${targetYear || 2026}
- Current Consistency Streak: ${streakDays || 14} days
- Current Aspirant Mood / State: ${mood || 'Overwhelmed by revision backlog'}
- Primary Stage: ${stageFocus || 'Integrated Prelims + Mains'}
- Progress today: ${tasksCompleted || 3} tasks cleared, ${hoursStudied || 6.5} hours deep study.

Generate a JSON object:
{
  "quote": string (powerful, intellectual, deeply moving quote tailored to UPSC rigor and the dream of LBSNAA / Sardar Patel's Steel Frame),
  "authorOrAttribution": string (e.g. "Sardar Vallabhbhai Patel", "Swami Vivekananda", "Dr. B.R. Ambedkar", or "UPSC AI Mentor"),
  "personalMentorNote": string (2-3 sentences of direct, warm, razor-sharp advice speaking directly to the aspirant),
  "lbsnaaMantra": string (short punchy mantra e.g. "Sheelam Param Bhushanam - Character is the highest virtue"),
  "actionForNextHour": string (a concrete next small step to break mental inertia)
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: UPSC_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating motivational quote:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate motivational quote.',
    });
  }
});

// 8. Generate UPSC High-Yield Revision Flashcards
app.post('/api/ai/generate-flashcards', async (req: Request, res: Response) => {
  try {
    const { topic, subject, paper, count = 4 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const prompt = `Create ${count} high-yield, punchy active-recall flashcards for UPSC Civil Services Examination:
TOPIC: "${topic}"
SUBJECT: "${subject || 'General Studies'}"
PAPER: "${paper || 'GS'}"

Each flashcard must follow authentic UPSC CSE standards:
- Front: A specific, sharp question or high-yield concept prompt (e.g. "What is the Kesavananda Bharati basic structure test?", "Differentiate between SDF and Reverse Repo Rate", "State the 3 core criteria of Montreux Record").
- Back: Bulleted high-yield recall points (Constitutional Articles, Supreme Court landmark cases, committee names, key distinctions, or memory mnemonics). Keep concise and ideal for quick 30-second review!

Return ONLY valid JSON:
{
  "flashcards": [
    {
      "id": string,
      "front": string,
      "back": string,
      "highYield": boolean
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: UPSC_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating flashcards:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate flashcards.',
    });
  }
});

// Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`UPSC CSE Server running on http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
