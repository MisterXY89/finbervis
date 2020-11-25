"""
@author: Tilman Kerl
@version: 2020.11.25
---
Evaluate the fine-tuned model with new evaluation data
"""

import pandas as pd

from config import EVALUATE_DATASET_FILE
from predict import SentimentPredictor

test_segments = pd.read_csv(EVALUATE_DATASET_FILE)

sent_pred = SentimentPredictor()
sent_pred.load_model()
predictions = sent_pred.predict(test_segments, shorten=False)
