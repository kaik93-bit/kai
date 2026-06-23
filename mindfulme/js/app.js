// MindfulMe App Logic

// --- App State ---
let appState = {
    theme: 'dark',
    moodLogs: [],
    journalEntries: [],
    routines: [false, false, false] // Matches the checklist items on home screen
};

// Affirmations list
const affirmations = [
    { text: "Deine Gegenwart ist ein Geschenk an die Welt.", author: "Achtsamkeit" },
    { text: "Atme tief ein. Atme tief aus. Du machst das großartig.", author: "Atem-Coach" },
    { text: "Du bist genug, genau so wie du jetzt gerade bist.", author: "Selbstliebe" },
    { text: "Erlaube dir selbst, Fehler zu machen und zu wachsen.", author: "Wachstum" },
    { text: "Jeder Tag ist eine neue Chance, achtsam mit dir umzugehen.", author: "Gelassenheit" },
    { text: "Stürme dauern nicht ewig. Auch dieser geht vorbei.", author: "Resilienz" },
    { text: "Kleine Fortschritte sind auch Fortschritte. Feiere sie.", author: "Motivation" }
];

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    loadStateFromStorage();
    initTheme();
    updateGreeting();
    renderAffirmation();
    initEventListeners();
    updateDashboardUI();
    renderMoodChart();
    renderJournalEntries();
    updateChecklistUI();
});

// 1. Clock functionality
function initClock() {
    const timeDisplay = document.getElementById('phone-time');
    const updateTime = () => {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        if (timeDisplay) {
            timeDisplay.textContent = `${hrs}:${mins}`;
        }
    };
    updateTime();
    setInterval(updateTime, 60000);
}

// 2. Local Storage helpers
function loadStateFromStorage() {
    const storedState = localStorage.getItem('mindfulme_state');
    if (storedState) {
        try {
            appState = JSON.parse(storedState);
        } catch (e) {
            console.error("Fehler beim Laden der Spieldaten", e);
        }
    }
    
    // Ensure state defaults are populated
    if (!appState) {
        appState = {
            theme: 'dark',
            moodLogs: [],
            journalEntries: [],
            routines: [false, false, false],
            friends: []
        };
    }
    if (!appState.friends || appState.friends.length === 0) {
        appState.friends = [
            { id: 'dm_marie', name: 'Marie', online: true, mood: '😄', moodLabel: 'Super', color: 'var(--accent2)' },
            { id: 'dm_jonas', name: 'Jonas', online: true, mood: '😐', moodLabel: 'Neutral', color: 'var(--primary-light)' },
            { id: 'dm_sarah', name: 'Sarah', online: false, mood: '😢', moodLabel: 'Schlecht', color: 'var(--text-muted)' }
        ];
    }
}

function saveStateToStorage() {
    localStorage.setItem('mindfulme_state', JSON.stringify(appState));
}

// 3. Navigation
window.switchScreen = function(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.app-screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        // Scroll back to top
        document.getElementById('app-content').scrollTop = 0;
    }

    // Update nav icons active class
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        const target = item.getAttribute('data-target');
        if (target === screenId) {
            item.classList.add('active');
        }
    });

    // Special handlers per screen
    if (screenId === 'screen-mood') {
        renderMoodChart();
    } else if (screenId === 'screen-chat') {
        // Render according to chat room state
        if (currentChannelId !== null) {
            document.getElementById('chat-tabs-container').style.display = 'none';
            document.getElementById('chat-groups-view-wrapper').style.display = 'none';
            document.getElementById('chat-friends-view-wrapper').style.display = 'none';
            document.getElementById('chat-room-view').style.display = 'flex';
        } else {
            document.getElementById('chat-tabs-container').style.display = 'flex';
            document.getElementById('chat-room-view').style.display = 'none';
            
            if (activeChatTab === 'groups') {
                document.getElementById('chat-groups-view-wrapper').style.display = 'flex';
                document.getElementById('chat-friends-view-wrapper').style.display = 'none';
                
                // Show correct groups subview
                if (selectedAgeGroup === null) {
                    document.getElementById('chat-age-selection-view').style.display = 'flex';
                    document.getElementById('chat-channels-view').style.display = 'none';
                } else {
                    renderChannelsList();
                    document.getElementById('chat-age-selection-view').style.display = 'none';
                    document.getElementById('chat-channels-view').style.display = 'flex';
                }
            } else {
                document.getElementById('chat-groups-view-wrapper').style.display = 'none';
                document.getElementById('chat-friends-view-wrapper').style.display = 'flex';
                renderFriendsList();
            }
        }
    } else {
        currentChannelId = null;
    }
};

// 4. Custom Theme Toggle (Light/Dark)
function initTheme() {
    const html = document.documentElement;
    html.setAttribute('data-theme', appState.theme);
    
    // Update active state in desktop controls
    const darkBtn = document.getElementById('btn-theme-dark');
    const lightBtn = document.getElementById('btn-theme-light');
    
    if (appState.theme === 'light') {
        darkBtn.classList.remove('active');
        lightBtn.classList.add('active');
    } else {
        lightBtn.classList.remove('active');
        darkBtn.classList.add('active');
    }
}

function setTheme(themeName) {
    appState.theme = themeName;
    saveStateToStorage();
    initTheme();
}

// 5. Greeting builder
function updateGreeting() {
    const greetingText = document.getElementById('dynamic-greeting');
    if (!greetingText) return;

    const hours = new Date().getHours();
    let greeting = 'Hallo!';
    if (hours >= 5 && hours < 12) {
        greeting = 'Guten Morgen!';
    } else if (hours >= 12 && hours < 17) {
        greeting = 'Schönen Tag!';
    } else if (hours >= 17 && hours < 22) {
        greeting = 'Guten Abend!';
    } else {
        greeting = 'Gute Nacht!';
    }
    greetingText.textContent = greeting;
}

// 6. Affirmation card randomizer
function renderAffirmation() {
    const textElement = document.getElementById('affirmation-text');
    const authorElement = document.getElementById('affirmation-author');
    if (!textElement || !authorElement) return;

    // Pick random affirmation
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    const item = affirmations[randomIndex];
    
    textElement.textContent = item.text;
    authorElement.textContent = item.author;
}

// 7. Routines/Checklist logic
window.toggleRoutine = function(element) {
    const checklistItems = Array.from(document.querySelectorAll('.checklist-item'));
    const index = checklistItems.indexOf(element);
    
    if (index !== -1) {
        element.classList.toggle('checked');
        appState.routines[index] = element.classList.contains('checked');
        saveStateToStorage();
    }
};

function updateChecklistUI() {
    const checklistItems = document.querySelectorAll('.checklist-item');
    checklistItems.forEach((item, index) => {
        if (appState.routines[index]) {
            item.classList.add('checked');
        } else {
            item.classList.remove('checked');
        }
    });
}

// 8. Mood Tracker Screen Logic
let selectedMoodValue = 0;
const moodLabels = {
    5: { label: "Super", emoji: "😄" },
    4: { label: "Gut", emoji: "🙂" },
    3: { label: "Neutral", emoji: "😐" },
    2: { label: "Mies", emoji: "😕" },
    1: { label: "Schlecht", emoji: "😢" }
};

function setupMoodTracker() {
    const moodBtns = document.querySelectorAll('.mood-btn');
    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            moodBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMoodValue = parseInt(btn.getAttribute('data-mood'));
        });
    });

    const tags = document.querySelectorAll('#mood-tags .tag-chip');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
        });
    });

    const saveBtn = document.getElementById('btn-save-mood');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveMoodEntry);
    }
}

function saveMoodEntry() {
    if (selectedMoodValue === 0) {
        alert("Bitte wähle eine Stimmung aus, bevor du speicherst.");
        return;
    }

    const selectedTags = [];
    const activeTags = document.querySelectorAll('#mood-tags .tag-chip.selected');
    activeTags.forEach(t => selectedTags.push(t.getAttribute('data-tag')));

    const note = document.getElementById('mood-note').value.trim();
    
    const entry = {
        id: Date.now(),
        mood: selectedMoodValue,
        tags: selectedTags,
        note: note,
        date: new Date().toISOString()
    };

    appState.moodLogs.push(entry);
    saveStateToStorage();
    
    // Reset UI
    selectedMoodValue = 0;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('#mood-tags .tag-chip').forEach(t => t.classList.remove('selected'));
    document.getElementById('mood-note').value = '';

    // Update widgets
    updateDashboardUI();
    renderMoodChart();
    
    // Switch back to home
    switchScreen('screen-home');
}

function updateDashboardUI() {
    const homeIndicator = document.getElementById('home-mood-indicator');
    const homeEmoji = document.getElementById('home-mood-emoji');
    const homeSubtitle = document.getElementById('home-mood-subtitle');
    
    if (!homeIndicator || !homeEmoji || !homeSubtitle) return;

    if (appState.moodLogs.length === 0) {
        homeIndicator.textContent = "Noch nicht erfasst";
        homeEmoji.textContent = "✨";
        homeSubtitle.textContent = "Nimm dir kurz Zeit, um zu reflektieren.";
        return;
    }

    // Get latest logged mood
    const latest = appState.moodLogs[appState.moodLogs.length - 1];
    const details = moodLabels[latest.mood];
    
    homeIndicator.textContent = "Heute erfasst";
    homeEmoji.textContent = details.emoji;
    
    let subtitleText = `Du fühlst dich heute ${details.label}.`;
    if (latest.tags.length > 0) {
        subtitleText += ` Beeinflusst durch: ${latest.tags.join(', ')}.`;
    }
    homeSubtitle.textContent = subtitleText;
}

// 9. Drawing interactive SVG Mood Chart
function renderMoodChart() {
    const wrapper = document.getElementById('chart-wrapper');
    if (!wrapper) return;

    // Filter to last 7 entries
    const recentLogs = appState.moodLogs.slice(-7);
    
    if (recentLogs.length === 0) {
        wrapper.innerHTML = `<div style="position: absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:0.75rem; color:var(--text-muted);" id="chart-placeholder">Noch keine Stimmungseinträge vorhanden</div>`;
        return;
    }

    // SVG Drawing logic
    const width = 310;
    const height = 120;
    const padding = 15;
    
    // Calculate coordinates
    const pointsCount = recentLogs.length;
    const xStep = pointsCount > 1 ? (width - padding * 2) / (pointsCount - 1) : 0;
    
    // Max mood is 5, Min is 1
    const getY = (moodValue) => {
        // Map 1-5 to height-padding and padding
        const ratio = (moodValue - 1) / 4;
        return height - padding - ratio * (height - padding * 2);
    };

    let points = [];
    let svgContent = '';

    recentLogs.forEach((log, index) => {
        const x = padding + index * xStep;
        const y = getY(log.mood);
        points.push(`${x},${y}`);
        
        // Format date (e.g. "22. Jun")
        const dateObj = new Date(log.date);
        const dateLabel = dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
        
        // Add vertical dashed line
        svgContent += `<line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}" stroke="var(--border-color)" stroke-dasharray="3,3" />`;
        
        // Add text labels below dots
        svgContent += `<text x="${x}" y="${height - 2}" text-anchor="middle" font-size="7" fill="var(--text-muted)" font-weight="600">${dateLabel}</text>`;
        
        // Add mood label above dot
        svgContent += `<text x="${x}" y="${y - 8}" text-anchor="middle" font-size="9">${moodLabels[log.mood].emoji}</text>`;
    });

    const polylinePoints = points.join(' ');
    
    // Build final SVG markup
    let finalSVG = `
        <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
            <!-- Horizontal grid lines -->
            <line x1="${padding}" y1="${getY(5)}" x2="${width - padding}" y2="${getY(5)}" stroke="var(--border-color)" stroke-width="0.5" />
            <line x1="${padding}" y1="${getY(3)}" x2="${width - padding}" y2="${getY(3)}" stroke="var(--border-color)" stroke-width="0.5" />
            <line x1="${padding}" y1="${getY(1)}" x2="${width - padding}" y2="${getY(1)}" stroke="var(--border-color)" stroke-width="0.5" />
            
            <!-- Connection Line -->
            ${pointsCount > 1 ? `<polyline points="${polylinePoints}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` : ''}
            
            <!-- Custom vertical grids and labels -->
            ${svgContent}
            
            <!-- Nodes -->
            ${points.map((pt, i) => {
                const [cx, cy] = pt.split(',');
                return `<circle class="chart-dot" cx="${cx}" cy="${cy}" r="5" />`;
            }).join('')}
        </svg>
    `;

    wrapper.innerHTML = finalSVG;
}

// 10. Breathing Coach (Guided Meditation)
let breathingActive = false;
let breathingInterval = null;
let breatheStep = 0; // 0: inhale, 1: hold, 2: exhale
let secondsCounter = 0;

function setupBreathingCoach() {
    const toggleBtn = document.getElementById('btn-breathe-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleBreathingExercise);
    }
}

function toggleBreathingExercise() {
    const toggleBtn = document.getElementById('btn-breathe-toggle');
    const bubble = document.getElementById('breathing-bubble');
    const timerText = document.getElementById('breathing-timer-text');
    const instructionText = document.getElementById('breathe-instruction-text');
    const subText = document.getElementById('breathe-timer-sub');

    if (breathingActive) {
        // Stop exercise
        clearInterval(breathingInterval);
        breathingActive = false;
        toggleBtn.textContent = "Übung starten";
        toggleBtn.classList.remove('active');
        
        // Reset classes
        bubble.className = "breathing-ring-visual";
        timerText.textContent = "Bereit";
        instructionText.textContent = "Tippe auf Start für 4-7-8 Atmung";
        subText.textContent = "Tief einatmen, halten, ausatmen";
    } else {
        // Start exercise
        breathingActive = true;
        toggleBtn.textContent = "Übung beenden";
        toggleBtn.classList.add('active');
        
        breatheStep = 0;
        secondsCounter = 4; // Start with Inhale 4s
        
        // Trigger immediate first step
        runBreathingCycle();
        
        // Interval runs every 1 second
        breathingInterval = setInterval(() => {
            secondsCounter--;
            timerText.textContent = `${secondsCounter}s`;
            
            if (secondsCounter <= 0) {
                // Advance step
                breatheStep = (breatheStep + 1) % 3;
                runBreathingCycle();
            }
        }, 1000);
    }
}

function runBreathingCycle() {
    const bubble = document.getElementById('breathing-bubble');
    const timerText = document.getElementById('breathing-timer-text');
    const instructionText = document.getElementById('breathe-instruction-text');
    const subText = document.getElementById('breathe-timer-sub');
    
    // Clear anim classes
    bubble.classList.remove('inhale', 'hold', 'exhale');
    
    if (breatheStep === 0) {
        // Inhale 4 seconds
        secondsCounter = 4;
        bubble.classList.add('inhale');
        instructionText.textContent = "Einatmen...";
        subText.textContent = "Fülle deine Lungen sanft mit Luft";
    } else if (breatheStep === 1) {
        // Hold 7 seconds
        secondsCounter = 7;
        bubble.classList.add('hold');
        instructionText.textContent = "Luft anhalten...";
        subText.textContent = "Spüre die Energie in deinem Körper";
    } else {
        // Exhale 8 seconds
        secondsCounter = 8;
        bubble.classList.add('exhale');
        instructionText.textContent = "Ausatmen...";
        subText.textContent = "Lasse allen Stress entweichen";
    }
    
    timerText.textContent = `${secondsCounter}s`;
}

// 11. Gratitude & Journaling Screen
let selectedJournalSentiment = "Dankbarkeit";

function setupJournal() {
    const sentimentChips = document.querySelectorAll('#journal-sentiment-tags .tag-chip');
    sentimentChips.forEach(chip => {
        chip.addEventListener('click', () => {
            sentimentChips.forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            selectedJournalSentiment = chip.getAttribute('data-sentiment');
        });
    });

    const saveJournalBtn = document.getElementById('btn-save-journal');
    if (saveJournalBtn) {
        saveJournalBtn.addEventListener('click', saveJournalEntry);
    }
}

function saveJournalEntry() {
    const textInput = document.getElementById('journal-input');
    const text = textInput.value.trim();

    if (!text) {
        alert("Bitte schreibe deine Gedanken auf, bevor du speicherst.");
        return;
    }

    const entry = {
        id: Date.now(),
        sentiment: selectedJournalSentiment,
        text: text,
        date: new Date().toISOString()
    };

    appState.journalEntries.push(entry);
    saveStateToStorage();

    // Reset UI
    textInput.value = '';
    
    // Re-render
    renderJournalEntries();
}

function renderJournalEntries() {
    const container = document.getElementById('journal-entries-container');
    if (!container) return;

    if (appState.journalEntries.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 30px;">Schreibe deinen ersten Eintrag oben auf.</div>`;
        return;
    }

    // Sort entries by newest first
    const sortedEntries = [...appState.journalEntries].sort((a,b) => b.id - a.id);
    
    let html = '';
    sortedEntries.forEach(entry => {
        const dateObj = new Date(entry.date);
        const formattedDate = dateObj.toLocaleDateString('de-DE', {
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        html += `
            <div class="journal-entry-card">
                <div class="journal-entry-meta">
                    <span>${formattedDate}</span>
                    <span class="journal-entry-tag">${entry.sentiment}</span>
                </div>
                <div class="journal-entry-text">${escapeHTML(entry.text)}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// 12. Desktop control commands (Mock data population & theme)
function initEventListeners() {
    // Theme switches
    const darkBtn = document.getElementById('btn-theme-dark');
    const lightBtn = document.getElementById('btn-theme-light');
    if (darkBtn) darkBtn.addEventListener('click', () => setTheme('dark'));
    if (lightBtn) lightBtn.addEventListener('click', () => setTheme('light'));

    // Loading mock demo data
    const loadDemoBtn = document.getElementById('btn-load-demo');
    if (loadDemoBtn) {
        loadDemoBtn.addEventListener('click', loadDemoData);
    }

    // Reset app
    const resetBtn = document.getElementById('btn-reset-app');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetApp);
    }

    // Quote card click randomizer
    const quoteCard = document.getElementById('affirmation-card');
    if (quoteCard) {
        quoteCard.addEventListener('click', () => {
            // Apply scale pop animation
            quoteCard.style.transform = 'scale(0.96)';
            setTimeout(() => {
                renderAffirmation();
                quoteCard.style.transform = 'scale(1)';
            }, 150);
        });
    }

    // Setup interactive views
    setupMoodTracker();
    setupBreathingCoach();
    setupJournal();
}

function loadDemoData() {
    if (confirm("Möchtest du Beispieldaten in das Protokoll laden? Dadurch werden deine bisher erstellten Logs überschrieben.")) {
        const today = new Date();
        
        // Generate mock dates going back over the last 5 days
        const getOffsetDate = (offsetDays) => {
            const d = new Date();
            d.setDate(today.getDate() - offsetDays);
            return d.toISOString();
        };

        appState.moodLogs = [
            { id: Date.now() - 400000, mood: 3, tags: ["Arbeit", "Schlaf"], note: "Recht müde am Morgen, aber ok.", date: getOffsetDate(5) },
            { id: Date.now() - 300000, mood: 2, tags: ["Arbeit"], note: "Stressiger Arbeitstag. Zu viele Meetings.", date: getOffsetDate(4) },
            { id: Date.now() - 200000, mood: 4, tags: ["Freizeit", "Freunde"], note: "Netter Abend mit Freunden beim Abendessen.", date: getOffsetDate(3) },
            { id: Date.now() - 100000, mood: 5, tags: ["Schlaf", "Gesundheit"], note: "Super geschlafen und Yoga gemacht.", date: getOffsetDate(2) },
            { id: Date.now() - 50000, mood: 4, tags: ["Ernährung", "Schlaf"], note: "Ausgeglichener Tag.", date: getOffsetDate(1) }
        ];

        appState.journalEntries = [
            { id: Date.now() - 250000, sentiment: "Dankbarkeit", text: "Ich bin dankbar für das leckere Essen, das ich gestern gekocht habe.", date: getOffsetDate(3) },
            { id: Date.now() - 180000, sentiment: "Erfolg", text: "Habe heute ein schwieriges Programmierproblem gelöst. Das fühlt sich toll an!", date: getOffsetDate(2) },
            { id: Date.now() - 90000, sentiment: "Liebe", text: "Meine Katze lag stundenlang schnurrend auf meinem Schoß.", date: getOffsetDate(1) },
            { id: Date.now() - 10000, sentiment: "Erkenntnis", text: "Es tut gut, sich abends 10 Minuten ohne Handy hinzusetzen.", date: today.toISOString() }
        ];

        appState.routines = [true, true, false];

        saveStateToStorage();
        
        // Reload all widgets
        updateDashboardUI();
        renderMoodChart();
        renderJournalEntries();
        updateChecklistUI();
        
        alert("Beispieldaten geladen!");
    }
}

function resetApp() {
    if (confirm("Möchtest du wirklich alle Einträge löschen und die App zurücksetzen?")) {
        appState = {
            theme: 'dark',
            moodLogs: [],
            journalEntries: [],
            routines: [false, false, false],
            friends: [
                { id: 'dm_marie', name: 'Marie', online: true, mood: '😄', moodLabel: 'Super', color: 'var(--accent2)' },
                { id: 'dm_jonas', name: 'Jonas', online: true, mood: '😐', moodLabel: 'Neutral', color: 'var(--primary-light)' },
                { id: 'dm_sarah', name: 'Sarah', online: false, mood: '😢', moodLabel: 'Schlecht', color: 'var(--text-muted)' }
            ]
        };
        saveStateToStorage();
        initTheme();
        updateGreeting();
        renderAffirmation();
        
        // Clear forms
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('#mood-tags .tag-chip').forEach(t => t.classList.remove('selected'));
        document.getElementById('mood-note').value = '';
        document.getElementById('journal-input').value = '';

        // Reset chat
        selectedAgeGroup = null;
        activeChatTab = 'groups';
        channelConversations = JSON.parse(JSON.stringify(defaultConversations));
        changeAgeGroup();

        // Reload views
        updateDashboardUI();
        renderMoodChart();
        renderJournalEntries();
        updateChecklistUI();

        alert("Die App wurde erfolgreich in den Ausgangszustand zurückgesetzt.");
    }
}

// --- 12. Mock Chat & Community Screen Logic ---

const channelsByAge = {
    'under18': [
        { id: '#SchuleDruck', name: 'Schule & Leistungsdruck', desc: 'Umgang mit Schulstress, Notenangst und Erwartungen.', online: '84', lastMsg: 'Felix: Morgen wieder Mathearbeit... 😭', color: 'var(--primary-light)' },
        { id: '#ElternZuhause', name: 'Eltern & Familie', desc: 'Austausch über Stress zu Hause und Streit mit den Eltern.', online: '56', lastMsg: 'Laura: Meine Eltern verstehen mich nicht.', color: 'var(--accent2)' },
        { id: '#FreundeGefuehle', name: 'Freundschaft & Gefühle', desc: 'Einsamkeit, Liebeskummer und Gefühlschaos unter Jugendlichen.', online: '92', lastMsg: 'Sarah: Es tut gut zu wissen, dass...', color: 'var(--accent-light)' }
    ],
    'adults': [
        { id: '#ArbeitBurnout', name: 'Arbeit & Burnout', desc: 'Leistungsdruck im Beruf, Jobsuche und Work-Life-Balance.', online: '142', lastMsg: 'Lucas: Wie entspannt ihr euch heute?', color: 'var(--primary-light)' },
        { id: '#FamilieAlltag', name: 'Beziehungen & Alltag', desc: 'Konflikte in der Partnerschaft, Erziehung und Alltagsstress.', online: '118', lastMsg: 'Sofia: Job und Kinder sind erdrückend...', color: 'var(--accent2)' },
        { id: '#ZukunftsAengste', name: 'Zukunft & Existenz', desc: 'Sorgen um die Zukunft, Finanzen und existenzielle Fragen.', online: '105', lastMsg: 'Jonas: Wenn ich die Nachrichten lese...', color: 'var(--accent-light)' }
    ]
};

const defaultConversations = {
    '#SchuleDruck': [
        { sender: 'Felix', text: 'Morgen wieder Mathearbeit. Ich krieg jetzt schon Bauchschmerzen...', isOutgoing: false, time: '20:15' },
        { sender: 'Lina', text: 'Fühl ich, ging mir letzte Woche auch so. Nimm dir heute Abend nicht zu viel vor, eine 4 ist auch kein Weltuntergang!', isOutgoing: false, time: '20:18' },
        { sender: 'Leon', text: 'Habt ihr mal die Atemübungen hier in der App ausprobiert? Die helfen mir vor Arbeiten voll runterzukommen.', isOutgoing: false, time: '20:22' }
    ],
    '#ElternZuhause': [
        { sender: 'Laura', text: 'Meine Eltern verstehen mich einfach gar nicht. Ständig gibt es nur Streit wegen Kleinigkeiten.', isOutgoing: false, time: '18:42' },
        { sender: 'Tom', text: 'Same hier... manchmal hilft es einfach, rauszugehen oder Musik anzumachen und auf Durchzug zu schalten.', isOutgoing: false, time: '18:46' },
        { sender: 'Klara', text: 'Vielleicht tut ein klärendes Gespräch an einem ruhigen Tag gut? Aber ich weiß, das ist super schwer.', isOutgoing: false, time: '19:05' }
    ],
    '#FreundeGefuehle': [
        { sender: 'Sarah', text: 'Ich fühle mich in letzter Zeit in der Schule oft voll ausgeschlossen. Als ob ich unsichtbar wäre.', isOutgoing: false, time: '14:10' },
        { sender: 'Emil', text: 'Das tut mir leid zu hören. Aber du bist nicht unsichtbar, wir lesen dich hier alle!', isOutgoing: false, time: '14:15' },
        { sender: 'Zoe', text: 'Es gibt Phasen, da läuft es mit Freunden echt schwer. Du bist gut so wie du bist!', isOutgoing: false, time: '14:18' }
    ],
    '#ArbeitBurnout': [
        { sender: 'Lucas', text: 'Wie entspannt ihr euch heute nach Feierabend? Mein Kopf platzt fast vor E-Mails.', isOutgoing: false, time: '17:30' },
        { sender: 'Marie', text: 'Ich lasse das Handy ab 19 Uhr komplett aus. Tut echt gut für den Kopf.', isOutgoing: false, time: '17:35' },
        { sender: 'Sandra', text: 'Erst mal eine Runde joggen gehen, um den Stress abzubauen.', isOutgoing: false, time: '17:42' }
    ],
    '#FamilieAlltag': [
        { sender: 'Sofia', text: 'Manchmal ist der Spagat zwischen Job und Kindern einfach nur erdrückend.', isOutgoing: false, time: '19:12' },
        { sender: 'Daniel', text: 'Absolut. Perfektionismus ablegen ist das Einzige, was mir ein bisschen hilft.', isOutgoing: false, time: '19:18' },
        { sender: 'Tanja', text: 'Vergiss dich selbst nicht bei all den Pflichten. 10 Minuten Me-Time am Tag bewirken Wunder.', isOutgoing: false, time: '19:25' }
    ],
    '#ZukunftsAengste': [
        { sender: 'Jonas', text: 'Wenn ich die Nachrichten lese, kriege ich echt Angst vor der Zukunft. Wie bleibt man da positiv?', isOutgoing: false, time: '21:05' },
        { sender: 'Christian', text: 'Konsumiere weniger News! Fokussiere dich auf dein direktes Umfeld und Dinge, die du kontrollieren kannst.', isOutgoing: false, time: '21:10' },
        { sender: 'Elena', text: 'Dankbarkeitsübungen helfen mir extrem, den Fokus auf das Gute im Hier und Jetzt zu lenken.', isOutgoing: false, time: '21:15' }
    ],
    'dm_marie': [
        { sender: 'Marie', text: 'Hey! Wollte mich nur kurz bedanken. Das Gespräch gestern tat echt gut.', isOutgoing: false, time: '14:20' },
        { sender: 'Du', text: 'Hey Marie! Sehr gerne, mir hat es auch sehr geholfen.', isOutgoing: true, time: '14:25' },
        { sender: 'Marie', text: 'Lass uns das bald wiederholen!', isOutgoing: false, time: '14:26' }
    ],
    'dm_jonas': [
        { sender: 'Jonas', text: 'Hey, bist du heute Abend auch im Atem-Kurs dabei?', isOutgoing: false, time: '19:10' }
    ],
    'dm_sarah': [
        { sender: 'Du', text: 'Hey Sarah, geht es dir heute etwas besser?', isOutgoing: true, time: '11:05' },
        { sender: 'Sarah', text: 'Heute ist ein schwerer Tag... Melde dich, wenn du Zeit hast.', isOutgoing: false, time: '11:15' }
    ]
};

let channelConversations = JSON.parse(JSON.stringify(defaultConversations));
let selectedAgeGroup = null;
let currentChannelId = null;
let activeChatTab = 'groups';

const botReplies = {
    '#SchuleDruck': [
        { sender: 'Lina', text: 'Du schaffst das morgen! Mach dir nicht zu viel Druck. Noten definieren nicht deinen Wert.' },
        { sender: 'Leon', text: 'Atme erst mal tief durch. Vielleicht hilft dir der Atem-Coach?' },
        { sender: 'Felix', text: 'Kopf hoch! Nach der Schule wird es besser.' }
    ],
    '#ElternZuhause': [
        { sender: 'Tom', text: 'Manchmal hilft es, sich ein bisschen Freiraum zu nehmen. Musik hilft immer.' },
        { sender: 'Klara', text: 'Ich kenne das. Du bist nicht allein damit. Halt durch!' },
        { sender: 'Laura', text: 'Vielleicht kannst du morgen mit einer vertrauensvollen Person darüber reden?' }
    ],
    '#FreundeGefuehle': [
        { sender: 'Zoe', text: 'Fühl dich gedrückt! Du bist eine tolle Person, vergiss das nicht.' },
        { sender: 'Emil', text: 'Ich bin auch oft einsam, aber dieser Chat hilft mir sehr.' },
        { sender: 'Sarah', text: 'Wir sind alle für dich da!' }
    ],
    '#ArbeitBurnout': [
        { sender: 'Marie', text: 'Das klingt nach einem sehr stressigen Arbeitstag bei dir. Atme erst mal tief durch. 💕' },
        { sender: 'Alexander', text: 'Gönn dir heute Abend etwas Ruhe. Du hast dein Bestes gegeben!' },
        { sender: 'Marie', text: 'Ich verstehe dich total. Mir hilft oft eine Tasse Tee und ruhige Musik.' }
    ],
    '#FamilieAlltag': [
        { sender: 'Sofia', text: 'Es ist völlig okay, wenn du dich heute so fühlst. Morgen ist ein neuer Tag.' },
        { sender: 'Michael', text: 'Wir sind hier alle für dich da. Du bist mit diesem Gefühl nicht allein.' },
        { sender: 'Elena', text: 'Schicke dir ganz viel Wärme. Nimm dir alle Zeit der Welt.' }
    ],
    '#ZukunftsAengste': [
        { sender: 'Laura', text: 'Du bist hier im Chat in Sicherheit. Versuche mal, die Atemübung zu machen.' },
        { sender: 'Jonas', text: 'Angst fühlt sich riesig an, aber sie geht wieder vorbei. Versprochen.' },
        { sender: 'Sandra', text: 'Mir hilft es in solchen Momenten, fünf Dinge zu benennen, die ich sehen kann.' }
    ]
};

const dmReplies = {
    'dm_marie': [
        { sender: 'Marie', text: 'Das freut mich sehr zu hören! 😊 Was machst du heute noch so?' },
        { sender: 'Marie', text: 'Ganz genau! Lass uns am Wochenende mal spazieren gehen.' },
        { sender: 'Marie', text: 'Schicke dir ein bisschen positive Energie! ✨' }
    ],
    'dm_jonas': [
        { sender: 'Jonas', text: 'Klingt super! Lass uns nachher dort treffen.' },
        { sender: 'Jonas', text: 'Gerade ist viel los, aber ich versuche mir die Zeit zu nehmen.' },
        { sender: 'Jonas', text: 'Danke dir! Tut gut, von dir zu hören.' }
    ],
    'dm_sarah': [
        { sender: 'Sarah', text: 'Danke für deine liebe Nachricht. Das bedeutet mir viel.' },
        { sender: 'Sarah', text: 'Es geht langsam bergauf. Ich versuche mich heute ein bisschen auszuruhen.' },
        { sender: 'Sarah', text: 'Morgen wird hoffentlich besser. 🌸' }
    ]
};

const genericDmReplies = [
    "Danke für deine Nachricht! Wie geht es dir heute?",
    "Das verstehe ich total. Schön, dass wir schreiben! 😊",
    "Klingt nach einem guten Plan. Lass uns in Kontakt bleiben!",
    "Ich hoffe, du hast heute einen entspannten Tag. 🌸",
    "Danke, dass du das mit mir teilst. Ich bin immer für dich da!"
];

window.switchChatTab = function(tab) {
    activeChatTab = tab;
    closeChatRoom(); // Ensure room is closed
    
    const groupsBtn = document.getElementById('btn-chat-tab-groups');
    const friendsBtn = document.getElementById('btn-chat-tab-friends');
    
    if (tab === 'groups') {
        friendsBtn.classList.remove('active');
        groupsBtn.classList.add('active');
        
        document.getElementById('chat-groups-view-wrapper').style.display = 'flex';
        document.getElementById('chat-friends-view-wrapper').style.display = 'none';
        
        if (selectedAgeGroup === null) {
            document.getElementById('chat-age-selection-view').style.display = 'flex';
            document.getElementById('chat-channels-view').style.display = 'none';
        } else {
            renderChannelsList();
            document.getElementById('chat-age-selection-view').style.display = 'none';
            document.getElementById('chat-channels-view').style.display = 'flex';
        }
    } else {
        groupsBtn.classList.remove('active');
        friendsBtn.classList.add('active');
        
        document.getElementById('chat-groups-view-wrapper').style.display = 'none';
        document.getElementById('chat-friends-view-wrapper').style.display = 'flex';
        
        renderFriendsList();
    }
};

window.selectAgeGroup = function(group) {
    selectedAgeGroup = group;
    
    // Update header title based on age group
    const ageHeaderTitle = document.getElementById('chat-age-header-title');
    if (ageHeaderTitle) {
        ageHeaderTitle.textContent = group === 'under18' ? 'Selbsthilfe (Unter 18)' : 'Selbsthilfe (Ab 18)';
    }

    // Render channels
    renderChannelsList();

    // Toggle views
    document.getElementById('chat-age-selection-view').style.display = 'none';
    document.getElementById('chat-channels-view').style.display = 'flex';
};

window.changeAgeGroup = function() {
    selectedAgeGroup = null;
    closeChatRoom(); // Close active chat room if any
    
    // Toggle views
    document.getElementById('chat-channels-view').style.display = 'none';
    document.getElementById('chat-age-selection-view').style.display = 'flex';
};

function renderChannelsList() {
    const container = document.getElementById('chat-channels-container');
    if (!container || !selectedAgeGroup) return;

    const channels = channelsByAge[selectedAgeGroup] || [];
    let html = '';

    channels.forEach(ch => {
        // Get last message in conversation
        const history = channelConversations[ch.id] || [];
        let lastMsgText = ch.lastMsg;
        if (history.length > 0) {
            const lastLog = history[history.length - 1];
            const senderName = lastLog.isOutgoing ? 'Du' : lastLog.sender;
            lastMsgText = `${senderName}: ${lastLog.text}`;
        }
        // Limit string size for display
        if (lastMsgText.length > 45) {
            lastMsgText = lastMsgText.substring(0, 42) + '...';
        }

        html += `
            <div class="glass-card channel-item" onclick="openChatRoom('${ch.name}', '${ch.id}', '${ch.online}')" style="cursor: pointer; padding: 16px; margin-bottom: 0;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <h4 style="font-family: var(--font-heading); font-size: 0.95rem; color: ${ch.color};">${ch.id}</h4>
                    <span class="badge-info" style="margin-top: 0; font-size: 0.65rem; padding: 2px 6px; ${selectedAgeGroup === 'under18' ? '' : 'background: rgba(16,185,129,0.15); color: var(--accent-light);'}">${ch.online} online</span>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 8px;">${ch.desc}</p>
                <div style="font-size: 0.7rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                    <span style="font-weight: 600; color: var(--text-secondary);">${escapeHTML(lastMsgText)}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderFriendsList() {
    const container = document.getElementById('chat-friends-list-container');
    if (!container) return;
    
    let html = '';
    
    appState.friends.forEach(f => {
        const history = channelConversations[f.id] || [];
        let lastMsgText = 'Keine Nachrichten vorhanden. Unterhaltung beginnen...';
        if (history.length > 0) {
            const lastLog = history[history.length - 1];
            const senderName = lastLog.isOutgoing ? 'Du' : f.name;
            lastMsgText = `${senderName}: ${lastLog.text}`;
        }
        
        // Trim message preview
        if (lastMsgText.length > 40) {
            lastMsgText = lastMsgText.substring(0, 37) + '...';
        }
        
        const initial = f.name.charAt(0).toUpperCase();
        const statusClass = f.online ? 'online' : 'offline';
        
        html += `
            <div class="glass-card friend-item" onclick="openChatRoom('${f.name}', '${f.id}', '')" style="cursor: pointer; padding: 14px; margin-bottom: 0;">
                <div class="friend-avatar-wrapper">
                    <div class="friend-avatar" style="background: ${f.color};">${initial}</div>
                    <div class="friend-status-dot ${statusClass}"></div>
                </div>
                <div class="friend-info">
                    <div class="friend-header">
                        <span class="friend-name" style="font-family: var(--font-heading); font-size: 0.95rem; font-weight: 600;">${f.name}</span>
                        <span class="friend-mood-badge">
                            <span>${f.mood}</span>
                            <span>${f.moodLabel}</span>
                        </span>
                    </div>
                    <div class="friend-last-msg">${escapeHTML(lastMsgText)}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

window.addMockFriend = function() {
    const input = document.getElementById('add-friend-input');
    const name = input.value.trim();
    if (!name) return;
    
    const newId = 'dm_' + name.toLowerCase().replace(/\s+/g, '');
    
    // Check if already exists
    if (appState.friends.some(f => f.id === newId)) {
        alert("Diese Person ist bereits in deiner Freundesliste!");
        return;
    }
    
    const moods = [
        { emoji: '😄', label: 'Super' },
        { emoji: '🙂', label: 'Gut' },
        { emoji: '😐', label: 'Neutral' },
        { emoji: '😕', label: 'Mies' }
    ];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const colors = ['var(--primary-light)', 'var(--accent2)', 'var(--accent-light)'];
    const randomColor = colors[Math.floor(colors.length * Math.random())];

    const newFriend = {
        id: newId,
        name: name,
        online: true,
        mood: randomMood.emoji,
        moodLabel: randomMood.label,
        color: randomColor
    };
    
    appState.friends.push(newFriend);
    saveStateToStorage();
    
    // Initialize conversation history
    channelConversations[newId] = [
        { sender: name, text: `Hey! Schön dich auf MindfulMe als Freund zu haben. Wie geht es dir heute?`, isOutgoing: false, time: 'Gerade' }
    ];
    
    renderFriendsList();
    input.value = '';
};

window.openChatRoom = function(channelName, channelId, onlineCount) {
    currentChannelId = channelId;
    
    // Toggle active tabs wrapper display off when room is open
    document.getElementById('chat-tabs-container').style.display = 'none';
    document.getElementById('chat-groups-view-wrapper').style.display = 'none';
    document.getElementById('chat-friends-view-wrapper').style.display = 'none';
    
    const isDM = channelId.startsWith('dm_');
    const avatarEl = document.getElementById('chat-room-avatar');
    
    if (isDM) {
        const friend = appState.friends.find(f => f.id === channelId);
        const name = friend ? friend.name : channelName;
        const status = friend && friend.online ? 'Online' : 'Offline';
        const color = friend ? friend.color : 'var(--primary)';
        
        document.getElementById('chat-room-title').textContent = name;
        document.getElementById('chat-room-subtitle').textContent = status;
        
        if (avatarEl) {
            avatarEl.textContent = name.charAt(0).toUpperCase();
            avatarEl.style.background = color;
        }
    } else {
        document.getElementById('chat-room-title').textContent = channelId;
        document.getElementById('chat-room-subtitle').textContent = `${onlineCount} Mitglieder online`;
        
        if (avatarEl) {
            avatarEl.textContent = 'C';
            avatarEl.style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--accent2) 100%)';
        }
    }
    
    // Show room
    document.getElementById('chat-room-view').style.display = 'flex';
    
    // Render messages
    renderChatMessages();
};

window.closeChatRoom = function() {
    currentChannelId = null;
    
    document.getElementById('chat-room-view').style.display = 'none';
    
    if (activeChatTab === 'groups') {
        document.getElementById('chat-tabs-container').style.display = 'flex';
        document.getElementById('chat-groups-view-wrapper').style.display = 'flex';
        renderChannelsList();
    } else {
        document.getElementById('chat-tabs-container').style.display = 'flex';
        document.getElementById('chat-friends-view-wrapper').style.display = 'flex';
        renderFriendsList();
    }
};

function renderChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container || !currentChannelId) return;
    
    const messages = channelConversations[currentChannelId] || [];
    let html = '';
    
    messages.forEach(msg => {
        const bubbleClass = msg.isOutgoing ? 'outgoing' : 'incoming';
        const senderName = msg.isOutgoing ? 'Du' : msg.sender;
        
        html += `
            <div class="chat-message-bubble ${bubbleClass}">
                <div class="chat-message-meta">
                    <span class="chat-sender-name">${senderName}</span>
                    <span>${msg.time}</span>
                </div>
                <div>${escapeHTML(msg.text)}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Scroll to bottom
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
}

window.sendChatMessage = function() {
    const input = document.getElementById('chat-message-input');
    const text = input.value.trim();
    if (!text || !currentChannelId) return;
    
    // Add User Message
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    channelConversations[currentChannelId].push({
        sender: 'Du',
        text: text,
        isOutgoing: true,
        time: timeStr
    });
    
    // Render and clear input
    renderChatMessages();
    input.value = '';
    
    // Trigger simulated supportive reply after 1.5 seconds
    const channelIdForTimeout = currentChannelId;
    setTimeout(() => {
        const isDM = channelIdForTimeout.startsWith('dm_');
        let reply = null;
        
        if (isDM) {
            const replies = dmReplies[channelIdForTimeout] || [];
            if (replies.length > 0) {
                reply = replies[Math.floor(Math.random() * replies.length)];
            } else {
                // Generic reply
                const friend = appState.friends.find(f => f.id === channelIdForTimeout);
                const senderName = friend ? friend.name : 'Dein Freund';
                const genericText = genericDmReplies[Math.floor(Math.random() * genericDmReplies.length)];
                reply = { sender: senderName, text: genericText };
            }
        } else {
            const replies = botReplies[channelIdForTimeout] || [{ sender: 'Achtsamkeitsbot', text: 'Danke für das Teilen!' }];
            reply = replies[Math.floor(Math.random() * replies.length)];
        }
        
        const responseTime = new Date();
        const responseTimeStr = `${String(responseTime.getHours()).padStart(2, '0')}:${String(responseTime.getMinutes()).padStart(2, '0')}`;
        
        channelConversations[channelIdForTimeout].push({
            sender: reply.sender,
            text: reply.text,
            isOutgoing: false,
            time: responseTimeStr
        });
        
        // Render if user is still viewing the active channel
        if (currentChannelId === channelIdForTimeout) {
            renderChatMessages();
        } else if (currentChannelId === null && activeChatTab === 'friends' && isDM) {
            // If they closed the room and are on the list, refresh list to show preview
            renderFriendsList();
        }
    }, 1500);
};
