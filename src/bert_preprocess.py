"""
@author: Tilman Kerl
@version: 2020.11.19
---
Description of bert_preprocess.py
"""

import pandas as pd
from tqdm import tqdm
from transformers import BertTokenizer
from keras.preprocessing.sequence import pad_sequences

from config import CLEANED_DATASET_FILE

data_frame = pd.read_csv(CLEANED_DATASET_FILE)

segments = data_frame.segment.values
labels = data_frame.sentiment.values

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

# Set the maximum sequence length.
# I've chosen 64 somewhat arbitrarily. It's slightly larger than the
# maximum training sentence length of 153...
MAX_LEN = 180

print(f"Padding/truncating all sentences to {MAX_LEN} values...")
print(f"Padding token: '{tokenizer.pad_token}', ID: {tokenizer.pad_token_id}")

# Pad our input tokens with value 0.
# "post" indicates that we want to pad and truncate at the end of the sequence,
# as opposed to the beginning.
input_ids = pad_sequences(input_ids,
                          maxlen=MAX_LEN,
                          dtype="long",
                          value=0,
                          truncating="post",
                          padding="post")
print('Done.')

# Create attention masks
attention_masks = []
# For each sentence...
for sentence in input_ids:

    # Create the attention mask.
    #   - If a token ID is 0, then it's padding, set the mask to 0.
    #   - If a token ID is > 0, then it's a real token, set the mask to 1.
    att_mask = [int(token_id > 0) for token_id in sentence]

    # Store the attention mask for this sentence.
    attention_masks.append(att_mask)
