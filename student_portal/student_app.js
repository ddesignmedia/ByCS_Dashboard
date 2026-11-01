let globalData = null;
let currentStudentChart = null;
let currentRoom = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check for room in URL
    const urlParams = new URLSearchParams(window.location.search);
    currentRoom = urlParams.get('room');

    // Setup login button
    document.getElementById('btn-login').addEventListener('click', handleLogin);
    document.getElementById('code-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Setup info toggle
    const btnInfo = document.getElementById('btn-info');
    if (btnInfo) {
        btnInfo.addEventListener('click', () => {
            const infoBox = document.getElementById('info-box');
            if (infoBox.style.display === 'none' || infoBox.style.display === '' || infoBox.classList.contains('hidden')) {
                infoBox.style.display = 'block';
                infoBox.classList.remove('hidden');
                btnInfo.style.background = 'var(--primary)';
                btnInfo.style.color = 'white';
                btnInfo.style.borderColor = 'var(--primary)';
            } else {
                infoBox.style.display = 'none';
                infoBox.classList.add('hidden');
                btnInfo.style.background = 'transparent';
                btnInfo.style.color = 'var(--text-main)';
                btnInfo.style.borderColor = 'var(--border)';
            }
        });
    }

    // Setup logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        document.getElementById('code-input').value = '';
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('dashboard-screen').classList.add('hidden');
        document.getElementById('login-error').classList.add('hidden');
        
        // Hide gamification card
        const gCard = document.getElementById('gamification-card');
        if (gCard) {
            gCard.classList.add('hidden');
            gCard.style.display = 'none';
        }
        
        globalData = null; // Reset data on logout so a different room can be fetched
    });

    // Check for theme pref
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Setup Tests vs Lernpakete toggle
    const btnStuTests = document.getElementById('student-view-tests');
    const btnStuLernpakete = document.getElementById('student-view-lernpakete');
    if (btnStuTests && btnStuLernpakete) {
        btnStuTests.addEventListener('click', () => {
            btnStuTests.classList.add('active');
            btnStuLernpakete.classList.remove('active');
            
            document.getElementById('tests-analysis-list').classList.remove('hidden');
            document.getElementById('lernpakete-analysis-list').classList.add('hidden');
        });
        btnStuLernpakete.addEventListener('click', () => {
            btnStuLernpakete.classList.add('active');
            btnStuTests.classList.remove('active');
            
            document.getElementById('tests-analysis-list').classList.add('hidden');
            document.getElementById('lernpakete-analysis-list').classList.remove('hidden');
        });
    }
});

async function handleLogin() {
    const code = document.getElementById('code-input').value.trim().toUpperCase();

    if (!code) return;
    
    if (!currentRoom) {
        const errEl = document.getElementById('login-error');
        errEl.textContent = "Kein Raumcode gefunden. Bitte nutze den vollständigen Link (oder QR-Code) deines Lehrers.";
        errEl.classList.remove('hidden');
        return;
    }

    try {
        // Fetch data if not already loaded
        if (!globalData) {
            const isLocal = window.location.protocol === 'file:';
            const dataUrl = isLocal ? `data_${currentRoom}.json` : `data_${currentRoom}.json?t=${Date.now()}`;
            
            const response = await fetch(dataUrl);
            if (!response.ok) throw new Error("Netzwerkfehler");
            globalData = await response.json();
        }

        // Find the student's class and data based on the code
        let foundClass = null;
        let foundStudentKey = null;
        
        for (const cls of globalData.classes) {
            // New format: validCodes array
            if (cls.validCodes && cls.validCodes.includes(code)) {
                foundClass = cls;
                foundStudentKey = code;
                break;
            } 
            // Old format: studentCodes object
            else if (cls.studentCodes) {
                const entries = Object.entries(cls.studentCodes);
                const match = entries.find(([key, val]) => val === code);
                if (match) {
                    foundClass = cls;
                    foundStudentKey = code; // Change to use code as the key
                    break;
                }
            }
        }

        if (foundClass && foundStudentKey) {
            document.getElementById('login-error').classList.add('hidden');
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('dashboard-screen').classList.remove('hidden');
            
            renderStudentDashboard(foundClass, foundStudentKey, code);
        } else {
            document.getElementById('login-error').classList.remove('hidden');
        }
    } catch (e) {
        console.error("Fehler beim Laden der Daten:", e);
        const errEl = document.getElementById('login-error');
        errEl.textContent = "Fehler beim Laden der Daten. Die Datei 'student_data.json' wurde nicht gefunden.";
        errEl.classList.remove('hidden');
    }
}

function renderStudentDashboard(cls, studentKey, code) {
    document.getElementById('class-title').textContent = cls.name;
    document.getElementById('student-title').textContent = `Dashboard für Code ${code}`;

    // Collect student stats across all tests in this class
    let testsTaken = 0;
    let totalScore = 0;
    let studentScoresPerTest = [];
    let classAveragesPerTest = [];
    let testNames = [];
    
    // Gaps and Strengths
    const gaps = [];
    const strengths = [];

    // Rank calculation base
    const studentAverages = {}; 

    cls.tests.forEach(test => {
        // Find this student in the test results. 
        // Note: In the exported JSON, 'nachname' contains the student code, and 'vorname' is empty.
        const result = test.results.find(r => r.nachname === code);
        
        // Compute averages for rank
        cls.validCodes.forEach(c => {
            const res = test.results.find(r => r.nachname === c);
            if (res) {
                if (!studentAverages[c]) studentAverages[c] = { sum: 0, count: 0 };
                studentAverages[c].sum += res.bewertung;
                studentAverages[c].count += 1;
            } else {
                const status = (test.missingStatuses && test.missingStatuses[c]) || 'krank';
                if (status === 'null_punkte') {
                    if (!studentAverages[c]) studentAverages[c] = { sum: 0, count: 0 };
                    studentAverages[c].sum += 0.0;
                    studentAverages[c].count += 1;
                }
            }
        });

        if (result) {
            testsTaken++;
            totalScore += result.bewertung;
            studentScoresPerTest.push(result.bewertung);
            classAveragesPerTest.push(test.classAverage);
            testNames.push(test.name);

            // Calculate class averages per question for this test
            const questionAverages = {};
            test.questions.forEach(q => {
                let totalScore = 0;
                let count = 0;
                test.results.forEach(r => {
                    const s = r.scores[q.key];
                    if (s !== null && s !== undefined) {
                        totalScore += s;
                        count++;
                    }
                });
                questionAverages[q.key] = count > 0 ? (totalScore / count) / q.maxPoints : 0; // ratio 0 to 1
            });

            // Find gaps and strengths in this test
            test.questions.forEach(q => {
                const score = result.scores[q.key];
                const classRatio = questionAverages[q.key];
                
                if (score !== null && score !== undefined && q.maxPoints > 0) {
                    const ratio = score / q.maxPoints;
                    const info = {
                        testName: test.name,
                        question: q,
                        score: score,
                        classRatio: classRatio
                    };
                    if (ratio <= 0.20) gaps.push(info);
                    else if (ratio >= 0.80) strengths.push(info);
                } else if (score === null || score === undefined) {
                    // skipped
                    gaps.push({
                        testName: test.name,
                        question: q,
                        score: 0,
                        skipped: true,
                        classRatio: classRatio
                    });
                }
            });
        } else {
            // Did not take this test
            const status = (test.missingStatuses && test.missingStatuses[code]) || 'krank';
            if (status === 'null_punkte') {
                testsTaken++;
                totalScore += 0.0;
                studentScoresPerTest.push(0.0);
            } else {
                studentScoresPerTest.push(null); // for chart continuity
            }
            classAveragesPerTest.push(test.classAverage);
            testNames.push(test.name);
        }
    });

    const avg = testsTaken > 0 ? (totalScore / testsTaken) : 0;
    document.getElementById('stat-tests').textContent = testsTaken;
    document.getElementById('stat-avg').textContent = avg.toFixed(2).replace('.', ',') + ' / 10';

    // Compute rank
    const classRanks = Object.entries(studentAverages).map(([k, v]) => ({
        key: k,
        avg: v.count > 0 ? v.sum / v.count : 0
    })).sort((a, b) => b.avg - a.avg);

    const rank = classRanks.findIndex(item => item.key === code) + 1;
    document.getElementById('stat-rank').textContent = rank > 0 ? `${rank} / ${classRanks.length}` : '-';

    // Setup global copy button
    const btnCopyAll = document.getElementById('btn-copy-all-prompts');
    if (btnCopyAll) {
        if (gaps.length > 0) {
            btnCopyAll.style.display = 'inline-flex';
            const newBtn = btnCopyAll.cloneNode(true);
            btnCopyAll.parentNode.replaceChild(newBtn, btnCopyAll);
            
            newBtn.addEventListener('click', () => {
                copyTutorPrompt(gaps, cls.name);
                const originalText = newBtn.innerHTML;
                newBtn.innerHTML = '<span>✅ Erfolgreich kopiert!</span>';
                setTimeout(() => {
                    newBtn.innerHTML = originalText;
                }, 2000);
            });
        } else {
            btnCopyAll.style.display = 'none';
        }
    }

    renderChart(testNames, studentScoresPerTest, classAveragesPerTest);
    renderAnalysis(testNames, gaps, strengths, cls, code);
    renderStudentLernpaketeList(cls, code);
    updateGamificationUI(cls, code);
}

function renderChart(labels, studentData, classData) {
    const ctx = document.getElementById('progress-chart');
    if (!ctx) return;
    
    if (currentStudentChart) currentStudentChart.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#1e293b';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

    currentStudentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Meine Punkte',
                    data: studentData,
                    borderColor: '#22d3ee', // Cyan
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                    tension: 0.25,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    spanGaps: true
                },
                {
                    label: 'Klassenschnitt',
                    data: classData,
                    borderColor: '#3b82f6', // Blue
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    tension: 0.25,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    labels: { 
                        color: textColor,
                        font: {
                            weight: '600'
                        }
                    } 
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f8fafc' : '#1e293b',
                    bodyColor: isDark ? '#cbd5e1' : '#475569',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed.y !== null ? context.parsed.y.toFixed(2).replace('.', ',') : '-';
                            return `${context.dataset.label}: ${val} / 10`;
                        }
                    }
                }
            },
            scales: {
                y: { min: 0, max: 10, ticks: { color: textColor }, grid: { color: gridColor } },
                x: { ticks: { color: textColor }, grid: { display: false } }
            }
        }
    });
}

function renderAnalysis(testNames, gaps, strengths, cls, code) {
    const container = document.getElementById('tests-analysis-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (testNames.length === 0) {
        container.innerHTML = `<p class="text-muted" style="text-align:center; padding:2rem;">Noch keine Tests absolviert.</p>`;
        return;
    }
    
    // Reverse testNames to show newest first
    const reversedNames = [...testNames].reverse();

    reversedNames.forEach((tName, idx) => {
        const testGaps = gaps.filter(g => g.testName === tName);
        const testStrengths = strengths.filter(s => s.testName === tName);
        
        // Skip test if no specific feedback
        if (testGaps.length === 0 && testStrengths.length === 0) return;

        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';

        // Set Stitch color theme rotatively
        const themes = ['cyan', 'purple', 'blue', 'sky'];
        const theme = themes[idx % themes.length];
        accordionItem.classList.add(`theme-${theme}`);

        // Compute scores and percentages
        let scorePercent = 0;
        let scoreLabel = '-';
        
        const testInCls = cls.tests.find(t => t.name === tName);
        if (testInCls) {
            const res = testInCls.results.find(r => r.nachname === code);
            if (res && res.bewertung !== null && res.bewertung !== undefined) {
                scorePercent = Math.min(100, Math.max(0, Math.round(res.bewertung * 10)));
                scoreLabel = res.bewertung.toFixed(1).replace('.', ',');
                if (scoreLabel.endsWith(',0')) scoreLabel = Math.round(res.bewertung).toString();
            }
        }

        // Setup custom dynamic SVG icon based on test name
        let iconSvg = '';
        const nameLower = tName.toLowerCase();
        if (nameLower.includes('nomenklatur') || nameLower.includes('carbonyl')) {
            iconSvg = `<svg viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>`;
        } else if (nameLower.includes('bindung') || nameLower.includes('hydratation') || nameLower.includes('reakt') || nameLower.includes('chemie')) {
            iconSvg = `<svg viewBox="0 0 24 24"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>`;
        } else {
            iconSvg = `<svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>`;
        }

        // Header
        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.innerHTML = `
            <div class="accordion-header-left">
                <div class="icon-container">${iconSvg}</div>
                <span class="accordion-title">${tName}</span>
            </div>
            <div class="accordion-header-right">
                <div class="progress-track" title="Ergebnis: ${scorePercent}%">
                    <div class="progress-bar-fill" style="width: ${scorePercent}%"></div>
                </div>
                <span class="badge-score">${scoreLabel}</span>
                <span class="chevron">▼</span>
            </div>
        `;
        header.addEventListener('click', () => {
            accordionItem.classList.toggle('active');
        });

        // Content Wrapper
        const content = document.createElement('div');
        content.className = 'accordion-content';
        
        // Grid for gaps and strengths inside the test
        const grid = document.createElement('div');
        grid.className = 'test-analysis-grid';

        // Gaps Column
        const gapsCol = document.createElement('div');
        
        const gapsHeaderContainer = document.createElement('div');
        gapsHeaderContainer.style.display = 'flex';
        gapsHeaderContainer.style.justifyContent = 'space-between';
        gapsHeaderContainer.style.alignItems = 'flex-start';
        gapsHeaderContainer.style.marginBottom = '1rem';
        gapsHeaderContainer.style.gap = '1rem';
        
        const gapsHeader = document.createElement('h3');
        gapsHeader.style.color = 'var(--danger)';
        gapsHeader.style.marginTop = '0';
        gapsHeader.style.marginBottom = '0';
        gapsHeader.textContent = 'Wiederholungsbedarf';
        gapsHeaderContainer.appendChild(gapsHeader);

        if (testGaps.length > 0) {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn-violet';
            copyBtn.innerHTML = '🤖 Tutor-Prompt kopieren';
            copyBtn.style.padding = '0.4rem 0.8rem';
            copyBtn.style.borderRadius = '0.75rem';
            copyBtn.style.fontSize = '0.8rem';

            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyTutorPrompt(testGaps);
                
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '✅ Kopiert!';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            });
            gapsHeaderContainer.appendChild(copyBtn);
        }

        gapsCol.appendChild(gapsHeaderContainer);
        
        const gapsContent = document.createElement('div');
        let gapsHtml = '';
        if (testGaps.length === 0) {
            gapsHtml += `<p class="text-muted" style="font-size:0.9rem; padding: 0.5rem 0;">Keine größeren Lücken festgestellt.</p>`;
        } else {
            testGaps.forEach(item => {
                const label = item.skipped ? 'Nicht beantwortet' : `Nur ${item.score.toFixed(2).replace('.', ',')} / ${item.question.maxPoints.toFixed(2).replace('.', ',')} P.`;
                let feedbackHtml = '';
                if (item.question.answers) {
                    const correct = item.question.answers.find(a => a.fraction === 100);
                    if (correct && correct.text) {
                        feedbackHtml = `<div class="feedback"><strong>Richtige Antwort:</strong> ${correct.text}</div>`;
                    }
                }
                gapsHtml += `
                    <div class="analysis-card gap">
                        <span class="badge badge-red">${label}</span>
                        <div class="q-name">${item.question.name}</div>
                        <div class="q-text">${item.question.text}</div>
                        ${feedbackHtml}
                    </div>
                `;
            });
        }
        gapsContent.innerHTML = gapsHtml;
        gapsCol.appendChild(gapsContent);

        // Strengths Column
        const strengthsCol = document.createElement('div');
        let strengthsHtml = `<h3 style="color: var(--success); margin-top:0; margin-bottom: 1rem;">Stärken</h3>`;
        if (testStrengths.length === 0) {
            strengthsHtml += `<p class="text-muted" style="font-size:0.9rem; padding: 0.5rem 0;">Keine besonderen Ausreißer nach oben.</p>`;
        } else {
            testStrengths.forEach(item => {
                const label = `${item.score.toFixed(2).replace('.', ',')} / ${item.question.maxPoints.toFixed(2).replace('.', ',')} P.`;
                strengthsHtml += `
                    <div class="analysis-card strength">
                        <span class="badge badge-green">${label}</span>
                        <div class="q-name">${item.question.name}</div>
                        <div class="q-text">${item.question.text}</div>
                    </div>
                `;
            });
        }
        strengthsCol.innerHTML += strengthsHtml;

        grid.appendChild(gapsCol);
        grid.appendChild(strengthsCol);
        content.appendChild(grid);
        
        accordionItem.appendChild(header);
        accordionItem.appendChild(content);
        
        container.appendChild(accordionItem);
    });
    
    // Trigger MathJax to render formulas in the newly created elements
    if (window.MathJax) {
        MathJax.typesetPromise().catch((err) => console.log('MathJax error: ', err));
    }
}

function copyTutorPrompt(gaps, className) {
    const basePrompt = `Du bist ein empathischer, intellektuell fordernder Sokratischer Tutor für MINT-Fächer (Mathematik, Informatik, Naturwissenschaften, Technik) an einem bayerischen Gymnasium. Deine Zielgruppe ist die ${className || 'Oberstufe/Mittelstufe'}. Deine Aufgabe ist es, sie durch wissenschaftliche Fragestellungen zu führen, ohne ihnen jemals die fertige Antwort zu verraten.

Befolge strikt diese didaktische Struktur und Methodik:

1. Strukturierung nach dem MINT-4MAT-Prinzip:
• WARUM (Motivation/Phänomen): Starte immer mit dem Alltagsphänomen, dem biologischen Sinn, der chemischen Relevanz oder dem mathematischen Problem. Warum brauchen wir dieses Modell/diese Formel? Welche historischen Fehlannahmen gab es (z.B. Dalton vs. Bohr)?
• WAS (Konzept/Modell): Erst nach der Motivation folgt die Theorie, das wissenschaftliche Modell oder die mathematische Definition.
• WIE (Anwendung/Experiment): Wie wird das Konzept angewendet? Wie sieht der Versuchsaufbau aus, wie die mathematische Herleitung oder der Code?
• WAS WÄRE WENN (Transfer): Hypothetische Szenarien, Störungen des Systems (z.B. Le Chatelier), Extremwerte oder Edge Cases.

2. Diagnose & Sokratische Methode:
• Beantworte Fragen nie direkt. Antworte stattdessen mit einer präzisen Gegenfrage, die die Wissenslücke des Schülers aufdeckt oder ein logisches Paradoxon aufzeigt.
• Nutze die Feynman-Technik: Lass den Schüler das Konzept in eigenen, einfachen Worten erklären ("Erkläre es mir, als wäre ich 10 Jahre alt"). Wo er ins Stocken gerät, ist die Wissenslücke.
• Passe dein Niveau dynamisch an (vom intuitiven Verständnis bis hin zu akademischer Tiefe für die Oberstufe).

3. Die Kompetenz-Checkliste ("Definition of Done"):
• Führe im Hintergrund (oder transparent für den Schüler) eine gedankliche Checkliste der Kompetenzen, die für das Thema nötig sind (Anforderungsbereiche I, II und III nach LehrplanPLUS).
• "Verstanden" bedeutet nicht "Auswendig gelernt", sondern die Fähigkeit zur Anwendung und Analyse (Bloom-Taxonomie). Der Schüler muss das Konzept auf ein neues, unbekanntes Beispiel übertragen können.

4. Die Interaktionsschleife:
• Nach jedem Teilschritt überprüfst du das Verständnis durch aktives Abrufen (Active Recall). Stelle eine offene Frage oder lass eine Vorhersage für ein Experiment treffen. Frage niemals "Macht das Sinn?" oder "Hast du das verstanden?".
• Geh erst zum nächsten Punkt der Checkliste über, wenn der aktuelle Punkt vom Schüler aktiv bewiesen wurde.
• Passe die Komplexität und den Umfang deiner Erklärungen der Größe der Fragestellung an.

Kommunikationsregeln:
- Sprich den Schüler per "Du" an, bleibe motivierend, aber wissenschaftlich präzise und sprachlich sauber (adäquat für das Gymnasium).
- Vermeide unbedingt "Sycophancy" (übertriebene Gefälligkeit): Lobe niemals falsche Antworten. Benenne Schwächen und fachliche Fehler stets klar, sachlich und unmissverständlich.
- Verwende gängige wissenschaftliche Notationen und Begriffe, fordere diese auch vom Schüler ein.

Lass uns starten. Begrüße den Schüler kurz, frage nach dem MINT-Thema oder der Fragestellung, die heute erarbeitet werden soll, und beginne sofort mit der ersten Diagnose-Frage zum "WARUM".

Hier sind meine aktuellen Defizite aus meinen letzten Tests, bei denen ich Hilfe brauche. Bitte arbeite mit mir zuerst die Defizite unter Priorität 1 (Individuelle Kenntnislücken) auf, da dies grundlegende Verständnisprobleme von mir sind. Danach können wir uns den komplexeren Themen unter Priorität 2 widmen:

`;

    // Filter into priority 1 (classRatio >= 0.40) and priority 2 (classRatio < 0.40)
    const priority1Gaps = gaps.filter(g => g.classRatio >= 0.40);
    const priority2Gaps = gaps.filter(g => g.classRatio < 0.40);

    const formatGap = (g) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = g.question.text;
        const cleanText = tempDiv.textContent || tempDiv.innerText || "";
        return `- Test: "${g.testName}" | Thema: "${g.question.name}" - ${cleanText.substring(0, 200)}${cleanText.length > 200 ? '...' : ''}`;
    };

    let fullPrompt = basePrompt;

    if (priority1Gaps.length > 0) {
        fullPrompt += "### Priorität 1: Individuelle Kenntnislücken (Hier hat der Rest der Klasse besser abgeschnitten)\n";
        fullPrompt += priority1Gaps.map(formatGap).join('\n') + "\n\n";
    }

    if (priority2Gaps.length > 0) {
        fullPrompt += "### Priorität 2: Generelle Schwierigkeiten / Komplexe Fragen (Hier hatte die gesamte Klasse Probleme)\n";
        fullPrompt += priority2Gaps.map(formatGap).join('\n') + "\n";
    }
    
    navigator.clipboard.writeText(fullPrompt).catch(err => {
        console.error('Fehler beim Kopieren:', err);
    });
}

function getScoreColor(score) {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
}

function renderStudentLernpaketeList(cls, code) {
    const container = document.getElementById('lernpakete-analysis-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!cls.lernpakete || cls.lernpakete.length === 0) {
        container.innerHTML = `<div class="analysis-card" style="border:none; text-align:center; padding: 2rem;">Keine Lernpakete in dieser Klasse vorhanden.</div>`;
        return;
    }
    
    cls.lernpakete.forEach(lp => {
        const result = lp.data.find(r => r.name === code);
        
        const card = document.createElement('div');
        card.className = 'analysis-card';
        
        if (result) {
            const score = result.bewertung;
            let statusClass = '';
            let statusText = 'Bearbeitet';
            
            if (score >= 80) {
                statusClass = 'badge-green';
                statusText = 'Sehr gut';
            } else if (score >= 50) {
                statusClass = 'badge-orange';
                statusText = 'Ausreichend';
            } else {
                statusClass = 'badge-red';
                statusText = 'Übungsbedarf';
            }
            
            card.innerHTML = `
                <div class="flex-between">
                    <div class="font-bold">${lp.name}</div>
                    <div class="flex-center">
                        <span class="badge ${statusClass}" style="margin-bottom:0; margin-right:0.75rem;">${statusText}</span>
                        <span class="font-bold" style="font-size: 1.25rem; color: ${getScoreColor(score)}">${Math.round(score)}%</span>
                    </div>
                </div>
                <div class="text-xs text-muted" style="margin-top: 0.5rem;">Versuch: ${result.versuch} | Letzter Versuch: ${result.letzterVersuch}</div>
            `;
        } else {
            const studentKey = code + "_";
            const currentStatus = (lp.missingStatuses && lp.missingStatuses[studentKey]) || 'krank';
            
            if (currentStatus === 'null_punkte') {
                card.innerHTML = `
                    <div class="flex-between">
                        <div class="font-bold text-muted">${lp.name}</div>
                        <div class="flex-center">
                            <span class="badge badge-red" style="margin-bottom:0; margin-right:0.75rem;">Unentschuldigt</span>
                            <span class="font-bold" style="font-size: 1.25rem; color: var(--danger)">0%</span>
                        </div>
                    </div>
                `;
            } else {
                card.style.opacity = '0.6';
                card.innerHTML = `
                    <div class="flex-between">
                        <div class="font-bold text-muted">${lp.name}</div>
                        <span class="badge" style="margin-bottom:0; background: rgba(0,0,0,0.05); color: var(--text-muted);">Krank / Entschuldigt</span>
                    </div>
                `;
            }
        }
        
        container.appendChild(card);
    });
}

function updateGamificationUI(cls, code) {
    const gCard = document.getElementById('gamification-card');
    if (!gCard) return;
    
    // 1. Calculate XP
    let totalXP = 0;
    const activities = []; // to calculate streak
    
    // Helper to parse dates robustly
    const parseDate = (dStr) => {
        if (!dStr) return new Date(0);
        const cleanStr = dStr.toLowerCase().trim();
        const months = {
            'januar': 0, 'februar': 1, 'märz': 2, 'april': 3, 'mai': 4, 'juni': 5,
            'juli': 6, 'august': 7, 'september': 8, 'oktober': 9, 'november': 10, 'dezember': 11,
            'jan': 0, 'feb': 1, 'mrz': 2, 'apr': 3, 'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'dez': 11
        };
        for (const [mName, mIdx] of Object.entries(months)) {
            if (cleanStr.includes(mName)) {
                const parts = cleanStr.replace(mName, `.${mIdx + 1}.`).split(/[\s.:]+/);
                if (parts.length >= 3) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    const hour = parts.length >= 5 ? parseInt(parts[3], 10) : 0;
                    const min = parts.length >= 5 ? parseInt(parts[4], 10) : 0;
                    return new Date(year, month, day, hour, min);
                }
            }
        }
        const parts = cleanStr.split(/[\s.:]+/);
        if (parts.length >= 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const hour = parts.length >= 5 ? parseInt(parts[3], 10) : 0;
            const min = parts.length >= 5 ? parseInt(parts[4], 10) : 0;
            return new Date(year, month, day, hour, min);
        }
        return new Date(0);
    };
    
    // Calculate Test XP & gather activities
    cls.tests.forEach(test => {
        const res = test.results.find(r => r.nachname === code);
        if (res && res.bewertung !== null && res.bewertung !== undefined) {
            totalXP += Math.round(res.bewertung * 10); // e.g. 8.5/10 points = 85 XP
            activities.push({
                scorePercent: res.bewertung * 10,
                date: parseDate(res.beendet || test.date)
            });
        } else {
            const status = (test.missingStatuses && test.missingStatuses[code]) || 'krank';
            if (status === 'null_punkte') {
                // unexcused absent counts as 0% score
                activities.push({
                    scorePercent: 0,
                    date: parseDate(test.date)
                });
            }
        }
    });
    
    // Calculate Lernpakete XP & gather activities
    if (cls.lernpakete) {
        cls.lernpakete.forEach(lp => {
            const res = lp.data.find(r => r.name === code);
            if (res) {
                totalXP += Math.round(res.bewertung); // e.g. 85% = 85 XP
                activities.push({
                    scorePercent: res.bewertung,
                    date: parseDate(res.letzterVersuch || lp.uploadDate)
                });
            } else {
                const studentKey = code + "_";
                const status = (lp.missingStatuses && lp.missingStatuses[studentKey]) || 'krank';
                if (status === 'null_punkte') {
                    // unexcused absent counts as 0% score
                    activities.push({
                        scorePercent: 0,
                        date: parseDate(lp.uploadDate)
                    });
                }
            }
        });
    }
    
    // 2. Calculate Streak
    // Sort activities chronologically ascending
    activities.sort((a, b) => a.date - b.date);
    
    let currentStreak = 0;
    // Go backwards from the end of the activities list
    for (let i = activities.length - 1; i >= 0; i--) {
        if (activities[i].scorePercent >= 80) {
            currentStreak++;
        } else {
            break;
        }
    }
    
    // 3. Determine Level
    const levels = [
        { threshold: 0, title: "Chemie-Entdecker", emoji: "🧪" },
        { threshold: 100, title: "Formel-Lehrling", emoji: "⚗️" },
        { threshold: 250, title: "Element-Bändiger", emoji: "⚡" },
        { threshold: 500, title: "Reaktions-Meister", emoji: "💥" },
        { threshold: 800, title: "Alchemie-Großmeister", emoji: "🔮" },
        { threshold: 1200, title: "ByCS-Chemie-Legende", emoji: "👑" }
    ];
    
    let currentLevelIdx = 0;
    for (let i = 0; i < levels.length; i++) {
        if (totalXP >= levels[i].threshold) {
            currentLevelIdx = i;
        } else {
            break;
        }
    }
    
    const curLvl = levels[currentLevelIdx];
    const nextLvl = currentLevelIdx + 1 < levels.length ? levels[currentLevelIdx + 1] : null;
    
    let xpProgressPercent = 100;
    let xpTextNext = "Maximale Stufe erreicht";
    
    if (nextLvl) {
        const range = nextLvl.threshold - curLvl.threshold;
        const currentProgress = totalXP - curLvl.threshold;
        xpProgressPercent = Math.min(100, Math.max(0, (currentProgress / range) * 100));
        xpTextNext = `${nextLvl.threshold - totalXP} XP bis zum nächsten Level`;
    }
    
    // 4. Update UI
    document.getElementById('game-avatar').textContent = curLvl.emoji;
    document.getElementById('game-title').textContent = curLvl.title;
    document.getElementById('game-level-badge').textContent = `Level ${currentLevelIdx + 1}`;
    document.getElementById('game-xp-current').textContent = `${totalXP} XP (Gesamt)`;
    document.getElementById('game-xp-next').textContent = xpTextNext;
    document.getElementById('game-xp-fill').style.width = `${xpProgressPercent}%`;
    document.getElementById('game-streak-count').textContent = currentStreak;
    
    // Show / hide streak container based on whether streak > 0
    const streakContainer = document.getElementById('game-streak-container');
    if (streakContainer) {
        if (currentStreak > 0) {
            streakContainer.style.display = 'flex';
        } else {
            streakContainer.style.display = 'none';
        }
    }
    
    // Unhide card
    gCard.classList.remove('hidden');
    gCard.style.display = 'block';
}
