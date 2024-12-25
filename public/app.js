document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const questionInput = document.getElementById('question');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const responseContainer = document.getElementById('responseContainer');
    const responseText = document.getElementById('responseText');
    const usageInfo = document.getElementById('usageInfo');
    
    let base64Image = '';
    
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                base64Image = e.target.result.split(',')[1];
            };
            reader.readAsDataURL(file);
        }
    });
    
    analyzeBtn.addEventListener('click', async () => {
        if (!base64Image) {
            alert('Please select an image first');
            return;
        }
        
        const question = questionInput.value.trim();
        if (!question) {
            alert('Please enter a question');
            return;
        }
        
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
        
        try {
            const response = await axios.post('/analyze', {
                image: base64Image,
                question: question
            });
            const messageContent = response.data.choices[0].message.content;
            const usage = response.data.usage;
            
            responseText.textContent = messageContent;
            usageInfo.innerHTML = `
                <p>Prompt Tokens: ${usage.prompt_tokens}</p>
                <p>Completion Tokens: ${usage.completion_tokens}</p>
                <p>Total Tokens: ${usage.total_tokens}</p>
            `;
            
            responseContainer.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            alert('Error analyzing image. Please check console for details.');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analyze Image';
        }
    });
});