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


from config import CLEANED_DATASET_FILE, LABEL_VALUES, CLEANED_PROCESSED_DATASET_FILE, EMBEDDINGS_DATASET_FILE
from explore import reduce_df
from structure_analysis import get_pos_tags, value_pos_n_grams
from predict import SentimentPredictor
from bert_preprocess import get_tokenizer

sns.set_theme(style="whitegrid")

print("\n----\nLoading spacy <en_core_web_sm> model")
nlp = spacy.load("en_core_web_sm")


def sample(df: pd.DataFrame, n: int = 100) -> pd.DataFrame:
    """
	sample df with equally distributed sentiment classes
	"""
    print(f"Sampling data with {n=}")
    sampled_df = pd.DataFrame()
    for value in LABEL_VALUES:
        sampled_df = sampled_df.append(
            df.query(f"sentiment == '{value}'").sample(frac=0.3))# n=n))
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


# check if preprocessed file exists and load/create respectively
if os.path.isfile(CLEANED_PROCESSED_DATASET_FILE):
    print("Loading 'CLEANED_PROCESSED_DATASET'")
    data = pd.read_csv(CLEANED_PROCESSED_DATASET_FILE)
else:
    data = pd.read_csv(CLEANED_DATASET_FILE)
    data = preprocess(data)
    data.to_csv(CLEANED_PROCESSED_DATASET_FILE, encoding="utf-8")


SAMPLE_SIZE = 5    # if sample_size == "_" else int(sample_size)
CLUSTER_NUMBER = 3  # if cluster_number == "_" else int(cluster_number)
DO_ANNOTATE = False # if do_annotate == "True" else False

# data = sample(data, n=SAMPLE_SIZE)
# print(data)
# segments = list(map(lambda el: el.split(" "), list(data["segment"])))
segments = list(data["segment"])
# print(preprocess(data))


sent_pred = SentimentPredictor()
sent_pred.load_model()

tokenizer = get_tokenizer()

segment_vectors = np.empty((0, 3), float)
data["embeddings"] = list(range(0, len(data)))

for index, segment in tqdm(enumerate(segments)):
    input_ids = torch.tensor(tokenizer.encode(segment)).unsqueeze(0)  # Batch size 1
    outputs = sent_pred.model(input_ids)
    hs = outputs[0]
    embedding_arr = hs.detach().numpy()[0]
    # add embedding_arr to df
    segment_vectors = np.append(segment_vectors, np.array([embedding_arr]), axis=0)
    data["embeddings"].loc[index] = ",".join(map(str, list(embedding_arr)))

# data["embedding"] = segment_vectors
print(data.head())

data.to_csv(EMBEDDINGS_DATASET_FILE, encoding="utf-8", index=False)


# define dataset
# X, _ = make_classification(n_samples=1000, n_features=2, n_informative=2, n_redundant=0, n_clusters_per_class=1, random_state=4)
X = segment_vectors
print("fitting UMAP")
X = umap.UMAP().fit_transform(X)

print("init DBSCAN model")
db_model = DBSCAN(eps=.6, min_samples=9)

print("predicting cluster")
yhat = db_model.fit_predict(X)

# retrieve unique clusters
clusters = np.unique(yhat)

# create scatter plot for samples from each cluster
for cluster in clusters:
	# get row indexes for samples with this cluster
	row_ix = np.where(yhat == cluster)
	# create scatter of these samples
	pyplot.scatter(X[row_ix, 0], X[row_ix, 1])

# show the plot
pyplot.show()

print("Vectorizing segments...")
vectors = []
segments
