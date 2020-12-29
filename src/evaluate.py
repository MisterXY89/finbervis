"""
@author: Tilman Kerl
@version: 2020.11.25
---
Evaluate the fine-tuned model with new evaluation data
"""

import torch
import pandas as pd

from config import EVALUATE_DATASET_FILE
from predict import SentimentPredictor
from bert_preprocess import get_tokenizer

# test_segments = pd.read_csv(EVALUATE_DATASET_FILE)

sent_pred = SentimentPredictor()
sent_pred.load_model()

tokenizer = get_tokenizer()
input_ids = torch.tensor(tokenizer.encode("Hello, your dog is cute")).unsqueeze(0)  # Batch size 1
outputs = sent_pred.model(input_ids)
print(outputs)
hs = outputs[0]  #
print(hs)
