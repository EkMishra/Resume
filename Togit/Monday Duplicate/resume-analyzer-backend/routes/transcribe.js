const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@deepgram/sdk");
require("dotenv").config();
const axios = require("axios");

const router = express.Router();
const upload = multer({ dest: "recordings/" });

// Initialize Deepgram client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// Function to structure conversation
const structureConversation = async (transcription) => {
    try {
        const prompt = `
        Format the following conversation into a structured JSON format where each dialogue is classified as either 'AI_HR' or 'Candidate'.
        The JSON should be in the format:
        {
          "conversation": [
            {
              "speaker": "AI_HR",
              "text": "Hello, how are you?"
            },
            {
              "speaker": "Candidate",
              "text": "I'm good, thank you."
            }
          ]
        }

        **Raw Conversation:**
        ${transcription}
        `;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        let rawContent = response.data?.candidates[0]?.content?.parts[0]?.text || "{}";

        // Clean up JSON formatting if needed
        rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(rawContent);
    } catch (error) {
        console.error("❌ Error structuring conversation:", error);
        return { conversation: [] };
    }
};

router.post("/", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const inputFile = req.file.path;
        const audioStream = fs.createReadStream(inputFile);

        // Transcribe the audio using Deepgram
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            audioStream,
            {
                model: "nova-3",
                smart_format: true
            }
        );

        if (error) {
            throw error;
        }

        const transcription = result?.results?.channels[0]?.alternatives[0]?.transcript || "";

        // Cleanup: Delete the file after processing
        fs.unlinkSync(inputFile);

        // Structure conversation using Gemini
        const structuredConversation = await structureConversation(transcription);

        // Return structured conversation
        res.json(structuredConversation);

    } catch (error) {
        console.error("❌ Transcription Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
