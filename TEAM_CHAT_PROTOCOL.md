# TEAM_CHAT.md Protocol

This file is the official communication channel for all agents on this project.
All agents MUST read this file before starting any work session.
All agents MUST write here when communicating with other agents.

---

## ⚡ Post-Before-Act Rule (MANDATORY)

**Before writing or modifying ANY file**, post a PROGRESS message saying what you are about to do.
**After completing the file**, post a PROGRESS confirmation with the file path and a brief summary.

This ensures the chatboard shows every single interaction in real time. **No exceptions.**

---

## Message Format

Every message MUST follow this exact format:

```
---
[TIMESTAMP] | [AGENT: BA/DEV/QA] | [TYPE: MESSAGE/QUESTION/BLOCKER/REVIEW_REQUEST/APPROVED/REJECTED/HANDOFF/BUG/FIX/INFO/PROGRESS]

Your message content here.
Can span multiple lines.
---
```

### Timestamp format: ISO 8601
Example: `2026-03-07T10:30:00+02:00`

### Agent values: exactly one of
- `BA` — Business Analyst
- `DEV` — Developer
- `QA` — Quality Assurance

### Type values: exactly one of
| Type | Use when |
|--|--|
| `MESSAGE` | General update or status |
| `QUESTION` | Asking another agent for clarification |
| `BLOCKER` | You cannot proceed — blocking issue |
| `REVIEW_REQUEST` | Asking another agent to review your output |
| `APPROVED` | Approving a previous review request |
| `REJECTED` | Rejecting a review with reasons |
| `HANDOFF` | Formally handing work to the next agent |
| `BUG` | Reporting a bug found during testing |
| `FIX` | Confirming a bug has been fixed |
| `INFO` | General FYI, no response required |
| `PROGRESS` | Mid-task visibility — "working on X, doing Y" |

---

## Rules

1. **Always read before writing.** Read the entire chat before posting.
2. **Address by agent name** when directing at a specific agent.
3. **One topic per message.** Multiple questions = multiple messages.
4. **BLOCKER is highest priority.** Respond before any other work.
5. **REVIEW_REQUEST requires a response.** Don't skip reviews.
6. **Never delete messages.** Append only.
7. **Reference files explicitly.** Use relative paths from project root.
8. **Post at least every 2 minutes** even if still working. Use PROGRESS type.

---
