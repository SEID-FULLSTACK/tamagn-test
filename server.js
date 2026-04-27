const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors()); // Frontend ከሰርቨሩ ጋር እንዲገናኝ ይፈቅዳል
app.use(express.json()); // የ JSON መረጃን ለመቀበል

// የGemini Setup

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

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
- ምላሽህ ሁልጊዜም አጭር፣ ግልጽ እና ደንበኛን ወደ ቀጣይ እርምጃ የሚያነሳሳ (Call to Action) ይሁን።`
});
// የቻት Endpoint
app.post('/chat', async (req, res) => {
    const { message } = req.body; // Frontend ከሚልከው 'message' ጋር ይዛመዳል
    
    if (!message) {
        return res.status(400).json({ reply: "መልእክት አልተገኘም!" });
    }

    try {
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();
        res.json({ reply: text }); // መልሱን እንደ 'reply' ይልካል
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "ይቅርታ፣ በAI ሰርቨሩ ላይ ችግር ተፈጥሯል።" });
    }
});

app.listen(5000, () => console.log('ሰርቨሩ በ Port 5000 እየሰራ ነው...'));













