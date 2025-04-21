document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    const mainContent = document.getElementById('main-content');
    const activateButton = document.getElementById('activateButton');
    const statusBox = document.getElementById('status');
    const transcriptionBox = document.getElementById('transcription');
    const commandOutput = document.getElementById('command-output');
    const infoIcon = document.getElementById('infoIcon');
    const commandsList = document.getElementById('commandsList');
    const themeToggle = document.getElementById('theme-toggle');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    document.getElementById('infoIcon').addEventListener('click', () => {
        document.getElementById('commandsList').classList.toggle('visible');
      });
      
    let recognition;
    let listening = false;
  
    // 🌀 Preloader fade out
    setTimeout(() => {
      preloader.style.display = 'none';
      mainContent.style.display = 'block';
    }, 2000);
  
    // 🌗 Theme Toggle
   // themeToggle.addEventListener('change', () => {
     // document.body.classList.toggle('dark-mode', themeToggle.checked);
   // });
  
    // ℹ️ Show/Hide Commands List
    infoIcon.addEventListener('click', () => {
      commandsList.classList.toggle('visible');
    });
  
    // 🗂 Load history from Flask
    loadHistory();
  
    // 🧹 Clear full history
    clearHistoryBtn.addEventListener('click', async () => {
      await fetch('/api/history/clear', { method: 'DELETE' });
      loadHistory();
    });
  
    // 🗑 Delete entry via button click (delegated)
    historyList.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const index = parseInt(e.target.dataset.index);
        await deleteHistoryEntry(index);
      }
    });
  
    // 🎙️ Speech Recognition Setup
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
  
      recognition.onstart = () => {
        listening = true;
        statusBox.textContent = 'Listening...';
        activateButton.textContent = 'Stop Listening';
      };
  
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        transcriptionBox.textContent = transcript;
        processCommand(transcript.toLowerCase());
      };
  
      recognition.onend = () => {
        listening = false;
        statusBox.textContent = 'Click the button to start';
        activateButton.textContent = 'Start Listening';
      };
  
      recognition.onerror = (event) => {
        console.error('Recognition Error:', event.error);
        statusBox.textContent = `Error: ${event.error}`;
        listening = false;
      };
    } else {
      alert("Your browser doesn't support Speech Recognition.");
      activateButton.disabled = true;
    }
  
    // 🎛️ Activate/Deactivate Mic
    activateButton.addEventListener('click', () => {
      if (listening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  
    // 🤖 Process Voice Commands
    async function processCommand(command) {
      console.log("Raw command:", command);
      await addToHistory(command);
      commandOutput.textContent = '';
  
      const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
        commandOutput.textContent = text;
      };
  
      if (command.includes("what's the time")) {
        const time = new Date().toLocaleTimeString();
        speak(`The current time is ${time}`);
      } else if (command.includes("what's the date")) {
        const date = new Date().toLocaleDateString();
        speak(`Today's date is ${date}`);
      } else if (command.includes('open google')) {
        window.open('https://www.google.com', '_blank');
        speak('Opening Google');
      } else if (command.includes('open youtube')) {
        window.open('https://www.youtube.com', '_blank');
        speak('Opening YouTube');
      } else if (command.startsWith('wikipedia')) {
        console.log("Raw command:", command); // Debugging line
    
        let topic = command.replace('wikipedia', '').trim();
        topic = topic.replace(/\.+$/, ''); // Remove one or more periods at the end
        topic = topic.replace(/^\.+/, ''); // Remove one or more periods at the beginning
        topic = topic.trim(); // Remove leading/trailing spaces
    
        if (topic) {
            window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`, '_blank');
            speak(`Searching Wikipedia for ${topic}`);
    
            try {
                const apiUrl = `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${encodeURIComponent(topic)}&origin=*`;
                const response = await fetch(apiUrl);
                const data = await response.json();
                const page = Object.values(data.query.pages)[0];
    
                if (page && page.extract) {
                    let summary = page.extract.trim();
                    if (summary.endsWith('.')) {
                        summary = summary.slice(0, -1);
                    }
                    speak(`According to Wikipedia: ${summary}`);
                } else {
                    speak(`Could not find a summary for ${topic} on Wikipedia.`);
                }
            } catch (error) {
                console.error("Error fetching Wikipedia summary:", error);
                speak(`Sorry, I encountered an error while trying to get information about ${topic} from Wikipedia.`);
            }
    
        } else {
            speak('Please say a topic after Wikipedia');
        }
    } else if (command.includes('tell me a joke')) {
        fetchJoke();
      } else if (command.includes('shutdown')) {
        speak('Shutting down... Just kidding!');
      } else if (command.includes('restart')) {
        speak('Restarting... Not really.');
      } else if (command.includes('open facebook')) {
        window.open('https://www.facebook.com', '_blank');
        speak('Opening Facebook');
      } else if (command.includes('open twitter')) {
        window.open('https://www.twitter.com', '_blank');
        speak('Opening Twitter');
      } else if (command.includes('open instagram')) {
        window.open('https://www.instagram.com', '_blank');
        speak('Opening Instagram');
      } else if (command.includes('open new tab')) {
        window.open('about:blank', '_blank');
        speak('Opening a new tab');
      } else if (command.includes('battery status')) {
        navigator.getBattery().then(battery => {
          const level = Math.round(battery.level * 100);
          speak(`Battery is at ${level} percent`);
        });
      } else if (command.includes('flip a coin')) {
        const result = Math.random() > 0.5 ? 'Heads' : 'Tails';
        speak(result);
      } else if (command.startsWith('search for')) {
        const query = command.replace('search for', '').trim();
        if (query) {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
          speak(`Searching for ${query}`);
        } else {
          speak('Please say a search term');
        }
      } else if (command.startsWith('spell')) {
        const word = command.replace('spell', '').trim();
        if (word) {
          const spelled = word.split('').join(', ');
          speak(`Spelling ${word}: ${spelled}`);
        } else {
          speak('Please say a word to spell');
        }
      } else if (command.includes('tell me a fact')) {
        fetchFact();
      } else {
        speak("I'm not sure how to respond to that.");
      }
    }
  
    // 🎭 Joke API
    function fetchJoke() {
      fetch('https://official-joke-api.appspot.com/random_joke')
        .then(res => res.json())
        .then(joke => {
          const jokeText = `${joke.setup} ... ${joke.punchline}`;
          speechSynthesis.speak(new SpeechSynthesisUtterance(jokeText));
          commandOutput.textContent = jokeText;
        })
        .catch(() => {
          speechSynthesis.speak(new SpeechSynthesisUtterance("Sorry, I couldn't get a joke right now."));
        });
    }
  
    // 💡 Fun Fact Generator
    function fetchFact() {
      const facts = [
        "Honey never spoils.",
        "Bananas are berries, but strawberries are not.",
        "Octopuses have three hearts.",
        "The Eiffel Tower can grow taller in summer.",
        "A day on Venus is longer than a year on Venus."
      ];
      const fact = facts[Math.floor(Math.random() * facts.length)];
      speechSynthesis.speak(new SpeechSynthesisUtterance(fact));
      commandOutput.textContent = fact;
    }
  });
  
  
  // 🌐 Backend-Connected History Functions
  async function loadHistory() {
    try {
      const res = await fetch('/api/history');
      const history = await res.json();
      renderHistory(history);
    } catch (err) {
      console.error('Error loading history:', err);
    }
  }
  
  async function addToHistory(command) {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      loadHistory();
    } catch (err) {
      console.error('Error adding to history:', err);
    }
  }
  
  async function deleteHistoryEntry(index) {
    try {
      await fetch(`/api/history/${index}`, { method: 'DELETE' });
      loadHistory();
    } catch (err) {
      console.error('Error deleting history:', err);
    }
  }
  
  function renderHistory(history) {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    history.forEach((entry, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span><strong>${entry.command}</strong> <small>(${entry.timestamp})</small></span>
        <button data-index="${index}" class="delete-btn">✖</button>
      `;
      historyList.appendChild(li);
    });
  }
  