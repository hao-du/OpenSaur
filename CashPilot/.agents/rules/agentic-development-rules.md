# Editing & Patch Reliability Rules

## Editing
- Make the smallest correct change; modify existing code, never regenerate entire files.
- Preserve existing formatting, style, comments, and surrounding code.

## Before Every Edit
1. Read the target file/section.
2. Locate the exact code to modify.
3. Generate the smallest possible edit.

## On Edit Failure
1. Stop, re-read the affected file, discard all previous replacement text.
2. Recompute and retry **once** using freshly-read content.
3. If retry fails: explain why, show current surrounding code, ask for guidance.

Never retry using stale content or previously generated text.

## Large Files (>500 lines)
- Read/modify only the relevant section; prefer multiple small edits over one large replacement.

## Failed Edit Recovery
- Never rely on memory or previous snippets.
- Read the current corrupted lines, propose the replacement, and wait for approval before editing.