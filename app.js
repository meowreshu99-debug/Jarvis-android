const chat = document.querySelector("#chat");
const input = document.querySelector("#input");
const composer = document.querySelector("#composer");
const mic = document.querySelector("#mic");
const listening = document.querySelector("#listening");

function addMessage(role, text) {
  const el = document.createElement("div");
  el.className = `message ${role}`;
  el.innerHTML = `<span class="label">${role === "user" ? "YOU" : "RESHU"}</span><p></p>`;
  el.querySelector("p").textContent = text;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

async function ask(text) {
  const message = text.trim();
  if (!message) return;
  addMessage("user", message);
  input.value = "";
  listening.textContent = "THINKING";

  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ message })
    });
    const data = await response.json();
    const reply = data.reply || data.error || "I could not process that.";
    addMessage("assistant", reply);
    speak(reply);
  } catch {
    addMessage("assistant", "The local assistant server is unavailable.");
  } finally {
    listening.textContent = "READY";
  }
}

composer.addEventListener("submit", e => {
  e.preventDefault();
  ask(input.value);
});

document.querySelectorAll("[data-command]").forEach(btn => {
  btn.addEventListener("click", () => ask(btn.dataset.command));
});

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = navigator.language || "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  mic.addEventListener("click", () => {
    listening.textContent = "LISTENING";
    recognition.start();
  });

  recognition.onresult = event => {
    const text = event.results[0][0].transcript;
    ask(text);
  };
  recognition.onerror = () => listening.textContent = "READY";
  recognition.onend = () => {
    if (listening.textContent === "LISTENING") listening.textContent = "READY";
  };
} else {
  mic.disabled = true;
  mic.title = "Speech recognition is not available in this browser.";
}
