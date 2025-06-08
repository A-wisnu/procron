const express = require('express');
const fs = require('fs').promises;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let genAI;

async function initializeAI() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // Fallback for local development if apikey.txt exists
            try {
                const data = await fs.readFile('apikey.txt', 'utf8');
                const lines = data.split('\n');
                const apiKeyLine = lines.find(line => line.startsWith('api_key:'));
                if (apiKeyLine) {
                    genAI = new GoogleGenerativeAI(apiKeyLine.split(':')[1].trim());
                    console.log("Initialized AI with apikey.txt for local development.");
                    return;
                }
            } catch (fsError) {
                // Ignore if apikey.txt doesn't exist, the main error will be thrown
            }
            throw new Error("GEMINI_API_KEY environment variable not found.");
        }
        
        genAI = new GoogleGenerativeAI(apiKey);
        console.log("Initialized AI with environment variable.");

    } catch (error) {
        console.error("Error initializing GoogleGenerativeAI:", error.message);
        // Do not exit the process in a serverless environment
    }
}

app.post('/generate', async (req, res) => {
    if (!genAI) {
        return res.status(500).json({ error: 'AI is not initialized' });
    }

    const { topic, language } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
    }

    const langMap = {
        'id': 'Indonesian',
        'en': 'English'
    };
    const targetLanguage = langMap[language] || 'Indonesian';

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: `You are an intelligent assistant. Your primary task is to generate a pro/con list for any given topic. All of your output, without exception, must be in this language: ${targetLanguage}.`
        });

        const prompt = `Analyze this topic: "${topic}".
Your entire response must be a single valid JSON object, with no extra text or markdown.
The JSON structure must be:
{
  "isProduct": <boolean>,
  "productSearchTerm": "<string>",
  "pros": ["<string>", "..."],
  "cons": ["<string>", "..."],
  "priceComparisons": [
    {"store": "<Store Name>", "price": "<Price (string)>"},
    ...
  ]
}
- "isProduct": true if the topic is a purchasable product, otherwise false.
- "productSearchTerm": If isProduct is true, provide a clear product name. Otherwise, an empty string.
- "pros": An array of strings with the product's advantages.
- "cons": An array of strings with the product's disadvantages.
- "priceComparisons": If isProduct is true, provide 3 sample price comparisons from relevant online stores. If it's not a product, provide an empty array [].`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("--- AI Raw Response ---");
        console.log(text);
        console.log("-----------------------");
        
        // Clean the response to make sure it's valid JSON
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let aiResponse;
        try {
            aiResponse = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", e);
            console.error("Cleaned Text:", cleanedText);
            // Send an error response to the client
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }
        
        console.log("--- Parsed AI Response ---");
        console.log(aiResponse);
        console.log("--------------------------");

        let shoppingLink = null;
        if (aiResponse.isProduct && aiResponse.productSearchTerm) {
            const searchTerm = encodeURIComponent(aiResponse.productSearchTerm);
            shoppingLink = `https://www.google.com/search?tbm=shop&q=${searchTerm}`;
        }

        const finalResponse = {
            pros: aiResponse.pros,
            cons: aiResponse.cons,
            priceComparisons: aiResponse.priceComparisons || [],
            shoppingLink: shoppingLink
        };
        
        console.log("--- Final Response to Client ---");
        console.log(finalResponse);
        console.log("--------------------------------");

        res.json(finalResponse);
    } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

initializeAI().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}); 