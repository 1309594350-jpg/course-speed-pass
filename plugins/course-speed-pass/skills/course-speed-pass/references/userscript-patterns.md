# Safe userscript-style patterns

Use this reference when extending the local script console. The goal is to borrow transparent userscript ergonomics for a local QA sandbox, not to automate a real course platform.

## Allowed patterns

- Persist non-sensitive settings in local storage.
- Offer named profiles plus a custom mode instead of hiding behavior in constants.
- Build an explicit task queue with visible `pending`, `running`, `review`, `complete`, `failed`, and `stopped` states.
- Provide start, pause, resume, and stop controls.
- Cap retries at a small, visible number. Never create an unbounded retry loop.
- Provide dry-run mode so users can inspect matches and queue behavior without writing answers.
- Export and import settings as local JSON after schema validation.
- Use `MutationObserver` only to observe elements inside the generated local page.
- Keep action logs, progress, detected-card counts, and errors visible.
- Keep answer confidence and manual-review gates active across every profile.

## Prohibited patterns

- Real learning-platform URLs, selectors, API endpoints, or page adapters.
- Cookie, token, account, login-session, CAPTCHA, face-check, or device-fingerprint access.
- `GM_xmlhttpRequest` or equivalent cross-origin access to school systems or AI chat sites.
- Automatic playback, completion, answering, grading submission, or progress fabrication on a third-party platform.
- Hidden background execution, randomization intended to evade detection, anti-debugging, or anti-cheat bypasses.
- Injecting prompts into DeepSeek or another chat page, scraping responses, or treating model output as authoritative.

## Implementation invariants

1. Queue settings are normalized before use and persisted only after validation.
2. Starting a run takes a snapshot of the current local questions and scope.
3. Pausing prevents the next item from running; resuming continues from the saved cursor.
4. Stopping clears the scheduled timer and marks the run stopped without altering unrelated page state.
5. Dry-run mode resolves each fictional question with `persist: false` and leaves answer controls unchanged.
6. Retries never exceed the selected cap, and failures remain visible in the task list.
7. Dynamic-card observation reports counts but does not automatically act on third-party DOM changes.
8. Playwright verifies control behavior, state transitions, settings round-trip, and screenshot output.

## Design sources

- [Tampermonkey documentation](https://www.tampermonkey.net/documentation.php?locale=en) documents user-facing menu commands and persistent value APIs that motivate explicit controls and saved settings.
- [OCS JavaScript API documentation](https://docs.ocsjs.com/docs/other/api) describes a Web Components-based UI and configurable answer-provider architecture; this sandbox keeps only the generic modularity and UI-management ideas.
- [OCS documentation](https://docs.ocsjs.com/) also emphasizes visible prompts and caching. Do not copy its real-platform automation or detection-bypass features.

Re-run the full Playwright suite after any queue change. A UI control without an observable state assertion is incomplete.
