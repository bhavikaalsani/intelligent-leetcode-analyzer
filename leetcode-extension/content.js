const API_URL = "http://127.0.0.1:5000/api/submissions";
const RESULT_TEXTS = ["Accepted", "Wrong Answer", "Runtime Error", "Time Limit Exceeded"];

console.log("LeetCode Tracker active");

function detectDifficulty() {
  const difficultyElement = [...document.querySelectorAll("div, span")]
    .find(element => {
      const text = element.textContent?.trim();
      return text === "Easy" || text === "Medium" || text === "Hard";
    });

  return difficultyElement ? difficultyElement.textContent.trim() : "Unknown";
}

function detectTopic() {
  const tagElements = document.querySelectorAll("a[href*='/tag/']");

  if (tagElements.length > 0) {
    return tagElements[0].textContent.trim().toLowerCase();
  }

  return "array";
}

function detectUsername() {
  const profileLink = document.querySelector("a[href^='/u/']");
  if (profileLink) {
    return profileLink
      .getAttribute("href")
      .replace("/u/", "")
      .replace("/", "");
  }

  return localStorage.getItem("leetcode_tracker_username") || "local_user";
}

function normalizeStatus(statusText) {
  if (statusText === "Accepted") return "AC";
  if (statusText === "Wrong Answer") return "WA";
  if (statusText === "Runtime Error") return "RE";
  if (statusText === "Time Limit Exceeded") return "TLE";
  return null;
}

function findResultText() {
  const elements = [...document.querySelectorAll("div, span")];
  const resultElement = elements.find(element => {
    const text = element.textContent?.trim();
    return RESULT_TEXTS.includes(text);
  });

  return resultElement?.textContent?.trim() || null;
}

function sendSubmission(payload) {
  chrome.runtime.sendMessage(
    {
      type: "LEETCODE_SUBMITTED",
      apiUrl: API_URL,
      payload
    },
    response => {
      if (chrome.runtime.lastError) {
        console.error("Tracker message failed:", chrome.runtime.lastError.message);
        return;
      }

      if (!response?.ok) {
        console.error("Tracker save failed:", response?.error);
        return;
      }

      console.log("Tracker saved submission:", response.submission);
    }
  );
}

function trackSubmission() {
  let lastSubmissionKey = null;

  const checkForResult = () => {
    const statusText = findResultText();
    if (!statusText) return;

    const status = normalizeStatus(statusText);
    if (!status) return;

    const problemUrl = window.location.href.split("/submissions/")[0].split("?")[0];
    const submissionKey = `${problemUrl}:${status}`;
    if (submissionKey === lastSubmissionKey) return;
    lastSubmissionKey = submissionKey;

    const payload = {
      problemUrl,
      difficulty: detectDifficulty(),
      topic: detectTopic(),
      username: detectUsername(),
      status
    };

    console.log("Tracker detected submission:", payload);
    sendSubmission(payload);
  };

  const observer = new MutationObserver(checkForResult);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  window.setInterval(checkForResult, 2000);
  checkForResult();
}

trackSubmission();
