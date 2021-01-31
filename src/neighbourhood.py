
import torch
import numpy as np
import pandas as pd
from tqdm import tqdm

import plotly.express as px

from .config import CLUSTER_DATASET_FILE
from .predict import SentimentPredictor
from .bert_preprocess import get_tokenizer

data = pd.read_csv(CLUSTER_DATASET_FILE)

segments = list(data["segment"])

sent_pred = SentimentPredictor()
sent_pred.load_model()
tokenizer = get_tokenizer()

def get_attention_for_segment(self, segment, layer):
    input_ids = torch.tensor(tokenizer.encode(segment)).unsqueeze(0)
    outputs = sent_pred.model(input_ids, return_dict=True, output_attentions=True)
    attentions = outputs["attentions"][layer] # index indicates layer
    attentions = attentions.detach().numpy()
    return attentions

# 12x27
# batch_size, num_heads, sequence_length, sequence_length
#[head][token_index] (START....END)
at = get_attention_for_segment("", segments[0], 11)[0]
# print(at)
print(len(at))

fig = px.imshow(at)
fig.show()
