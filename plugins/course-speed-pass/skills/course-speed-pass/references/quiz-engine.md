# Local quiz engine

Use this reference when changing the bundled quiz data or adding another deterministic answer source.

## Question schema

Each item in `quizQuestions` contains:

- `id`: stable local identifier.
- `type`: `single`, `multiple`, `truefalse`, or `fill`.
- `typeLabel`: visible Chinese label.
- `prompt`: fictional or user-supplied local test question.
- `options`: required for selectable questions.
- `answer`: string or string array used only by the local simulator.
- `aliases`: optional accepted fill-in variants.
- `explanation`: feedback shown after simulated submission.

## Decision trace

Every automatically filled answer should record its question fingerprint, answer source, confidence, and cache-hit state. Keep the source order deterministic: fingerprint cache, imported or bundled local answer bank, then explicit rules. A missing answer should remain visibly unmatched instead of being guessed.

The AI review panel is a manual handoff. It may generate a prompt and accept a pasted JSON result, but it must not add credentials, external answer APIs, login-state access, third-party DOM automation, or real-platform selectors. Attribute pasted results and do not persist them into the permanent bank automatically.

## Review invariant

When review is enabled, any decision below the selected threshold must block simulated submission until the user confirms it. Changing the threshold must recalculate the pending-review count. Manual answer edits clear the prior score.

## Browser-test invariant

For the starter data, Playwright must independently verify:

1. Six mock lessons complete in order.
2. Six quiz answers are filled.
3. The default 75% threshold produces one pending review.
4. Confirming that review enables submission.
5. The local score becomes six correct answers and 100 points.
6. A deliberately wrong answer scores 83, and retrying it restores 100.
7. The JSON report download has the expected filename.
8. JSON merge import reports accepted, duplicate, and rejected records correctly.
9. The imported seventh question is answered, CSV replace works, and starter restore returns the total to six.
10. A generated AI review prompt and manually pasted result retain visible source attribution.

Keep these assertions explicit. If the starter dataset changes, change the expected values together with the dataset.
