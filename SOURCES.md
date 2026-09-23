# Sources and data provenance

- The symptom dataset is generated in `ml/src/disease_model/core.py`: all 256 binary combinations with an arbitrary modulo-three label rule. It contains no patient records or clinically meaningful disease labels.
- Facility names and records in `ml/data/fictional_hospitals.csv` are fictional. Coordinates are demonstration points around Bengaluru.
- scikit-learn BernoulliNB: https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.BernoulliNB.html
- scikit-learn cross-validation: https://scikit-learn.org/stable/modules/cross_validation.html
- Great-circle distance method: https://www.movable-type.co.uk/scripts/latlong.html
- Hono framework and Cloudflare adapter: https://hono.dev/docs/getting-started/cloudflare-workers
- Cloudflare Worker static asset binding: https://developers.cloudflare.com/workers/static-assets/binding/
- React: https://react.dev/
- Vite: https://vite.dev/
- Zod: https://zod.dev/

The serving implementation evaluates the exported BernoulliNB parameters; it does not call a language-model API or load a browser Python runtime. The scientific model's limitations remain documented in the model card.
