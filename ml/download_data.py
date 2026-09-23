"""Download the attributed official DDXPlus English splits and verify digests."""
import argparse,hashlib,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--data-dir',type=Path,required=True);args=p.parse_args();args.data_dir.mkdir(parents=True,exist_ok=True)
manifest=json.loads((Path(__file__).parent/'data/ddxplus/download-manifest.json').read_text())
for f in manifest['files']:
 target=args.data_dir/f['name']
 if not target.exists():subprocess.run(['curl','-fL','--retry','2','--max-time','600',f['download_url'],'-o',str(target)],check=True)
 if hashlib.md5(target.read_bytes()).hexdigest()!=f['computed_md5']:raise RuntimeError('Dataset digest mismatch: '+f['name'])
 print('Verified',f['name'])
