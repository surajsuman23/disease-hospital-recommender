# Sources and attribution

## DDXPlus data — CC BY 4.0

Arsene Fansi Tchango and colleagues. **DDXPlus: A New Dataset For Automatic Medical Diagnosis**, NeurIPS 2022. English v2 dataset: https://doi.org/10.6084/m9.figshare.22687585.v2. Source documentation: https://github.com/mila-iqia/ddxplus. License: https://creativecommons.org/licenses/by/4.0/.

The repository redistributes source evidence and condition metadata, a derived symptom catalogue, aggregate trained parameters and simulated-case test fixtures. Changes: binary symptoms only, shortened UI labels, positive-evidence Naive Bayes training and model export. DDXPlus's authors do not endorse this app. Dataset cases are medically simulated, although condition names are real.

## Hospital directory — OpenStreetMap ODbL

© OpenStreetMap contributors, https://www.openstreetmap.org/copyright. Coordinates/address snapshots queried through Nominatim on 2026-09-23. Adapted display names and added official source links. The derived directory is available as `ml/artifacts/hospitals.json` under ODbL: https://opendatacommons.org/licenses/odbl/1-0/.

- St. John's: https://www.openstreetmap.org/relation/17069662 ; https://bengaluruurban.nic.in/en/public-utility/st-johns-medical-college-hospital/
- Victoria: https://www.openstreetmap.org/way/150350476 ; https://victoriahospital.karnataka.gov.in/english
- Bowring: https://www.openstreetmap.org/way/45444044 ; https://bengaluruurban.nic.in/en/public-utility/bowringhospital/

Distance order is not clinical suitability. No hours, services, availability or quality ratings are invented.

## Safety context

NHS, shortness of breath: https://www.nhs.uk/symptoms/shortness-of-breath/. The app gives a brief generic emergency reminder; visitors should follow their local emergency service, not use model output for triage.

## Visual asset

`apps/frontend/public/images/hospital-atrium.png`: generated architectural illustration of an imaginary hospital atrium. Not a photograph of or endorsement by any listed institution. No patient imagery or third-party logos are included.

## Software

React, Hono, Zod, TypeScript, Vite, esbuild, Drizzle, NumPy, scikit-learn, Playwright and axe are dependencies subject to their own licenses. Application logic and research reports should be read with the model card's limits.
