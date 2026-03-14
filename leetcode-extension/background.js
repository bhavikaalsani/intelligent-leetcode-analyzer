chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === "LEETCODE_SUBMITTED") {
    try {
      await fetch("http://127.0.0.1:5000/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.payload)
      });

      console.log("✅ Submission saved");
    } catch (err) {
      console.error("Backend error:", err);
    }
  }
});