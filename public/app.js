document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const responseContainer = document.getElementById('responseContainer');
    const responseText = document.getElementById('responseText');
    
    let cleanlinessBarChart;
    let cleanlinessPieChart;

    // Create container for charts
    const chartsContainer = document.createElement('div');
    chartsContainer.id = 'chartsContainer';
    chartsContainer.style.width = '100%';
    responseContainer.appendChild(chartsContainer);

    // Create and append canvas elements
    const barChartCanvas = document.createElement('canvas');
    barChartCanvas.id = 'cleanlinessBarChart';
    chartsContainer.appendChild(barChartCanvas);

    const pieChartCanvas = document.createElement('canvas');
    pieChartCanvas.id = 'cleanlinessPieChart';
    chartsContainer.appendChild(pieChartCanvas);

    // Parse OpenAI response text into chart data
    function parseAnalysisResponse(responseText) {
        console.log('Raw response text:', responseText);
        
        const lines = responseText.trim().split('\n');
        console.log('Split lines:', lines);
        
        const scoreData = {
            labels: [],
            data: []
        };
        const countData = {
            labels: [],
            data: []
        };
        
        let processingScores = true;
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;
            
            // Split by colon and clean up the parts
            let [category, valueStr] = trimmedLine.split(':').map(part => part.trim());
            
            // Remove brackets from the value and convert to number
            valueStr = valueStr.replace(/[\[\]]/g, '').trim();
            const value = parseFloat(valueStr);
            
            if (isNaN(value)) {
                console.log(`Skipping invalid line: ${line}`);
                return;
            }
            
            // Switch to processing counts after we've handled all scores
            if (category === 'Dust') {
                processingScores = false;
            }
            
            if (processingScores) {
                scoreData.labels.push(category);
                scoreData.data.push(value);
            } else {
                countData.labels.push(category);
                countData.data.push(value);
            }
        });
        
        console.log('Parsed Score Data:', scoreData);
        console.log('Parsed Count Data:', countData);
        
        return { scoreData, countData };
    }

    function createBarChart(labels, actualData) {
        const canvas = document.getElementById('cleanlinessBarChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
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

    function createPieChart(labels, data) {
        console.log('Creating pie chart with:', { labels, data }); // Debug log
        const canvas = document.getElementById('cleanlinessPieChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        if (cleanlinessPieChart) {
            cleanlinessPieChart.destroy();
        }
    
        // Only create chart if we have data
        if (labels.length === 0 || data.length === 0) {
            console.log('No data for pie chart');
            return;
        }
    
        cleanlinessPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF3784',
                        '#36A2EB',
                        '#4BC0C0',
                        '#F77825',
                        '#9966FF',
                        '#1C1949',
                        '#FF9F40',
                        '#4BC0C0'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            font: {
                                size: 14
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Issue Occurrence Distribution'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.formattedValue;
                                return `${label}: ${value} occurrences`;
                            }
                        }
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

    // Update the analyze button click handler
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
                console.log('Raw API response:', result);

                if (result.error) {
                    responseText.textContent = `Error: ${result.error}`;
                    return;
                }

                const analysisText = result.choices[0]?.message?.content;
                if (!analysisText) {
                    throw new Error('Invalid response format');
                }

                console.log('OpenAI response content:', analysisText);

                const { scoreData, countData } = parseAnalysisResponse(analysisText);
                
                console.log('Final Score Data:', scoreData);
                console.log('Final Count Data:', countData);
                
                if (scoreData.labels.length > 0) {
                    createBarChart(scoreData.labels, scoreData.data);
                } else {
                    console.log('No score data available for bar chart');
                }
                
                if (countData.labels.length > 0) {
                    createPieChart(countData.labels, countData.data);
                } else {
                    console.log('No count data available for pie chart');
                }

                responseText.textContent = 'Analysis Complete';
            } catch (error) {
                responseText.textContent = 'Error analyzing image. Please try again.';
                console.error('Analysis error:', error);
            }
        };
        reader.readAsDataURL(file);
    });
});