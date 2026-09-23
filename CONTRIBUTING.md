# Contributing

Install with `npm ci`, make focused changes, then run `npm run check` and `npm run format:check`. Keep API schemas and OpenAPI documentation aligned. Add behavior tests for new request/response paths.

Model changes must include regenerated artifacts and parity fixtures from `python ml/export_model.py`, updated evaluation and model-card notes, and passing Python/backend tests. Do not change synthetic labels to real disease names without an independently validated model and revised intended-use review.

Do not commit credentials, real medical records, location histories, local environment files or generated dependency directories. Use a pull request to explain behavior changes and verification.
