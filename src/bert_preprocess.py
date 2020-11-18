"""
@author: Tilman Kerl
@version: 2020.11.18
---
Description of bert_preprocess.py
"""

from config import *
from tqdm import tqdm
import pandas as pd
from transformers import BertTokenizer

df = pd.read_csv(CLEANED_DATASET_FILE)

segments = df.segment.values
labels = df.sentiment.values

print("Downloading BERT-Tokenizer...")
# BERT-Base, Uncased: 12-layer, 768-hidden, 12-heads, 110M parameters
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased',
                                          do_lower_case=True)

# Tokenize all of the sentences and map the tokens to thier word IDs.
input_ids = []
print("Tokenizing segments...")
for segment in tqdm(segments):
    encoded_segment = tokenizer.encode(
        segment,
        add_special_tokens=True,  # Add '[CLS]' and '[SEP]'
        # max_length = 128,          # Truncate all sentences.
        # return_tensors = 'pt',     # Return pytorch tensors.
    )

    input_ids.append(encoded_segment)

print('Max sentence length: ', max([len(segment) for segment in input_ids]))

print('Original: ', segments[0])
print('Token IDs:', input_ids[0])
