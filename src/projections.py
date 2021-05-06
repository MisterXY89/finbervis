
import os
import sys
import umap
import numpy as np
import pandas as pd

import matplotlib.pyplot as plt
import seaborn as sns

# from config import (
#     NEW_EMBS_FILE
# )
WORKING_DIR = os.getcwd()
BASE_DIR = WORKING_DIR
if "src" in WORKING_DIR:
    BASE_DIR = WORKING_DIR.split("/src")[0]
DATA_DIR = BASE_DIR + "/data"
NEW_EMBS_FILENAME = "data.csv"
NEW_EMBS_FILE = f"{DATA_DIR}/{NEW_EMBS_FILENAME}"

data = pd.read_csv(NEW_EMBS_FILE)
# print(data.head())

def get_segment_vectors(df, f=0, t=100):
    embeddings = df.cls_embs
    values = list(embeddings.apply(lambda r: list(filter(lambda x: len(x) > 1, r[:-1][1:].split(",")))))[f:t]
    print(len(values))
    segment_vectors = np.array(list(map(lambda e: np.array(list(map(float, e))), values)))
    return segment_vectors


X = get_segment_vectors(data)
print(X)
print(dir(X))
# print(len(X))
print("fitting UMAP")

# sys.exit(0)

relation_dict = {i:i for i in range(X.size)}
relation_dicts = [relation_dict.copy() for i in range(X.size - 1)]

# plt.matshow(ordered_digits[-1].reshape((8,8)))

# print(relation_dicts)
print(len(relation_dicts))

reducer = umap.AlignedUMAP()
# print(dir(reducer))
print(X)
print(X.shape)
print(len(X))
coords = reducer.fit(X, relations = relation_dicts)

print(coords)
print(coords.shape)

Y = get_segment_vectors(data, f=200, t=220)
new_coords = reducer.update(Y)

print(new_coords)


plt.scatter(
    coords[:, 0],
    coords[:, 1])
plt.gca().set_aspect('equal', 'datalim')
plt.title('UMAP projection of CLS_EMBS', fontsize=24)

plt.show()