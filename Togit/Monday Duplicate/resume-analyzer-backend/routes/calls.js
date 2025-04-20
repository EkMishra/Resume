// const express = require("express");

// const router = express.Router();

// router.get("/", async (req, res) => {
//     try {
//         const response = await globalThis.fetch("https://api.bland.ai/v1/calls", {
//             method: "GET",
//             headers: {
//                 authorization: "org_2ebdbdd009f7fc24ac09babec0ef9cf48ab154f03429be17338c3f7a33b9dbb9a66009ea78cf641e2ea369", // Replace with actual API key
//             },
//         });

//         if (!response.ok) {
//             throw new Error(`API request failed with status ${response.status}`);
//         }

//         const data = await response.json();
//         console.log("✅ API Response:", data);
//         res.json(data); // Send response to client
//     } catch (err) {
//         console.error("❌ API Error:", err);
//         res.status(500).json({ error: "Internal Server Error", details: err.message });
//     }
// });

// module.exports = router;

// const express = require("express");
// const fs = require("fs");
// const axios = require("axios");

// const router = express.Router();

// router.get("/", async (req, res) => {
//     try {
//         // Fetch calls from the API
//         const response = await fetch("https://api.bland.ai/v1/calls", {
//             method: "GET",
//             headers: {
//                 authorization: "org_2ebdbdd009f7fc24ac09babec0ef9cf48ab154f03429be17338c3f7a33b9dbb9a66009ea78cf641e2ea369", // Replace with actual API key
//             },
//         });
        
//         if (!response.ok) {
//             throw new Error(`API request failed with status ${response.status}`);
//         }

//         const data = await response.json();
//         console.log("✅ API Response:", data);

//         // Extract recording URL from the first call (change logic if needed)
//         const call = data.calls[5]; // Get first call (modify as needed)
//         if (!call || !call.recording_url) {
//             throw new Error("❌ No recording URL found in API response.");
//         }

//         const recordingUrl = call.recording_url; 
//         console.log("🎤 Recording URL:", recordingUrl);

//         // Download the recording
//         const filePath = `recordings/${call.call_id}.mp3`; // Save in "recordings" folder

//         const writer = fs.createWriteStream(filePath);
//         const recordingResponse = await axios({
//             url: recordingUrl,
//             method: "GET",
//             responseType: "stream",
//         });

//         recordingResponse.data.pipe(writer);

//         writer.on("finish", () => {
//             console.log("✅ Download complete:", filePath);
//             res.json({ message: "Download complete", filePath});
//         });

//         writer.on("error", (err) => {
//             console.error("❌ Error saving recording:", err);
//             res.status(500).json({ error: "Failed to save recording" });
//         });

//     } catch (err) {
//         console.error("❌ Error:", err);
//         res.status(500).json({ error: "Internal Server Error", details: err.message });
//     }
// });

// module.exports = router;

const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createClient } = require("@deepgram/sdk");
require("dotenv").config();

const router = express.Router();
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// 🧠 Structure the transcript using Gemini
// const structureConversation = async (transcription) => {
//     try {
//         const prompt = `
// Format the following conversation into a structured JSON format where each dialogue is classified as either 'AI_HR' or 'Candidate'.
// The JSON should be in the format:
// {
//   "conversation": [
//     {
//       "speaker": "AI_HR",
//       "text": "Hello, how are you?"
//     },
//     {
//       "speaker": "Candidate",
//       "text": "I'm good, thank you."
//     }
//   ]
// }

// **Raw Conversation:**
// ${transcription}
//         `;

//         const response = await axios.post(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
//             {
//                 contents: [{ parts: [{ text: prompt }] }]
//             },
//             {
//                 headers: { "Content-Type": "application/json" }
//             }
//         );

//         console.log("✅ Gemini API Response:", response.data);

//         let rawContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
//         rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

//         return JSON.parse(rawContent);
//     } catch (error) {
//         console.error("❌ Error structuring conversation:", error.message);
//         return { conversation: [] };
//     }
// };

// 🎯 Main GET route
router.get("/", async (req, res) => {
    try {
        // 📞 Get latest call from Bland
        const blandRes = await axios.get("https://api.bland.ai/v1/calls", {
            headers: {
                authorization: process.env.BLAND_API_KEY
            }
        });

        const call = blandRes.data?.calls?.[1]; // latest call (use [4] if you want specific one)

        if (!call?.recording_url) {
            return res.status(404).json({ error: "Recording URL not found in the Bland API response." });
        }

        const filePath = path.join("recordings", `${call.call_id}.mp3`);
        const writer = fs.createWriteStream(filePath);

        // 🎧 Download audio
        const audioRes = await axios({
            url: call.recording_url,
            method: "GET",
            responseType: "stream"
        });

        audioRes.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        const audioStream = fs.createReadStream(filePath);
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(audioStream, {
            model: "nova-3",
            smart_format: true
        });

        console.log("✅ Transcription Result:", result);

        // fs.unlink(filePath, (err) => {
        //     if (err) console.warn("⚠️ Could not delete file:", err.message);
        // });

        if (error) throw error;

        let finalcall=JSON.stringify(result, null, 2)

        console.log(JSON.stringify(result, null, 2));


        res.json({
            call_id: call.call_id,
            structured_conversation: result
        });

    } catch (err) {
        console.error("❌ Error:", err.message);
        res.status(500).json({
            error: "Something went wrong",
            details: err.message
        });
    }
});

module.exports = router;


// const express = require("express");
// const fs = require("fs");
// const path = require("path");
// const axios = require("axios");
// const { createClient } = require("@deepgram/sdk");
// require("dotenv").config();

// const router = express.Router();
// const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// // 🎯 Main GET route
// router.get("/", async (req, res) => {
//     try {
//         // 📞 Get latest call from Bland
//         const blandRes = await axios.get("https://api.bland.ai/v1/calls", {
//             headers: {
//                 authorization: process.env.BLAND_API_KEY
//             }
//         });

//         const call = blandRes.data?.calls?.[4];
//         console.log(blandRes.data?.calls?.length);

//         // if (!call?.recording_url) {
//         //     return res.status(404).json({ error: "Recording URL not found in the Bland API response." });
//         // }

//         // 💾 Save as abc123.mp3
//         const filePath = path.join("recordings", `${call.call_id}.mp3`);
        
//         const writer = fs.createWriteStream(filePath);

//         // 🎧 Download audio
//         const audioRes = await axios({
//             url: call.recording_url,
//             method: "GET",
//             responseType: "stream"
//         });

//         audioRes.data.pipe(writer);

//         await new Promise((resolve, reject) => {
//             writer.on("finish", resolve);
//             writer.on("error", reject);
//         });

//         const audioStream = fs.createReadStream(filePath);
//         const { result, error } = await deepgram.listen.prerecorded.transcribeFile(audioStream, {
//             model: "nova-3",
//             smart_format: true
//         });

//         console.log("✅ Transcription Result:", result);

//         // 🧹 Delete file after transcription
//         fs.unlink(filePath, (err) => {
//             if (err) console.warn("⚠️ Could not delete file:", err.message);
//         });

//         res.json({
//             call_id: call.call_id,
//             structured_conversation: result
//         });

//     } catch (err) {
//         console.error("❌ Error:", err.message);
//         res.status(500).json({
//             error: "Something went wrong",
//             details: err.message
//         });
//     }
// });

// module.exports = router;
