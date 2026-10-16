---
name: course-speed-pass
description: Create, customize, and verify local simulated online-course interfaces and Playwright browser-automation test sandboxes. Use for mock course players, chapter state machines, local automation labs, and end-to-end QA demos; do not use for real learning platforms, unattended course completion, fake progress, automatic answers, or anti-cheat bypasses.
---

# Course speed pass

Build a local, inspectable course-automation sandbox that demonstrates playback state, chapter completion, automatic next-chapter transitions, event logs, and Playwright verification.

## Boundary

- Operate only on a mock site created in a directory the user controls.
- Never connect the template or automation runner to Learning Tong, MOOCs, school systems, or other third-party course platforms.
- Do not add login handling, Cookie import, unattended real-course playback, fake watch time, automatic answers, CAPTCHA handling, face-check bypasses, or anti-detection behavior.
- If the request targets a real platform or academic completion, keep the work in the local sandbox and explain the boundary briefly.

## Create the sandbox

1. Choose an explicit output directory. Preserve unrelated files and avoid broad destinations such as the home directory or a workspace root.
2. Run the bundled installer:

   ```bash
   python3 <skill-directory>/scripts/create_demo.py --output <absolute-output-directory>
   ```

3. Customize `src/app.js` when the user wants different mock lessons, durations, or labels. Keep all data fictional or user-supplied.
4. Customize `index.html` and `styles.css` only as needed for the requested experience. Preserve the visible local-only notice and boundary text.
5. Keep `scripts/server.mjs` bound to `127.0.0.1` by default. Do not expose the demo to a network unless the user explicitly requests deployment.

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

Success requires the page to load, every mock lesson to complete in order, the final state to report `6/6` and `100%` for the starter data, and `artifacts/automation-success.png` to exist. If lesson data changes, update the runner's expected count rather than weakening the assertion.

## Handoff

Give the user the output directory, the double-click launchers, the test result, and the screenshot path. State clearly that the result is a local teaching and QA sandbox, not a tool for completing real coursework.
