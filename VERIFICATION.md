# Verification — Arovia rebuild, 2026-09-23

- Local TypeScript checks, 23 API/component/inference tests and four Python tests pass.
- TypeScript and independent Python inference agree with 80 exported DDXPlus test fixtures to 12 decimal places.
- Model training and official test evaluation completed. The model card reports exact counts, source hashes, full-feature and three-feature measurements.
- Browser CI covers all five screens, real disease candidate names, hospital search, model search, result download, coordinate ranking toggles, API failure recovery and automated accessibility on Chromium, Firefox, WebKit and mobile WebKit.
- Container CI builds a non-root image, checks readiness and performs the bounded 48-request local load check.

See the current application's GitHub Actions run for browser/container completion. Earlier runs used the retired A/B/C demonstration and do not validate the DDXPlus release. No clinical validation, independent medical review, full manual accessibility audit or sustained production capacity test is claimed.
