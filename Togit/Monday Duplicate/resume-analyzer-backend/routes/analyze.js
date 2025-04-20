// const express = require("express");
// const axios = require("axios");

// const router = express.Router();

// router.post("/", async (req, res) => {
//     const { text, role } = req.body;

//     if (!text || !role) {
//         return res.status(400).json({ message: "Missing text or role" });
//     }

//     const prompt = `
//         You are an AI assistant designed to analyze resumes and provide summaries in a specific JSON format.

//         Generate a summary and give a brief description of the person based on the provided resume details. In the end, conclude whether the person is suitable for the ${role} role. Only consider the candidate for acceptance if they possess relevant skills or passion for the job role; otherwise, reject them. Provide strong reasons for whether you accept or reject the candidate.

//         The conclusion should be clear and concise and start with a heading 'Conclusion'. Also, based on the resume in context, generate 7 questions that need to be asked for better understanding, totally in context with the provided information to assess the candidate.

//         Here is the candidate information:
//         ${text}

//         **Response Format:**
//         Your final response MUST be a valid JSON string with the following keys:
//         * "summary" (string): A summary of the candidate’s qualifications.
//         * "questions" (array of strings): An array of 7 interview questions.
//         * "name" (string): The candidate's first name.
//         * "phone_no" (string): The candidate's phone number with the country code.

//         **Example JSON Response:**
//         \`\`\`json
//         {
//             "summary": "Summary of Candidate: ...\\n\\nConclusion: ...",
//             "questions": ["Question 1...", "Question 2...", ...],
//             "name": "John",
//             "phone_no": "+15551234567"
//         }
//         \`\`\`
//     `;

//     try {
//         const response = await axios.post(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
//             {
//                 contents: [{ parts: [{ text: prompt }] }]
//             },
//             {
//                 headers: { "Content-Type": "application/json" }
//             }
//         );

//         console.log("🔹 AI Response:", JSON.stringify(response.data, null, 2));

//         let rawContent = response.data?.candidates[0]?.content?.parts[0]?.text || "{}";

        
//         rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

     
//         let summary = JSON.parse(rawContent);

//         return res.json({
//             role: role,
//             text: text,
//             analysis: summary
//         });

//     } catch (error) {
//         console.error("❌ JSON Parsing Error:", error);
//         return res.status(500).json({
//             message: "Error analyzing resume",
//             error: error.message
//         });
//     }
// });

// module.exports = router;


// const express = require("express");
// const axios = require("axios");

// const router = express.Router();

// router.post("/", async (req, res) => {
//     const { text, role, requiredSkills, experienceLevel, additionalRequirements } = req.body;

//     if (!text || !role) {
//         return res.status(400).json({ message: "Missing text or role" });
//     }

//     const prompt = `
//         You are an AI assistant analyzing resumes based on the given job role and requirements. Also, Generate a summary and give a brief description of the person based on the provided resume details. In the end, conclude whether the person is suitable for the ${role} role. Only consider the candidate for acceptance if they possess relevant skills or passion for the job role; otherwise, reject them. Provide strong reasons for whether you accept or reject the candidate. The conclusion should be clear and concise and start with a heading 'Conclusion'.

//         **Candidate Resume:**
//         ${text}

//         **Job Role:** ${role}
//         **Required Skills:** ${requiredSkills?.join(", ") || "Not specified"}
//         **Experience Level:** ${experienceLevel || "Not specified"}
//         **Additional Requirements:** ${additionalRequirements || "None"}

//         **Analysis Instructions:**
//         - "summary" (string): A summary of the candidate’s qualifications.
//         - Extract **name, phone number, education, experience, and key skills**.
//         - Provide a **Experience** in pointwise manner in very short as possible.
//         - Determine a **Match Rate (0-100%)** based on job requirements.
//         - Rate the candidate (out of 5) based on fit for this role.
//         - Provide a **decision (Accepted/Rejected)** with strong reasons in pointwise manner.
//         - If rejected, suggest **areas for improvement**.
//         - Generate **7 relevant interview questions** based on experience.

//         **Return Response in JSON Format ONLY:**
//         \`\`\`json
//         {   "summary": "Summary of Candidate: ...\\n\\nConclusion: ...",
//             "name": "Candidate's Name",
//             "phone_no": "+91551234567",
//             "education": "Highest Degree & Institution",
//             "experience": ["Total years of experience with key roles"],
//             "skills": ["Skill1", "Skill2", "..."],
//             "match_rate": "75%",
//             "rating": "4/5",
//             "decision": "Accepted/Rejected",
//             "reasons": ["Reasons for acceptance/rejection."],
//             "questions": ["Question 1", "Question 2", "..."]
//         }
//         \`\`\`
//     `;

//     try {
//         const response = await axios.post(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
//             {
//                 contents: [{ parts: [{ text: prompt }] }]
//             },
//             {
//                 headers: { "Content-Type": "application/json" }
//             }
//         );

//         console.log("🔹 AI Response:", JSON.stringify(response.data, null, 2));

//         let rawContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

//         // 🛠️ **Sanitize AI Response**
//         rawContent = rawContent
//             .replace(/```json/g, "") // Remove opening Markdown JSON block
//             .replace(/```/g, "") // Remove closing Markdown block
//             .trim(); // Trim unnecessary spaces

//         console.log("📝 Sanitized JSON String:", rawContent);

//         let analysis;
//         try {
//             analysis = JSON.parse(rawContent); // Parse the cleaned-up JSON
//         } catch (jsonError) {
//             console.error("❌ JSON Parsing Error:", jsonError);
//             return res.status(500).json({
//                 message: "Invalid JSON response from AI",
//                 rawContent
//             });
//         }

//         return res.json({
//             role,
//             text,
//             analysis
//         });

//     } catch (error) {
//         console.error("❌ API Error:", error);
//         return res.status(500).json({
//             message: "Error analyzing resume",
//             error: error.message
//         });
//     }
// });

// module.exports = router;


const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/", async (req, res) => {
    const { text, role, requiredSkills, experienceLevel, additionalRequirements } = req.body;

    if (!text || !role) {
        return res.status(400).json({ message: "Missing text or role" });
    }

    const prompt = `
        You are an AI assistant analyzing resumes based on the given job role and requirements. Also, Generate a summary and give a brief description of the person based on the provided resume details. In the end, conclude whether the person is suitable for the ${role} role. Only consider the candidate for acceptance if they possess relevant skills or passion for the job role; otherwise, reject them. Provide strong reasons for whether you accept or reject the candidate. The conclusion should be clear and concise and start with a heading 'Conclusion'.

        **Candidate Resume:**
        ${text}

        **Job Role:** ${role}
        **Required Skills:** ${requiredSkills?.join(", ") || "Not specified"}
        **Experience Level:** ${experienceLevel || "Not specified"}
        **Additional Requirements:** ${additionalRequirements || "None"}

        **Analysis Instructions:**
        - "summary" (string): A summary of the candidate’s qualifications.
        - Extract **name, phone number, education, experience, and key skills**.
        - Provide a **Experience** in pointwise manner in very short as possible.
        - Determine a **Match Rate (0-100%)** based on job requirements.
        - Rate the candidate (out of 5) based on fit for this role.
        - Provide a **decision (Accepted/Rejected)** with strong reasons in pointwise manner.
        - If rejected, suggest **areas for improvement**.
        - Generate **7 relevant interview questions** based on experience.

        **Return Response in JSON Format ONLY:**
        \`\`\`json
        {   "summary": "Summary of Candidate: ...\\n\\nConclusion: ...",
            "name": "Candidate's Name",
            "phone_no": "+91551234567",
            "education": "Highest Degree & Institution",
            "experience": ["Total years of experience with key roles"],
            "skills": ["Skill1", "Skill2", "..."],
            "match_rate": "75%",
            "rating": "4/5",
            "decision": "Accepted/Rejected",
            "reasons": ["Reasons for acceptance/rejection."],
            "questions": ["Question 1", "Question 2", "..."]
        }
        \`\`\`
    `;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        console.log("🔹 AI Response:", JSON.stringify(response.data, null, 2));

        let rawContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        // Sanitize AI Response
        rawContent = rawContent
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        console.log("📝 Sanitized JSON String:", rawContent);

        let analysis;
        try {
            analysis = JSON.parse(rawContent);
        } catch (jsonError) {
            console.error("❌ JSON Parsing Error:", jsonError);
            return res.status(500).json({
                message: "Invalid JSON response from AI",
                rawContent
            });
        }

        // ✅ Save to JSON file
        const savePath = path.join(__dirname, "../data/analysis.json");

        // Make sure directory exists
        fs.mkdir(path.dirname(savePath), { recursive: true }, (mkdirErr) => {
            if (mkdirErr) {
                console.error("❌ Failed to create directory:", mkdirErr);
                return res.status(500).json({ message: "Directory creation failed", error: mkdirErr });
            }

            fs.writeFile(savePath, JSON.stringify(analysis, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error("❌ Failed to write analysis to file:", writeErr);
                    return res.status(500).json({ message: "Failed to save analysis", error: writeErr });
                }

                console.log("✅ Analysis saved to JSON file");
            });
        });

        return res.json({
            role,
            text,
            analysis
        });

    } catch (error) {
        console.error("❌ API Error:", error);
        return res.status(500).json({
            message: "Error analyzing resume",
            error: error.message
        });
    }
});

module.exports = router;
