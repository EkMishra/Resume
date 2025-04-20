require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const twilio = require("twilio");

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
    console.error("❌ Error: GOOGLE_API_KEY is missing in environment variables.");
    process.exit(1);
}

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

// **Generate the AI Prompt**
const generatePrompt = (conversation, summary) => {
    return `
    You are an AI interviewer evaluating a candidate's interview performance based on their conversation. Provide a structured evaluation.

    **Interview Transcript:**
    ${JSON.stringify(conversation, null, 2)}

    **Candidate Summary:** 
    ${summary}

    **Evaluation Criteria:**
    - "strengths": List key strengths based on the conversation.
    - "areasForImprovement": Highlight areas that need improvement.
    - "detailedFeedback": Provide ratings and insights on:
      - "Technical Skills"
      - "Communication Skills"
      - "Problem-Solving Ability"
      - "Team Collaboration"
    - "finalDecision":
      - "decision": "Accepted" or "Rejected"
      - "ratings": Rate each category (1-5).
      - "confidenceScore": How confident you are in this decision.
    - "additionalInsights":
      - "sentimentAnalysis": Emotional tone of the conversation.
      - "recommendedResources": Learning materials based on weak areas.
      - "alternateRoleSuggestions": Other potential roles for the candidate.

    **Return JSON only (no extra text, no markdown formatting):**
    \`\`\`json
    {
        "strengths": ["Technical Related",],
        "areasForImprovement": ["Realated to Technical Improvements"],
        "detailedFeedback": {
            "Technical Skills": "Strong in algorithms, weak in databases",
            "Communication Skills": "Clear but hesitant",
            "Problem-Solving Ability": "Logical but slow",
            "Team Collaboration": "Not enough data"
        },
        "finalDecision": {
            "decision": "Accepted/Rejected",
            "ratings": {
                "Technical Skills": 4,
                "Communication Skills": 3,
                "Problem-Solving": 4,
                "Experience Level": 3
            },
            "confidenceScore": "High"
        },
        "additionalInsights": {
            "sentimentAnalysis": {
                "overallSentiment": "Positive",
                "emotionalTone": "Confident"
            },
            "recommendedResources": [
                {
                    "topic": "Database Optimization",
                    "resource": "https://www.some-resource.com"
                }
            ],
            "alternateRoleSuggestions": ["Data Analyst", "Backend Engineer"]
        }
    }
    \`\`\`
    `;
};

// **POST Route to Evaluate the Interview**
router.post("/", async (req, res) => {
    try {
        const { conversation, summary } = req.body;

        // Validate input
        if (!conversation || !summary || !Array.isArray(conversation) || typeof summary !== "string") {
            return res.status(400).json({ message: "Invalid input. 'conversation' must be an array and 'summary' must be a string." });
        }

        const prompt = generatePrompt(conversation, summary);

        let existingData = conversation;

        const filePath = path.join(__dirname, "../data/interviews.json");

        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, "utf-8");
            try {
                existingData = JSON.parse(fileContent);
            } catch (err) {
                console.error("⚠️ Failed to parse existing JSON. Overwriting...");
            }
        }


        // Save back to file
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf-8");

        // **Send API Request**
        const response = await axios.post(
            GEMINI_API_URL,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { "Content-Type": "application/json" } }
        );

        console.log("🔹 Raw API Response:", JSON.stringify(response.data, null, 2));

        let rawContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        // **Sanitize AI Response**
        rawContent = rawContent
            .replace(/```json/g, "") // Remove Markdown JSON block
            .replace(/```/g, "") // Remove closing Markdown
            .trim();

        console.log("📝 Sanitized JSON String:", rawContent);

        let evaluation;
        try {
            evaluation = JSON.parse(rawContent); // Parse JSON
        } catch (jsonError) {
            console.error("❌ JSON Parsing Error:", jsonError);
            return res.status(500).json({
                message: "Invalid JSON response from AI",
                rawContent
            });
        }

        // Send decision via Twilio
        try {
            const decisionText = `Interview Decision: ${evaluation.finalDecision.decision}`;
            const message = await client.messages.create({
                body: decisionText,
                from: twilioPhone,
                to: "+919108244780" // Use E.164 format, e.g., +911234567890 for India
            });
            console.log("📲 Twilio Message Sent:", message.sid);
        } catch (twilioError) {
            console.error("❌ Failed to send SMS via Twilio:", twilioError.message);
        }


        return res.json({ conversation, summary, evaluation });

    } catch (error) {
        console.error("❌ API Error:", error);
        return res.status(500).json({
            message: "Failed to process evaluation",
            error: error.message
        });
    }
});

module.exports = router;
