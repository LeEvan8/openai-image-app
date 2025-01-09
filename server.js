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
Task: For each category, calculate 'Score' according to each weight (If unable to detect from image, take out said category). Each category Weight: Ceilings and Walls: 15, Windows and Glass: 15, Seats and Upholstery: 20, Floors: 20, Rubbish and Debris: 10, Driver's, Area: 10, Stairs: 5, High-Touch Areas: 5.
Respond ONLY in the following format, replacing [Score] with the calculated values, do not write anything extra:

Ceilings and Walls: [Score]
Windows and Glass: [Score]
Seats and Upholstery: [Score]
Floors: [Score]
Rubbish and Debris: [Score]
Driver's Area: [Score]
Stairs: [Score]
High-Touch Areas: [Score]

Output example:
Ceilings and Walls: [15]
Windows and Glass: [10]
Seats and Upholstery: [6.67]
Floors: [20]
Rubbish and Debris: [6.67]
Driver's Area: [10]
Stairs: [1.67]
High-Touch Areas: [3.33]
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