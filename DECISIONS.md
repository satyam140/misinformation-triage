# Design Decisions

## DP1 — Feed Ordering

The public feed displays claims with the most recently submitted claims first. Claim status is displayed and can be used for filtering. Risk level is shown as a triage signal but does not determine feed ordering.

## DP2 — Visibility of Unverified Claims

Unverified claims remain publicly visible and are clearly labeled as **Unverified**. This allows users to see submitted information while making it clear that the claim has not yet received a reviewer decision.

## DP3 — Editing Claims

The original claim submission is preserved after it is submitted. Reviewer decisions and notes are stored separately so that the original claim is not silently modified and the review history remains transparent.
