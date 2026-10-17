---
name: course-speed-pass
description: Create, customize, and verify local simulated online-course interfaces, importable fictional question banks, controllable local task queues, quiz-answering engines, and Playwright browser-automation test sandboxes. Use for mock course players, JSON/CSV bank workflows, confidence review, manual AI handoffs, userscript-style local controls, automation labs, and end-to-end QA demos; do not use for real learning platforms, unattended course completion, real automatic answers, third-party web-chat automation, fake progress, or anti-cheat bypasses.
---

# Course speed pass

Build a local, inspectable course-automation sandbox that demonstrates playback state, chapter completion, fictional question-bank import, quiz answering, confidence review, manual AI handoff, a controllable task queue, event logs, and Playwright verification.

## Boundary

- Operate only on a mock site created in a directory the user controls.
- Never connect the template or automation runner to Learning Tong, MOOCs, school systems, or other third-party course platforms.
- Do not add login handling, Cookie import, unattended real-course playback, fake watch time, answers for real coursework, CAPTCHA handling, face-check bypasses, or anti-detection behavior.
- Do not automate DeepSeek or another third-party chat website, scrape its logged-in session, or treat its output as trusted. Keep AI assistance as a manual copy/paste review step for fictional local questions.
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
4. Accept an optional manually pasted AI review result, keep it visibly attributed, and require human review when it is below the threshold.

Preserve the confidence threshold and human-review gate. Low-confidence answers must remain reviewable before the simulated submission. See [references/quiz-engine.md](references/quiz-engine.md) for the schema and test invariants.

## Import a fictional question bank

Use JSON or CSV files that the page processes locally. Validate every record, normalize answer letters to option text, deduplicate by question fingerprint, and report accepted, duplicate, and rejected counts. Support both merge and replace modes, plus export and restore. Read [references/question-bank.md](references/question-bank.md) before changing the import schema or parser.

The DeepSeek panel may generate and copy a review prompt, open the official site as a normal user-controlled link, and accept a manually pasted JSON response. It must not inject prompts into the external page, access login state, read responses from it, or submit answers to any real course.

## Configure the local userscript-style console

Use userscript conventions only inside the generated local demo: persistent settings, explicit profiles, observable queue states, start/pause/resume/stop controls, bounded retries, dry-run mode, settings import/export, and local dynamic-DOM observation. Keep every action visible and reversible.

Do not add real-platform selectors, cross-origin requests, cookie/session access, hidden background execution, automatic external submission, anti-detection code, or third-party site control. Read [references/userscript-patterns.md](references/userscript-patterns.md) before changing the queue or browser-control surface.

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
- JSON merge import reports one accepted, one duplicate, and one rejected record in the bundled test fixture.
- The imported bank scores `7/7`, while CSV replace mode and starter-bank restore both succeed.
- A manual DeepSeek review prompt and pasted JSON result are applied with visible attribution.
- Dry-run mode completes its queue without writing answers.
- The cautious profile can pause and resume, the stop control cancels a run, and the fast profile completes `6/6` local tasks.
- Queue settings export/import round-trips successfully, and dynamic local question-card detection reports the expected count.
- `artifacts/automation-success.png` exists.
- `artifacts/ai-review-success.png` exists.
- `artifacts/userscript-console-success.png` exists.

If starter data changes, update the runner's expected counts rather than weakening the assertions.

## Handoff

Give the user the output directory, the double-click launchers, test results, and all screenshot paths. State clearly that the result is a local teaching and QA sandbox, not a tool for completing real coursework or automating a third-party AI website.
