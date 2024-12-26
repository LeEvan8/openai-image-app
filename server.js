const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error', 
        message: err.message 
    });
});

const ANALYSIS_PROMPT = `Analyze the cleanliness of the provided image and rank it for each category below on a scale from 3 to 1:
3: Freshly cleaned with no visible stains, smudges, or debris.
2: Acceptable cleanliness with minor stains, smudges, or debris visible upon close inspection.
1: Obvious dirt, smudges, buildup, or other cleanliness issues visible.

For each category, calculate the Category Score as a percentage using the formula:
Category Score = (Given Score / 3) × Weight

Categories and Weights:
Ceilings and Walls: 15%
Windows and Glass: 15%
Seats and Upholstery: 20%
Floors: 20%
Rubbish and Debris: 10%
Driver's Area: 10%
Stairs: 5%
High-Touch Areas: 5%

Output the results as follows:
Category Scores (percentages):
Ceilings and Walls: [Score]%
Windows and Glass: [Score]%
Seats and Upholstery: [Score]%
Floors: [Score]%
Rubbish and Debris: [Score]%
Driver's Area: [Score]%
Stairs: [Score]%
High-Touch Areas: [Score]%
Total Cleanliness Score: [Score]%

Note: If any category is not visible in the image, default to a score of 2 for that category. Keep the response concise.`;

app.post('/analyze', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ 
                error: 'Missing image data' 
            });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ 
                error: 'OpenAI API key not configured' 
            });
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: ANALYSIS_PROMPT},
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${image}`,
                                detail: "auto"
                            }
                        }
                    ]
                }
            ],
            max_tokens: 2000
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Detailed error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to analyze image',
            details: error.response?.data || error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("http://localhost:3000/")
});