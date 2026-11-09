# Support

Support tickets; the conversation is Messages about the ticket and internal notes are Notes.

Packs are versioned with the standard, currently 0.1.0. Each model below has its own version.

## Models

| Model | Version | Description |
|---|---|---|
| [Ticket](../models/ticket) | v1 | A request for help from a Person, owned by the team until it is solved. |

## Extensions

Fields this pack adds to other models.

### [Ticket](../models/ticket)

| Extension | Type | Notes |
|---|---|---|
| `ext.support.cc` | object | People copied on the whole ticket rather than on single messages: { participants: [ Participant ] }. |
| `ext.support.first_responded_at` | datetime | When the team first replied to the requester; the start of SLA reporting. |
| `ext.support.kind` | string | The ticket type in the source's vocabulary: question, incident, problem, task, feedback, or a workspace's own. |
| `ext.support.parent` | string | The id of the parent Ticket (a problem this incident belongs to, a tracker, a follow-up source). |
| `ext.support.satisfaction` | object | The requester's rating after resolution: { rating (int, 1 to 5), comment }. |
