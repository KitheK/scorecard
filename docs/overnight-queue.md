# Overnight queue

Issues labeled `overnight-queue` are eligible for the **Overnight agent nightly** workflow when `ENABLE_OVERNIGHT_AGENT=true`.

**Order:** top of the list wins (lower issue numbers first unless you reorder here).

1. _(empty — add issues below with links)_

**Skip automatically:** `needs-human`, `blocked`, issues that already have an open `Closes #N` PR.

**After pick:** the agent removes `overnight-queue` and opens a draft PR labeled `overnight-agent`.