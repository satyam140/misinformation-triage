# Design Decisions

## DP1 — Feed Ordering

The public feed uses status and recency when presenting claims rather than ordering claims by risk level alone. This prevents high-risk claims from being automatically promoted simply because they contain more warning signals.

## DP2 — Visibility of Unverified Claims

Unverified claims remain publicly visible and are clearly labeled as **Unverified**. This allows users to see submitted information while making it clear that the claim has not yet received a reviewer decision.

## DP3 — Editing Claims

The original claim submission is preserved after it is submitted. Reviewer decisions and notes are stored separately so that the original claim is not silently modified and the review history remains transparent.