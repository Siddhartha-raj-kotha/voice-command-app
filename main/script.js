let recognition;
let isRecognizing = false;
let savedText = "";
let fileText = "";
let currentUtterance = null;
let commandMode = false;

// Voice Commands Map
const voiceCommands = {
    "start recording": startRecognition,
    "stop recording": stopRecognition,
    "save text": saveText,
    "delete text": deleteText,
    "download text": downloadText,
    "pause speech": pauseSpeech,
    "resume speech": resumeSpeech,
    "stop speech": stopSpeech,
    "go home": showHomeScreen,
    "open history": () => toggleHistory(true),
    "close history": () => toggleHistory(false)
};

function startRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported in this browser.");
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.lang = document.getElementById("language-select").value;
    recognition.continuous = true;

    recognition.onresult = function (event) {
        const output = document.getElementById("output");
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                const transcript = event.results[i][0].transcript.toLowerCase().trim();
                if (commandMode && voiceCommands[transcript]) {
                    voiceCommands[transcript]();
                } else {
                    output.innerText += transcript + " ";
                }
            }
        }
        output.scrollTop = output.scrollHeight;
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
    };

    recognition.onend = function () {
        isRecognizing = false;
    };

    recognition.start();
    isRecognizing = true;
}

function stopRecognition() {
    if (recognition && isRecognizing) {
        recognition.stop();
        isRecognizing = false;
    }
}

function saveText() {
    const output = document.getElementById("output").innerText;
    if (!output.trim()) return alert("Nothing to save.");

    const timestamp = new Date().toLocaleString();
    const listItem = document.createElement("li");
    listItem.innerHTML = `        
        <strong>${timestamp}:</strong> ${output}
        <button class="delete-btn" onclick="deleteHistoryItem(this)">🗑️</button>
    `;
    document.getElementById("history-list").appendChild(listItem);

    savedText = output;
    localStorage.setItem("savedText", savedText);
    showSaveNotification();
    updateHistoryStorage();
}

function deleteText() {
    document.getElementById("output").innerText = "";
    savedText = "";
}

function downloadText() {
    if (!savedText.trim()) {
        alert("No text to download.");
        return;
    }

    const blob = new Blob([savedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "transcript.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function deleteHistoryItem(button) {
    const listItem = button.parentElement;
    listItem.remove();
    updateHistoryStorage();
}


// TTS Functions
function speak(text) {
    if (!window.speechSynthesis) {
        alert("Your browser does not support text-to-speech.");
        return;
    }

    console.log("Speech synthesis initialized");

    // If already speaking, cancel previous speech
    if (speechSynthesis.speaking) {
        console.log("Cancelling previous speech...");
        speechSynthesis.cancel();
    }

    currentUtterance = new SpeechSynthesisUtterance(text);
    const ttsLang = document.getElementById("tts-language-select");
    currentUtterance.lang = ttsLang ? ttsLang.value : "en-US";
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.lang === currentUtterance.lang);
    if (selectedVoice) {
        currentUtterance.voice = selectedVoice;
    }


    // Check if we are passing valid text
    if (!text.trim()) {
        console.log("No text to speak.");
        return;
    }

    console.log("Starting speech...");
    speechSynthesis.speak(currentUtterance);

    currentUtterance.onstart = function () {
        console.log("Speech started...");
    };

    currentUtterance.onend = function () {
        console.log("Speech ended.");
    };

    currentUtterance.onerror = function (event) {
        console.error("Speech synthesis error: ", event);
    };
}


function pauseSpeech() {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
    }
}

function resumeSpeech() {
    if (speechSynthesis.paused) {
        speechSynthesis.resume();
    }
}

function stopSpeech() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
}

// File Upload
document.getElementById("file-upload").addEventListener("change", () => {
    const file = document.getElementById("file-upload").files[0];
    if (!file || file.type !== "text/plain") {
      alert("Please upload a valid .txt file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      fileText = e.target.result;
      document.getElementById("file-preview").innerText = fileText;
    };
    reader.readAsText(file);
});

// TTS Event Listeners
document.getElementById("speak-button").addEventListener("click", () => {
    const text = document.getElementById("text-input").value;
    if (!text.trim()) {
        alert("Please type something to speak.");
        return;
    }
    speak(text); // Ensure this calls the speak function correctly
});

document.getElementById("speak-file").addEventListener("click", () => {
    if (!fileText.trim()) {
        alert("Please upload and preview a file first.");
        return;
    }
    speak(fileText); // Ensure this calls the speak function correctly
});


function toggleHistory(forceState) {
    const historyPanel = document.getElementById("saved-history");
    if (typeof forceState === "boolean") {
        historyPanel.style.display = forceState ? "block" : "none";
    } else {
        historyPanel.style.display = historyPanel.style.display === "none" ? "block" : "none";
    }
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('section');
    sections.forEach(sec => {
        sec.style.display = 'none';
        sec.style.opacity = 0;
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        setTimeout(() => {
            targetSection.style.opacity = 1;
        }, 10); 
    }
}

function showHomeScreen() {
    document.getElementById("speech-to-text-section").style.display = "none";
    document.getElementById("text-to-speech-section").style.display = "none";
    document.getElementById("home-screen").style.display = "block";
}

function toggleTheme() {
    const isDark = document.getElementById("theme-toggle").checked;
    const theme = isDark ? "dark" : "light";
    setTheme(theme);
    localStorage.setItem("theme", theme);
}

function setTheme(mode) {
    const toggle = document.getElementById("theme-toggle");
    if (mode === "dark") {
        document.body.classList.add("dark");
        document.body.classList.remove("light");
        toggle.checked = true;
    } else {
        document.body.classList.add("light");
        document.body.classList.remove("dark");
        toggle.checked = false;
    }
}

function showSaveNotification() {
    const notification = document.getElementById("save-notification");
    notification.classList.add("show");
    setTimeout(() => {
        notification.classList.remove("show");
    }, 2000);
}

function updateHistoryStorage() {
    const historyItems = document.querySelectorAll("#history-list li");
    const history = Array.from(historyItems).map(item => item.innerText.replace("🗑️", "").trim());
    localStorage.setItem("historyItems", JSON.stringify(history));
}

// On page load
window.addEventListener("DOMContentLoaded", () => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);

    const storedText = localStorage.getItem("savedText");
    if (storedText) {
        document.getElementById("output").innerText = storedText;
        savedText = storedText;

        const timestamp = new Date().toLocaleString();
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <strong>${timestamp}:</strong> ${storedText}
            <button class="delete-btn" onclick="deleteHistoryItem(this)">🗑️</button>
        `;
        document.getElementById("history-list").appendChild(listItem);
    }

    const storedHistory = JSON.parse(localStorage.getItem("historyItems"));
    if (storedHistory) {
        storedHistory.forEach(text => {
            const li = document.createElement("li");
            li.innerHTML = `${text} <button class="delete-btn" onclick="deleteHistoryItem(this)">🗑️</button>`;
            document.getElementById("history-list").appendChild(li);
        });
    }
});

// Preloader
window.addEventListener("load", () => {
    console.log("Page has fully loaded."); // ADD THIS LINE
    const preloader = document.getElementById("preloader");
    const homeScreen = document.getElementById("home-screen");

    preloader.style.display = "none";
    homeScreen.style.display = "block";
    setTimeout(() => {
        homeScreen.style.opacity = 1;
    }, 100);
});

