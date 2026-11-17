# Discussion Markdown and JSON rendering on stable

Backported the dev discussion renderer to main on 2026-11-17. AI replies use the
host Markdown renderer, including its localized code toolbar. A lightweight
Markdown fallback is retained for hosts without that component. User messages
remain plain text.

Completed JSON objects/arrays and complete JSON fences are indented without
changing numeric literals, duplicate keys or escaping. Mixed Markdown is preserved;
invalid or incomplete JSON stays untouched. Streaming replies use their current
text without JSON reformatting until completion. Code blocks scroll horizontally
and no longer inherit the old plain-text discussion styles.

This is an isolated rendering backport; Super Agent and other development work
remain on dev. No interactive browser visual verification was performed.
