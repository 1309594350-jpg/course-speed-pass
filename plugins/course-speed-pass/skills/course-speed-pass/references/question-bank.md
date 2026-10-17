# Question-bank import

Read this reference when changing JSON/CSV import, validation, deduplication, or export behavior.

## JSON shape

Accept either an array of question objects or an object containing a `questions` array:

```json
{
  "questions": [
    {
      "type": "single",
      "prompt": "Local fictional question",
      "options": ["A value", "B value"],
      "answer": "B",
      "aliases": [],
      "explanation": "Why the answer is correct",
      "confidence": 0.9
    }
  ]
}
```

Supported `type` values are `single`, `multiple`, `truefalse`, and `fill`; the importer also accepts the bundled Chinese aliases. For choice questions, `answer` may contain option text or letters such as `B`. Multiple-choice answers may be arrays or pipe-delimited strings.

## CSV shape

Use the columns below. Multi-value fields use `|` as the separator. Standard quoted CSV fields and UTF-8 BOM are accepted.

```csv
type,prompt,options,answer,aliases,explanation,confidence
single,"Local fictional question","A value|B value",B,,"Short explanation",0.9
multiple,"Choose two","One|Two|Three","A|C",,"Short explanation",0.85
```

## Validation and storage

- Reject missing prompts, unsupported types, missing answers, choice questions with fewer than two options, and answers outside the options.
- Default a missing confidence to `0.85` and clamp provided values to the range from zero to one.
- Generate internal IDs from normalized question fingerprints. Ignore imported IDs.
- In merge mode, keep the current bank and skip duplicate fingerprints. In replace mode, start from an empty bank, but do not replace the current bank if no valid records remain.
- Report counts for accepted, duplicate, and rejected records. Persist only validated questions in browser local storage.
- Treat imported strings as untrusted and HTML-escape them before rendering.

Exported files use the same JSON shape. Restoring the starter bank removes imported questions, answer cache, and quiz state without changing course playback progress.
