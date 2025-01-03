document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const responseContainer = document.getElementById('responseContainer');
    const responseText = document.getElementById('responseText');
    
    let cleanlinessBarChart, cleanlinessPieChart;

    // Add canvas elements for the charts
    const barChartCanvas = document.createElement('canvas');
    barChartCanvas.id = 'cleanlinessBarChart';
    const pieChartCanvas = document.createElement('canvas');
    pieChartCanvas.id = 'cleanlinessPieChart';
    responseContainer.appendChild(barChartCanvas);
    responseContainer.appendChild(pieChartCanvas);

    function createBarChart(labels, data) {
        const ctx = document.getElementById('cleanlinessBarChart').getContext('2d');
        cleanlinessBarChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cleanliness Metrics',
                    data: data,
                    backgroundColor: [
                        '#FF3784',
                        '#36A2EB',
                        '#4BC0C0',
                        '#F77825',
                        '#9966FF',
                        '#1C1949'
                    ],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Category'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Score'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function createPieChart(labels, data) {
        const ctx = document.getElementById('cleanlinessPieChart').getContext('2d');
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
                        '#1C1949'
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

                const data = result.choices[0]?.message?.content;

                // Parse OpenAI's response
                const itemCounts = {};
                const categoryScores = {};
                const totalScoreMatch = data.match(/Total Cleanliness Score:\s+([\d.]+)/);
                const totalScore = totalScoreMatch ? parseFloat(totalScoreMatch[1]) : 0;

                // Extract item counts
                const itemCountRegex = /(\w+):\s+(\d+)/g;
                let match;
                while ((match = itemCountRegex.exec(data))) {
                    itemCounts[match[1]] = parseInt(match[2], 10);
                }

                // Extract category scores
                const categoryScoreRegex = /(\w+(?:\s\w+)*):\s+([\d.]+)/g;
                while ((match = categoryScoreRegex.exec(data))) {
                    categoryScores[match[1]] = parseFloat(match[2]);
                }

                // Reset existing charts
                if (cleanlinessBarChart) cleanlinessBarChart.destroy();
                if (cleanlinessPieChart) cleanlinessPieChart.destroy();

                // Update charts dynamically
                const labels = Object.keys(itemCounts);
                const counts = Object.values(itemCounts);
                createBarChart(labels, counts);
                createPieChart(labels, counts);

                responseText.textContent = `Analysis Complete: Total Cleanliness Score: ${totalScore}`;
            } catch (error) {
                responseText.textContent = 'Error analyzing image. Please try again.';
                console.error(error);
            }
        };

        reader.readAsDataURL(file);
    });
});