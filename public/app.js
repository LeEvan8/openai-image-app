document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const responseContainer = document.getElementById('responseContainer');
    const responseText = document.getElementById('responseText');
    
    let cleanlinessBarChart;

    // Add canvas element for the chart
    const barChartCanvas = document.createElement('canvas');
    barChartCanvas.id = 'cleanlinessBarChart';
    responseContainer.appendChild(barChartCanvas);

    // Parse OpenAI response text into chart data
    function parseAnalysisResponse(responseText) {
        const lines = responseText.split('\n');
        const data = [];
        const labels = [];
        
        lines.forEach(line => {
            if (line.trim()) {
                const [category, score] = line.split(': ');
                labels.push(category);
                data.push(parseFloat(score));
            }
        });
        
        return { labels, data };
    }

    function createBarChart(labels, actualData) {
        const ctx = document.getElementById('cleanlinessBarChart').getContext('2d');
        if (cleanlinessBarChart) {
            cleanlinessBarChart.destroy();
        }

        // Define ideal weightage data
        const idealData = {
            'Ceilings and Walls': 15,
            'Windows and Glass': 15,
            'Seats and Upholstery': 20,
            'Floors': 20,
            'Rubbish and Debris': 10,
            'Driver\'s Area': 10,
            'Stairs': 5,
            'High-Touch Areas': 5
        };

        const idealWeightage = labels.map(label => idealData[label] || 0);
        
        cleanlinessBarChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Actual Score',
                    data: actualData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Ideal Weightage',
                    data: idealWeightage,
                    backgroundColor: 'rgba(192, 75, 192, 0.2)',
                    borderColor: 'rgba(192, 75, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 20,
                        title: {
                            display: true,
                            text: 'Score (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Category'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Cleanliness Analysis Results'
                    }
                }
            }
        });
    }

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    analyzeBtn.addEventListener('click', async () => {
        const file = imageInput.files[0];
        if (!file) {
            responseText.textContent = 'Please upload an image first!';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = e.target.result.split(',')[1];

            responseText.textContent = 'Analyzing image...';
            responseContainer.style.display = 'block';

            try {
                const res = await fetch('/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ image: base64Image })
                });

                const result = await res.json();

                if (result.error) {
                    responseText.textContent = `Error: ${result.error}`;
                    return;
                }

                const analysisText = result.choices[0]?.message?.content;
                if (!analysisText) {
                    throw new Error('Invalid response format');
                }

                const { labels, data } = parseAnalysisResponse(analysisText);
                createBarChart(labels, data);

                responseText.textContent = 'Analysis Complete';
            } catch (error) {
                responseText.textContent = 'Error analyzing image. Please try again.';
                console.error(error);
            }
        };
        reader.readAsDataURL(file);
    });
});