chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "LEETCODE_SUBMITTED") return false;

  fetch(message.apiUrl || "http://127.0.0.1:5000/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message.payload)
  })
    .then(async response => {
      const body = await response.json();
      if (!response.ok) {
        sendResponse({ ok: false, error: body.error || response.statusText });
        return;
      }

      console.log("Submission saved:", body);
      sendResponse({ ok: true, submission: body.submission });
    })
    .catch(error => {
      console.error("Backend error:", error);
      sendResponse({ ok: false, error: error.message });
    });

  return true;
});
