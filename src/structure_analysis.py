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
import matplotlib.pyplot as plt

from config import CLEANED_DATASET_FILE, LABEL_VALUES

nlp = spacy.load("en_core_web_sm")
data_frame = pd.read_csv(CLEANED_DATASET_FILE)
N_GRAM_VALUE = 3

COLORS = [
    'tab:blue', 'tab:orange', 'tab:green', 'tab:red', 'tab:purple',
    'tab:brown', 'tab:pink', 'tab:gray', 'tab:olive', 'tab:cyan'
]


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



def value_pos_n_grams(n_value: int, limit: int) -> None:
    n_gram_series_dict = {}
    for value in LABEL_VALUES:
        print(f"POS-TAGS for <{value}>:")
        value_segments = list(data_frame.query(f"sentiment=='{value}'").segment)
        pos_tags = get_pos_tags(value_segments)
        n_grams = get_n_grams(pos_tags, n_value, limit=limit)
        n_gram_series_dict[value] = n_grams
        print(f"\n{n_grams}")
    print(40*"-"+"\n")
    return pd.DataFrame(n_gram_series_dict)

def overall_pos_n_grams(n_value: int, limit: int):
    segments = list(data_frame.segment)
    pos_tags = get_pos_tags(segments)
    n_grams = get_n_grams(pos_tags, n_value, limit=limit)
    print(f"{n_grams}")
    print(40*"-"+"\n")
    return n_grams


def plot_n_grams(n_grams_series, n_value: int, limit: int) -> None:
    # sort_values()
    n_grams_series.sort_values().plot.barh(color=["SkyBlue","IndianRed", "tab:gray"], width=.9, figsize=(12, 8))
    plt.title(f"{limit} Most Frequently Occuring {n_value}grams")
    plt.ylabel(f"{n_value}-grams")
    plt.xlabel("# of Occurances")
    plt.show()


N_GRAM_VALUE = 3
LIMIT = 10

n_gram_series = overall_pos_n_grams(N_GRAM_VALUE, limit=LIMIT)
# value_n_gram_series = value_pos_n_grams(N_GRAM_VALUE, limit=LIMIT)

plot_n_grams(n_gram_series, N_GRAM_VALUE, LIMIT)
# plot_n_grams(value_n_gram_series, N_GRAM_VALUE,LIMIT)
