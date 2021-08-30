
import os
import sys
import umap
import time
import numba
import pickle
import numpy as np
import pandas as pd

from interface import Interface

interface = Interface()

WORKING_DIR = os.getcwd()
BASE_DIR = WORKING_DIR
if "src" in WORKING_DIR:
    BASE_DIR = WORKING_DIR.split("/src")[0]
DATA_DIR = BASE_DIR + "/data"
NEW_EMBS_FILENAME = "data.csv"
NEW_EMBS_FILE = f"{DATA_DIR}/{NEW_EMBS_FILENAME}"

data = pd.read_csv(NEW_EMBS_FILE)

def get_segment_vectors(df, f=0, t=50):
    cls_embeddings = df.cls_embs
    cls_values = list(cls_embeddings.apply(lambda r: list(filter(lambda x: len(x) > 1, r[:-1][1:].split(",")))))[f:t]
    segment_vectors = np.array(list(map(lambda e: np.array(list(map(float, e))), cls_values)))
    return segment_vectors

with open(f"{DATA_DIR}/reducer.pk", "rb") as file:
    red = pickle.load(file)

# with open(f"{DATA_DIR}/reducer_embs.str", "r") as file:
#     red_embs_str = file.read()
# red_embs_str = red_embs_str.split("\n")

with open(f"{DATA_DIR}/reducer_embs.pk", "rb") as file:
    reducer_embs = pickle.load(file)
    

reducer_embs_ready = numba.typed.List([np.array(rel) for rel in np.array(reducer_embs)])
red.embeddings_ = reducer_embs_ready

print(len(red.embeddings_))

for index, emb in enumerate(red.embeddings_[0]):
    data.loc[data.index == index, ['x', 'y']] = list(emb)    
    
data.to_csv("data_copy.csv", index=False, encoding="utf-8")
    

