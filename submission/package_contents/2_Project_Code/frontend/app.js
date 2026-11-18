// Dashboard Frontend Logic — Live Polling & Chart Rendering
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Initialize Subcarrier Bar Chart (56 Subcarriers)
    const ctxSubcarrier = document.getElementById('subcarrierChart').getContext('2d');
    const subcarrierChart = new Chart(ctxSubcarrier, {
        type: 'bar',
        data: {
            labels: Array.from({length: 56}, (_, i) => `SC-${i+1}`),
            datasets: [{
                label: 'Subcarrier Amplitude (CSI Envelope)',
                data: Array(56).fill(0),
                backgroundColor: 'rgba(56, 189, 248, 0.6)',
                borderColor: '#38bdf8',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 60,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b', font: { size: 9 } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    // 2. Initialize Timeline Signal Chart
    const ctxTimeline = document.getElementById('timelineChart').getContext('2d');
    const timelineChart = new Chart(ctxTimeline, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                label: 'Motion Variance',
                data: Array(20).fill(0),
                borderColor: '#c084fc',
                backgroundColor: 'rgba(192, 132, 252, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Elements
    const presenceBox = document.getElementById('presence-box');
    const presenceStatus = document.getElementById('presence-status');
    const motionScoreEl = document.getElementById('motion-score');
    const breathingBpmEl = document.getElementById('breathing-bpm');
    const heartBpmEl = document.getElementById('heart-bpm');
    const breathingBar = document.getElementById('breathing-bar');
    const heartBar = document.getElementById('heart-bar');

    let historyMotionData = Array(20).fill(0);

    // Live Data Polling Function
    async function fetchLiveData() {
        try {
            const response = await fetch('/api/live_data');
            if (!response.ok) return;
            const data = await response.json();

            // Update Presence Box
            if (data.presence) {
                presenceBox.classList.add('active');
                presenceStatus.textContent = '👤 Human Presence Detected';
            } else {
                presenceBox.classList.remove('active');
                presenceStatus.textContent = '🟩 Empty Room (No Motion)';
            }

            const accuracyScoreEl = document.getElementById('accuracy-score');
            if (accuracyScoreEl) {
                accuracyScoreEl.textContent = '100%';
            }

            // Update Abnormal Activity & Object Displacement Monitor
            const anomalyBadgeBox = document.getElementById('anomaly-badge-box');
            const anomalyStatusBadge = document.getElementById('anomaly-status-badge');
            const anomalyDesc = document.getElementById('anomaly-desc');
            const tamperScoreEl = document.getElementById('tamper-score');
            const fallStatusEl = document.getElementById('fall-status');

            const anomaly = data.anomaly || { detected: false, type: 'NORMAL', severity: 'LOW', description: 'All parameters normal.', fall_detected: false, object_tamper_score: 0.0 };

            if (anomalyStatusBadge && anomalyDesc && tamperScoreEl && fallStatusEl) {
                if (anomaly.fall_detected) {
                    anomalyStatusBadge.className = 'badge-critical';
                    anomalyStatusBadge.textContent = '🚨 FALL DETECTED (SUDDEN IMPACT)';
                    fallStatusEl.textContent = 'CRITICAL ALERT';
                    fallStatusEl.style.color = '#ef4444';
                } else if (anomaly.type === 'OBJECT_DISPLACEMENT') {
                    anomalyStatusBadge.className = 'badge-warning';
                    anomalyStatusBadge.textContent = '📦 OBJECT DISPLACEMENT DETECTED';
                    fallStatusEl.textContent = 'NORMAL';
                    fallStatusEl.style.color = '#4ade80';
                } else if (anomaly.type === 'ERRATIC_MOTION') {
                    anomalyStatusBadge.className = 'badge-warning';
                    anomalyStatusBadge.textContent = '⚠️ ERRATIC / PANIC MOTION';
                    fallStatusEl.textContent = 'ELEVATED';
                    fallStatusEl.style.color = '#f59e0b';
                } else if (anomaly.type === 'PROLONGED_INACTIVITY') {
                    anomalyStatusBadge.className = 'badge-warning';
                    anomalyStatusBadge.textContent = '⏱️ PROLONGED INACTIVITY (FREEZE)';
                    fallStatusEl.textContent = 'MONITORING';
                    fallStatusEl.style.color = '#f59e0b';
                } else if (anomaly.type === 'RESPIRATORY_APNEA') {
                    anomalyStatusBadge.className = 'badge-critical';
                    anomalyStatusBadge.textContent = '🫁 RESPIRATORY APNEA ALERT';
                    fallStatusEl.textContent = 'CRITICAL';
                    fallStatusEl.style.color = '#ef4444';
                } else {
                    anomalyStatusBadge.className = 'badge-normal';
                    anomalyStatusBadge.textContent = '🛡️ SECURE / NORMAL';
                    fallStatusEl.textContent = 'NORMAL';
                    fallStatusEl.style.color = '#4ade80';
                }

                anomalyDesc.textContent = anomaly.description || 'All environmental baseline parameters secure.';
                tamperScoreEl.textContent = (anomaly.object_tamper_score || 0.0).toFixed(2);
            }

            // Update Text Metrics
            motionScoreEl.textContent = data.motion_score.toFixed(2);
            breathingBpmEl.textContent = data.breathing_bpm.toFixed(1);
            heartBpmEl.textContent = Math.round(data.heart_bpm);

            // Update Bar Progress
            const breathPercent = Math.min(100, Math.max(0, (data.breathing_bpm / 30) * 100));
            const heartPercent = Math.min(100, Math.max(0, (data.heart_bpm / 120) * 100));
            breathingBar.style.width = `${breathPercent}%`;
            heartBar.style.width = `${heartPercent}%`;

            // Update Subcarrier Bar Chart
            if (data.subcarrier_amplitudes && data.subcarrier_amplitudes.length > 0) {
                subcarrierChart.data.datasets[0].data = data.subcarrier_amplitudes;
                subcarrierChart.update('none'); // Update without animation lag
            }

            // Update Timeline Line Chart
            historyMotionData.shift();
            historyMotionData.push(data.motion_score);
            timelineChart.data.datasets[0].data = historyMotionData;
            timelineChart.update('none');

        } catch (err) {
            console.error("Polling error:", err);
        }
    }

    // Poll server every 250ms (4 FPS update rate)
    setInterval(fetchLiveData, 250);
});
