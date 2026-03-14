import * as vscode from "vscode";
import axios from "axios";

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("LeetCode Analyzer activated!");

  const disposable = vscode.commands.registerCommand(
    "leetcode-analyzer.sendSubmission",
    async () => {
      const username = await vscode.window.showInputBox({ prompt: "Enter your username" });
      const problemUrl = await vscode.window.showInputBox({ prompt: "Enter LeetCode problem URL" });
      const difficulty = await vscode.window.showQuickPick(["Easy", "Medium", "Hard"]);
      const topic = await vscode.window.showInputBox({ prompt: "Enter topic (e.g., Array, DP, Graph)" });
      const language = await vscode.window.showQuickPick(["Java", "Python", "C++", "JavaScript"]);
      const status = await vscode.window.showQuickPick(["AC", "TLE", "WA"]);

      if (!username || !problemUrl || !difficulty || !topic || !language || !status) {
        vscode.window.showErrorMessage("All fields are required!");
        return;
      }

      try {
        await axios.post("http://localhost:5000/api/submissions", {
          username, problemUrl, difficulty, topic, language, status
        });
        vscode.window.showInformationMessage("Submission sent successfully!");
      } catch (err: any) {
        vscode.window.showErrorMessage("Failed to send submission: " + err.message);
      }
    }
  );

  context.subscriptions.push(disposable);
}