import unittest
import pandas as pd
from disease_model.core import classify, fit_models, haversine_km, rank_hospitals, synthetic_data, validate_symptoms

class RecommenderTests(unittest.TestCase):
    def test_distance(self):
        self.assertEqual(haversine_km(0, 0, 0, 0), 0)
        self.assertAlmostEqual(haversine_km(0, 0, 0, 1), 111.195, places=2)
        with self.assertRaises(ValueError): haversine_km(91, 0, 0, 0)
        with self.assertRaises(ValueError): haversine_km(float('nan'), 0, 0, 0)

    def test_ranking_filters_before_distance(self):
        frame = pd.DataFrame([
            {'name': 'wrong', 'latitude': 0, 'longitude': 0, 'conditions': 'b'},
            {'name': 'far', 'latitude': 0, 'longitude': 2, 'conditions': 'a'},
            {'name': 'near', 'latitude': 0, 'longitude': 1, 'conditions': 'all'}])
        self.assertEqual([r['name'] for r in rank_hospitals(frame, 'a', 0, 0)], ['near', 'far'])
        self.assertEqual(rank_hospitals(frame.iloc[:1], 'a', 0, 0), [])

    def test_no_duplicate_patterns_and_validation(self):
        frame = synthetic_data()
        self.assertEqual(len(validate_symptoms(frame)), 256)
        frame.loc[0, 'fever'] = 2
        with self.assertRaises(ValueError): validate_symptoms(frame)

    def test_end_to_end_and_unknown_symptom(self):
        model, report = fit_models(synthetic_data())
        self.assertTrue(classify(model, ['fever']).startswith('demo_condition_'))
        self.assertEqual(report['train_rows'] + report['test_rows'], 256)
        with self.assertRaises(ValueError): classify(model, ['not_a_symptom'])
        with self.assertRaises(ValueError): classify(model, [])

if __name__ == '__main__': unittest.main()
