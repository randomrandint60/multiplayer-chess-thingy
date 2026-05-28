let mediaRecorder = null;
let audioChunks = [];

const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE"; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startCapture") startRecording();
  if (request.action === "stopCapture") stopRecording();
});

function startRecording() {
  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    if (!stream) {
      updateStatus("Error: Could not grab tab audio.");
      return;
    }
    
    // FIX 1: Lower the bitrate (128kbps) to keep file size small
    const options = { 
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000 
    };

    mediaRecorder = new MediaRecorder(stream, options);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      stream.getTracks().forEach(track => track.stop());

      // Check file size (25MB limit)
      if (audioBlob.size > 25 * 1024 * 1024) {
        updateStatus("Error: Meeting too long (over 25MB).");
        return;
      }

      updateStatus("Transcribing...");
      const transcript = await transcribeAudio(audioBlob);
      
      if (transcript) {
        updateStatus("Summarizing...");
        await generateSummary(transcript);
      }
    };

    mediaRecorder.start();
    // Safety stop after 10 minutes to prevent crash
    setTimeout(() => stopRecording(), 600000); 
  });
}

async function transcribeAudio(blob) {
  const formData = new FormData();
  formData.append("file", blob, "recording.webm");
  formData.append("model", "whisper-1");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      updateStatus(`Transcription Error: ${err.error.message}`);
      return null;
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    updateStatus("Network error during transcription.");
    return null;
  }
}

async function generateSummary(text) {
  try {
    const response = await fetch("", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Summarize this transcript briefly." },
          { role: "user", content: text }
        ]
      })
    });

    const data = await response.json();
    saveNotes(data.choices[0].message.content);
  } catch (error) {
    updateStatus("Error generating summary.");
  }
}

function updateStatus(msg) {
    chrome.runtime.sendMessage({ action: "statusUpdate", message: msg });
}

function saveNotes(summaryText) {
  const dateString = new Date().toLocaleString();
  const newNote = { id: Date.now().toString(), date: dateString, summary: summaryText };
  chrome.storage.local.get({ notes: [] }, (result) => {
    chrome.storage.local.set({ notes: [...result.notes, newNote] }, () => {
      chrome.runtime.sendMessage({ action: "aiComplete" });
    });
  });
}