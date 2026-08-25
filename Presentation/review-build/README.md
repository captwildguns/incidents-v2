# Review page generator

Builds `../review-2026-08-25.html`, the page used to walk the team through every
incident ticket.

To refresh it against live GitHub data:

    gh issue list --repo captwildguns/incident-tracker --state open --limit 200 \
      --json number,title,body,author,assignees,labels > live-open.json
    python build-review.py

Edit `build-review.py` to change what a ticket would gain (`ADDS`), which of our
tickets are proposed to close into which existing ticket (`PROPOSED`), and which
of those are already posted and closed (`DONE`). Groups and their order are in
`GROUPS`. Panel chrome and the preview pane live in `review-shell.html`.

Titles come straight from GitHub. Never invent a summary title.
