
import torch
import numpy as np
import pandas as pd
from tqdm import tqdm

import plotly.express as px

from config import NEW_EMBS_FILE

# data = pd.read_csv(CLUSTER_DATASET_FILE)

# segments = list(data["segment"])

from interface import Interface

interface = Interface()

print(interface.dist.df)
print(interface.dist.df.mean_attention)

segments = list(interface.dist.df.segment)
mean_attention_list = []
for seg in tqdm(segments):
    seg_mean_att = interface.get_mean_attention_for_layer(seg, 10)
    mean_attention_list.append(seg_mean_att)

interface.dist.df["mean_attention"] = mean_attention_list
interface.dist.df.to_csv(NEW_EMBS_FILE, index=False, encoding="utf-8")    