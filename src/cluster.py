"""
@author: Tilman Kerl
@version: 2020.11.25
---
Description of cluster.py
"""

import sys
import os.path
from collections import Counter

import spacy
import pandas as pd
from tqdm import tqdm
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import CountVectorizer


from config import CLEANED_DATASET_FILE, LABEL_VALUES, CLEANED_PROCESSED_DATASET_FILE
from explore import reduce_df

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
            df.query(f"sentiment == '{value}'").sample(frac=1))
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

file, cluster_number, sample_size, do_annotate = sys.argv

SAMPLE_SIZE = 100 if sample_size == "_" else int(sample_size)
CLUSTER_NUMBER = 3 if cluster_number == "_" else int(cluster_number)
DO_ANNOTATE = True if do_annotate == "True" else False

# data = sample(data, n=SAMPLE_SIZE)
segments = data["segment"]

print("Vectorizing segments...")
vectorizer = CountVectorizer(analyzer='word',
                             lowercase=True,
                             stop_words='english')
vectorized_docs = vectorizer.fit_transform(segments)

kmeans = KMeans(n_clusters=CLUSTER_NUMBER,
                init='k-means++',
                max_iter=100,
                n_init=1,
                random_state=0)

print("Fitting Model...")
kmean_indices = kmeans.fit_predict(vectorized_docs)

print("Creating Visualization...")
pca = PCA(n_components=2)
scatter_plot_points = pca.fit_transform(vectorized_docs.toarray())

colors = [
    'tab:blue', 'tab:orange', 'tab:green', 'tab:red', 'tab:purple',
    'tab:brown', 'tab:pink', 'tab:gray', 'tab:olive', 'tab:cyan'
]
x_axis = [o[0] for o in scatter_plot_points]
y_axis = [o[1] for o in scatter_plot_points]
fig, ax = plt.subplots(figsize=(20, 10))

ax.scatter(x_axis, y_axis, c=[colors[d] for d in kmean_indices])

if DO_ANNOTATE:
    for i, txt in enumerate(segments):
        ax.annotate(data.iloc[i]["sentiment"][:3], (x_axis[i], y_axis[i]))

plt.show()

frequency = dict(Counter(kmean_indices.tolist()))
plt.bar(*zip(*frequency.items()), color=colors)
plt.show()
