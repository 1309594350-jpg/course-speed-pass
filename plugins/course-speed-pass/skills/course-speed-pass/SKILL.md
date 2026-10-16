---
name: course-speed-pass
description: Create, customize, and verify local simulated online-course interfaces, quiz-answering engines, and Playwright browser-automation test sandboxes. Use for mock course players, fictional question banks, confidence-review workflows, local automation labs, and end-to-end QA demos; do not use for real learning platforms, unattended course completion, real automatic answers, fake progress, or anti-cheat bypasses.
---

# Course speed pass

Build a local, inspectable course-automation sandbox that demonstrates playback state, chapter completion, automatic next-chapter transitions, fictional quiz answering, confidence review, event logs, and Playwright verification.

## Boundary

- Operate only on a mock site created in a directory the user controls.
- Never connect the template or automation runner to Learning Tong, MOOCs, school systems, or other third-party course platforms.
- Do not add login handling, Cookie import, unattended real-course playback, fake watch time, answers for real coursework, CAPTCHA handling, face-check bypasses, or anti-detection behavior.
- If the request targets a real platform or academic completion, keep the work in the local sandbox and explain the boundary briefly.

## Create the sandbox

1. Choose an explicit output directory. Preserve unrelated files and avoid broad destinations such as the home directory or a workspace root.
2. Run the bundled installer:

   ```bash
   python3 <skill-directory>/scripts/create_demo.py --output <absolute-output-directory>
   ```

3. Customize `src/app.js` when the user wants different mock lessons, durations, question types, answer sources, or labels. Keep all course and quiz data fictional or explicitly user-supplied for a local test.
4. Customize `index.html` and `styles.css` only as needed for the requested experience. Preserve the visible local-only notice and boundary text.
5. Keep `scripts/server.mjs` bound to `127.0.0.1` by default. Do not expose the demo to a network unless the user explicitly requests deployment.

## Configure the quiz lab

The starter supports single-choice, multiple-choice, true/false, and fill-in questions. Its answer strategy is deliberately local and inspectable:

1. Match a normalized question fingerprint against the local cache.
2. Fall back to the bundled fictional answer bank.
3. Use a deterministic rule only for explicitly defined mock questions.
4. Leave the AI adapter disabled unless the user is building a separate local test double. Never connect it to real coursework.

Preserve the confidence threshold and human-review gate. Low-confidence answers must remain reviewable before the simulated submission. See [references/quiz-engine.md](references/quiz-engine.md) for the schema and test invariants.

## Verify

Run syntax and server checks first:

```bash
node --check src/app.js
node --check scripts/server.mjs
node --check automation/runner.mjs
```

For the full browser test:

```bash
npm install
PLAYWRIGHT_DOWNLOAD_HOST="https://npmmirror.com/mirrors/playwright" npx playwright install chromium || npx playwright install chromium
npm run automation
```

Success requires the page to load, every mock lesson to complete in order, and the starter quiz to pass all of these checks:

- Course state reports `6/6` lessons and `100%`.
- Quiz coverage reports `6/6` questions and `100%`.
- The default 75% threshold pauses on exactly one low-confidence answer.
- After review, the simulated score reports `6/6` and `100`.
- A manual wrong answer scores `83`, then retrying that item returns the score to `100`.
- A local JSON report download is generated with the expected filename.
- `artifacts/automation-success.png` exists.

If starter data changes, update the runner's expected counts rather than weakening the assertions.

## Handoff

Give the user the output directory, the double-click launchers, both test results, and the screenshot path. State clearly that the result is a local teaching and QA sandbox, not a tool for completing real coursework.
