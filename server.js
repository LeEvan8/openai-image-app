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

const ANALYSIS_PROMPT = `Analyze the uploaded image of the interior of a public bus to detect visible cleanliness and dirtiness. Focus on the following categories:  
1. **Dust**: Includes visible dust or dirt on surfaces such as seats, floors, and walls.  
2. **Trash**: Visible waste items such as wrappers, cans, bottles, or papers.  
3. **Leaves**: Includes any foliage or natural debris.  
4. **Liquid Spills**: Includes visible liquid stains, puddles, or wet areas.  
5. **Non-dirty Items**: Objects such as personal belongings, signage, or functional items (not dirt-related).  
6. **Other Relevant Observations**: Includes anything else affecting the cleanliness (e.g., graffiti, stains, or broken items).

**Output Requirements:**
- Display a **pie chart** on the left side showing the percentage breakdown of each detected category, using distinct and contrasting colors for each category.  
- Provide a **text breakdown** on the right side with the percentage of each category and a brief note for each (e.g., 'Trash: 35% - Includes wrappers and plastic bottles found mostly near seats').  
- Ensure the output highlights critical cleanliness concerns, like high percentages of trash, liquid spills, or dust.`;

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