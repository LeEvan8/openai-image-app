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
const ANALYSIS_PROMPT = `
Analyze the uploaded image of the interior of a public bus to detect visible cleanliness and dirtiness. Focus on the following categories:  
1. **Dust**: Includes visible dust or dirt on surfaces such as seats, floors, and walls.  
2. **Trash**: Visible waste items such as wrappers, cans, bottles, or papers.  
3. **Leaves**: Includes any foliage or natural debris.  
4. **Liquid Spills**: Includes visible liquid stains, puddles, or wet areas.  
5. **Non-dirty Items**: Objects such as personal belongings, signage, or functional items (not dirt-related).  
6. **Other Relevant Observations**: Includes anything else affecting the cleanliness (e.g., graffiti, stains, or broken items).


Analyze this bus interior image and provide two analyses:
1.	Item Count (exact numbers):
o	Dust:
o	Trash:
o	Leaves:
o	Liquid Spills:
o	Other Dirty Items:
o	Non-dirty Items:
2.	Cleanliness Analysis and Scoring:
For each category, rank the cleanliness on a scale from 3 to 1:
o	3: Freshly cleaned with no visible stains, smudges, or debris.
o	2: Acceptable cleanliness with minor stains, smudges, or debris visible upon close inspection.
o	1: Obvious dirt, smudges, buildup, or other cleanliness issues visible.
Category Scores Calculation: Use the formula:
Category Score = (Given Score / 3) × Weight
Categories and Weights:
o	Ceilings and Walls: 15%
o	Windows and Glass: 15%
o	Seats and Upholstery: 20%
o	Floors: 20%
o	Rubbish and Debris: 10%
o	Driver's Area: 10%
o	Stairs: 5%
o	High-Touch Areas: 5%
Output Format:
Respond ONLY with the following format exactly (no additional text):
Item Count:
Dust: [Count]
Trash: [Count]
Leaves: [Count]
Liquid Spills: [Count]
Other Dirty Items: [Count]
Non-dirty Items: [Count]


`;

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