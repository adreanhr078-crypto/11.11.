# Repository Agent Instructions

The active 11.11 application is under `artifacts/eleven-eleven`. Read and preserve its project rules in `artifacts/eleven-eleven/AGENT_RULES.md` before making application changes. Do not modify legacy or unrelated project paths unless the task explicitly requires it.

# Mandatory 11.11 Quality Gate

For EVERY implementation, bug fix, refactor, UI change, gameplay change,
content integration, asset change, data change, or system modification:

Before reporting the task complete, you MUST invoke and satisfy:

$11.11-autonomous-quality-gate

The task is NOT complete merely because code was written or tests passed.

Required lifecycle:

UNDERSTAND
→ INSPECT
→ PLAN
→ IMPLEMENT
→ VERIFY
→ SELF-CRITIQUE
→ AUTO-FIX SAFE DEFECTS
→ VERIFY AGAIN
→ REGRESSION REVIEW
→ FINAL DELIVERY

Do not knowingly return fixable defects to the Owner.

If runtime/browser evidence is genuinely unavailable, never fabricate PASS.
Complete every verification possible and explicitly report the missing runtime evidence.
