import os
import sys
import pytest
import pandas as pd

sys.path.insert(0, './src')

from config import test_df
from explore import reduce_df, clean_dataset, parse_sentences, get_distribution



################################################
# TESTING EXPLORE.py

def test_reduce_df():
    df = reduce_df(test_df)
    assert "segment" in df and "sentiment" and len(df.columns) == 2

def test_clean_dataset():    
    df = clean_dataset(test_df)
    assert '\n' not in df.values and "\r" not in df.values

def test_parse_sentences():
    df = clean_dataset(test_df)
    df = parse_sentences(df)
    assert "isSentence" in df

def test_get_distribution():
    assert get_distribution(test_df) == True

