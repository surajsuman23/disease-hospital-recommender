"""Compatibility entry point: retrain only from the attributed official dataset."""
from train_ddxplus import run
from pathlib import Path
import argparse
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--data-dir',type=Path,required=True);run(parser.parse_args().data_dir)
