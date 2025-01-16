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

const ANALYSIS_PROMPT = `You have two tasks:

1. For each category, calculate the 'Score' based on the weight:
Ceilings and Walls: 15
Windows and Glass: 15
Seats and Upholstery: 20
Floors: 20
Rubbish and Debris: 10
Driver's Area: 10
Stairs: 5
High-Touch Areas: 5

2. For each category, calculate item 'Count' (exact number) of:
Dust: Visible fine particles
Leaves/Stem/Petals: Visible plant parts
Liquid Spills: Any liquid on surfaces
Graffiti: Written or drawn markings
Stain: Permanent discoloration
Rubbish/Trash: Loose waste materials
Other Dirty Items: Chewing gum, glue, sticker stains
Non-dirty Items: Personal belongings, signage, functional items

Rules:
Count each occurrence of dirty and non-dirty items.
If no items are detected for a category, assign [0] as the count.
Ensure all categories appear in the output, even if counts or scores are 0.
Classify each item into only one category.
If an item fits multiple categories, prioritize as follows:
Dust > Leaves/Stem/Petals > Liquid Spills > Stain > Other Dirty Items.

Respond ONLY in the following format:
Ceilings and Walls: [Score]
Windows and Glass: [Score]
Seats and Upholstery: [Score]
Floors: [Score]
Rubbish and Debris: [Score]
Driver's Area: [Score]
Stairs: [Score]
High-Touch Areas: [Score]
Dust: [Count]
Leaves/Stem/Petals: [Count]
Liquid Spills: [Count]
Graffiti: [Count]
Stain: [Count]
Rubbish/Trash: [Count]
Other Dirty Items: [Count]
Non-dirty Items: [Count]`;

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
        
        console.log('Sending request to OpenAI...');
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",  // Fixed model name
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: ANALYSIS_PROMPT },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${image}`,
                                detail: "high"
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
        
        console.log('OpenAI Response:', response.data);
        
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
    console.log("http://localhost:3000/");
});