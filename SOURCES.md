# Sources and data provenance

## Data created for this repository

- `synthetic_data()` generates 256 binary patterns and fictional labels using a documented deterministic rule. No patient records or third-party symptom dataset are included.
- `fictional_hospitals.csv` contains four invented institutions and illustrative coordinates. It is not scraped from a hospital directory.

## Method references

- [scikit-learn KNeighborsClassifier](https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.KNeighborsClassifier.html)
- [scikit-learn BernoulliNB](https://scikit-learn.org/stable/modules/generated/sklearn.naive_bayes.BernoulliNB.html)
- [scikit-learn cross-validation guide](https://scikit-learn.org/stable/modules/cross_validation.html)
- [scikit-learn Haversine distances](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.haversine_distances.html): mathematical reference; the repository implements the scalar formula using Python's standard `math` module and a mean Earth radius of 6371.0088 km.

Accessed 2026-09-22. New code was written with AI assistance; no third-party implementation was copied.
