import json,unittest
from pathlib import Path
from disease_model.core import load_model,classify
ROOT=Path(__file__).resolve().parents[2]
class ModelTests(unittest.TestCase):
 def test_real_catalogue_and_training_provenance(self):
  model=load_model();self.assertEqual(len(model['classes']),49);self.assertIn('Influenza',model['classes']);self.assertNotIn('demo_condition_a',model['classes']);self.assertEqual(len(model['features']),96);self.assertEqual(model['evaluation']['trainRows'],1025602);self.assertFalse(model['clinicalUse'])
 def test_independent_python_inference_matches_exported_test_cases(self):
  model=load_model()
  for case in json.loads((ROOT/'tests/fixtures/model-parity.json').read_text()):
   result=classify(model,case['symptoms']);self.assertEqual(result['label'],case['label'])
   for a,b in zip(result['scores'],case['probabilities']):self.assertAlmostEqual(a,b,places=12)
 def test_invalid_features_and_duplicates(self):
  model=load_model()
  for features in [[],['invalid'],['E_91','E_91']]:
   with self.assertRaises(ValueError):classify(model,features)
 def test_example_and_order_invariance(self):
  model=load_model();features=['E_91','E_201','E_97','E_94','E_144'];first=classify(model,features);self.assertEqual(first['label'],'Influenza');second=classify(model,list(reversed(features)));self.assertEqual(first['label'],second['label']);self.assertAlmostEqual(sum(first['scores']),1,places=12)
if __name__=='__main__':unittest.main()
