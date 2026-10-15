# Privacy Score

Privacy scores are calculated by deterministic backend rules. AI extracts policy facts and evidence but never chooses the score.

## Direction and thresholds

- `100` means lower observed privacy exposure and fewer disclosure conflicts.
- `0` means higher observed privacy exposure and more disclosure conflicts.
- `LOW`: 80–100
- `MODERATE`: 60–79
- `HIGH`: 40–59
- `VERY HIGH`: 0–39

## Inputs and weights

The score starts at 100. Duplicate values are normalized and counted once within each input group.

| Evidence | Adjustment | Maximum adjustment |
| --- | ---: | ---: |
| Requested permission group | -1 each | -10 |
| Collected-data group | -3 each | -24 |
| Shared-data group | -5 each | -25 |
| Supported possible mismatch | -6 each | -30 |
| Unclear comparison | -3 each | -12 |
| Policy-supported deletion option | +4 | +4 |
| Policy-supported security practice | +2 each | +4 |

The result is rounded to an integer and clamped to 0–100.

## Incomplete evidence

`INSUFFICIENT_INFORMATION`, unavailable sources, and failed sources do not change the score. Available permission and disclosure evidence can still affect the score. A report with no available scoreable evidence therefore retains 100, but the UI must use `sourceStatus` and insufficient-information findings to state that the score is not conclusive. Missing evidence must never be described as proof of safety.

## Comparison scope

Disclosure comparisons cover the agreed essential categories: location, contacts, camera, microphone, photos, messages, financial information, health information, and device identifiers. Other permission or disclosure groups may affect the exposure portion of the score, but they do not create unsupported mismatch findings.
