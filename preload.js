// This script runs before other scripts in the renderer context
// You can safely expose certain APIs if needed:

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Example: Provide a function for sending messages to main
  sendKeyEvent: (key) => ipcRenderer.send('key-event', key)
});

// If you want to use require in the renderer, normally you'd enable nodeIntegration.
// It's more secure to selectively expose the functionality you need here.