document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('status').innerText = "Recording in progress...";
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = false;
  chrome.runtime.sendMessage({ action: "startCapture" });
});

document.getElementById('stopBtn').addEventListener('click', () => {
  document.getElementById('status').innerText = "AI is writing your notes... (This takes a minute)";
  document.getElementById('startBtn').disabled = true;
  document.getElementById('stopBtn').disabled = true;
  chrome.runtime.sendMessage({ action: "stopCapture" });
});

// Listen for a message from background.js telling us the AI is done
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "aiComplete") {
    document.getElementById('status').innerText = "Notes saved!";
    document.getElementById('startBtn').disabled = false;
    loadRecordings();
  }
});

function loadRecordings() {
  chrome.storage.local.get({ notes: [] }, (result) => {
    const list = document.getElementById('recordingsList');
    list.innerHTML = ""; 

    if (result.notes.length === 0) {
      list.innerHTML = "<div style='text-align:center; color:#999; font-size: 12px; padding:10px;'>No notes yet.</div>";
      return;
    }

    const reversedNotes = result.notes.slice().reverse();

    reversedNotes.forEach((note) => {
      const card = document.createElement('div');
      card.className = "note-card";
      
      const dateDiv = document.createElement('div');
      dateDiv.className = "note-date";
      dateDiv.innerText = note.date;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = "note-content";
      contentDiv.innerText = note.summary;

      const delBtn = document.createElement('button');
      delBtn.innerText = "Delete";
      delBtn.className = "delete-btn";
      delBtn.onclick = () => deleteRecording(note.id);

      card.appendChild(dateDiv);
      card.appendChild(delBtn);
      card.appendChild(contentDiv);
      list.appendChild(card);
    });
  });
}

function deleteRecording(id) {
  chrome.storage.local.get({ notes: [] }, (result) => {
    const filtered = result.notes.filter(n => n.id !== id);
    chrome.storage.local.set({ notes: filtered }, () => loadRecordings());
  });
}

loadRecordings();

