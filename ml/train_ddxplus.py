"""Export a positive-evidence NB research ranker from official DDXPlus splits.
Unchecked symptoms are unknown, never negative. No patient records are persisted.
"""
import argparse,csv,hashlib,json,math,re,zipfile
from pathlib import Path
import numpy as np
from sklearn.metrics import f1_score
ROOT=Path(__file__).resolve().parents[1]

def run(data_dir):
 evidence=json.loads((ROOT/'ml/data/ddxplus/evidences.json').read_text())
 conditions=json.loads((ROOT/'ml/data/ddxplus/conditions.json').read_text())
 features=sorted([k for k,v in evidence.items() if v['data_type']=='B' and not v['is_antecedent']],key=lambda k:int(k[2:]))
 classes=sorted(conditions); fi={x:i for i,x in enumerate(features)}; ci={x:i for i,x in enumerate(classes)}
 counts=np.zeros((len(classes),len(features))); totals=np.zeros(len(classes)); token=re.compile(r"'([^']+)'")
 def rows(file):
  import io
  with zipfile.ZipFile(file) as archive:
   name=next(n for n in archive.namelist() if not n.endswith('/') and not n.startswith('__MACOSX'))
   with archive.open(name) as raw:
    for row in csv.DictReader(io.TextIOWrapper(raw)):
     yield row['PATHOLOGY'],[fi[x] for x in token.findall(row['EVIDENCES']) if x in fi]
 train_file=data_dir/'release_train_patients.zip';test_file=data_dir/'release_test_patients.zip'
 for label,indices in rows(train_file):
  k=ci[label];totals[k]+=1;counts[k,indices]+=1
 print('Training rows',int(totals.sum()),'classes',len(classes),flush=True)
 logp=np.log((counts+1)/(totals[:,None]+2)); prior=np.full(len(classes),-math.log(len(classes)))
 def predict(indices):
  logits=prior+logp[:,indices].sum(axis=1); w=np.exp(logits-logits.max());return w/w.sum()
 expected=[];predicted=[];partial_true=[];partial_pred=[];top3=0;partial_top3=0;skipped=0;fixtures=[]
 rng=np.random.default_rng(42)
 for label,indices in rows(test_file):
  if not indices:skipped+=1;continue
  scores=predict(indices); order=np.argsort(-scores);expected.append(ci[label]);predicted.append(int(order[0]));top3+=ci[label] in order[:3]
  if len(indices)>=3:
   subset=sorted(rng.choice(indices,3,replace=False).tolist());scores3=predict(subset);rank3=np.argsort(-scores3);partial_true.append(ci[label]);partial_pred.append(int(rank3[0]));partial_top3+=ci[label] in rank3[:3]
  if len(fixtures)<80 and len(indices)>=3:
   fixtures.append({'symptoms':[features[i] for i in indices],'label':classes[order[0]],'probabilities':scores.tolist()})
 evaluation={'trainRows':int(totals.sum()),'testRows':len(expected),'excludedEmptyTestRows':skipped,'holdoutAccuracy':float(np.mean(np.array(expected)==predicted)),'holdoutMacroF1':float(f1_score(expected,predicted,average='macro',zero_division=0)),'top3Accuracy':top3/len(expected),'threeSymptomRows':len(partial_true),'threeSymptomAccuracy':float(np.mean(np.array(partial_true)==partial_pred)),'threeSymptomTop3':partial_top3/len(partial_true),'evaluationScope':'Official synthetic test split; positive binary symptoms only; three-symptom subset uses seed 42. Not clinical validation.'}
 params={'classes':classes,'features':features,'classLogPrior':prior.tolist(),'featureLogProbability':logp.tolist()}
 version='ddxplus-positive-nb-'+hashlib.sha256(json.dumps(params,sort_keys=True).encode()).hexdigest()[:12]
 hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [train_file,test_file]}
 artifact={**params,'version':version,'algorithm':'Positive-evidence Bernoulli Naive Bayes','clinicalUse':False,'dataset':'DDXPlus English v2, CC BY 4.0; medically simulated cases with real disease labels','source':'https://doi.org/10.6084/m9.figshare.22687585.v2','evaluation':evaluation,'sourceSha256':hashes,'classTrainingRows':{c:int(totals[i]) for i,c in enumerate(classes)}}
 (ROOT/'ml/artifacts/model.json').write_text(json.dumps(artifact,indent=2)+'\n')
 (ROOT/'tests/fixtures/model-parity.json').write_text(json.dumps(fixtures,indent=2)+'\n')
 print(json.dumps(evaluation,indent=2));print(version)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--data-dir',type=Path,required=True);run(parser.parse_args().data_dir)
