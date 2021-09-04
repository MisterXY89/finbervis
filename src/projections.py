
import os
import sys
import umap
import numba
import pickle
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
NEW_EMBS_FILENAME = "drop_from_3_data.csv"
NEW_EMBS_FILE = f"{DATA_DIR}/{NEW_EMBS_FILENAME}"

data = pd.read_csv(NEW_EMBS_FILE)
# print(data.head())

def get_segment_vectors(df, f=0, t=50):
    cls_embeddings = df.cls_embs
    print(cls_embeddings)
    print(cls_embeddings[1])
    # list(cls_embeddings.apply(lambda r: list(filter(lambda x: len(x) > 1, r[:-1][1:].split(","))))) 
    cls_values = list(cls_embeddings.apply(lambda r: list(filter(lambda x: len(x) > 1, r[:-1][1:].split(",")))))
    segment_vectors = np.array(list(map(lambda e: np.array(list(map(float, e))), cls_values)))
    return segment_vectors

embs = np.array(get_segment_vectors(data))
X = [embs, embs]
print("fitting UMAP")

relation_dict_training = {i:i for i in range(len(embs))}
relation_dicts_training = [relation_dict_training]

reducer = umap.AlignedUMAP()
print(dir(reducer))

res = reducer.fit(X, relations = relation_dicts_training)

print(reducer)
print(len(res.embeddings_))
embs = res.embeddings_[0]
x_vals = []
y_vals = []
for e in embs:
    print(e)
    print(type(e))
    x_vals.append(e[0])
    y_vals.append(e[1])
    
data["x"] = x_vals
data["y"] = y_vals

data.to_csv(NEW_EMBS_FILE, index=False)

# new_vecs = get_segment_vectors(data, f=200, t=220)
# relation_dict_up = {i:i for i in range(len(embs)+len(new_vecs)+20)}

# reducer.update(new_vecs, relations = relation_dict_up)


# print(reducer.embeddings_)
# print(dir(reducer))

# state = reducer.__getstate__()
# print(state)
# 
# for key in state.keys():    
#     print(f"{key}: {type(state[key])}")
# 
# 
# for map in state["mappers_"]:
#     print(map)
#     print(type(map))
# 
reducer_embs = reducer.embeddings_
reducer.embeddings_ = []

reducer_embs_list = [list(rel) for rel in list(reducer_embs)]


with open(f"{DATA_DIR}/drop_from_3.pk", "wb") as file:
    pickle.dump(reducer, file) # protocol=pickle.HIGHEST_PROTOCOL

with open(f"{DATA_DIR}/drop_from_3_embs.pk", "wb") as file:
    pickle.dump(reducer_embs_list, file)
    
    