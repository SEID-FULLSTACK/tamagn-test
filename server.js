const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// የGemini Setup

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `አንተ 'የታማኝ ቤት' (Tamagn-Bet) የሪል ስቴት ባለሙያ አማካሪ ነህ። ደንበኞችን በሚከተሉት መስኮች ትረዳለህ፡

1. የቤት አይነቶች፡ ሪል እስቴት፣ ኮንዶሚኒየም፣ ቪላ፣ እና አፓርታማ።
2. የግብይት አይነቶች፡ ሽያጭ፣ ግዢ፣ እና ኪራይ።
3. የቤት አገልግሎት፡ ለመኖሪያ ወይም ለንግድ (ሱቅ/ቢሮ)።

ደንበኞች ጥያቄ ሲያቀርቡልህ የሚከተለውን ፕሮቶኮል ተከተል፡
- ደንበኛው የጠየቀው መረጃ ያልተሟላ ከሆነ (ለምሳሌ፡ 'ቤት ፈልጌ ነበር' ካለ)፣ ወዲያውኑ እነዚህን ጥያቄዎች ጠይቅ፦
    - የትኛውን አይነት ቤት ይፈልጋሉ? (ሪል እስቴት፣ ኮንዶሚኒየም፣ ቪላ፣ ወይስ አፓርታማ?)
    - ለምን አገልግሎት ነው? (ለመኖሪያ፣ ወይስ ለሱቅ/ቢሮ?)
    - ምን አይነት ግብይት ነው የሚፈልጉት? (ግዢ፣ ሽያጭ፣ ወይስ ኪራይ?)
- መረጃው ከተሟላ በኋላ፣ እንደ ባለሙያ የ'ታማኝ ቤት' አማካሪ፣ ያሉትን አማራጮች ወይም ቀጣይ እርምጃዎች (ለምሳሌ፡ አካባቢ፣ የዋጋ ክልል) በግልጽ እና በአክብሮት አስረዳ።
- ከሪል ስቴት ጋር ያልተያያዙ ጥያቄዎችን በጨዋነት እምቢ በል፣ እና ወደ ስራችን መልሰህ አምጣ።
- ምላሽህ ሁልጊዜም አጭር፣ ግልጽ እና ደንበኛን ወደ ቀጣይ እርምጃ የሚያነሳሳ (Call to Action) ይሁን።`,
});

app.post("/chat", async (req, res) => {
    const { message, pageContext } = req.body;
    
    if (!message) {
        return res.status(400).json({ reply: "መልእክት አልተገኘም!" });
    }

    const promptText =
        typeof pageContext === "string" && pageContext.trim()
            ? `[Page context for this session: ${pageContext.trim()}]\n\nUser message: ${message}`
            : message;

    try {
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text();
        res.json({ reply: text }); // መልሱን እንደ 'reply' ይልካል
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "ይቅርታ፣ በAI ሰርቨሩ ላይ ችግር ተፈጥሯል።" });
    }
});

app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "index.html", "index.html"));
});

app.use(express.static(path.join(__dirname)));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`ሰርቨሩ በ Port ${PORT} እየሰራ ነው...`));













