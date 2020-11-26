"""
@author: Tilman Kerl
@version: 2020.11.26
---
Anylse the structure of the segments via n-grams & POS-Tagging
"""

import nltk
import spacy
import pandas as pd
from tqdm import tqdm

from config import CLEANED_DATASET_FILE, LABEL_VALUES

nlp = spacy.load("en_core_web_sm")
data_frame = pd.read_csv(CLEANED_DATASET_FILE)
N_GRAM_VALUE = 3


def get_pos_tags(segments:list) -> list:
    pos_tags = []
    print("Getting POS-Tags...")
    for segment in tqdm(segments):
        doc = nlp(segment)
        # doc_tags = []
        for token in doc:
            pos_tags.append(token.pos_)
        # POS_TAGS.append(doc_tags)
    return pos_tags

def get_n_grams(list_of_values:list, n_value:int, limit:int =10):
    return pd.Series(nltk.ngrams(list_of_values, n_value)).value_counts()[:limit]



def value_pos_n_grams(n_value: int) -> None:
    for value in LABEL_VALUES:
        print(f"POS-TAGS for <{value}>:")
        value_segments = list(data_frame.query(f"sentiment=='{value}'").segment)
        pos_tags = get_pos_tags(value_segments)
        n_grams = get_n_grams(pos_tags, n_value)
        print(f"\n{n_grams}")
    print(40*"-"+"\n")

def overall_pos_n_grams(n_value: int) -> None:
    segments = list(data_frame.segment)
    pos_tags = get_pos_tags(segments)
    n_grams = get_n_grams(pos_tags, n_value)
    print(f"{n_grams}")
    print(40*"-"+"\n")


value_pos_n_grams(3)
