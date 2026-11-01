/**
 * Mebis Lernverlaufsdashboard - Application Logic
 * Runs entirely in the browser, ensuring 100% GDPR (DSGVO) compliance.
 */

// Application State
let appState = {
    tests: []
};
let showAllStudentsInOverview = false;

// LocalStorage Key
const STORAGE_KEY = 'mebis_dashboard_data';

// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromStorage();
    initTheme();
    setupEventListeners();
    renderActiveTab();
});

// Load state from localStorage
function loadStateFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            appState = JSON.parse(stored);
            
            // Migration: old schema had appState.tests directly
            if (appState.tests && !appState.classes) {
                const firstTest = appState.tests[0];
                const defaultName = (firstTest && firstTest.statsSummary && firstTest.statsSummary.kursname) || "Chemie 9a";
                appState.classes = [
                    {
                        id: 'class_default',
                        name: defaultName,
                        tests: appState.tests
                    }
                ];
                appState.currentClassId = 'class_default';
            }
        }
        
        // Ensure classes array exists and has at least one default class
        if (!appState.classes || appState.classes.length === 0) {
            appState.classes = [
                {
                    id: 'class_' + Date.now(),
                    name: 'Chemie 9a',
                    tests: []
                }
            ];
            appState.currentClassId = appState.classes[0].id;
        }
        
        // Ensure a Room ID exists for the teacher
        if (!appState.roomId) {
            appState.roomId = 'TR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        }
        
        // Bind the appState.tests reference to the current class tests list
        bindCurrentClassTests();
        
    } catch (e) {
        console.error("Error loading state from localStorage:", e);
        showNotification("Fehler beim Laden der lokalen Daten.", "error");
    }
}

// Save state to localStorage
function saveStateToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        // Automatically sync to server whenever local state changes
        if (typeof syncStudentDataToFolder === 'function') {
            syncStudentDataToFolder();
        }
    } catch (e) {
        console.error("Error saving state to localStorage:", e);
        showNotification("Fehler beim Speichern der Daten. Speicherplatz voll?", "error");
    }
}

// Initialize Theme (Dark / Light Mode)
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
}

// Toggle Theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);
    // Redraw charts if visible to update text/grid colors
    renderActiveTab();
}

function updateThemeToggleIcon(theme) {
    const icon = document.getElementById('theme-toggle-icon');
    if (!icon) return;
    if (theme === 'dark') {
        icon.innerHTML = `<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>`;
    } else {
        icon.innerHTML = `<path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>`;
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation Tabs
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Test File Upload Form
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleTestUpload);
    }

    // Backup & Restore
    const exportBtn = document.getElementById('btn-export');
    if (exportBtn) exportBtn.addEventListener('click', exportBackup);

    const importInput = document.getElementById('import-file');
    if (importInput) importInput.addEventListener('change', importBackup);

    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetData);

    // Search and Sort inputs in Dashboard
    const searchInput = document.getElementById('student-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderStudentTable(searchInput.value);
        });
    }

    const studentSelect = document.getElementById('student-detail-select');
    if (studentSelect) {
        studentSelect.addEventListener('change', (e) => {
            renderStudentDetail(e.target.value);
        });
    }

    const highscoreSelect = document.getElementById('highscore-filter-select');
    if (highscoreSelect) {
        highscoreSelect.addEventListener('change', () => {
            renderHighscoreTab();
        });
    }

    // Highscore Toggle (Tests vs Lernpakete)
    const btnHsTests = document.getElementById('highscore-type-tests');
    const btnHsLernpakete = document.getElementById('highscore-type-lernpakete');
    if (btnHsTests && btnHsLernpakete) {
        btnHsTests.addEventListener('click', () => {
            btnHsTests.classList.add('active');
            btnHsTests.style.background = 'var(--bg-card)';
            btnHsTests.style.color = 'var(--text-main)';
            btnHsLernpakete.classList.remove('active');
            btnHsLernpakete.style.background = 'transparent';
            btnHsLernpakete.style.color = 'var(--text-muted)';
            renderHighscoreTab();
        });
        btnHsLernpakete.addEventListener('click', () => {
            btnHsLernpakete.classList.add('active');
            btnHsLernpakete.style.background = 'var(--bg-card)';
            btnHsLernpakete.style.color = 'var(--text-main)';
            btnHsTests.classList.remove('active');
            btnHsTests.style.background = 'transparent';
            btnHsTests.style.color = 'var(--text-muted)';
            renderHighscoreTab();
        });
    }

    // Student Toggle (Tests vs Lernpakete)
    const btnStuTests = document.getElementById('student-type-tests');
    const btnStuLernpakete = document.getElementById('student-type-lernpakete');
    if (btnStuTests && btnStuLernpakete) {
        btnStuTests.addEventListener('click', () => {
            btnStuTests.classList.add('active');
            btnStuTests.style.background = 'var(--bg-card)';
            btnStuTests.style.color = 'var(--text-main)';
            btnStuLernpakete.classList.remove('active');
            btnStuLernpakete.style.background = 'transparent';
            btnStuLernpakete.style.color = 'var(--text-muted)';
            document.getElementById('student-tests-details-container').style.display = 'block';
            document.getElementById('student-lernpakete-details-container').style.display = 'none';
        });
        btnStuLernpakete.addEventListener('click', () => {
            btnStuLernpakete.classList.add('active');
            btnStuLernpakete.style.background = 'var(--bg-card)';
            btnStuLernpakete.style.color = 'var(--text-main)';
            btnStuTests.classList.remove('active');
            btnStuTests.style.background = 'transparent';
            btnStuTests.style.color = 'var(--text-muted)';
            document.getElementById('student-tests-details-container').style.display = 'none';
            document.getElementById('student-lernpakete-details-container').style.display = 'block';
        });
    }

    // Lernpaket Upload Form
    const uploadLpForm = document.getElementById('upload-lernpaket-form');
    if (uploadLpForm) {
        uploadLpForm.addEventListener('submit', handleLernpaketUpload);
    }

    const statsSelect = document.getElementById('overview-stats-select');
    if (statsSelect) {
        statsSelect.addEventListener('change', () => {
            renderOverviewStatsCard(statsSelect.value);
        });
    }

    const toggleBtn = document.getElementById('sidebar-toggle');
    const appContainer = document.querySelector('.app-container');
    if (toggleBtn && appContainer) {
        toggleBtn.addEventListener('click', () => {
            appContainer.classList.toggle('sidebar-collapsed');
            const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
            toggleBtn.innerHTML = isCollapsed ? '▶' : '◀';
            toggleBtn.setAttribute('aria-expanded', !isCollapsed);
        });
    }

    const studentListToggleBtn = document.getElementById('btn-toggle-student-list');
    if (studentListToggleBtn) {
        studentListToggleBtn.addEventListener('click', () => {
            showAllStudentsInOverview = !showAllStudentsInOverview;
            const searchInput = document.getElementById('student-search');
            renderStudentTable(searchInput ? searchInput.value : '');
        });
    }

    // Populate active class dropdown
    populateClassDropdown();

    const activeClassSelect = document.getElementById('active-class-select');
    if (activeClassSelect) {
        activeClassSelect.addEventListener('change', (e) => {
            appState.currentClassId = e.target.value;
            bindCurrentClassTests();
            saveStateToStorage();
            
            // Re-render dashboard overview
            renderActiveTab();
            
            // Reset selectors
            const studSelect = document.getElementById('student-detail-select');
            if (studSelect) studSelect.value = '';
            
            showNotification("Klasse gewechselt.", "info");
        });
    }

    const addClassBtn = document.getElementById('btn-add-class');
    if (addClassBtn) {
        addClassBtn.addEventListener('click', () => {
            const className = prompt("Name der neuen Klasse / des neuen Kurses eingeben:");
            if (className && className.trim() !== '') {
                const newClass = {
                    id: 'class_' + Date.now(),
                    name: className.trim(),
                    tests: []
                };
                appState.classes.push(newClass);
                appState.currentClassId = newClass.id;
                bindCurrentClassTests();
                saveStateToStorage();
                
                populateClassDropdown();
                renderActiveTab();
                showNotification(`Klasse "${className.trim()}" erfolgreich erstellt!`, "success");
            }
        });
    }

    const deleteClassBtn = document.getElementById('btn-delete-class');
    if (deleteClassBtn) {
        deleteClassBtn.addEventListener('click', () => {
            const activeClass = appState.classes.find(c => c.id === appState.currentClassId);
            if (!activeClass) return;
            
            if (appState.classes.length <= 1) {
                alert("Die einzige verbleibende Klasse kann nicht gelöscht werden. Bitte legen Sie zuerst eine neue Klasse an.");
                return;
            }
            
            if (confirm(`Sind Sie sicher, dass Sie die Klasse "${activeClass.name}" inklusive ALLER Schüler, Tests und Auswertungen unwiderruflich löschen möchten?`)) {
                appState.classes = appState.classes.filter(c => c.id !== appState.currentClassId);
                appState.currentClassId = appState.classes[0].id;
                bindCurrentClassTests();
                saveStateToStorage();
                
                populateClassDropdown();
                renderActiveTab();
                
                const studSelect = document.getElementById('student-detail-select');
                if (studSelect) studSelect.value = '';
                
                showNotification(`Klasse "${activeClass.name}" wurde gelöscht.`, "info");
            }
        });
    }

    const closeShareBtn = document.getElementById('btn-close-share');
    const closeShareFooterBtn = document.getElementById('btn-close-share-footer');
    const shareModal = document.getElementById('share-modal');
    
    if (closeShareBtn && shareModal) {
        closeShareBtn.addEventListener('click', () => {
            shareModal.style.display = 'none';
        });
    }
    if (closeShareFooterBtn && shareModal) {
        closeShareFooterBtn.addEventListener('click', () => {
            shareModal.style.display = 'none';
        });
    }
    if (shareModal) {
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                shareModal.style.display = 'none';
            }
        });
    }


    const portalQrBtn = document.getElementById('btn-show-portal-qr');
    if (portalQrBtn) {
        portalQrBtn.addEventListener('click', showPortalQrModal);
    }
    
    const closePortalQrBtn = document.getElementById('btn-close-portal-qr');
    const closePortalQrFooterBtn = document.getElementById('btn-close-portal-footer');
    const portalQrModal = document.getElementById('portal-qr-modal');
    
    if (closePortalQrBtn && portalQrModal) {
        closePortalQrBtn.addEventListener('click', () => { portalQrModal.style.display = 'none'; });
    }
    if (closePortalQrFooterBtn && portalQrModal) {
        closePortalQrFooterBtn.addEventListener('click', () => { portalQrModal.style.display = 'none'; });
    }
    if (portalQrModal) {
        portalQrModal.addEventListener('click', (e) => {
            if (e.target === portalQrModal) {
                portalQrModal.style.display = 'none';
            }
        });
    }
    
    const portalUrlInput = document.getElementById('portal-url-input');
    if (portalUrlInput) {
        portalUrlInput.addEventListener('input', () => {
            generatePortalQrCode(portalUrlInput.value);
        });
    }
    const printCodesBtn = document.getElementById('btn-print-codes');
    if (printCodesBtn) {
        printCodesBtn.addEventListener('click', printStudentCodes);
    }
}

// Navigation Tab Switcher
let activeTab = 'overview';
function switchTab(tabId) {
    activeTab = tabId;
    
    // Update nav classes
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update view panels
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabPanels.forEach(panel => {
        if (panel.id === `${tabId}-panel`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });

    renderActiveTab();
}

// Render active tab contents
function renderActiveTab() {
    if (activeTab === 'overview') {
        renderOverviewTab();
    } else if (activeTab === 'students') {
        renderStudentsTab();
    } else if (activeTab === 'highscore') {
        renderHighscoreTab();
    } else if (activeTab === 'tests') {
        renderTestsTab();
    } else if (activeTab === 'xml-editor') {
        renderXmlEditorTab();
    } else if (activeTab === 'lernpakete') {
        renderLernpaketeTab();
    } else if (activeTab === 'help') {
        // Static HTML page - no JS rendering required.
    }
}

// --- PARSING LOGIC ---

// Clean and normalize text for robust matching
function cleanTextForMatching(text) {
    if (!text) return '';
    return text.toString()
        .toLowerCase()
        .replace(/<[^>]*>/g, '') // remove HTML tags
        .replace(/\{[^}]*\}/g, '') // remove matching choices like {Wasserstoffbrückenbindungen; ...}
        .replace(/->/g, '')
        .replace(/\\\(|\\\)|\\\[|\\\]/g, '') // remove LaTeX delimiters
        .replace(/[^a-z0-9äöüß]/g, '') // remove non-alphanumeric chars
        .replace(/\s+/g, '') // remove all whitespace
        .trim();
}

// Grade a student's answer against the correct answer automatically
function gradeStudentResponse(studentAns, correctAns, qType, maxPoints) {
    if (studentAns === undefined || studentAns === null || studentAns.toString().trim() === '') {
        return 0;
    }
    
    const sClean = studentAns.toString().trim();
    const cClean = correctAns.toString().trim();
    
    if (sClean.toLowerCase() === cClean.toLowerCase()) {
        return maxPoints;
    }
    
    if (qType === 'matching') {
        const studentPairs = sClean.split(';').map(p => p.trim()).filter(p => p !== '');
        const correctPairs = cClean.split(';').map(p => p.trim()).filter(p => p !== '');
        let correctCount = 0;
        studentPairs.forEach(sp => {
            if (correctPairs.includes(sp)) {
                correctCount++;
            }
        });
        return correctPairs.length > 0 ? (correctCount / correctPairs.length) * maxPoints : 0;
    }
    
    if (qType === 'cloze') {
        const studentParts = sClean.split(';').map(p => p.trim()).filter(p => p !== '');
        const correctParts = cClean.split(';').map(p => p.trim()).filter(p => p !== '');
        let correctCount = 0;
        studentParts.forEach((sp, idx) => {
            // "Teil 1: Wert" -> extract "Wert"
            const studentVal = sp.split(':').slice(1).join(':').trim();
            const correctVal = correctParts[idx] ? correctParts[idx].split(':').slice(1).join(':').trim() : '';
            if (studentVal && correctVal && studentVal.toLowerCase() === correctVal.toLowerCase()) {
                correctCount++;
            }
        });
        return correctParts.length > 0 ? (correctCount / correctParts.length) * maxPoints : 0;
    }
    
    // Fallback for shortanswer / numerical / multichoice with partial match/trim
    const cleanStudent = sClean.toLowerCase().replace(/[^a-z0-9äöüß]/g, '');
    const cleanCorrect = cClean.toLowerCase().replace(/[^a-z0-9äöüß]/g, '');
    if (cleanStudent === cleanCorrect || cleanCorrect.includes(cleanStudent) || cleanStudent.includes(cleanCorrect)) {
        return maxPoints;
    }
    
    return 0;
}

// Helper to parse localized Mebis number format ("6,94" -> 6.94)
function parseMebisNumber(val) {
    if (val === undefined || val === null || val === '-' || val.toString().trim() === '') {
        return null;
    }
    const clean = val.toString().replace(',', '.').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
}

// Parse Mebis JSON
function parseMebisJson(jsonText) {
    let raw = JSON.parse(jsonText);
    
    // Flatten array if nested double [[...]]
    if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
        raw = raw[0];
    }
    
    if (!Array.isArray(raw)) {
        throw new Error("Ungültiges JSON-Format. Erwartet wird ein Array von Objekten.");
    }
    
    const students = [];
    let classAverageObj = null;
    
    raw.forEach(item => {
        if (item.nachname && item.nachname.trim() === "Gesamtdurchschnitt") {
            classAverageObj = item;
        } else if (item.nachname || item.vorname) {
            students.push(item);
        }
    });
    
    // Identify question columns (e.g. f1083, f2083, f3250, f10083)
    let questionKeys = [];
    let isAntwortenFormat = false;
    
    if (raw.length > 0) {
        // Search keys of the first item
        const sample = raw[0];
        for (const key in sample) {
            if (/^f\d+/.test(key)) {
                questionKeys.push(key);
            }
        }
        
        // If no f-keys, check for frageX keys (Antworten format)
        if (questionKeys.length === 0) {
            for (const key in sample) {
                if (/^frage\d+$/.test(key)) {
                    questionKeys.push(key);
                }
            }
            if (questionKeys.length > 0) {
                isAntwortenFormat = true;
                // Sort keys: frage1, frage2, ..., frage10
                questionKeys.sort((a, b) => {
                    const idxA = parseInt(a.replace('frage', ''), 10);
                    const idxB = parseInt(b.replace('frage', ''), 10);
                    return idxA - idxB;
                });
            }
        } else {
            // Sort question keys by their question index extracted from key (e.g. f1083 -> index 1, f10083 -> index 10)
            questionKeys.sort((a, b) => {
                const idxA = parseInt(a.slice(1, -3), 10);
                const idxB = parseInt(b.slice(1, -3), 10);
                return idxA - idxB;
            });
        }
    }
    
    // Parse question metadata from key
    const questions = questionKeys.map(key => {
        if (isAntwortenFormat) {
            const index = parseInt(key.replace('frage', ''), 10);
            const firstStudentSample = raw[0] || {};
            return {
                key, // e.g. "frage1"
                index,
                maxPoints: 1.0, // default, will be overridden during merge/grading
                isAntwortenFormat: true,
                textFromJson: firstStudentSample[key] || ''
            };
        } else {
            const idxStr = key.slice(1, -3);
            const index = parseInt(idxStr, 10);
            const maxPointsStr = key.slice(-3);
            const maxPoints = parseInt(maxPointsStr, 10) / 100;
            return {
                key,
                index,
                maxPoints,
                isAntwortenFormat: false
            };
        }
    });
    
    return {
        students,
        classAverageObj,
        questions,
        isAntwortenFormat
    };
}

// Parse Mebis XML (Moodle Quiz format)
function parseMebisXml(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Check for XML parsing error
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
        throw new Error("Fehler beim Parsen der XML-Datei: " + parseError.textContent);
    }
    
    // Select all <question> nodes that are not placeholders/categories
    const questionNodes = Array.from(xmlDoc.querySelectorAll('question[type]:not([type="category"])'));
    
    return questionNodes.map((q, idx) => {
        const type = q.getAttribute('type');
        const name = q.querySelector('name > text')?.textContent || q.querySelector('name')?.textContent || `Frage ${idx + 1}`;
        let text = q.querySelector('questiontext > text')?.textContent || q.querySelector('questiontext')?.textContent || '';
        
        // Clean Cloze question text placeholders to display clean [Lücke X] blanks instead of raw Moodle syntax
        if (type === 'cloze') {
            let clozeIndex = 1;
            text = text.replace(/\{[^{}]*\}/g, () => {
                return `<strong>[Lücke ${clozeIndex++}]</strong>`;
            });
        }
        
        // Extract answer choices and feedbacks
        const answers = Array.from(q.querySelectorAll('answer')).map(ans => {
            return {
                fraction: parseFloat(ans.getAttribute('fraction') || '0'),
                text: ans.querySelector('text')?.textContent || '',
                feedback: ans.querySelector('feedback > text')?.textContent || ans.querySelector('feedback')?.textContent || ''
            };
        });
        
        // For matching questions, extract subquestions
        const subquestions = Array.from(q.querySelectorAll('subquestion')).map(sub => {
            return {
                text: sub.querySelector('text')?.textContent || '',
                answer: sub.querySelector('answer > text')?.textContent || ''
            };
        });
        
        return {
            index: idx + 1,
            type,
            name,
            text,
            answers,
            subquestions
        };
    });
}

// Handle Test Upload Form Submit
async function handleTestUpload(e) {
    e.preventDefault();
    
    const jsonFile = document.getElementById('upload-json').files[0];
    const xmlFile = document.getElementById('upload-xml').files[0];
    const statsFile = document.getElementById('upload-stats').files[0];
    const customName = document.getElementById('upload-name').value.trim();
    
    if (!jsonFile || !xmlFile) {
        showNotification("Bitte wählen Sie sowohl eine JSON- als auch eine XML-Datei aus.", "error");
        return;
    }
    
    try {
        // Read JSON File
        const jsonText = await readFileAsText(jsonFile);
        const parsedJson = parseMebisJson(jsonText);
        
        // Read XML File
        const xmlText = await readFileAsText(xmlFile);
        const parsedXml = parseMebisXml(xmlText);
        
        // Read optional Stats File
        let parsedStats = null;
        if (statsFile) {
            const statsText = await readFileAsText(statsFile);
            parsedStats = parseMebisStatistikJson(statsText);
        }
        
        // Validate question count matches
        if (parsedJson.questions.length !== parsedXml.length) {
            console.warn(`Warnung: Anzahl der Fragen in JSON (${parsedJson.questions.length}) und XML (${parsedXml.length}) stimmt nicht überein.`);
        }
        
        // Merge questions metadata
        const mergedQuestions = parsedJson.questions.map(jq => {
            let xmlQ = null;
            let statQ = null;
            
            // 1. Try to match using Statistik if available (by quiz index mapping to name)
            if (parsedStats) {
                statQ = parsedStats.questions.find(sq => sq.index === jq.index) || null;
                if (statQ) {
                    xmlQ = parsedXml.find(xq => xq.name.trim().toLowerCase() === statQ.title.trim().toLowerCase()) || null;
                }
            }
            
            // 2. If no match yet and we have JSON text, match by cleaned question text
            if (!xmlQ && jq.isAntwortenFormat && jq.textFromJson) {
                const cleanJsonText = cleanTextForMatching(jq.textFromJson);
                xmlQ = parsedXml.find(xq => {
                    const cleanXmlText = cleanTextForMatching(xq.text);
                    return cleanXmlText && (cleanXmlText.includes(cleanJsonText) || cleanJsonText.includes(cleanXmlText));
                }) || null;
            }
            
            // 3. Fallback: match by index
            if (!xmlQ) {
                xmlQ = parsedXml.find(xq => xq.index === jq.index) || null;
            }
            
            // Try to find statQ by xmlQ name if not matched by index directly
            if (parsedStats && !statQ && xmlQ) {
                statQ = parsedStats.questions.find(sq => sq.title.trim().toLowerCase() === xmlQ.name.trim().toLowerCase()) || null;
            }
            
            // Calculate max points
            let maxPoints = jq.maxPoints;
            if (jq.isAntwortenFormat) {
                if (statQ && statQ.intendedWeight !== null) {
                    maxPoints = Math.round(statQ.intendedWeight * 1000) / 100;
                } else {
                    maxPoints = Math.round((10 / parsedJson.questions.length) * 100) / 100;
                }
            }
            
            return {
                key: jq.key,
                index: jq.index,
                maxPoints: maxPoints,
                name: xmlQ ? xmlQ.name : (statQ ? statQ.title : `Frage ${jq.index}`),
                type: xmlQ ? xmlQ.type : (statQ ? statQ.type : 'unknown'),
                text: xmlQ ? xmlQ.text : 'Keine Beschreibung im XML gefunden.',
                answers: xmlQ ? xmlQ.answers : [],
                subquestions: xmlQ ? xmlQ.subquestions : [],
                stats: statQ ? {
                    easeIndex: statQ.easeIndex,
                    discriminationIndex: statQ.discriminationIndex,
                    discriminationEfficiency: statQ.discriminationEfficiency,
                    responses: statQ.responses
                } : null
            };
        });
        
        // Default test name
        const testName = customName || xmlFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        
        // Extract default test date from the first student's completed date
        let testDate = new Date().toLocaleDateString('de-DE');
        if (parsedJson.students.length > 0 && parsedJson.students[0].beendet) {
            const dateStr = parsedJson.students[0].beendet.split('  ')[0];
            if (dateStr) testDate = dateStr;
        }
        
        // Build student results array
        const studentResults = parsedJson.students.map(s => {
            const scores = {};
            const responses = {};
            
            mergedQuestions.forEach(q => {
                if (parsedJson.isAntwortenFormat) {
                    // Responses JSON file format:
                    // s.antwort1 is the response text.
                    // s.richtigeantwort1 is the correct answer.
                    // If Moodle includes grades/points in the Responses export, it has s["f" + q.index] or similar.
                    let rawScore = null;
                    const possiblePointsKeys = [`f${q.index}`, `punkte${q.index}`, `score${q.index}`];
                    for (const pk of possiblePointsKeys) {
                        if (s[pk] !== undefined) {
                            rawScore = parseMebisNumber(s[pk]);
                            break;
                        }
                    }
                    
                    const studentAns = s[`antwort${q.index}`] || '';
                    const correctAns = s[`richtigeantwort${q.index}`] || '';
                    
                    responses[q.key] = studentAns;
                    
                    if (rawScore !== null) {
                        scores[q.key] = rawScore;
                    } else {
                        // Grade automatically if not in JSON file
                        scores[q.key] = gradeStudentResponse(studentAns, correctAns, q.type, q.maxPoints);
                    }
                } else {
                    // Bewertungen JSON file format
                    scores[q.key] = parseMebisNumber(s[q.key]);
                }
            });
            
            return {
                nachname: s.nachname || 'Unbekannt',
                vorname: s.vorname || '',
                email: '', // GDPR: Do not import or store student email addresses
                bewertung: parseMebisNumber(s.bewertung1000) || 0,
                dauerRaw: s.dauer || '-',
                dauerSeconds: parseMebisDuration(s.dauer),
                scores,
                responses
            };
        });
        
        // Build class averages for questions
        const questionAverages = {};
        if (parsedJson.classAverageObj && !parsedJson.isAntwortenFormat) {
            mergedQuestions.forEach(q => {
                const score = parseMebisNumber(parsedJson.classAverageObj[q.key]);
                questionAverages[q.key] = score;
            });
        } else {
            // Calculate average manually if not provided
            mergedQuestions.forEach(q => {
                let sum = 0;
                let count = 0;
                studentResults.forEach(sr => {
                    const score = sr.scores[q.key];
                    if (score !== null && score !== undefined) {
                        sum += score;
                        count++;
                    }
                });
                questionAverages[q.key] = count > 0 ? (sum / count) : 0;
            });
        }
        
        const classAverage = parsedJson.classAverageObj ? 
            parseMebisNumber(parsedJson.classAverageObj.bewertung1000) : 
            (studentResults.reduce((sum, s) => sum + s.bewertung, 0) / studentResults.length);
            
        // Calculate class average duration
        const validDurations = studentResults.filter(s => s.dauerSeconds > 0).map(s => s.dauerSeconds);
        const classAverageDuration = validDurations.length > 0 ? (validDurations.reduce((sum, v) => sum + v, 0) / validDurations.length) : 0;
        
        // Compile new test object
        const newTest = {
            id: 'test_' + Date.now(),
            name: testName,
            date: testDate,
            questions: mergedQuestions,
            results: studentResults,
            classAverage: classAverage || 0,
            questionAverages,
            statsSummary: parsedStats ? parsedStats.summary : null,
            classAverageDuration
        };
        
        // Save to state
        appState.tests.push(newTest);
        
        // Generate missing student codes for the class
        const activeClass = appState.classes.find(c => c.id === appState.currentClassId);
        if (activeClass) {
            if (!activeClass.studentCodes) activeClass.studentCodes = {};
            studentResults.forEach(r => {
                const key = `${r.nachname}_${r.vorname}`;
                if (!activeClass.studentCodes[key]) {
                    let newCode = generateStudentCode();
                    while (Object.values(activeClass.studentCodes).includes(newCode)) {
                        newCode = generateStudentCode();
                    }
                    activeClass.studentCodes[key] = newCode;
                }
            });
        }
        
        saveStateToStorage();
        
        // Reset form
        const formEl = document.getElementById('upload-form');
        if (formEl) formEl.reset();
        
        showNotification(`Test "${testName}" erfolgreich hinzugefügt!`, "success");
        switchTab('overview');
        
    } catch (error) {
        console.error("Upload error:", error);
        showNotification("Fehler beim Verarbeiten der Dateien: " + error.message, "error");
    }
}

// File Reader Helper
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error("Datei konnte nicht gelesen werden."));
        reader.readAsText(file, "UTF-8");
    });
}

// --- NOTIFICATION HELPER ---
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `
        <span class="notification-text">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    container.appendChild(notif);
    
    // Event listener to close
    notif.querySelector('.notification-close').addEventListener('click', () => {
        notif.remove();
    });
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateY(-10px)';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// --- OVERVIEW TAB RENDERING ---
let classTrendChart = null;

function renderOverviewTab() {
    const totalStudentsEl = document.getElementById('stat-students');
    const totalTestsEl = document.getElementById('stat-tests');
    const classAvgEl = document.getElementById('stat-average');
    const hardestTopicEl = document.getElementById('stat-hardest');
    
    if (appState.tests.length === 0) {
        // Show empty state
        document.getElementById('overview-content').style.display = 'none';
        document.getElementById('overview-empty-state').style.display = 'block';
        
        if (totalStudentsEl) totalStudentsEl.textContent = '0';
        if (totalTestsEl) totalTestsEl.textContent = '0';
        if (classAvgEl) classAvgEl.textContent = '-';
        if (hardestTopicEl) hardestTopicEl.textContent = '-';
        return;
    }
    
    document.getElementById('overview-content').style.display = 'grid';
    document.getElementById('overview-empty-state').style.display = 'none';
    
    // Compute Statistics
    const totalTests = appState.tests.length;
    
    // Get unique students list
    const studentMap = getUniqueStudentsMap();
    const totalStudents = studentMap.size;
    
    // Calculate global average grade
    let totalGradeSum = 0;
    let totalGradesCount = 0;
    appState.tests.forEach(test => {
        totalGradeSum += test.classAverage;
        totalGradesCount++;
    });
    const globalAverage = totalGradesCount > 0 ? (totalGradeSum / totalGradesCount) : 0;
    
    // Identify hardest question overall (lowest percentage score relative to max)
    let hardestQName = "-";
    let lowestQRatio = 1.0;
    
    appState.tests.forEach(test => {
        test.questions.forEach(q => {
            const avg = test.questionAverages[q.key];
            if (avg !== null && q.maxPoints > 0) {
                const ratio = avg / q.maxPoints;
                if (ratio < lowestQRatio) {
                    lowestQRatio = ratio;
                    hardestQName = `${test.name}: ${q.name} (${Math.round(ratio * 100)}% Erfolg)`;
                }
            }
        });
    });
    
    // Render Stats
    if (totalStudentsEl) totalStudentsEl.textContent = totalStudents;
    if (totalTestsEl) totalTestsEl.textContent = totalTests;
    if (classAvgEl) classAvgEl.textContent = globalAverage.toFixed(2).replace('.', ',');
    if (hardestTopicEl) {
        hardestTopicEl.textContent = hardestQName;
        hardestTopicEl.title = hardestQName;
    }
    
    // Render Chart
    renderClassTrendChart();
    
    // Render Student Table
    renderStudentTable();
    
    // Render Stats Card if statistics are available
    const statsSelect = document.getElementById('overview-stats-select');
    const statsCard = document.getElementById('overview-stats-card');
    
    if (statsSelect && statsCard) {
        const testsWithStats = appState.tests.filter(t => t.statsSummary);
        if (testsWithStats.length === 0) {
            statsCard.style.display = 'none';
        } else {
            const currentSelected = statsSelect.value;
            
            statsSelect.innerHTML = '';
            testsWithStats.forEach(test => {
                const option = document.createElement('option');
                option.value = test.id;
                option.textContent = test.name;
                statsSelect.appendChild(option);
            });
            
            // Restore selection or default to the latest test
            if (currentSelected && testsWithStats.some(t => t.id === currentSelected)) {
                statsSelect.value = currentSelected;
            } else {
                statsSelect.value = testsWithStats[testsWithStats.length - 1].id;
            }
            
            renderOverviewStatsCard(statsSelect.value);
        }
    }
    
    // Render Class Review (Wiederholungsbedarf) section
    renderClassReviewSection();
}

// Get unique students map from all tests
function getUniqueStudentsMap() {
    const studentMap = new Map(); // key: "Nachname_Vorname", value: { nachname, vorname, email, testScores: {} }
    
    // 1. First, collect all unique students from all tests
    appState.tests.forEach(test => {
        test.results.forEach(res => {
            const key = `${res.nachname.trim()}_${res.vorname.trim()}`;
            if (!studentMap.has(key)) {
                studentMap.set(key, {
                    nachname: res.nachname,
                    vorname: res.vorname,
                    email: res.email,
                    testScores: {}
                });
            }
        });
    });
    
    // 2. Map all scores and handle missing statuses (Krank vs 0 Punkte)
    studentMap.forEach((student, key) => {
        appState.tests.forEach(test => {
            const res = test.results.find(r => `${r.nachname.trim()}_${r.vorname.trim()}` === key);
            if (res) {
                student.testScores[test.id] = res.bewertung;
            } else {
                const status = (test.missingStatuses && test.missingStatuses[key]) || 'krank';
                if (status === 'null_punkte') {
                    student.testScores[test.id] = 0.0;
                }
                // If 'krank', the test is ignored (remains undefined, excluded from calculations)
            }
        });
    });
    
    return studentMap;
}

// Render class performance trend chart
function renderClassTrendChart() {
    const ctx = document.getElementById('class-trend-chart');
    if (!ctx) return;
    
    // Sort tests chronologically if dates can be parsed, otherwise keep insert order
    const sortedTests = [...appState.tests].sort((a, b) => {
        const parseDate = (dStr) => {
            const parts = dStr.split('.');
            if (parts.length === 3) {
                return new Date(parseInt(parts[2], 10), getGermanMonthIndex(parts[1]), parseInt(parts[0], 10));
            }
            return new Date(0);
        };
        return parseDate(a.date) - parseDate(b.date);
    });
    
    const labels = sortedTests.map(t => t.name);
    const data = sortedTests.map(t => t.classAverage);
    
    if (classTrendChart) {
        classTrendChart.destroy();
    }
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#1e293b';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    
    classTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Klassendurchschnitt (Punkte)',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.3,
                fill: true,
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#6366f1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Schnitt: ${context.parsed.y.toFixed(2).replace('.', ',')} / 10`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

function getGermanMonthIndex(monthStr) {
    const m = monthStr.trim().toLowerCase();
    const months = ["januar", "februar", "märz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"];
    const num = parseInt(m, 10);
    if (!isNaN(num)) return num - 1;
    
    return months.findIndex(name => name.includes(m)) || 0;
}

// Render student table with filtering
function renderStudentTable(filterText = '') {
    const tbody = document.getElementById('student-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const studentMap = getUniqueStudentsMap();
    const query = filterText.toLowerCase().trim();
    
    const rowsData = [];
    
    studentMap.forEach((student, key) => {
        const fullName = `${student.vorname} ${student.nachname}`;
        if (query && !fullName.toLowerCase().includes(query) && !student.email.toLowerCase().includes(query)) {
            return;
        }
        
        const scores = Object.values(student.testScores);
        const avg = scores.length > 0 ? (scores.reduce((sum, val) => sum + val, 0) / scores.length) : 0;
        const count = scores.length;
        
        let trend = 'neutral';
        if (appState.tests.length >= 2) {
            const sortedTestIds = [...appState.tests].map(t => t.id);
            const studentTests = sortedTestIds.filter(id => student.testScores[id] !== undefined);
            if (studentTests.length >= 2) {
                const latestScore = student.testScores[studentTests[studentTests.length - 1]];
                const prevScore = student.testScores[studentTests[studentTests.length - 2]];
                if (latestScore > prevScore + 0.2) trend = 'up';
                else if (latestScore < prevScore - 0.2) trend = 'down';
            }
        }
        
        rowsData.push({
            studentKey: key,
            fullName,
            email: student.email,
            count,
            avg,
            trend
        });
    });
    
    rowsData.sort((a, b) => b.avg - a.avg);
    
    if (rowsData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Keine Schüler gefunden.</td></tr>`;
        const toggleContainer = document.getElementById('student-list-toggle-container');
        if (toggleContainer) toggleContainer.style.display = 'none';
        return;
    }
    
    // Collapsible list logic
    const toggleContainer = document.getElementById('student-list-toggle-container');
    const toggleBtn = document.getElementById('btn-toggle-student-list');
    let displayedRows = rowsData;
    
    if (query === '' && rowsData.length > 5) {
        if (toggleContainer) toggleContainer.style.display = 'flex';
        if (showAllStudentsInOverview) {
            if (toggleBtn) toggleBtn.textContent = "Weniger anzeigen (▲)";
        } else {
            displayedRows = rowsData.slice(0, 5);
            if (toggleBtn) toggleBtn.textContent = `Alle ${rowsData.length} Schüler anzeigen (▼)`;
        }
    } else {
        if (toggleContainer) toggleContainer.style.display = 'none';
    }
    
    displayedRows.forEach(row => {
        const tr = document.createElement('tr');
        
        let trendIcon = '<span class="trend-icon neutral">→</span>';
        if (row.trend === 'up') trendIcon = '<span class="trend-icon up">↑</span>';
        if (row.trend === 'down') trendIcon = '<span class="trend-icon down">↓</span>';
        
        tr.innerHTML = `
            <td>
                <button class="btn-link student-click-btn" data-key="${row.studentKey}">${row.fullName}</button>
                <div class="text-muted text-xs">${row.email}</div>
            </td>
            <td class="text-center">${row.count}</td>
            <td class="text-center font-bold">${row.avg.toFixed(2).replace('.', ',')} / 10</td>
            <td class="text-center">${trendIcon}</td>
            <td class="text-right">
                <button class="btn btn-sm btn-outline student-click-btn" data-key="${row.studentKey}">Verlauf ansehen</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    tbody.querySelectorAll('.student-click-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-key');
            navigateToStudentDetail(key);
        });
    });
}

function navigateToStudentDetail(studentKey) {
    switchTab('students');
    const select = document.getElementById('student-detail-select');
    if (select) {
        select.value = studentKey;
        renderStudentDetail(studentKey);
    }
}


// --- STUDENTS TAB RENDERING ---
let studentProgressChart = null;

function renderStudentsTab() {
    const select = document.getElementById('student-detail-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Schüler auswählen --</option>';
    
    if (appState.tests.length === 0) {
        document.getElementById('student-detail-content').style.display = 'none';
        document.getElementById('student-detail-empty-state').style.display = 'block';
        return;
    }
    
    const studentMap = getUniqueStudentsMap();
    const sortedStudents = Array.from(studentMap.entries()).sort((a, b) => {
        return `${a[1].nachname} ${a[1].vorname}`.localeCompare(`${b[1].nachname} ${b[1].vorname}`);
    });
    
    sortedStudents.forEach(([key, student]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${student.nachname}, ${student.vorname}`;
        select.appendChild(option);
    });
    
    const currentSelected = select.value;
    if (currentSelected) {
        renderStudentDetail(currentSelected);
    } else {
        document.getElementById('student-detail-content').style.display = 'none';
        document.getElementById('student-detail-empty-state').style.display = 'block';
    }
}

function renderStudentDetail(studentKey) {
    const detailContent = document.getElementById('student-detail-content');
    const emptyState = document.getElementById('student-detail-empty-state');
    
    if (!studentKey) {
        detailContent.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    detailContent.style.display = 'grid';
    emptyState.style.display = 'none';
    
    const studentMap = getUniqueStudentsMap();
    const student = studentMap.get(studentKey);
    if (!student) return;
    
    document.getElementById('detail-student-name').textContent = `${student.vorname} ${student.nachname}`;
    document.getElementById('detail-student-email').textContent = student.email;
    
    const scores = Object.values(student.testScores);
    const avg = scores.length > 0 ? (scores.reduce((sum, v) => sum + v, 0) / scores.length) : 0;
    const testCount = scores.length;
    
    document.getElementById('detail-stat-tests').textContent = testCount;
    document.getElementById('detail-stat-avg').textContent = avg.toFixed(2).replace('.', ',') + ' / 10';
    
    const classRanks = getSortedClassAverages();
    const rank = classRanks.findIndex(item => item.key === studentKey) + 1;
    document.getElementById('detail-stat-rank').textContent = rank > 0 ? `${rank} / ${classRanks.length}` : '-';

    // Calculate average duration
    let studentDurations = [];
    appState.tests.forEach(test => {
        const res = test.results.find(r => `${r.nachname.trim()}_${r.vorname.trim()}` === `${student.nachname.trim()}_${student.vorname.trim()}`);
        if (res && res.dauerSeconds > 0) {
            studentDurations.push(res.dauerSeconds);
        }
    });
    const avgDurationSeconds = studentDurations.length > 0 ? (studentDurations.reduce((sum, v) => sum + v, 0) / studentDurations.length) : 0;
    const timeStatEl = document.getElementById('detail-stat-time');
    if (timeStatEl) {
        timeStatEl.textContent = formatDuration(avgDurationSeconds);
    }
    
    renderStudentProgressChart(student, studentKey);
    analyzeGapsAndStrengths(student);
    renderStudentTestsDetailedList(student);
    renderStudentLernpaketeDetailedList(student, studentKey);
    
    if (window.MathJax && typeof window.MathJax.typeset === 'function') {
        window.MathJax.typeset();
    }
}

function getSortedClassAverages() {
    const studentMap = getUniqueStudentsMap();
    const studentsList = [];
    
    studentMap.forEach((student, key) => {
        const scores = Object.values(student.testScores);
        const avg = scores.length > 0 ? (scores.reduce((sum, v) => sum + v, 0) / scores.length) : 0;
        studentsList.push({ key, avg });
    });
    
    return studentsList.sort((a, b) => b.avg - a.avg);
}

function renderStudentProgressChart(student, studentKey) {
    const ctx = document.getElementById('student-trend-chart');
    if (!ctx) return;
    
    const sortedTests = [...appState.tests];
    
    const labels = sortedTests.map(t => t.name);
    const studentData = sortedTests.map(t => student.testScores[t.id] !== undefined ? student.testScores[t.id] : null);
    const classData = sortedTests.map(t => t.classAverage);
    
    if (studentProgressChart) {
        studentProgressChart.destroy();
    }
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#1e293b';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    
    studentProgressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Schüler-Punkte',
                    data: studentData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.2,
                    fill: false,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: '#10b981',
                    spanGaps: true
                },
                {
                    label: 'Klassenschnitt',
                    data: classData,
                    borderColor: '#6366f1',
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    tension: 0.2,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#6366f1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed.y !== null ? context.parsed.y.toFixed(2).replace('.', ',') : '-';
                            return `${context.dataset.label}: ${val} / 10`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

function analyzeGapsAndStrengths(student) {
    const gapsListEl = document.getElementById('analysis-gaps-list');
    const strengthsListEl = document.getElementById('analysis-strengths-list');
    
    if (!gapsListEl || !strengthsListEl) return;
    
    gapsListEl.innerHTML = '';
    strengthsListEl.innerHTML = '';
    
    const gaps = [];
    const strengths = [];
    
    appState.tests.forEach(test => {
        const result = test.results.find(r => `${r.nachname.trim()}_${r.vorname.trim()}` === `${student.nachname.trim()}_${student.vorname.trim()}`);
        if (!result) return;
        
        test.questions.forEach(q => {
            const score = result.scores[q.key];
            if (score === null || score === undefined) {
                gaps.push({
                    testName: test.name,
                    question: q,
                    score: 0,
                    skipped: true
                });
            } else if (q.maxPoints > 0) {
                const ratio = score / q.maxPoints;
                const info = {
                    testName: test.name,
                    question: q,
                    score: score,
                    skipped: false
                };
                
                if (ratio <= 0.20) {
                    gaps.push(info);
                } else if (ratio >= 0.80) {
                    strengths.push(info);
                }
            }
        });
    });
    
    // Render Gaps
    if (gaps.length === 0) {
        gapsListEl.innerHTML = `<div class="empty-notice">Keine inhaltlichen Lücken festgestellt (alle Fragen gut gelöst!).</div>`;
    } else {
        gaps.forEach(item => {
            const div = document.createElement('div');
            div.className = 'analysis-card gap-card';
            
            const labelText = item.skipped ? 'Nicht beantwortet (Lücke)' : `Nur ${item.score.toFixed(2).replace('.', ',')} / ${item.question.maxPoints.toFixed(2).replace('.', ',')} P.`;
            
            div.innerHTML = `
                <div class="analysis-card-header">
                    <span class="badge badge-red">${labelText}</span>
                    <span class="analysis-test-name">${item.testName}</span>
                </div>
                <h4 class="analysis-q-name">${item.question.name}</h4>
                <div class="analysis-q-text">${item.question.text}</div>
                ${getFeedbackSnippet(item.question, item.score)}
            `;
            gapsListEl.appendChild(div);
        });
    }
    
    // Render Strengths
    if (strengths.length === 0) {
        strengthsListEl.innerHTML = `<div class="empty-notice">Keine besonderen Stärken (Ergebnis über 80% bei Einzelfragen) verzeichnet.</div>`;
    } else {
        strengths.forEach(item => {
            const div = document.createElement('div');
            div.className = 'analysis-card strength-card';
            div.innerHTML = `
                <div class="analysis-card-header">
                    <span class="badge badge-green">Erfolgreich (${item.score.toFixed(2).replace('.', ',')} / ${item.question.maxPoints.toFixed(2).replace('.', ',')} P.)</span>
                    <span class="analysis-test-name">${item.testName}</span>
                </div>
                <h4 class="analysis-q-name">${item.question.name}</h4>
                <div class="analysis-q-text text-sm muted">${item.question.text}</div>
            `;
            strengthsListEl.appendChild(div);
        });
    }
}

function getFeedbackSnippet(question, score) {
    if (!question.answers || question.answers.length === 0) return '';
    
    const ratio = question.maxPoints > 0 ? (score / question.maxPoints) * 100 : 0;
    
    const matchingAns = question.answers.find(ans => Math.abs(ans.fraction - ratio) < 5);
    
    if (matchingAns && matchingAns.feedback && matchingAns.feedback.trim() !== '') {
        return `
            <div class="analysis-feedback">
                <strong>Hilfestellung / Feedback:</strong> ${matchingAns.feedback}
            </div>
        `;
    }
    
    const correctAns = question.answers.find(ans => ans.fraction === 100);
    if (correctAns && correctAns.text && correctAns.text.trim() !== '') {
        return `
            <div class="analysis-feedback">
                <strong>Richtige Antwort war:</strong> <code class="bg-gray">${correctAns.text}</code>
                ${correctAns.feedback ? `<br><strong>Erklärung:</strong> ${correctAns.feedback}` : ''}
            </div>
        `;
    }
    
    if (question.type === 'matching' && question.subquestions && question.subquestions.length > 0) {
        const correctMapping = question.subquestions.map(sub => `<li>${sub.text} &rarr; <strong>${sub.answer}</strong></li>`).join('');
        return `
            <div class="analysis-feedback">
                <strong>Korrekte Zuordnungen:</strong>
                <ul class="text-xs list-disc pl-4">${correctMapping}</ul>
            </div>
        `;
    }
    
    return '';
}

function renderStudentTestsDetailedList(student) {
    const container = document.getElementById('student-tests-details-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (appState.tests.length === 0) {
        container.innerHTML = `<div class="empty-notice">Keine Tests in dieser Klasse vorhanden.</div>`;
        return;
    }
    
    const studentKey = `${student.nachname.trim()}_${student.vorname.trim()}`;
    
    appState.tests.forEach(test => {
        const result = test.results.find(r => `${r.nachname.trim()}_${r.vorname.trim()}` === studentKey);
        const card = document.createElement('div');
        card.className = 'test-detail-item-card';
        
        if (result) {
            // Render detailed test questions
            let questionsHtml = '';
            test.questions.forEach((q) => {
                const score = result.scores[q.key];
                const max = q.maxPoints;
                let statusClass = 'neutral';
                let statusText = 'Nicht beantwortet';
                
                if (score !== null && score !== undefined) {
                    const ratio = score / max;
                    if (ratio >= 0.8) {
                        statusClass = 'success';
                        statusText = 'Gelöst';
                    } else if (ratio > 0.2) {
                        statusClass = 'warning';
                        statusText = 'Teilweise';
                    } else {
                        statusClass = 'danger';
                        statusText = 'Falsch';
                    }
                }
                
                const scoreStr = score !== null ? score.toFixed(2).replace('.', ',') : '-';
                
                let subqDetailsHtml = '';
                if (q.type === 'matching' && q.subquestions && q.subquestions.length > 0) {
                    const subs = q.subquestions.map(sub => `<li>${sub.text}: <strong>${sub.answer}</strong></li>`).join('');
                    subqDetailsHtml = `<div class="q-subdetails">Zuordnungen:<ul class="list-disc pl-4">${subs}</ul></div>`;
                }
                
                let studentResponseHtml = '';
                if (result.responses && result.responses[q.key] !== undefined && result.responses[q.key].trim() !== '') {
                    studentResponseHtml = `
                        <div class="q-response text-xs ml-6 mt-2">
                            <strong>Eingegebene Antwort des Schülers:</strong> <code class="bg-gray font-mono text-xs">${result.responses[q.key]}</code>
                        </div>
                    `;
                }
                
                questionsHtml += `
                    <div class="q-row border-t py-3">
                        <div class="q-row-header flex justify-between items-center mb-1">
                            <div class="q-index-name">
                                <span class="q-index font-bold text-sm">Frage ${q.index}:</span>
                                <span class="q-name font-semibold text-sm">${q.name}</span>
                                <span class="text-xs text-muted ml-2">(${q.type})</span>
                            </div>
                            <div class="q-score flex items-center">
                                <span class="badge badge-sm badge-${statusClass} mr-2">${statusText}</span>
                                <span class="score-points font-mono text-sm font-bold">${scoreStr} / ${max.toFixed(2).replace('.', ',')} P.</span>
                            </div>
                        </div>
                        <div class="q-text-body text-sm text-gray-600 dark:text-gray-300 ml-6">${q.text}</div>
                        ${subqDetailsHtml}
                        ${studentResponseHtml}
                        ${getFeedbackSnippet(q, score !== null ? score : 0) ? `
                        <div class="ml-6 mt-2 text-xs">
                            ${getFeedbackSnippet(q, score !== null ? score : 0)}
                        </div>` : ''}
                    </div>
                `;
            });
            
            const scoreRatio = test.classAverage > 0 ? (result.bewertung / test.classAverage) : 1;
            const relativePerformance = scoreRatio > 1.05 ? 'Überdurchschnittlich' : (scoreRatio < 0.95 ? 'Unterdurchschnittlich' : 'Durchschnittlich');
            const performanceBadgeClass = scoreRatio > 1.05 ? 'green' : (scoreRatio < 0.95 ? 'red' : 'indigo');
            
            const suspicion = checkCheatingSuspicion(test, result);
            let timeAnomalyHtml = '';
            if (suspicion.suspicious) {
                timeAnomalyHtml = `
                    <div class="mb-4 p-3 rounded text-xs flex items-start gap-2" style="background-color: rgba(245, 158, 11, 0.12); border-left: 4px solid var(--warning); border-radius: 0.375rem;">
                        <span style="font-size: 1.1rem; line-height: 1;">⚠️</span>
                        <div>
                            <strong class="text-yellow-700 dark:text-yellow-400 font-bold block mb-1">Auffällige Bearbeitungszeit (Möglicher Täuschungsversuch)</strong>
                            <span style="color: var(--text-secondary);">${suspicion.reason}</span>
                        </div>
                    </div>
                `;
            } else if (result.dauerSeconds > 0 && test.classAverageDuration > 0) {
                if (result.dauerSeconds < test.classAverageDuration * 0.45) {
                    if (result.bewertung >= 8.0) {
                        timeAnomalyHtml = `
                            <div class="mb-4 p-3 rounded text-xs flex items-start gap-2" style="background-color: rgba(16, 185, 129, 0.12); border-left: 4px solid var(--success); border-radius: 0.375rem;">
                                <span style="font-size: 1.1rem; line-height: 1;">⚡</span>
                                <div>
                                    <strong class="text-green-700 dark:text-green-400 font-bold block mb-1">Hervorragendes Arbeitstempo</strong>
                                    <span style="color: var(--text-secondary);">Der Schüler hat den Test extrem schnell absolviert (${Math.round((1 - result.dauerSeconds/test.classAverageDuration)*100)}% schneller als der Klassenschnitt) bei hervorragendem Ergebnis. Zeigt große Sicherheit.</span>
                                </div>
                            </div>
                        `;
                    } else if (result.bewertung <= 4.0) {
                        timeAnomalyHtml = `
                            <div class="mb-4 p-3 rounded text-xs flex items-start gap-2" style="background-color: rgba(239, 68, 68, 0.12); border-left: 4px solid var(--danger); border-radius: 0.375rem;">
                                <span style="font-size: 1.1rem; line-height: 1;">⏱️</span>
                                <div>
                                    <strong class="text-red-700 dark:text-red-400 font-bold block mb-1">Sehr kurzes Arbeitstempo (Vermutlich geraten)</strong>
                                    <span style="color: var(--text-secondary);">Der Test wurde in extrem kurzer Zeit abgegeben bei ungenügender Punktzahl. Die Fragen wurden womöglich nur durchgeklickt.</span>
                                </div>
                            </div>
                        `;
                    }
                }
            }
            
            card.innerHTML = `
                <div class="test-detail-header-row flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-t-lg border-b cursor-pointer" onclick="toggleTestDetailsCollapse(this)">
                    <div>
                        <h3 class="text-lg font-bold flex items-center">
                            <span class="collapse-icon mr-2">&#9658;</span>
                            ${test.name}
                        </h3>
                        <div class="text-sm text-muted">
                            Test-Datum: ${test.date} | Dauer: <strong>${result.dauerRaw || '-'}</strong>
                            ${test.classAverageDuration > 0 ? ` (Klassen-Schnitt: ${formatDuration(test.classAverageDuration)})` : ''}
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div class="text-right mr-4">
                            <div class="font-bold text-lg text-indigo-600 dark:text-indigo-400">${result.bewertung.toFixed(2).replace('.', ',')} / 10</div>
                            <div class="text-xs text-muted">Klassen-Schnitt: ${test.classAverage.toFixed(2).replace('.', ',')}</div>
                        </div>
                        <span class="badge badge-${performanceBadgeClass}">${relativePerformance}</span>
                    </div>
                </div>
                <div class="test-detail-body-collapse hidden p-4">
                    ${timeAnomalyHtml}
                    <div class="question-list-detailed">
                        ${questionsHtml}
                    </div>
                </div>
            `;
        } else {
            // Student did not participate in this test
            const currentStatus = (test.missingStatuses && test.missingStatuses[studentKey]) || 'krank';
            const statusLabel = currentStatus === 'null_punkte' ? 'Unentschuldigt (0,00 / 10 P.)' : 'Krank / Entschuldigt (kein Einfluss)';
            const badgeClass = currentStatus === 'null_punkte' ? 'red' : 'neutral';
            
            card.innerHTML = `
                <div class="test-detail-header-row flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-t-lg border-b cursor-pointer" onclick="toggleTestDetailsCollapse(this)">
                    <div>
                        <h3 class="text-lg font-bold flex items-center text-gray-500">
                            <span class="collapse-icon mr-2">&#9658;</span>
                            ${test.name}
                        </h3>
                        <div class="text-sm text-muted">
                            Test-Datum: ${test.date} | <strong>Nicht teilgenommen</strong>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="badge badge-${badgeClass}">${statusLabel}</span>
                    </div>
                </div>
                <div class="test-detail-body-collapse hidden p-4 bg-gray-50 dark:bg-gray-900">
                    <div class="flex flex-col gap-2 p-3 bg-white dark:bg-gray-800 rounded border">
                        <strong class="text-sm block">Teilnahme-Status bearbeiten:</strong>
                        <p class="text-xs text-secondary mb-2">Hier können Sie festlegen, ob das Fehlen des Schülers entschuldigt ist (keine Auswirkung auf die Gesamtbewertung) oder unentschuldigt (wird mit 0 Punkten gewertet).</p>
                        <div class="flex items-center gap-2">
                            <select class="input py-1 text-xs" style="width: auto; padding: 4px 8px; font-size: 0.75rem;" 
                                    onchange="updateMissingStatus('${test.id}', '${studentKey}', this.value)">
                                <option value="krank" ${currentStatus === 'krank' ? 'selected' : ''}>Krank / Entschuldigt (Wertung aussetzen)</option>
                                <option value="null_punkte" ${currentStatus === 'null_punkte' ? 'selected' : ''}>Unentschuldigt (0 Punkte Wertung)</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.appendChild(card);
    });
}

window.updateMissingStatus = function(testId, studentKey, newStatus) {
    const test = appState.tests.find(t => t.id === testId);
    if (!test) return;
    
    if (!test.missingStatuses) {
        test.missingStatuses = {};
    }
    
    test.missingStatuses[studentKey] = newStatus;
    saveStateToStorage();
    
    // Re-render student detail and calculate ranks again
    renderStudentDetail(studentKey);
    showNotification("Fehlzeiten-Status erfolgreich aktualisiert!", "success");
};

window.toggleTestDetailsCollapse = function(headerElement) {
    const body = headerElement.nextElementSibling;
    const icon = headerElement.querySelector('.collapse-icon');
    
    if (body.classList.contains('hidden')) {
        body.classList.remove('hidden');
        icon.innerHTML = '&#9660;';
    } else {
        body.classList.add('hidden');
        icon.innerHTML = '&#9658;';
    }
};


// --- TESTS TAB (ADMIN / MANAGE) RENDERING ---
function renderTestsTab() {
    const listContainer = document.getElementById('uploaded-tests-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    if (appState.tests.length === 0) {
        listContainer.innerHTML = `<div class="empty-notice py-6">Keine Tests hochgeladen. Nutzen Sie das Formular oben, um Ihren ersten Test zu importieren.</div>`;
        return;
    }
    
    appState.tests.forEach((test) => {
        const card = document.createElement('div');
        card.className = 'test-manage-card';
        const count = test.results.length;
        
        card.innerHTML = `
            <div class="test-manage-info">
                <div class="test-manage-name-row">
                    <span class="test-manage-name">${test.name}</span>
                    <span class="badge badge-indigo">${test.questions.length} Fragen</span>
                </div>
                <div class="test-manage-meta">
                    <span><strong>Datum:</strong> ${test.date}</span> | 
                    <span><strong>Teilnehmer:</strong> ${count}</span> | 
                    <span><strong>Durchschnitt:</strong> ${test.classAverage.toFixed(2).replace('.', ',')} / 10</span>
                </div>
            </div>
            <div class="test-manage-actions">
                <button class="btn btn-sm btn-outline btn-edit-test mr-2" data-id="${test.id}">Bearbeiten</button>
                <button class="btn btn-sm btn-danger btn-delete-test" data-id="${test.id}">Löschen</button>
            </div>
            <div class="test-edit-inputs hidden border-t mt-3 pt-3 flex flex-wrap gap-2 items-end">
                <div class="flex-grow min-w-[200px]">
                    <label class="block text-xs font-semibold mb-1">Name des Tests</label>
                    <input type="text" class="input input-sm w-full input-edit-name" value="${test.name}">
                </div>
                <div>
                    <label class="block text-xs font-semibold mb-1">Datum</label>
                    <input type="text" class="input input-sm input-edit-date" value="${test.date}">
                </div>
                <button class="btn btn-sm btn-indigo btn-save-edit" data-id="${test.id}">Speichern</button>
                <button class="btn btn-sm btn-outline btn-cancel-edit">Abbrechen</button>
            </div>
        `;
        
        listContainer.appendChild(card);
    });
    
    listContainer.querySelectorAll('.btn-delete-test').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            deleteTest(id);
        });
    });
    
    listContainer.querySelectorAll('.btn-edit-test').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.test-manage-card');
            const inputsDiv = card.querySelector('.test-edit-inputs');
            inputsDiv.classList.remove('hidden');
        });
    });
    
    listContainer.querySelectorAll('.btn-cancel-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.test-manage-card');
            const inputsDiv = card.querySelector('.test-edit-inputs');
            inputsDiv.classList.add('hidden');
        });
    });
    
    listContainer.querySelectorAll('.btn-save-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const card = btn.closest('.test-manage-card');
            const newName = card.querySelector('.input-edit-name').value.trim();
            const newDate = card.querySelector('.input-edit-date').value.trim();
            
            if (!newName) {
                showNotification("Name darf nicht leer sein.", "error");
                return;
            }
            
            updateTestMeta(id, newName, newDate);
        });
    });
}

function updateTestMeta(id, name, date) {
    const test = appState.tests.find(t => t.id === id);
    if (test) {
        test.name = name;
        test.date = date;
        saveStateToStorage();
        showNotification("Test-Metadaten aktualisiert.", "success");
        renderTestsTab();
    }
}

function deleteTest(id) {
    const test = appState.tests.find(t => t.id === id);
    if (!test) return;
    
    if (confirm(`Sind Sie sicher, dass Sie den Test "${test.name}" und alle zugehörigen Daten löschen möchten?`)) {
        const index = appState.tests.findIndex(t => t.id === id);
        if (index !== -1) {
            appState.tests.splice(index, 1);
        }
        saveStateToStorage();
        showNotification(`Test "${test.name}" wurde gelöscht.`, "info");
        renderTestsTab();
        
        const select = document.getElementById('student-detail-select');
        if (select) select.value = '';
    }
}


// --- BACKUP & RESTORE ---

function exportBackup() {
    if (appState.classes.length === 0) {
        showNotification("Keine Daten zum Exportieren vorhanden.", "info");
        return;
    }
    
    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        
        const timestamp = new Date().toISOString().slice(0, 10);
        dlAnchorElem.setAttribute("download", `mebis_lernverlauf_backup_${timestamp}.json`);
        dlAnchorElem.click();
        
        showNotification("Backup-Datei erfolgreich erstellt und heruntergeladen.", "success");
    } catch (e) {
        console.error(e);
        showNotification("Export fehlgeschlagen: " + e.message, "error");
    }
}

async function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const fileText = await readFileAsText(file);
        const importedData = JSON.parse(fileText);
        
        if (!importedData || (!Array.isArray(importedData.tests) && !Array.isArray(importedData.classes))) {
            throw new Error("Ungültiges Backup-Format. Die Datei muss Klassen oder Tests enthalten.");
        }
        
        if (confirm("Möchten Sie Ihre aktuellen Daten mit diesem Backup überschreiben? Alle bisherigen Tests und Klassen gehen verloren.")) {
            const currentRoomId = appState.roomId;
            appState = importedData;
            
            // Run migration if the backup is in the old single-class schema
            if (appState.tests && !appState.classes) {
                const firstTest = appState.tests[0];
                const defaultName = (firstTest && firstTest.statsSummary && firstTest.statsSummary.kursname) || "Chemie 9a";
                appState.classes = [
                    {
                        id: 'class_default',
                        name: defaultName,
                        tests: appState.tests
                    }
                ];
                appState.currentClassId = 'class_default';
            }
            
            if (!appState.classes || appState.classes.length === 0) {
                appState.classes = [
                    {
                        id: 'class_' + Date.now(),
                        name: 'Chemie 9a',
                        tests: []
                    }
                ];
                appState.currentClassId = appState.classes[0].id;
            }
            
            // Ensure Room ID exists even if importing an old backup
            if (!appState.roomId) {
                appState.roomId = currentRoomId || ('TR-' + Math.random().toString(36).substring(2, 8).toUpperCase());
            }
            
            bindCurrentClassTests();
            saveStateToStorage();
            
            showNotification("Backup erfolgreich eingespielt!", "success");
            e.target.value = '';
            
            populateClassDropdown();
            renderActiveTab();
            
            const select = document.getElementById('student-detail-select');
            if (select) select.value = '';
        }
    } catch (error) {
        console.error(error);
        showNotification("Import fehlgeschlagen: " + error.message, "error");
        e.target.value = '';
    }
}

function resetData() {
    if (confirm("WARNUNG: Dadurch werden alle hochgeladenen Tests und Schülerdaten der AKTUELLEN KLASSE unwiderruflich gelöscht. Möchten Sie fortfahren?")) {
        appState.tests.length = 0; // In-place clear to keep class reference intact
        saveStateToStorage();
        showNotification("Daten der aktuellen Klasse gelöscht.", "info");
        
        renderActiveTab();
        
        const select = document.getElementById('student-detail-select');
        if (select) select.value = '';
    }
}

// --- HIGHSCORE TAB RENDERING & GAMIFICATION ---

function populateHighscoreDropdown() {
    const select = document.getElementById('highscore-filter-select');
    if (!select) return;
    
    const currentVal = select.value;
    
    // Clear except the first option "overall"
    select.innerHTML = '<option value="overall">Gesamtwertung (Schuljahr)</option>';
    
    const isLernpakete = document.getElementById('highscore-type-lernpakete') && document.getElementById('highscore-type-lernpakete').classList.contains('active');
    const dataSource = isLernpakete ? (appState.lernpakete || []) : (appState.tests || []);
    
    dataSource.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        select.appendChild(option);
    });
    
    if (Array.from(select.options).some(o => o.value === currentVal)) {
        select.value = currentVal;
    } else {
        select.value = 'overall';
    }
}

function renderHighscoreTab() {
    populateHighscoreDropdown();
    
    const filterSelect = document.getElementById('highscore-filter-select');
    const filter = filterSelect ? filterSelect.value : 'overall';
    
    const emptyState = document.getElementById('highscore-empty-state');
    const content = document.getElementById('highscore-content');
    
    const isLernpakete = document.getElementById('highscore-type-lernpakete') && document.getElementById('highscore-type-lernpakete').classList.contains('active');
    const dataSource = isLernpakete ? appState.lernpakete : appState.tests;
    
    if (!dataSource || dataSource.length === 0) {
        emptyState.style.display = 'block';
        content.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    content.style.display = 'block';
    
    const studentMap = getUniqueStudentsMap();
    const leaderboardData = [];
    
    if (isLernpakete) {
        // Collect lernpakete scores per student
        const lpStudentScores = {};
        
        studentMap.forEach((student, studentKey) => {
            const studentFullName = `${student.vorname} ${student.nachname}`;
            const key = student.nachname.toLowerCase();
            
            if (!lpStudentScores[key]) {
                lpStudentScores[key] = { name: studentFullName, scores: [] };
            }
            
            appState.lernpakete.forEach(lp => {
                if (filter !== 'overall' && lp.id !== filter) return;
                
                const result = lp.data.find(r => matchStudentNames(r.name, studentFullName));
                if (result) {
                    lpStudentScores[key].scores.push(result.bewertung);
                } else {
                    const status = (lp.missingStatuses && lp.missingStatuses[studentKey]) || 'krank';
                    if (status === 'null_punkte') {
                        lpStudentScores[key].scores.push(0.0);
                    }
                    // If 'krank', the Lernpaket is ignored (no negative influence)
                }
            });
        });
        
        Object.keys(lpStudentScores).forEach(key => {
            const data = lpStudentScores[key];
            const avg = data.scores.length > 0 ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0;
            if (data.scores.length > 0) {
                leaderboardData.push({
                    key: key,
                    fullName: data.name,
                    score: avg
                });
            }
        });
    } else {
        studentMap.forEach((student, key) => {
            let score = 0;
            if (filter === 'overall') {
                const scores = Object.values(student.testScores);
                score = scores.length > 0 ? (scores.reduce((sum, v) => sum + v, 0) / scores.length) : 0;
            } else {
                score = student.testScores[filter];
            }
            
            if (score !== undefined && score !== null) {
                leaderboardData.push({
                    key,
                    fullName: `${student.vorname} ${student.nachname}`,
                    score: score
                });
            }
        });
    }
    
    // Sort descending
    leaderboardData.sort((a, b) => b.score - a.score);
    
    // Extract podium
    const gold = leaderboardData[0] || null;
    const silver = leaderboardData[1] || null;
    const bronze = leaderboardData[2] || null;
    
    // Render gold podium
    const goldNameEl = document.getElementById('podium-gold-name');
    const goldScoreEl = document.getElementById('podium-gold-score');
    const goldPodium = document.getElementById('podium-gold');
    if (gold) {
        goldPodium.style.display = 'flex';
        goldNameEl.textContent = gold.fullName;
        const goldVal = parseFloat(gold.score) || 0;
        goldScoreEl.textContent = goldVal.toFixed(2).replace('.', ',') + ' / 10';
        const badge = document.getElementById('podium-gold-badge');
        if (badge) badge.textContent = "👑 Mythisch";
        
        goldPodium.style.cursor = 'pointer';
        goldPodium.onclick = () => openShareModal(gold.fullName, 1, "Mythisch", "👑", goldVal);
    } else {
        goldPodium.style.display = 'none';
    }
    
    // Render silver podium
    const silverNameEl = document.getElementById('podium-silver-name');
    const silverScoreEl = document.getElementById('podium-silver-score');
    const silverPodium = document.getElementById('podium-silver');
    if (silver) {
        silverPodium.style.display = 'flex';
        silverNameEl.textContent = silver.fullName;
        const silverVal = parseFloat(silver.score) || 0;
        silverScoreEl.textContent = silverVal.toFixed(2).replace('.', ',') + ' / 10';
        const badge = document.getElementById('podium-silver-badge');
        if (badge) badge.textContent = "⭐ Legendär";
        
        silverPodium.style.cursor = 'pointer';
        silverPodium.onclick = () => openShareModal(silver.fullName, 2, "Legendär", "⭐", silverVal);
    } else {
        silverPodium.style.display = 'none';
    }
    
    // Render bronze podium
    const bronzeNameEl = document.getElementById('podium-bronze-name');
    const bronzeScoreEl = document.getElementById('podium-bronze-score');
    const bronzePodium = document.getElementById('podium-bronze');
    if (bronze) {
        bronzePodium.style.display = 'flex';
        bronzeNameEl.textContent = bronze.fullName;
        const bronzeVal = parseFloat(bronze.score) || 0;
        bronzeScoreEl.textContent = bronzeVal.toFixed(2).replace('.', ',') + ' / 10';
        const badge = document.getElementById('podium-bronze-badge');
        if (badge) badge.textContent = "⚡ Episch";
        
        bronzePodium.style.cursor = 'pointer';
        bronzePodium.onclick = () => openShareModal(bronze.fullName, 3, "Episch", "⚡", bronzeVal);
    } else {
        bronzePodium.style.display = 'none';
    }
    
    // Render Ranks 4+ Table
    const tbody = document.getElementById('leaderboard-table-body');
    if (tbody) {
        tbody.innerHTML = '';
        const remaining = leaderboardData.slice(3);
        
        if (remaining.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Keine weiteren Schüler auf der Liste.</td></tr>`;
        } else {
            remaining.forEach((item, index) => {
                const rank = index + 4;
                const scoreVal = item.score;
                
                // Gaming ranks for Ranks 4+
                let title = "Gewöhnlich";
                let badgeClass = "neutral";
                if (scoreVal >= 8.0) {
                    title = "🔵 Selten";
                    badgeClass = "indigo";
                } else if (scoreVal >= 6.0) {
                    title = "🟢 Ungewöhnlich";
                    badgeClass = "green";
                } else {
                    title = "⚪ Gewöhnlich";
                    badgeClass = "neutral";
                }
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="text-center font-bold" style="color: var(--text-secondary);">${rank}.</td>
                    <td>
                        <button class="btn-link student-click-btn" data-key="${item.key}">${item.fullName}</button>
                    </td>
                    <td class="text-center font-bold">${scoreVal.toFixed(2).replace('.', ',')} / 10</td>
                    <td class="text-center"><span class="badge badge-${badgeClass}">${title}</span></td>
                `;
                tbody.appendChild(tr);
            });
            
            // Attach click listeners to navigate to student profile
            tbody.querySelectorAll('.student-click-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.getAttribute('data-key');
                    navigateToStudentDetail(key);
                });
            });
        }
    }
}

// --- MEBIS QUIZ STATISTICS PARSER & RENDERER ---

function parseMebisStatistikJson(jsonText) {
    let raw = JSON.parse(jsonText);
    
    if (!Array.isArray(raw) || raw.length < 2) {
        throw new Error("Ungültiges Statistik-JSON-Format. Mindestens Zusammenfassung und Fragenliste werden erwartet.");
    }
    
    const summary = raw[0][0] || {};
    const questions = raw[1] || [];
    
    // Filter out Cloze and Description questions as they don't have matching response distribution arrays in the export
    const nonClozeQuestions = questions.filter(q => 
        q.typderfrage !== 'Lückentext (Cloze)' && 
        q.typderfrage !== 'Beschreibung'
    );
    
    const questionStats = questions.map(q => {
        let responses = [];
        if (q.typderfrage !== 'Lückentext (Cloze)' && q.typderfrage !== 'Beschreibung') {
            const nonClozeIdx = nonClozeQuestions.findIndex(nq => nq.f === q.f);
            if (nonClozeIdx !== -1 && raw[2 + nonClozeIdx]) {
                responses = raw[2 + nonClozeIdx];
            }
        }
        
        return {
            index: parseInt(q.f || '0', 10),
            type: q.typderfrage || '',
            title: q.titelderfrage || '',
            attempts: parseInt(q.versuche || '0', 10),
            easeIndex: parsePercentage(q.leichtigkeitsindex),
            stdDev: parsePercentage(q.standardabweichung),
            guessProb: parsePercentage(q.ratewahrscheinlichkeit),
            intendedWeight: parsePercentage(q.beabsichtigtegewichtung),
            effectiveWeight: parsePercentage(q.effektivegewichtung),
            discriminationIndex: parsePercentage(q.trennschrfeindex),
            discriminationEfficiency: parsePercentage(q['trennschrfe-effizienz']),
            responses: responses
        };
    });
    
    return {
        summary: {
            testName: summary['test-name'] || '',
            kursname: summary.kursname || '',
            attemptsCount: parseInt(summary.anzahldervollstndigbewertetenerstenversuche || '0', 10),
            totalAttempts: parseInt(summary.gesamtzahldervollstndigbewertetenversuche || '0', 10),
            avgFirstAttempt: summary.durchschnittbeierstemversuch || '',
            avgAllAttempts: summary.durchschnittsergebnisallerversuche || '',
            avgLastAttempt: summary.durchschnittderletztenbewertung || '',
            avgBestAttempt: summary.durchschnittderbestbewertetenversuche || '',
            medianBestAttempt: summary.medianfrbestbewerteterversuch || '',
            stdDevBestAttempt: summary.standardabweichungfrbestbewerteterversuch || '',
            consistency: summary.koeffizientinternerkonsistenzfrbestbewerteterversuch || '',
            errorRatio: summary.fehlerquotientfrbestbewerteterversuch || '',
            stdError: summary.standardfehlerfrbestbewerteterversuch || ''
        },
        questions: questionStats
    };
}

function parsePercentage(val) {
    if (!val) return null;
    const clean = val.replace('%', '').replace(',', '.').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? null : (num / 100);
}

function renderOverviewStatsCard(testId) {
    const card = document.getElementById('overview-stats-card');
    if (!card) return;
    
    const test = appState.tests.find(t => t.id === testId);
    if (!test || !test.statsSummary) {
        card.style.display = 'none';
        return;
    }
    
    card.style.display = 'flex';
    
    document.getElementById('stat-sum-kursname').textContent = test.statsSummary.kursname || 'N/A';
    document.getElementById('stat-sum-erstversuche').textContent = test.statsSummary.attemptsCount || '0';
    document.getElementById('stat-sum-erstschnitt').textContent = test.statsSummary.avgFirstAttempt || '0%';
    document.getElementById('stat-sum-stdfehler').textContent = test.statsSummary.stdError || '0%';
    document.getElementById('stat-sum-konsistenz').textContent = test.statsSummary.consistency || '0%';
    
    const tbody = document.getElementById('stats-questions-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        
        const questionsWithStats = test.questions.filter(q => q.stats);
        // Sort: hardest questions (lowest easeIndex) first
        questionsWithStats.sort((a, b) => (a.stats.easeIndex || 0) - (b.stats.easeIndex || 0));
        
        if (questionsWithStats.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">Keine Fragenschwierigkeiten gefunden.</td></tr>`;
        } else {
            questionsWithStats.forEach(q => {
                const tr = document.createElement('tr');
                tr.className = 'cursor-pointer stats-q-row';
                tr.setAttribute('data-qkey', q.key);
                
                const easePercent = q.stats.easeIndex !== null ? Math.round(q.stats.easeIndex * 100) + '%' : '-';
                const discPercent = q.stats.discriminationIndex !== null ? Math.round(q.stats.discriminationIndex * 100) + '%' : '-';
                
                let easeClass = 'success';
                if (q.stats.easeIndex !== null) {
                    if (q.stats.easeIndex < 0.5) easeClass = 'danger';
                    else if (q.stats.easeIndex < 0.8) easeClass = 'warning';
                }
                
                tr.innerHTML = `
                    <td class="text-center font-bold">Frage ${q.index}</td>
                    <td><button class="btn-link text-left stats-q-btn" style="text-align: left;">${q.name}</button></td>
                    <td class="text-center font-bold"><span class="badge badge-${easeClass}">${easePercent}</span></td>
                    <td class="text-center font-bold">${discPercent}</td>
                `;
                
                tr.addEventListener('click', () => {
                    tbody.querySelectorAll('.stats-q-row').forEach(row => row.classList.remove('bg-gray-100'));
                    tr.classList.add('bg-gray-100');
                    renderQuestionResponseDistribution(test, q);
                });
                
                tbody.appendChild(tr);
            });
            
            // Auto-click first row to show responses by default
            const firstRow = tbody.querySelector('.stats-q-row');
            if (firstRow) firstRow.click();
        }
    }
}

function renderQuestionResponseDistribution(test, question) {
    const container = document.getElementById('stats-responses-container');
    if (!container) return;
    
    container.innerHTML = '';
    container.classList.remove('empty-notice');
    
    if (!question.stats || !question.stats.responses || question.stats.responses.length === 0) {
        container.innerHTML = `<div class="empty-notice py-4">Keine Antwortverteilungen für diese Frage verfügbar.</div>`;
        return;
    }
    
    const responses = question.stats.responses;
    
    let html = `
        <div class="mb-4">
            <h5 class="font-bold text-sm mb-1">${question.name}</h5>
            <div class="text-xs text-muted mb-2">Fragetyp: ${question.type}</div>
            <div class="q-text-body text-xs bg-gray p-2 rounded mb-3" style="max-height: 80px; overflow-y: auto;">
                ${question.text}
            </div>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Antwortoption / Eingegebener Text</th>
                        <th class="text-center" style="width: 80px;">Bewertung</th>
                        <th class="text-center" style="width: 70px;">Anzahl</th>
                        <th class="text-center" style="width: 70px;">Frequenz</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    responses.forEach(resp => {
        const text = resp.tatschlicheantwort || resp.musterantwort || '[Keine Antwort]';
        const rawFraction = parseMebisNumber(resp.teilweisebewertung);
        
        let badgeClass = 'danger';
        if (rawFraction !== null) {
            if (rawFraction >= 100) badgeClass = 'success';
            else if (rawFraction > 0) badgeClass = 'warning';
        }
        
        const count = resp.zhlen || '0';
        const freq = resp.frequenz || '0%';
        const fractionText = resp.teilweisebewertung || '0%';
        
        html += `
            <tr>
                <td class="text-xs font-mono" style="white-space: normal; word-break: break-all;">
                    ${text}
                </td>
                <td class="text-center"><span class="badge badge-sm badge-${badgeClass}">${fractionText}</span></td>
                <td class="text-center font-bold text-xs">${count}</td>
                <td class="text-center font-bold text-xs">${freq}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
    
    if (window.MathJax && typeof window.MathJax.typeset === 'function') {
        window.MathJax.typeset();
    }
}

// --- DURATION PARSING & CHEATING ANOMALY DETECTION HELPER ---

function parseMebisDuration(durationStr) {
    if (!durationStr || durationStr === '-') return 0;
    
    let seconds = 0;
    const cleanStr = durationStr.toString().trim();
    
    // German duration text formats, e.g.:
    // "7 Minuten 44 Sekunden", "1 Stunde 5 Minuten", "38 Sekunden"
    const stundenMatch = cleanStr.match(/(\d+)\s*Stunde/i);
    const minutenMatch = cleanStr.match(/(\d+)\s*Minute/i);
    const sekundenMatch = cleanStr.match(/(\d+)\s*Sekunde/i);
    
    if (stundenMatch) {
        seconds += parseInt(stundenMatch[1], 10) * 3600;
    }
    if (minutenMatch) {
        seconds += parseInt(minutenMatch[1], 10) * 60;
    }
    if (sekundenMatch) {
        seconds += parseInt(sekundenMatch[1], 10);
    }
    
    return seconds;
}

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '-';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m} Min. ${s} Sek.`;
}

function checkCheatingSuspicion(test, result) {
    const studentSec = result.dauerSeconds || 0;
    const classAvgSec = test.classAverageDuration || 0;
    const score = result.bewertung || 0;
    
    // No suspicion if they took no time, or score is not high (>= 8.0/10)
    if (studentSec <= 0 || classAvgSec <= 0 || score < 8.0) {
        return { suspicious: false };
    }
    
    // Check if the test has Essay/Freitext questions
    const hasEssay = test.questions.some(q => 
        q.type === 'essay' || 
        q.type === 'freitext' || 
        q.name.toLowerCase().includes('freitext') ||
        q.text.toLowerCase().includes('freitext')
    );
    if (hasEssay) {
        return { suspicious: false };
    }
    
    // If student took > 1.7x of class average duration, flag it
    if (studentSec > classAvgSec * 1.7) {
        const diffPercent = Math.round((studentSec / classAvgSec - 1) * 100);
        return {
            suspicious: true,
            reason: `Der Schüler benötigt ${formatDuration(studentSec)} (${diffPercent}% über dem Klassenschnitt von ${formatDuration(classAvgSec)}) für einen reinen Auswahl- oder Kurzantwort-Test, erzielt dabei aber eine exzellente Note (${score.toFixed(2).replace('.', ',')} / 10). Dies kann auf systematisches Nachschlagen im Internet oder die Nutzung eines KI-Chatbots hindeuten.`
        };
    }
    
    return { suspicious: false };
}

window.copyTop5DeficitsAIPrompt = function() {
    if (appState.tests.length === 0) return;
    
    const reviewItems = [];
    appState.tests.forEach(test => {
        test.questions.forEach(q => {
            const avgScore = test.questionAverages[q.key];
            if (avgScore !== null && avgScore !== undefined && q.maxPoints > 0) {
                const ratio = avgScore / q.maxPoints;
                if (ratio < 0.60) {
                    reviewItems.push({
                        testName: test.name,
                        question: q,
                        ratio: ratio,
                        avgScore: avgScore
                    });
                }
            }
        });
    });
    
    if (reviewItems.length === 0) {
        showNotification("Keine Defizite gefunden.", "info");
        return;
    }
    
    // Sort by lowest ratio (worst performance)
    reviewItems.sort((a, b) => a.ratio - b.ratio);
    
    // Take top 5
    const top5 = reviewItems.slice(0, 5);
    
    let prompt = `Ich bin Lehrkraft und benötige deine Hilfe bei der Analyse der Testergebnisse meiner Klasse.
Bitte analysiere die folgenden Top 5 Defizite (die Fragen/Themen, die am schlechtesten abgeschnitten haben) und gliedere deine Antwort ZWINGEND in zwei separate Abschnitte:

ABSCHNITT 1: Defizite aufgrund von mangelhafter Fragenqualität
- Ordne hier alle Defizite ein, bei denen die Statistik (insbesondere eine niedrige oder negative Trennschärfe / Discrimination Index) darauf hindeutet, dass die Frage schlecht formuliert oder unklar war.
- Mache für diese Fragen konkrete Verbesserungsvorschläge, wie die Frageformulierungen optimiert werden können.
- Berücksichtige dabei die technischen Möglichkeiten und Fragetypen des Moodle/Mebis-Test-Aktivitäten-Moduls.

ABSCHNITT 2: Defizite aufgrund von inhaltlichen Verständnislücken
- Ordne hier alle Defizite ein, bei denen die Statistik (z. B. niedriger Leichtigkeitsindex bei normaler/positiver Trennschärfe) auf echtes Unverständnis des Themas durch die Schüler hindeutet.
- Gib mir hierzu konkrete didaktische Handlungsanweisungen und Ideen (z. B. Erklärungsansätze, Methoden, praktische Übungen), wie ich diese inhaltlichen Lücken mit den Schülern im Unterricht effektiv aufarbeiten kann.

Hier sind die Top 5 Defizite meiner Klasse:

`;

    top5.forEach((item, index) => {
        prompt += `--- Defizit ${index + 1} ---\nTest: ${item.testName}\nFrage/Thema: ${item.question.name}\n`;
        
        // Sanitize question text
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = item.question.text;
        let cleanText = tempDiv.textContent || tempDiv.innerText || "";
        // Keep it to max 500 chars per question to avoid blowing up the prompt length unnecessarily
        if (cleanText.length > 500) cleanText = cleanText.substring(0, 500) + '...';
        
        prompt += `Aufgabentext: ${cleanText.trim()}\n`;
        prompt += `Erfolgsquote der Klasse: ${Math.round(item.ratio * 100)}% (${item.avgScore.toFixed(2).replace('.', ',')} von ${item.question.maxPoints.toFixed(2).replace('.', ',')} Punkten)\n`;
        
        if (item.question.stats) {
            const ease = item.question.stats.easeIndex !== null ? Math.round(item.question.stats.easeIndex * 100) + '%' : 'N/A';
            const disc = item.question.stats.discriminationIndex !== null ? Math.round(item.question.stats.discriminationIndex * 100) + '%' : 'N/A';
            prompt += `Statistik -> Leichtigkeitsindex: ${ease} | Trennschärfe (Discrimination Index): ${disc}\n`;
        }
        prompt += `\n`;
    });

    prompt += `Bitte gib mir eine übersichtliche Zusammenfassung und konkrete Tipps für meine nächste Stunde!`;

    navigator.clipboard.writeText(prompt).then(() => {
        showNotification("KI-Prompt erfolgreich in die Zwischenablage kopiert!", "success");
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showNotification("Fehler beim Kopieren in die Zwischenablage.", "error");
    });
};

function renderClassReviewSection() {
    const card = document.getElementById('overview-review-card');
    const listContainer = document.getElementById('review-list');
    const countBadge = document.getElementById('review-anomalies-count');
    
    if (!card || !listContainer) return;
    
    if (appState.tests.length === 0) {
        card.style.display = 'none';
        return;
    }
    
    const reviewItems = [];
    
    // Loop through all tests to find questions with average score < 60%
    appState.tests.forEach(test => {
        test.questions.forEach(q => {
            const avgScore = test.questionAverages[q.key];
            if (avgScore !== null && avgScore !== undefined && q.maxPoints > 0) {
                const ratio = avgScore / q.maxPoints;
                if (ratio < 0.60) {
                    reviewItems.push({
                        testId: test.id,
                        testName: test.name,
                        question: q,
                        ratio: ratio,
                        avgScore: avgScore
                    });
                }
            }
        });
    });
    
    // If no questions need review, hide card
    if (reviewItems.length === 0) {
        card.style.display = 'none';
        return;
    }
    
    card.style.display = 'block';
    if (countBadge) {
        countBadge.textContent = `${reviewItems.length} Thema / Frage${reviewItems.length > 1 ? 'n' : ''}`;
    }
    
    listContainer.innerHTML = '';
    
    reviewItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'p-3 border rounded-lg bg-red-50 dark:bg-red-950 flex flex-col gap-2 cursor-pointer transition hover:bg-red-100 dark:hover:bg-red-900';
        div.style.backgroundColor = 'rgba(239, 68, 68, 0.03)';
        div.style.border = '1px solid var(--border-color)';
        div.style.borderRadius = '0.5rem';
        div.style.padding = '1rem';
        div.style.marginBottom = '0.5rem';
        
        const successPercent = Math.round(item.ratio * 100);
        
        // Find if there is statistic responses distribution for this question
        let commonWrongAnswerHtml = '';
        let topWrongResponse = null;
        if (item.question.stats && item.question.stats.responses && item.question.stats.responses.length > 0) {
            const wrongResponses = item.question.stats.responses.filter(resp => {
                const fraction = parseMebisNumber(resp.teilweisebewertung) || 0;
                return fraction < 100 && (resp.tatschlicheantwort || resp.musterantwort);
            });
            
            wrongResponses.sort((a, b) => {
                const freqA = parseFloat(a.frequenz.replace('%', '').replace(',', '.')) || 0;
                const freqB = parseFloat(b.frequenz.replace('%', '').replace(',', '.')) || 0;
                return freqB - freqA;
            });
            
            if (wrongResponses.length > 0) {
                topWrongResponse = wrongResponses[0];
                const text = topWrongResponse.tatschlicheantwort || topWrongResponse.musterantwort;
                commonWrongAnswerHtml = `
                    <div class="text-xs mt-2 border-t pt-2" style="border-top: 1px dotted var(--border-color); color: var(--text-secondary);">
                        ⚠️ <strong>Häufigste Fehlantwort:</strong> <code class="bg-gray">${text}</code> (${topWrongResponse.frequenz})
                    </div>
                `;
            }
        }
        
        // Detailed answers / mappings HTML
        let answersDetailsHtml = '';
        if (item.question.type === 'matching' && item.question.subquestions && item.question.subquestions.length > 0) {
            const subs = item.question.subquestions.map(sub => `<li>${sub.text} &rarr; <strong>${sub.answer}</strong></li>`).join('');
            answersDetailsHtml = `
                <div class="mt-2 text-xs">
                    <strong>Korrekte Zuordnungen:</strong>
                    <ul class="list-disc pl-4 mt-1" style="margin-top: 0.25rem;">${subs}</ul>
                </div>
            `;
        } else if (item.question.answers && item.question.answers.length > 0) {
            const correctAns = item.question.answers.find(ans => ans.fraction === 100);
            if (correctAns && correctAns.text) {
                answersDetailsHtml = `
                    <div class="mt-2 text-xs">
                        <strong>Musterlösung:</strong> <code class="bg-gray">${correctAns.text}</code>
                        ${correctAns.feedback ? `<div class="mt-1 text-muted" style="margin-top: 0.25rem;"><em>Feedback:</em> ${correctAns.feedback}</div>` : ''}
                    </div>
                `;
            }
        }
        
        // Full response distribution table if statistics are available
        let fullResponsesTableHtml = '';
        if (item.question.stats && item.question.stats.responses && item.question.stats.responses.length > 0) {
            let trs = '';
            item.question.stats.responses.forEach(resp => {
                const text = resp.tatschlicheantwort || resp.musterantwort || '[Keine Antwort]';
                const count = resp.zhlen || '0';
                const freq = resp.frequenz || '0%';
                const scorePct = resp.teilweisebewertung || '0%';
                const isCorrect = (parseMebisNumber(resp.teilweisebewertung) || 0) >= 100;
                
                trs += `
                    <tr>
                        <td class="font-mono text-xs" style="white-space: normal; word-break: break-all; padding: 4px;">${text}</td>
                        <td class="text-center font-bold text-xs" style="color: ${isCorrect ? 'var(--success)' : 'var(--danger)'}; padding: 4px;">${scorePct}</td>
                        <td class="text-center text-xs" style="padding: 4px;">${count}</td>
                        <td class="text-center font-bold text-xs" style="padding: 4px;">${freq}</td>
                    </tr>
                `;
            });
            
            fullResponsesTableHtml = `
                <div class="mt-3 border-t pt-2" style="border-top: 1px dotted var(--border-color);">
                    <strong class="text-xs block mb-1">Alle abgegebenen Antworten der Klasse:</strong>
                    <div class="table-wrapper" style="margin-top: 0.5rem; overflow-x: auto;">
                        <table style="width: 100%; font-size: 0.75rem;">
                            <thead>
                                <tr>
                                    <th style="padding: 4px;">Antwortoption</th>
                                    <th class="text-center" style="padding: 4px; width: 60px;">Wertung</th>
                                    <th class="text-center" style="padding: 4px; width: 50px;">Anzahl</th>
                                    <th class="text-center" style="padding: 4px; width: 60px;">Frequenz</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${trs}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        
        div.innerHTML = `
            <div class="flex justify-between items-center flex-wrap gap-2">
                <div class="flex items-center gap-1">
                    <span class="review-arrow mr-2" style="font-size: 0.7rem; color: var(--text-secondary);">&#9658;</span>
                    <span class="badge badge-red">Erfolgsquote: ${successPercent}%</span>
                    <strong style="color: var(--text-primary); font-size: 0.9rem;">${item.testName}: Frage ${item.question.index} - ${item.question.name}</strong>
                </div>
                <span class="text-xs text-muted">Schnitt: ${item.avgScore.toFixed(2).replace('.', ',')} / ${item.question.maxPoints.toFixed(2).replace('.', ',')} P.</span>
            </div>
            
            <div class="text-xs text-secondary mt-1 p-2 bg-gray rounded" style="max-height: 80px; overflow-y: auto; background-color: var(--bg-app); border: 1px solid var(--border-color); padding: 0.5rem; border-radius: 0.25rem; font-family: inherit;">
                ${item.question.text}
            </div>
            
            ${commonWrongAnswerHtml}
            
            <!-- Collapsible details section (hidden by default) -->
            <div class="review-details mt-3 border-t pt-3" style="border-top: 1px solid var(--border-color); display: none;">
                ${answersDetailsHtml}
                ${fullResponsesTableHtml}
            </div>
        `;
        
        // Add toggle behavior
        div.addEventListener('click', (e) => {
            if (e.target.closest('table') || e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
                return;
            }
            
            const details = div.querySelector('.review-details');
            const arrow = div.querySelector('.review-arrow');
            
            if (details) {
                const isHidden = details.style.display === 'none';
                if (isHidden) {
                    details.style.display = 'block';
                    if (arrow) arrow.innerHTML = '&#9660;';
                } else {
                    details.style.display = 'none';
                    if (arrow) arrow.innerHTML = '&#9658;';
                }
            }
        });
        
        listContainer.appendChild(div);
    });
    
    if (window.MathJax && typeof window.MathJax.typeset === 'function') {
        window.MathJax.typeset();
    }
}

function generateMissingCodesForClass(activeClass) {
    if (!activeClass) return;
    if (!activeClass.studentCodes) activeClass.studentCodes = {};
    
    let updated = false;
    const uniqueMap = getUniqueStudentsMap();
    uniqueMap.forEach((student, key) => {
        if (!activeClass.studentCodes[key]) {
            let newCode = generateStudentCode();
            while (Object.values(activeClass.studentCodes).includes(newCode)) {
                newCode = generateStudentCode();
            }
            activeClass.studentCodes[key] = newCode;
            updated = true;
        }
    });
    
    if (updated) saveStateToStorage();
}

function bindCurrentClassTests() {
    const activeClass = appState.classes.find(c => c.id === appState.currentClassId);
    if (activeClass) {
        if (!activeClass.lernpakete) activeClass.lernpakete = [];
        appState.tests = activeClass.tests;
        appState.lernpakete = activeClass.lernpakete;
        generateMissingCodesForClass(activeClass);
    } else {
        if (appState.classes.length > 0) {
            if (!appState.classes[0].lernpakete) appState.classes[0].lernpakete = [];
            appState.currentClassId = appState.classes[0].id;
            appState.tests = appState.classes[0].tests;
            appState.lernpakete = appState.classes[0].lernpakete;
        } else {
            appState.tests = [];
            appState.lernpakete = [];
        }
    }
}

function populateClassDropdown() {
    const select = document.getElementById('active-class-select');
    if (!select) return;
    
    select.innerHTML = '';
    appState.classes.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name;
        select.appendChild(option);
    });
    
    select.value = appState.currentClassId;
}

function openShareModal(studentName, rankNum, rankTitle, emoji, score) {
    try {
        const modal = document.getElementById('share-modal');
        if (!modal) return;
        
        // Safe score conversion
        const numScore = parseFloat(score) || 0;
        
        // Set preview card details
        document.getElementById('share-cert-emoji').textContent = emoji;
        const titleEl = document.getElementById('share-cert-title');
        titleEl.textContent = rankTitle.toUpperCase().trim();
        document.getElementById('share-cert-name').textContent = studentName;
        
        // Find active class name
        const activeClass = appState.classes.find(c => c.id === appState.currentClassId);
        const className = activeClass ? activeClass.name : 'Mebis Kurs';
        document.getElementById('share-cert-class').textContent = `Kurs: ${className}`;
        document.getElementById('share-cert-score').textContent = `${numScore.toFixed(2).replace('.', ',')} / 10 Punkte`;
        
        // Style the preview card depending on rank
        const certCard = document.getElementById('share-certificate-card');
        if (certCard) {
            if (rankNum === 1) {
                certCard.style.background = 'linear-gradient(135deg, #7f1d1d, #4c0519)'; // mythic red
                certCard.style.borderColor = '#ef4444';
                titleEl.style.color = '#f87171';
            } else if (rankNum === 2) {
                certCard.style.background = 'linear-gradient(135deg, #1e1b4b, #311042)'; // legendary purple-indigo
                certCard.style.borderColor = '#818cf8';
                titleEl.style.color = '#a5b4fc';
            } else {
                certCard.style.background = 'linear-gradient(135deg, #1e293b, #0f172a)'; // epic slate-gray
                certCard.style.borderColor = '#94a3b8';
                titleEl.style.color = '#cbd5e1';
            }
        }
        
        // Clear previous QR code
        const qrContainer = document.getElementById('share-qrcode');
        if (qrContainer) qrContainer.innerHTML = '';
        
        // Build Urkunden text content
        const qrText = `🏆 BYCS-ANALYTICS - URKUNDE 🏆
-------------------------------
Name:  ${studentName}
Kurs:  ${className}
Rang:  ${rankNum}. Platz
Titel: ${emoji} ${rankTitle}
Score: ${numScore.toFixed(2).replace('.', ',')} / 10 Punkte

Herzlichen Glückwunsch! 🎉`;

        let qrSuccess = false;
        // Generate new QR code using client-side QRCode.js
        if (window.QRCode) {
            try {
                new QRCode(qrContainer, {
                    text: qrText,
                    width: 130,
                    height: 130,
                    colorDark : "#0f172a",
                    colorLight : "#ffffff"
                });
                qrSuccess = true;
            } catch (qrErr) {
                console.error("Local QRCode.js generation failed:", qrErr);
            }
        }
        
        if (!qrSuccess) {
            console.warn("Using fallback QR Code API...");
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(qrText)}`;
            qrContainer.innerHTML = `<img src="${qrUrl}" width="130" height="130" style="display: block; margin: 0 auto;" alt="QR Code">`;
        }
        
        // Show Modal
        modal.style.display = 'flex';
    } catch (err) {
        console.error("Error in openShareModal:", err);
        showNotification("Fehler beim Öffnen der Urkunde.", "error");
    }
}


// --- STUDENT PORTAL SERVER UPLOAD ---

function getOrGenerateRoomId() {
    if (!appState.roomId) {
        appState.roomId = 'TR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        saveStateToStorage();
    }
    return appState.roomId;
}

function showPortalQrModal() {
    const modal = document.getElementById('portal-qr-modal');
    const input = document.getElementById('portal-url-input');
    if (modal && input) {
        modal.style.display = 'flex';
        try {
            let url = new URL(input.value);
            url.searchParams.set('room', getOrGenerateRoomId());
            input.value = url.toString();
        } catch (e) {
            // Ignore if URL is invalid
        }
        generatePortalQrCode(input.value);
    }
}

function generatePortalQrCode(url) {
    const container = document.getElementById('portal-qrcode');
    if (!container) return;
    
    container.innerHTML = '';
    
    new QRCode(container, {
        text: url,
        width: 200,
        height: 200,
        colorDark: "#1e1b4b",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

function generateStudentCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 5-digit, clear characters
    let code = '';
    for(let i=0; i<5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function syncStudentDataToFolder() {
    try {
        const secureAnonData = {
            roomId: getOrGenerateRoomId(),
            classes: appState.classes.map(cls => {
                const studentCodes = cls.studentCodes || {};
                
                return {
                    name: cls.name,
                    validCodes: Object.values(studentCodes),
                    tests: cls.tests.map(test => {
                        const anonMissingStatuses = {};
                        if (test.missingStatuses) {
                            for (const [studentKey, status] of Object.entries(test.missingStatuses)) {
                                const codeVal = studentCodes[studentKey];
                                if (codeVal) {
                                    anonMissingStatuses[codeVal] = status;
                                }
                            }
                        }
                        return {
                            name: test.name,
                            classAverage: test.classAverage,
                            missingStatuses: anonMissingStatuses,
                            questions: test.questions.map(q => ({
                                key: q.key,
                                index: q.index,
                                maxPoints: q.maxPoints,
                                name: q.name,
                                text: q.text,
                                answers: q.answers
                            })),
                            results: test.results.map(r => {
                                const key = `${r.nachname}_${r.vorname}`;
                                return {
                                    nachname: studentCodes[key] || "Unknown", 
                                    vorname: "",
                                    bewertung: r.bewertung,
                                    scores: r.scores
                                };
                            })
                        };
                    }),
                    lernpakete: (cls.lernpakete || []).map(lp => {
                        const anonMissingStatuses = {};
                        if (lp.missingStatuses) {
                            for (const [studentKey, status] of Object.entries(lp.missingStatuses)) {
                                const codeVal = studentCodes[studentKey];
                                if (codeVal) {
                                    anonMissingStatuses[codeVal + "_"] = status;
                                }
                            }
                        }
                        return {
                            id: lp.id,
                            name: lp.name,
                            uploadDate: lp.uploadDate,
                            missingStatuses: anonMissingStatuses,
                            data: lp.data.map(d => {
                                let matchedCode = "Unknown";
                                const cleanLPName = d.name.replace(/"/g, '').trim();
                                
                                for (const [mapKey, codeVal] of Object.entries(studentCodes)) {
                                    const parts = mapKey.split('_');
                                    const mapFullName = `${parts[1] || ''} ${parts[0] || ''}`.trim();
                                    if (matchStudentNames(cleanLPName, mapFullName) || matchStudentNames(cleanLPName, mapKey)) {
                                        matchedCode = codeVal;
                                        break;
                                    }
                                }
                                return {
                                    name: matchedCode,
                                    versuch: d.versuch,
                                    letzterVersuch: d.letzterVersuch,
                                    bewertung: d.bewertung
                                };
                            })
                        };
                    })
                };
            })
        };

        const response = await fetch('api/upload.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(secureAnonData)
        });

        if (response.ok) {
            console.log("Student data successfully uploaded to server.");
        } else {
            console.error("Server responded with an error:", await response.text());
            showNotification("Fehler beim Hochladen der Daten auf den Server.", "error");
        }
    } catch (e) {
        console.error("Error syncing to server:", e);
        showNotification("Netzwerkfehler beim Hochladen der Daten.", "error");
    }
}

function printStudentCodes() {
    const activeClass = appState.classes.find(c => c.id === appState.currentClassId);
    if (!activeClass || !activeClass.studentCodes || Object.keys(activeClass.studentCodes).length === 0) {
        alert("Für diese Klasse existieren noch keine Schüler-Codes. Bitte laden Sie zuerst einen Test hoch.");
        return;
    }

    let html = `
    <div id="pdf-content" style="padding: 20px; font-family: sans-serif;">
        <h2 style="text-align: center; margin-bottom: 20px;">Schüler-Codes für ${activeClass.name}</h2>
    `;

    // Sort alphabetically by last name
    const entries = Object.entries(activeClass.studentCodes).sort((a, b) => a[0].localeCompare(b[0]));
    
    entries.forEach(([nameKey, code]) => {
        const nameParts = nameKey.split('_');
        const name = `${nameParts[1] || ''} ${nameParts[0] || ''}`.trim();
        html += `
        <div style="border: 1px dashed #ccc; padding: 15px; margin: 10px; width: 250px; display: inline-block; text-align: center; page-break-inside: avoid;">
            <div style="font-size: 14px;">${name}</div>
            <div style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 2px; margin: 10px 0;">${code}</div>
            <div style="font-size: 10px; color: #666;">Mebis Lernverlaufsdashboard</div>
        </div>`;
    });

    html += `</div>`;

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = html;
    
    // We must append it to the body for html2pdf to process it, but hide it
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    showNotification("PDF wird generiert, bitte warten...", "info");

    const opt = {
        margin:       10,
        filename:     `Schuelercodes_${activeClass.name.replace(/\\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(container.firstElementChild).save().then(() => {
            document.body.removeChild(container);
            showNotification("PDF-Download gestartet!", "success");
        });
    } else {
        document.body.removeChild(container);
        alert("Fehler: html2pdf Bibliothek konnte nicht geladen werden.");
    }
}


// ==========================================================================
// MOODLE XML-EDITOR MODULE
// ==========================================================================

let xmlEditorQuestions = [];
let xmlEditorFileName = 'moodle_test.xml';
let xmlEditorExpandedIds = new Set();

function getQuestionTypeDisplayName(type) {
    switch (type) {
        case 'truefalse': return 'Wahr / Falsch';
        case 'multichoice': return 'Multiple Choice';
        case 'shortanswer': return 'Kurzantwort';
        case 'numerical': return 'Numerisch';
        case 'matching': return 'Zuordnung';
        case 'cloze': return 'Lückentext';
        case 'essay': return 'Freitext';
        default: return (type || '').toUpperCase();
    }
}

function escapeXml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Dedicated Moodle-XML parser for the editor
function parseXmlForEditor(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
        throw new Error("Fehler beim Parsen der XML-Datei: " + parseError.textContent);
    }
    
    // Select questions that are not placeholders/categories
    const questionNodes = Array.from(xmlDoc.querySelectorAll('quiz > question[type]:not([type="category"])'));
    if (questionNodes.length === 0) {
        // Try fallback selector (if root is not quiz but has question nodes)
        const fallback = Array.from(xmlDoc.querySelectorAll('question[type]:not([type="category"])'));
        if (fallback.length === 0) {
            throw new Error("Keine Moodle-Fragen in der XML-Datei gefunden.");
        }
        questionNodes.push(...fallback);
    }
    
    return questionNodes.map((q, idx) => {
        const type = q.getAttribute('type');
        const name = q.querySelector('name > text')?.textContent || q.querySelector('name')?.textContent || `Frage ${idx + 1}`;
        const text = q.querySelector('questiontext > text')?.textContent || q.querySelector('questiontext')?.textContent || '';
        
        // Extract answers
        const answers = Array.from(q.querySelectorAll('answer')).map(ans => {
            const toleranceNode = ans.querySelector('tolerance');
            return {
                fraction: parseFloat(ans.getAttribute('fraction') || '0'),
                text: ans.querySelector('text')?.textContent || '',
                feedback: ans.querySelector('feedback > text')?.textContent || ans.querySelector('feedback')?.textContent || '',
                tolerance: toleranceNode ? parseFloat(toleranceNode.textContent) : null
            };
        });
        
        // Extract subquestions for matching
        const subquestions = Array.from(q.querySelectorAll('subquestion')).map(sub => {
            return {
                text: sub.querySelector('text')?.textContent || '',
                answer: sub.querySelector('answer > text')?.textContent || ''
            };
        });

        // For multichoice: check if it's single choice
        const singleNode = q.querySelector('single');
        const single = singleNode ? (singleNode.textContent === 'true') : true;

        return {
            id: 'q_' + Math.random().toString(36).substring(2, 9),
            type,
            name: name.trim(),
            text: text.trim(),
            answers,
            subquestions,
            single
        };
    });
}

// XML stringifier for download (strict Moodle XML)
function generateXmlFromEditor(questions) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n';
    
    questions.forEach(q => {
        xml += `  <question type="${escapeXml(q.type)}">\n`;
        xml += `    <name>\n      <text>${escapeXml(q.name)}</text>\n    </name>\n`;
        xml += `    <questiontext format="html">\n      <text><![CDATA[${q.text}]]></text>\n    </questiontext>\n`;
        
        xml += `    <generalfeedback format="html">\n      <text></text>\n    </generalfeedback>\n`;
        xml += `    <defaultgrade>1.0000000</defaultgrade>\n`;
        xml += `    <penalty>1.0000000</penalty>\n`;
        xml += `    <hidden>0</hidden>\n`;
        xml += `    <idnumber></idnumber>\n`;

        if (q.type === 'truefalse') {
            q.answers.forEach(ans => {
                xml += `    <answer fraction="${ans.fraction}" format="html">\n`;
                xml += `      <text>${escapeXml(ans.text)}</text>\n`;
                xml += `      <feedback format="html">\n`;
                xml += `        <text>${escapeXml(ans.feedback)}</text>\n`;
                xml += `      </feedback>\n`;
                xml += `    </answer>\n`;
            });
        }
        else if (q.type === 'multichoice') {
            xml += `    <single>${q.single ? 'true' : 'false'}</single>\n`;
            xml += `    <shuffleanswers>true</shuffleanswers>\n`;
            xml += `    <answernumbering>abc</answernumbering>\n`;
            q.answers.forEach(ans => {
                xml += `    <answer fraction="${ans.fraction}" format="html">\n`;
                xml += `      <text>${escapeXml(ans.text)}</text>\n`;
                xml += `      <feedback format="html">\n`;
                xml += `        <text>${escapeXml(ans.feedback)}</text>\n`;
                xml += `      </feedback>\n`;
                xml += `    </answer>\n`;
            });
        }
        else if (q.type === 'shortanswer') {
            xml += `    <usecase>0</usecase>\n`;
            q.answers.forEach(ans => {
                xml += `    <answer fraction="${ans.fraction}" format="plain">\n`;
                xml += `      <text>${escapeXml(ans.text)}</text>\n`;
                xml += `      <feedback format="html">\n`;
                xml += `        <text>${escapeXml(ans.feedback)}</text>\n`;
                xml += `      </feedback>\n`;
                xml += `    </answer>\n`;
            });
        }
        else if (q.type === 'numerical') {
            q.answers.forEach(ans => {
                xml += `    <answer fraction="${ans.fraction}" format="plain">\n`;
                xml += `      <text>${escapeXml(ans.text)}</text>\n`;
                if (ans.tolerance !== null && ans.tolerance !== undefined) {
                    xml += `      <tolerance>${ans.tolerance}</tolerance>\n`;
                } else {
                    xml += `      <tolerance>0</tolerance>\n`;
                }
                xml += `      <feedback format="html">\n`;
                xml += `        <text>${escapeXml(ans.feedback)}</text>\n`;
                xml += `      </feedback>\n`;
                xml += `    </answer>\n`;
            });
        }
        else if (q.type === 'matching') {
            xml += `    <shuffleanswers>true</shuffleanswers>\n`;
            q.subquestions.forEach(sub => {
                xml += `    <subquestion format="html">\n`;
                xml += `      <text><![CDATA[${sub.text}]]></text>\n`;
                xml += `      <answer>\n        <text>${escapeXml(sub.answer)}</text>\n      </answer>\n`;
                xml += `    </subquestion>\n`;
            });
        }
        
        xml += `  </question>\n`;
    });
    
    xml += '</quiz>\n';
    return xml;
}

// Render dynamic forms for answer options based on question type
function renderAnswersEditorForQuestion(q) {
    if (q.type === 'essay') {
        return `
        <div class="xml-editor-notice">
            ℹ️ <strong>Freitext-Aufgabe:</strong> Für diesen Fragentyp müssen in Moodle keine vordefinierten Antwortoptionen angegeben werden. Die Schüler geben ihre Antworten im Freitextfeld ein.
        </div>`;
    }
    
    if (q.type === 'cloze') {
        return `
        <div class="xml-editor-notice">
            ℹ️ <strong>Lückentext (Cloze):</strong> Die Lücken und richtigen Antworten werden direkt im Fragentext über die Moodle-Syntax eingebettet.
            <br><em>Beispiel:</em> <code>Salze haben ein {1:MULTICHOICE:=Ionengitter#Korrekt~Molekülgitter#Falsch}</code> oder <code>Name der Energie: {1:SHORTANSWER:=Gitterenergie}</code>.
        </div>`;
    }
    
    if (q.type === 'matching') {
        let html = `
        <div class="xml-answers-title">
            <span>🔗 Zuordnungspaare</span>
            <button class="xml-add-option-btn" onclick="addMatchingPairToQuestion('${q.id}')">➕ Paar hinzufügen</button>
        </div>
        <div class="xml-answer-rows-container">`;
        
        if (!q.subquestions || q.subquestions.length === 0) {
            html += `<p class="text-xs text-muted text-center py-2">Keine Paare definiert. Fügen Sie mindestens ein Paar hinzu.</p>`;
        } else {
            q.subquestions.forEach((pair, pairIdx) => {
                html += `
                <div class="xml-matching-pair-row">
                    <div class="xml-field-group">
                        <input type="text" class="xml-input" placeholder="Begriff / Begriffskarte (z.B. Natrium-Ion)" value="${escapeXml(pair.text)}" oninput="updateMatchingPairInQuestion('${q.id}', ${pairIdx}, 'text', this.value)">
                    </div>
                    <div class="xml-field-group">
                        <input type="text" class="xml-input" placeholder="Zugehörige Antwort (z.B. Sauerstoff-Atom)" value="${escapeXml(pair.answer)}" oninput="updateMatchingPairInQuestion('${q.id}', ${pairIdx}, 'answer', this.value)">
                    </div>
                    <button class="xml-control-btn delete" title="Paar löschen" onclick="deleteMatchingPairFromQuestion('${q.id}', ${pairIdx})">🗑️</button>
                </div>`;
            });
        }
        
        html += `</div>`;
        return html;
    }
    
    // For standard answer-based types (truefalse, multichoice, shortanswer, numerical)
    let html = '';
    if (q.type === 'multichoice') {
        html += `
        <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" id="chk-single-${q.id}" ${!q.single ? 'checked' : ''} onchange="toggleMultiChoiceSingle('${q.id}', !this.checked)" style="cursor:pointer;">
            <label for="chk-single-${q.id}" class="text-xs font-bold text-secondary" style="cursor:pointer; text-transform:none;">Mehrere richtige Antworten erlauben (Multiple Choice)</label>
        </div>`;
    }
    
    html += `
    <div class="xml-answers-title">
        <span>🎯 Antwortoptionen &amp; Punkte</span>
        ${q.type !== 'truefalse' ? `<button class="xml-add-option-btn" onclick="addAnswerToQuestion('${q.id}')">➕ Option hinzufügen</button>` : ''}
    </div>
    <div class="xml-answer-rows-container">`;
    
    if (!q.answers || q.answers.length === 0) {
        html += `<p class="text-xs text-muted text-center py-2">Keine Antworten definiert. Fügen Sie mindestens eine Antwort hinzu.</p>`;
    } else {
        q.answers.forEach((ans, ansIdx) => {
            html += `
            <div class="xml-answer-editor-row">
                <div class="xml-answer-text-col xml-field-group">
                    <label class="text-xxs" style="font-size:0.65rem;">Antworttext</label>
                    <input type="text" class="xml-input" placeholder="z.B. Richtiges Resultat" value="${escapeXml(ans.text)}" oninput="updateAnswerInQuestion('${q.id}', ${ansIdx}, 'text', this.value)" ${q.type === 'truefalse' ? 'readonly' : ''}>
                </div>`;
            
            if (q.type === 'numerical') {
                html += `
                <div class="xml-field-group" style="width: 80px; flex-shrink:0;">
                    <label class="text-xxs" style="font-size:0.65rem;">Toleranz</label>
                    <input type="number" step="any" class="xml-input" placeholder="0" value="${ans.tolerance !== null ? ans.tolerance : ''}" oninput="updateAnswerInQuestion('${q.id}', ${ansIdx}, 'tolerance', this.value)">
                </div>`;
            }
            
            html += `
                <div class="xml-answer-fraction-col xml-field-group">
                    <label class="text-xxs" style="font-size:0.65rem;">Wertung</label>
                    <select class="xml-input" onchange="updateAnswerInQuestion('${q.id}', ${ansIdx}, 'fraction', this.value)">
                        <option value="100" ${ans.fraction === 100 ? 'selected' : ''}>100% (Richtig)</option>
                        <option value="50" ${ans.fraction === 50 ? 'selected' : ''}>50%</option>
                        <option value="33.33333" ${ans.fraction > 33 && ans.fraction < 34 ? 'selected' : ''}>33.3%</option>
                        <option value="25" ${ans.fraction === 25 ? 'selected' : ''}>25%</option>
                        <option value="0" ${ans.fraction === 0 ? 'selected' : ''}>0% (Falsch)</option>
                        <option value="-25" ${ans.fraction === -25 ? 'selected' : ''}>-25% (Abzug)</option>
                        <option value="-33.33333" ${ans.fraction > -34 && ans.fraction < -33 ? 'selected' : ''}>-33.3% (Abzug)</option>
                        <option value="-50" ${ans.fraction === -50 ? 'selected' : ''}>-50% (Abzug)</option>
                        <option value="-100" ${ans.fraction === -100 ? 'selected' : ''}>-100% (Abzug)</option>
                    </select>
                </div>
                
                <div class="xml-answer-feedback-col xml-field-group">
                    <label class="text-xxs" style="font-size:0.65rem;">Feedback (optional)</label>
                    <input type="text" class="xml-input" placeholder="Super! oder Schade..." value="${escapeXml(ans.feedback)}" oninput="updateAnswerInQuestion('${q.id}', ${ansIdx}, 'feedback', this.value)">
                </div>`;
            
            if (q.type !== 'truefalse') {
                html += `
                <div class="xml-answer-delete-col">
                    <button class="xml-control-btn delete" title="Option löschen" onclick="deleteAnswerFromQuestion('${q.id}', ${ansIdx})">🗑️</button>
                </div>`;
            }
            
            html += `</div>`;
        });
    }
    
    html += `</div>`;
    return html;
}

// Binds event listeners for the upload/empty state view
function bindXmlEditorEmptyStateEvents() {
    const fileInput = document.getElementById('xml-editor-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await readFileAsText(file);
                xmlEditorQuestions = parseXmlForEditor(text);
                xmlEditorFileName = file.name;
                xmlEditorExpandedIds.clear();
                showNotification(`XML geladen: ${xmlEditorQuestions.length} Fragen.`, "success");
                renderXmlEditorTab();
            } catch (err) {
                console.error(err);
                showNotification("Fehler beim Laden der XML: " + err.message, "error");
            }
        });
    }
    
    const pasteBtn = document.getElementById('xml-editor-btn-load-pasted');
    if (pasteBtn) {
        pasteBtn.addEventListener('click', () => {
            const text = document.getElementById('xml-editor-paste-input').value.trim();
            if (!text) {
                showNotification("Bitte fügen Sie zuerst XML-Code ein.", "error");
                return;
            }
            try {
                xmlEditorQuestions = parseXmlForEditor(text);
                xmlEditorFileName = 'paste_test.xml';
                xmlEditorExpandedIds.clear();
                showNotification(`XML geladen: ${xmlEditorQuestions.length} Fragen.`, "success");
                renderXmlEditorTab();
            } catch (err) {
                console.error(err);
                showNotification("Fehler beim Parsen des XML-Codes: " + err.message, "error");
            }
        });
    }
    
    const scratchBtn = document.getElementById('xml-editor-btn-create-new');
    if (scratchBtn) {
        scratchBtn.addEventListener('click', () => {
            xmlEditorQuestions = [
                {
                    id: 'q_' + Math.random().toString(36).substring(2, 9),
                    type: 'shortanswer',
                    name: 'Frage 1',
                    text: 'Geben Sie hier den Aufgabentext ein.',
                    answers: [
                        { fraction: 100, text: 'Richtige Antwort', feedback: '' }
                    ],
                    subquestions: [],
                    single: true
                }
            ];
            xmlEditorFileName = 'moodle_test.xml';
            xmlEditorExpandedIds.clear();
            xmlEditorExpandedIds.add(xmlEditorQuestions[0].id);
            renderXmlEditorTab();
        });
    }
    
    const dropzone = document.getElementById('xml-editor-dropzone');
    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.background = 'rgba(79, 70, 229, 0.2)';
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.style.background = 'var(--primary-light)';
        });
        dropzone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropzone.style.background = 'var(--primary-light)';
            const file = e.dataTransfer.files[0];
            if (!file) return;
            try {
                const text = await readFileAsText(file);
                xmlEditorQuestions = parseXmlForEditor(text);
                xmlEditorFileName = file.name;
                xmlEditorExpandedIds.clear();
                showNotification(`XML geladen: ${xmlEditorQuestions.length} Fragen.`, "success");
                renderXmlEditorTab();
            } catch (err) {
                console.error(err);
                showNotification("Fehler beim Laden der XML: " + err.message, "error");
            }
        });
    }
}

// Controller entry point for rendering the tab
window.renderXmlEditorTab = function() {
    const container = document.getElementById('xml-editor-container');
    if (!container) return;
    
    if (xmlEditorQuestions.length === 0) {
        container.innerHTML = `
        <div class="xml-empty-state">
            <div class="xml-empty-icon">📁</div>
            <h2>Moodle XML-Datei laden</h2>
            <p class="text-sm text-secondary mt-2 mb-4">Wählen Sie eine vorhandene XML-Datei aus oder fügen Sie den XML-Code ein, um Fragen zu bearbeiten.</p>
            
            <label class="xml-upload-zone" id="xml-editor-dropzone">
                <strong>📂 Moodle XML-Datei auswählen</strong>
                <p class="text-xs text-muted mt-2">Klicken oder Datei hineinziehen (z. B. eine aus Mebis exportierte oder von KI generierte XML)</p>
                <input type="file" id="xml-editor-file-input" accept=".xml">
            </label>
            
            <div class="xml-divider">ODER</div>
            
            <div class="xml-paste-box">
                <textarea id="xml-editor-paste-input" class="xml-paste-textarea" placeholder="<?xml version='1.0' encoding='UTF-8'?>&#10;<quiz>&#10;  <question type='shortanswer'>&#10;    ...&#10;  </question>&#10;</quiz>"></textarea>
                <button id="xml-editor-btn-load-pasted" class="btn btn-indigo w-full mt-3">📋 XML-Code laden</button>
            </div>
            
            <div class="xml-divider">ODER</div>
            
            <button id="xml-editor-btn-create-new" class="btn btn-outline" style="border-color: var(--primary); color: var(--primary);">➕ Neuen Test von Grund auf erstellen</button>
        </div>`;
        
        bindXmlEditorEmptyStateEvents();
    } else {
        let cardsHtml = '';
        xmlEditorQuestions.forEach((q, idx) => {
            const isExpanded = xmlEditorExpandedIds.has(q.id);
            cardsHtml += `
            <div class="xml-question-card ${q.type} ${isExpanded ? 'expanded' : ''}" id="card-${q.id}">
                <div class="xml-card-header" onclick="toggleQuestionExpand('${q.id}')">
                    <div class="xml-header-title-section">
                        <span class="xml-question-number">#${idx + 1}</span>
                        <span class="xml-type-badge ${q.type}">${getQuestionTypeDisplayName(q.type)}</span>
                        <span class="xml-question-name-display" id="display-title-${q.id}" title="${escapeXml(q.name)}">${escapeXml(q.name)}</span>
                    </div>
                    <div class="xml-header-controls" onclick="event.stopPropagation()">
                        <button class="xml-control-btn" title="Nach oben verschieben" onclick="moveQuestionInEditor(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>▲</button>
                        <button class="xml-control-btn" title="Nach unten verschieben" onclick="moveQuestionInEditor(${idx}, 1)" ${idx === xmlEditorQuestions.length - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>▼</button>
                        <button class="xml-control-btn delete" title="Frage löschen" onclick="deleteQuestionFromEditor('${q.id}')">🗑️</button>
                        <span class="xml-card-arrow">▼</span>
                    </div>
                </div>
                
                <div class="xml-card-content">
                    <div class="xml-form-grid">
                        <div class="xml-field-group">
                            <label>Fragen-Titel / Name</label>
                            <input type="text" class="xml-input" value="${escapeXml(q.name)}" oninput="updateQuestionField('${q.id}', 'name', this.value)">
                        </div>
                        <div class="xml-field-group">
                            <label>Fragentyp</label>
                            <select class="xml-input" onchange="changeQuestionTypeInEditor('${q.id}', this.value)">
                                <option value="truefalse" ${q.type === 'truefalse' ? 'selected' : ''}>Wahr / Falsch</option>
                                <option value="multichoice" ${q.type === 'multichoice' ? 'selected' : ''}>Multiple Choice</option>
                                <option value="shortanswer" ${q.type === 'shortanswer' ? 'selected' : ''}>Kurzantwort</option>
                                <option value="numerical" ${q.type === 'numerical' ? 'selected' : ''}>Numerisch</option>
                                <option value="matching" ${q.type === 'matching' ? 'selected' : ''}>Zuordnung</option>
                                <option value="cloze" ${q.type === 'cloze' ? 'selected' : ''}>Lückentext</option>
                                <option value="essay" ${q.type === 'essay' ? 'selected' : ''}>Freitext</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="xml-field-group mb-4">
                        <label>Fragentext (HTML / LaTeX-Formeln möglich)</label>
                        <textarea class="xml-textarea" oninput="updateQuestionField('${q.id}', 'text', this.value)">${escapeXml(q.text)}</textarea>
                    </div>
                    
                    <div class="xml-answers-section">
                        ${renderAnswersEditorForQuestion(q)}
                    </div>
                </div>
            </div>`;
        });
        
        container.innerHTML = `
        <div class="xml-editor-layout">
            <div class="xml-editor-header">
                <div class="flex items-center gap-3" style="display:flex;align-items:center;gap:0.75rem;">
                    <span class="xml-file-badge">${escapeXml(xmlEditorFileName)}</span>
                    <span class="text-sm text-secondary"><strong>${xmlEditorQuestions.length}</strong> Fragen geladen</span>
                </div>
                <div class="flex gap-2" style="display:flex;gap:0.5rem;">
                    <button class="btn btn-sm btn-indigo" onclick="addQuestionToEditor()">➕ Neue Frage</button>
                    <button class="btn btn-sm btn-outline" style="border-color: var(--primary); color: var(--primary);" onclick="saveXmlFromEditor()">💾 XML herunterladen</button>
                    <button class="btn btn-sm btn-danger" onclick="closeXmlEditor()">❌ Schließen</button>
                </div>
            </div>
            
            <div class="xml-questions-list">
                ${cardsHtml}
            </div>
            
            <div class="xml-bottom-bar">
                <button class="btn btn-indigo" onclick="addQuestionToEditor()">➕ Neue Frage hinzufügen</button>
                <button class="btn btn-success" onclick="saveXmlFromEditor()">💾 XML exportieren und herunterladen</button>
            </div>
        </div>`;
    }
};

// Expand/Collapse question cards
window.toggleQuestionExpand = function(qId) {
    const card = document.getElementById(`card-${qId}`);
    if (!card) return;
    
    if (xmlEditorExpandedIds.has(qId)) {
        xmlEditorExpandedIds.delete(qId);
        card.classList.remove('expanded');
    } else {
        xmlEditorExpandedIds.add(qId);
        card.classList.add('expanded');
    }
};

// Toggle Multichoice single/multiple answers
window.toggleMultiChoiceSingle = function(qId, isSingle) {
    const q = xmlEditorQuestions.find(x => x.id === qId);
    if (q) {
        q.single = isSingle;
    }
};

// Keybind input updates in-memory to prevent cursor jumping
window.updateQuestionField = function(qId, field, value) {
    const q = xmlEditorQuestions.find(x => x.id === qId);
    if (q) {
        q[field] = value;
        if (field === 'name') {
            const disp = document.getElementById(`display-title-${qId}`);
            if (disp) {
                disp.textContent = value || 'Frage';
                disp.title = value || '';
            }
        }
    }
};

window.updateAnswerInQuestion = function(qId, ansIndex, field, value) {
    const q = xmlEditorQuestions.find(x => x.id === qId);
    if (q && q.answers && q.answers[ansIndex]) {
        if (field === 'fraction') {
            q.answers[ansIndex].fraction = parseFloat(value);
        } else if (field === 'tolerance') {
            q.answers[ansIndex].tolerance = value !== '' ? parseFloat(value) : null;
        } else {
            q.answers[ansIndex][field] = value;
        }
    }
};

window.updateMatchingPairInQuestion = function(qId, pairIndex, field, value) {
    const q = xmlEditorQuestions.find(x => x.id === qId);
    if (q && q.subquestions && q.subquestions[pairIndex]) {
        q.subquestions[pairIndex][field] = value;
    }
};

// Structural mutations (trigger redraw)
window.addAnswerToQuestion = function(qId) {
    const q = xmlEditorQuestions.find(x => x.id === qId);
    if (q) {
        if (!q.answers) q.answers = [];
        q.answers.push({
            fraction: 0,
            text: '',
            feedback: '',
            tolerance: null
        });
        renderXmlEditorTab();
    }
};

window.deleteAnswerFromQuestion = function(qId, ansIndex) {
    const q = xmlEditorQuestions.find(x => x.id === qId);
    if (q && q.answers) {
        q.answers.splice(ansIndex, 1);
        renderXmlEditorTab();
    }
};

window.addMatchingPairToQuestion = function(qId) {
    const q = xmlEditorQuestions.find(x => x.id === qId);
    if (q) {
        if (!q.subquestions) q.subquestions = [];
        q.subquestions.push({
            text: '',
            answer: ''
        });
        renderXmlEditorTab();
    }
};

window.deleteMatchingPairFromQuestion = function(qId, pairIndex) {
    const q = xmlEditorQuestions.find(x => x.id === qId);
    if (q && q.subquestions) {
        q.subquestions.splice(pairIndex, 1);
        renderXmlEditorTab();
    }
};

window.changeQuestionTypeInEditor = function(qId, newType) {
    const q = xmlEditorQuestions.find(x => x.id === qId);
    if (q) {
        q.type = newType;
        if (newType === 'truefalse') {
            q.answers = [
                { fraction: 100, text: 'true', feedback: '' },
                { fraction: 0, text: 'false', feedback: '' }
            ];
            q.subquestions = [];
        } else if (newType === 'matching') {
            q.answers = [];
            if (!q.subquestions || q.subquestions.length === 0) {
                q.subquestions = [
                    { text: '', answer: '' }
                ];
            }
        } else {
            q.subquestions = [];
            if (!q.answers || q.answers.length === 0) {
                q.answers = [
                    { fraction: 100, text: '', feedback: '', tolerance: newType === 'numerical' ? 0 : null }
                ];
            } else {
                q.answers.forEach(ans => {
                    if (newType === 'numerical' && ans.tolerance === null) {
                        ans.tolerance = 0;
                    } else if (newType !== 'numerical') {
                        ans.tolerance = null;
                    }
                });
            }
        }
        renderXmlEditorTab();
    }
};

window.addQuestionToEditor = function() {
    const newQ = {
        id: 'q_' + Math.random().toString(36).substring(2, 9),
        type: 'shortanswer',
        name: 'Neue Frage',
        text: 'Geben Sie hier den Aufgabentext ein.',
        answers: [
            { fraction: 100, text: 'Richtige Antwort', feedback: '' }
        ],
        subquestions: [],
        single: true
    };
    xmlEditorQuestions.push(newQ);
    xmlEditorExpandedIds.add(newQ.id);
    renderXmlEditorTab();
    
    setTimeout(() => {
        const card = document.getElementById(`card-${newQ.id}`);
        if (card) card.scrollIntoView({ behavior: 'smooth' });
    }, 100);
};

window.deleteQuestionFromEditor = function(qId) {
    if (confirm("Möchten Sie diese Frage wirklich löschen?")) {
        xmlEditorQuestions = xmlEditorQuestions.filter(x => x.id !== qId);
        xmlEditorExpandedIds.delete(qId);
        renderXmlEditorTab();
    }
};

window.moveQuestionInEditor = function(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < xmlEditorQuestions.length) {
        const temp = xmlEditorQuestions[index];
        xmlEditorQuestions[index] = xmlEditorQuestions[targetIndex];
        xmlEditorQuestions[targetIndex] = temp;
        renderXmlEditorTab();
    }
};

window.closeXmlEditor = function() {
    if (confirm("Möchten Sie den XML-Editor schließen? Nicht exportierte Änderungen gehen verloren.")) {
        xmlEditorQuestions = [];
        xmlEditorFileName = 'moodle_test.xml';
        xmlEditorExpandedIds.clear();
        renderXmlEditorTab();
    }
};

window.saveXmlFromEditor = function() {
    if (xmlEditorQuestions.length === 0) {
        showNotification("Keine Fragen zum Exportieren vorhanden.", "error");
        return;
    }
    
    try {
        const xmlText = generateXmlFromEditor(xmlEditorQuestions);
        
        // Strict local XML validation check
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error("Generiertes XML hat Validierungsfehler: " + parseError.textContent);
        }
        
        const blob = new Blob([xmlText], { type: 'text/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", url);
        
        let nameBase = xmlEditorFileName.replace(/\.[^/.]+$/, "");
        if (!nameBase.endsWith('_edit') && !nameBase.endsWith('_edited')) {
            nameBase += '_edited';
        }
        
        dlAnchorElem.setAttribute("download", `${nameBase}.xml`);
        dlAnchorElem.click();
        URL.revokeObjectURL(url);
        
        showNotification("Moodle XML-Datei erfolgreich exportiert und heruntergeladen.", "success");
    } catch (e) {
        console.error("Export error:", e);
        showNotification("Export fehlgeschlagen: " + e.message, "error");
    }
};

function getScoreColor(score) {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
}

// --- LERNPAKETE LOGIK ---
async function handleLernpaketUpload(e) {
    e.preventDefault();
    const file = document.getElementById('upload-lernpaket-txt').files[0];
    if (!file) return;

    try {
        const text = await readFileAsText(file);
        const lines = text.split('\n');
        
        let paketName = file.name.replace(/\.[^/.]+$/, ""); // remove extension
        if (paketName.includes('-')) {
            paketName = paketName.split('-')[0].trim();
        }

        const data = [];
        // Skip header (i = 1)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split('\t');
            if (cols.length >= 7) {
                let bewertung = cols[6].replace(/"/g, '').trim();
                if (bewertung !== '-' && bewertung !== '') {
                    data.push({
                        name: cols[0].replace(/"/g, '').trim(),
                        versuch: cols[3].replace(/"/g, '').trim(),
                        letzterVersuch: cols[5].replace(/"/g, '').trim(),
                        bewertung: parseFloat(bewertung) || 0
                    });
                }
            }
        }

        if (data.length === 0) {
            showNotification("Keine bewerteten Versuche im Lernpaket gefunden.", "warn");
            return;
        }

        const newPaket = {
            id: 'lp_' + Date.now(),
            name: paketName,
            uploadDate: new Date().toLocaleDateString('de-DE'),
            data: data
        };

        if (!appState.lernpakete) appState.lernpakete = [];
        
        // Remove if existing with same name
        const existingIdx = appState.lernpakete.findIndex(lp => lp.name === paketName);
        if (existingIdx !== -1) {
            appState.lernpakete[existingIdx] = newPaket;
        } else {
            appState.lernpakete.push(newPaket);
        }

        saveStateToStorage();
        showNotification(`Lernpaket "${paketName}" erfolgreich importiert!`, "success");
        e.target.reset();
        switchTab('lernpakete');
    } catch (err) {
        console.error(err);
        showNotification("Fehler beim Verarbeiten der Textdatei.", "error");
    }
}

function renderLernpaketeTab() {
    if (!appState.lernpakete || appState.lernpakete.length === 0) {
        document.getElementById('lernpakete-content').style.display = 'none';
        document.getElementById('lernpakete-empty-state').style.display = 'block';
        return;
    }
    
    document.getElementById('lernpakete-content').style.display = 'grid';
    document.getElementById('lernpakete-empty-state').style.display = 'none';

    document.getElementById('stat-lp-count').innerText = appState.lernpakete.length;

    let totalScoreSum = 0;
    let totalAttempts = 0;
    let bestPaket = { name: '-', avg: -1 };
    let hardestPaket = { name: '-', avg: 101 };

    const tbody = document.getElementById('lp-table-body');
    tbody.innerHTML = '';
    
    const chartLabels = [];
    const chartData = [];

    appState.lernpakete.forEach(lp => {
        let lpSum = 0;
        lp.data.forEach(d => lpSum += d.bewertung);
        const lpAvg = lp.data.length > 0 ? lpSum / lp.data.length : 0;
        
        totalScoreSum += lpSum;
        totalAttempts += lp.data.length;

        if (lpAvg > bestPaket.avg && lp.data.length > 0) bestPaket = { name: lp.name, avg: lpAvg };
        if (lpAvg < hardestPaket.avg && lp.data.length > 0) hardestPaket = { name: lp.name, avg: lpAvg };

        chartLabels.push(lp.name.substring(0, 20) + (lp.name.length > 20 ? '...' : ''));
        chartData.push(Math.round(lpAvg));

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="font-bold text-sm">${lp.name}</div><div class="text-xs text-muted">Upload: ${lp.uploadDate}</div></td>
            <td class="text-center">${lp.data.length}</td>
            <td class="text-center font-bold" style="color: ${getScoreColor(lpAvg)}">${Math.round(lpAvg)}%</td>
        `;
        tbody.appendChild(tr);
    });

    const overallAvg = totalAttempts > 0 ? totalScoreSum / totalAttempts : 0;
    document.getElementById('stat-lp-average').innerText = Math.round(overallAvg) + '%';
    
    document.getElementById('stat-lp-best').innerText = bestPaket.name !== '-' ? `${bestPaket.name} (${Math.round(bestPaket.avg)}%)` : '-';
    document.getElementById('stat-lp-hardest').innerText = hardestPaket.name !== '-' ? `${hardestPaket.name} (${Math.round(hardestPaket.avg)}%)` : '-';

    renderLernpaketeChart(chartLabels, chartData);
}

let lpChartInstance = null;
function renderLernpaketeChart(labels, data) {
    const ctx = document.getElementById('lp-trend-chart');
    if (!ctx) return;
    
    if (lpChartInstance) {
        lpChartInstance.destroy();
    }
    
    const computedStyle = getComputedStyle(document.documentElement);
    const textColor = computedStyle.getPropertyValue('--text-main').trim() || '#333';
    const gridColor = computedStyle.getPropertyValue('--border-color').trim() || '#ddd';

    lpChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Klassendurchschnitt (%)',
                data: data,
                backgroundColor: 'rgba(79, 70, 229, 0.7)',
                borderColor: 'rgba(79, 70, 229, 1)',
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
                    max: 100,
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderStudentLernpaketeDetailedList(student, studentKey) {
    const container = document.getElementById('student-lernpakete-details-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!appState.lernpakete || appState.lernpakete.length === 0) {
        container.innerHTML = `<div class="empty-notice">Keine Lernpakete in dieser Klasse vorhanden.</div>`;
        return;
    }
    
    const studentFullName = `${student.vorname} ${student.nachname}`;
    
    appState.lernpakete.forEach(lp => {
        const result = lp.data.find(r => matchStudentNames(r.name, studentFullName));
        
        const card = document.createElement('div');
        card.className = 'test-detail-item-card mb-4 p-4 border rounded';
        
        if (result) {
            const score = result.bewertung;
            let statusClass = 'neutral';
            let statusText = 'Bearbeitet';
            
            if (score >= 80) {
                statusClass = 'success';
                statusText = 'Sehr gut';
            } else if (score >= 50) {
                statusClass = 'warning';
                statusText = 'Ausreichend';
            } else {
                statusClass = 'danger';
                statusText = 'Übungsbedarf';
            }
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: bold;">${lp.name}</div>
                    <div style="display: flex; align-items: center;">
                        <span class="badge badge-sm badge-${statusClass}" style="margin-right: 0.5rem;">${statusText}</span>
                        <span style="font-weight: bold; font-size: 1.125rem; color: ${getScoreColor(score)}">${Math.round(score)}%</span>
                    </div>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">Versuch: ${result.versuch} | Letzter Versuch am: ${result.letzterVersuch}</div>
            `;
        } else {
            const currentStatus = (lp.missingStatuses && lp.missingStatuses[studentKey]) || 'krank';
            const statusLabel = currentStatus === 'null_punkte' ? 'Unentschuldigt (0% Wertung)' : 'Krank / Entschuldigt (kein Einfluss)';
            const badgeClass = currentStatus === 'null_punkte' ? 'red' : 'neutral';
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleLPDetailsCollapse(this)">
                    <div>
                        <div style="font-weight: bold; color: var(--text-muted);">${lp.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                            <span style="margin-right: 0.25rem;">&#9658;</span> Nicht teilgenommen
                        </div>
                    </div>
                    <span class="badge badge-sm badge-${badgeClass}">${statusLabel}</span>
                </div>
                <div class="lp-detail-body-collapse hidden p-3 bg-gray-50 dark:bg-gray-900 rounded border mt-3">
                    <div class="flex flex-col gap-2">
                        <strong class="text-xs block">Teilnahme-Status bearbeiten:</strong>
                        <p class="text-secondary" style="font-size: 0.7rem; margin-bottom: 0.5rem;">Hier können Sie festlegen, ob das Fehlen des Schülers entschuldigt ist (keine Auswirkung auf die Gesamtbewertung) oder unentschuldigt (wird mit 0% gewertet).</p>
                        <div class="flex items-center gap-2">
                            <select class="input py-1 text-xs" style="width: auto; padding: 4px 8px; font-size: 0.75rem;" 
                                    onchange="updateLPMissingStatus('${lp.id}', '${studentKey}', this.value)">
                                <option value="krank" ${currentStatus === 'krank' ? 'selected' : ''}>Krank / Entschuldigt (Wertung aussetzen)</option>
                                <option value="null_punkte" ${currentStatus === 'null_punkte' ? 'selected' : ''}>Unentschuldigt (0% Wertung)</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
            card.style.opacity = '0.9';
        }
        
        container.appendChild(card);
    });
}

// Helper function to match student names robustly across different formats
function matchStudentNames(nameA, nameB) {
    if (!nameA || !nameB) return false;
    
    const cleanA = nameA.replace(/"/g, '').trim().toLowerCase();
    const cleanB = nameB.replace(/"/g, '').trim().toLowerCase();
    
    if (cleanA === cleanB) return true;
    
    // Split into words, ignoring commas, underscores, spaces
    const partsA = cleanA.split(/[\s,_+]+/).filter(Boolean);
    const partsB = cleanB.split(/[\s,_+]+/).filter(Boolean);
    
    if (partsA.length === 0 || partsB.length === 0) return false;
    
    // Check if the set of words is identical
    if (partsA.length === partsB.length) {
        const matchAll = partsA.every(p => partsB.includes(p));
        if (matchAll) return true;
    }
    
    // Check if one is a subset of another (handling middle names / partial names)
    const isASubsetOfB = partsA.every(p => partsB.includes(p));
    const isBSubsetOfA = partsB.every(p => partsA.includes(p));
    
    return isASubsetOfB || isBSubsetOfA;
}

window.updateLPMissingStatus = function(lpId, studentKey, newStatus) {
    const lp = appState.lernpakete.find(l => l.id === lpId);
    if (!lp) return;
    
    if (!lp.missingStatuses) {
        lp.missingStatuses = {};
    }
    
    lp.missingStatuses[studentKey] = newStatus;
    saveStateToStorage();
    
    // Re-render student detail
    renderStudentDetail(studentKey);
    showNotification("Teilnahme-Status des Lernpakets erfolgreich aktualisiert!", "success");
};

window.toggleLPDetailsCollapse = function(headerElement) {
    const card = headerElement.parentElement;
    const body = card.querySelector('.lp-detail-body-collapse');
    const icon = headerElement.querySelector('span[style*="margin-right"]');
    
    if (body) {
        const isHidden = body.classList.toggle('hidden');
        if (icon) {
            icon.innerHTML = isHidden ? '&#9658;' : '&#9660;';
        }
    }
};


