"""
@author: Tilman Kerl
@version: 2020.11.25
---
Description of cluster.py
"""

import sys
import os.path
import pretty_errors
from collections import Counter

import torch
import spacy
import pandas as pd
from tqdm import tqdm
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np
from sklearn.datasets import make_classification
from sklearn.cluster import DBSCAN
from matplotlib import pyplot

import umap


from config import (
    CLEANED_DATASET_FILE, LABEL_VALUES, CLEANED_PROCESSED_DATASET_FILE,
    EMBEDDINGS_DATASET_FILE, CLUSTER_DATASET_FILE, NEW_EMBS_FILE)
from explore import reduce_df
from structure_analysis import get_pos_tags, value_pos_n_grams
# from predict import SentimentPredictor
from bert_preprocess import get_tokenizer

sns.set_theme(style="whitegrid")

print("\n----\nLoading spacy <en_core_web_sm> model")
nlp = spacy.load("en_core_web_sm")


def sample(df: pd.DataFrame, frac: float = 0.3) -> pd.DataFrame:
    """
	sample df with equally distributed sentiment classes
	"""
    print(f"Sampling data with {frac=}")
    sampled_df = pd.DataFrame()
    for value in LABEL_VALUES:
        sampled_df = sampled_df.append(
            df.query(f"sentiment == '{value}'").sample(frac=frac))# n=n))
    return sampled_df


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """
	Preprocessing text segments in df:
		-tokenization
		-lemmatization
		-punct removal
		-stop word removal
	"""
    print(
        "Preprocessing text:\n\t-tokenization\n\t-lemmatization\n\t-punct removal\n\t-stop word removal"
    )
    df = reduce_df(df)
    for index, row in tqdm(df.iterrows(), desc='Progress',
                           total=len(df.index)):
        segment = str(row.segment).lower()
        doc = nlp(segment)
        processed_segment = " ".join([
            token.lemma_ for token in doc
            if not token.is_punct or token.is_stop
        ])
        # print(processed_segment)
        df.loc[index] = [processed_segment, row.sentiment]
    return df


segment_vectors = None

# check if preprocessed file exists and load/create respectively
# if os.path.isfile(EMBEDDINGS_DATASET_FILE):
#     print("Loading 'EMBEDDINGS_DATASET'")
#     data = pd.read_csv(EMBEDDINGS_DATASET_FILE)
# else:
#     # check if preprocessed file exists and load/create respectively
#     if os.path.isfile(CLEANED_PROCESSED_DATASET_FILE):
#         print("Loading 'CLEANED_PROCESSED_DATASET'")
#         data = pd.read_csv(CLEANED_PROCESSED_DATASET_FILE)
#     else:
#         data = pd.read_csv(CLEANED_DATASET_FILE)
#         data = preprocess(data)
#         data.to_csv(CLEANED_PROCESSED_DATASET_FILE, encoding="utf-8")
#
#     segments = list(data["segment"])
#
#     sent_pred = SentimentPredictor()
#     sent_pred.load_model()
#     tokenizer = get_tokenizer()
#
#     segment_vectors = np.empty((0, 3), float)
#     data["embeddings"] = list(range(0, len(data)))
#     data["embeddings"] = data["embeddings"].astype('object')
#     for index, segment in tqdm(enumerate(segments)):
#         input_ids = torch.tensor(tokenizer.encode(segment)).unsqueeze(0)  # Batch size 1
#         outputs = sent_pred.model(input_ids)
#         hs = outputs[0]
#         embedding_arr = hs.detach().numpy()[0]
#         # add embedding_arr to df
#         segment_vectors = np.append(segment_vectors, np.array([embedding_arr]), axis=0)
#         data["embeddings"].loc[index] = np.array(embedding_arr)    #",".join(
#     data.to_csv(EMBEDDINGS_DATASET_FILE, encoding="utf-8")

# if not isinstance(segment_vectors, list):
    # segment_vectors = list(map(list, list(data["embeddings"])))
#     segment_vectors = data["embeddings"]

# segment_vectors = np.array(map(np.array, list(data["embeddings"])))
# segment_vectors = data["embeddings"]
# print(segment_vectors[0])

data = pd.read_csv(NEW_EMBS_FILE)
embeddings = data.cls_embs
values = list(embeddings.apply(lambda r: list(filter(lambda x: len(x) > 1, r[:-1][1:].split(",")))))
segment_vectors = np.array(list(map(lambda e: list(map(float, e)), values)))

print(data.head())

# define dataset
X = segment_vectors
print("fitting UMAP")
X = umap.UMAP().fit_transform(X)

print("init DBSCAN model")
db_model = DBSCAN(eps=.55, min_samples=3)

print("predicting cluster")
yhat = db_model.fit_predict(X)

# retrieve unique clusters
clusters = np.unique(yhat)

data["cluster"] = list(range(0, len(data)))
data["x"] = list(range(0, len(data)))
data["y"] = list(range(0, len(data)))

# create scatter plot for samples from each cluster
for cluster in clusters:
    # get row indexes for samples with this cluster
    row_ix = np.where(yhat == cluster)
    # getting coords
    x_coord = X[row_ix, 0]
    y_coord = X[row_ix, 1]
    # adding cluster & coords to df
    data["cluster"].loc[row_ix] = cluster
    data["x"].loc[row_ix] = x_coord
    data["y"].loc[row_ix] = y_coord
    # create scatter of these samples
    pyplot.scatter(x_coord, y_coord)

data.to_csv(NEW_EMBS_FILE, encoding="utf-8")

# show the plot
pyplot.show()
