console.log("🚀 LeetCode Tracker active");

/* =========================
   Detect Difficulty
========================= */
function detectDifficulty() {
  const difficultyElement = [...document.querySelectorAll("div, span")]
    .find(el => {
      const text = el.innerText?.trim();
      return text === "Easy" || text === "Medium" || text === "Hard";
    });

  return difficultyElement ? difficultyElement.innerText.trim() : "Unknown";
}

/* =========================
   Detect Topic
========================= */
function detectTopic() {
  const tagElements = document.querySelectorAll("a[href*='/tag/']");
  
  if (tagElements.length > 0) {
    return tagElements[0].innerText.trim().toLowerCase();
  }

  // fallback: try reading tags from problem header
  const possibleTags = document.querySelectorAll("a");
  for (let el of possibleTags) {
    if (el.href.includes("/tag/")) {
      return el.innerText.trim().toLowerCase();
    }
  }

  return "array"; // safe default instead of unknown
}

/* =========================
   Detect Username
========================= */
function getUsername() {
  const profileLink = document.querySelector("a[href^='/u/']");
  if (profileLink) {
    return profileLink
      .getAttribute("href")
      .replace("/u/", "")
      .replace("/", "");
  }
  return "bhavika_alsani-27";
}

/* =========================
   Track Real Submission Only
========================= */
function trackSubmission() {
  let lastStatus = null;

  const observer = new MutationObserver(async () => {

    const resultElement = [...document.querySelectorAll("span")]
      .find(el =>
        el.innerText === "Accepted" ||
        el.innerText === "Wrong Answer" ||
        el.innerText === "Runtime Error" ||
        el.innerText === "Time Limit Exceeded"
      );

    if (!resultElement) return;

    const statusText = resultElement.innerText;

    if (statusText === lastStatus) return;
    lastStatus = statusText;

    let status = null;
    if (statusText === "Accepted") status = "AC";
    else if (statusText === "Wrong Answer") status = "WA";
    else if (statusText === "Runtime Error") status = "RE";
    else if (statusText === "Time Limit Exceeded") status = "TLE";

    let url = window.location.href.split("/submissions/")[0];

    const payload = {
      problemUrl: url,
      difficulty: detectDifficulty(),
      topic: detectTopic(),
      username: getUsername(),
      status
    };

    console.log("📦 DATA BEING SAVED:");
    console.log(payload);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log("✅ Backend response:", result);

    } catch (err) {
      console.error("❌ Failed to save submission:", err);
    }

  });

  observer.observe(document.body, { childList: true, subtree: true });
}

trackSubmission();