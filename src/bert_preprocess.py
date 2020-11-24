"""
@author: Tilman Kerl
@version: 2020.11.23
---
Prepare the given data to use it in the Trainer class (train.py):
tokenize the segments and encode them to an id, pad the padding_token_ids
to a fixed length, create the attention masks, split the data in training and
validation data, some small convertion functions:
train_valid_to_tensor, convert_labels_to_int
And finaly preparing training & test(validation) data and the
coresponding DataLoader.
"""

import torch
import numpy as np
import pandas as pd
from tqdm import tqdm
from sklearn.model_selection import train_test_split
from keras.preprocessing.sequence import pad_sequences
from torch.utils.data import TensorDataset, DataLoader, RandomSampler, SequentialSampler

from config import get_tokenizer, CLEANED_DATASET_FILE, LABEL_VALUES, BATCH_SIZE, MAX_LEN, TEST_SIZE

# data loading & parsing
data_frame = pd.read_csv(CLEANED_DATASET_FILE)
segments = data_frame.segment.values
LABELS = data_frame.sentiment.values

# getting BERT-tokenizer
tokenizer = get_tokenizer()


def tokenize_segments_to_id(
        to_be_tokenized_segments: np.ndarray) -> np.ndarray:
    """
	trokenize all of the sentences and map the tokens to thier word IDs.
	"""
    if not isinstance(to_be_tokenized_segments, np.ndarray):
        to_be_tokenized_segments = np.array(
                                to_be_tokenized_segments, dtype=object)
    input_ids = []
    print("Tokenizing segments...")
    for segment in tqdm(to_be_tokenized_segments):
        encoded_segment = tokenizer.encode(
            segment,
            add_special_tokens=True,  # Add '[CLS]' and '[SEP]'
        )

        input_ids.append(encoded_segment)
    return input_ids


def pad_token_ids(token_ids: list) -> list:
    """
	Pad input tokens with value 0 at the end of the sequence (post)
	"""
    print(f"Padding/truncating all sentences to {MAX_LEN} values...")
    print(
        f"Padding token: '{tokenizer.pad_token}', ID: {tokenizer.pad_token_id}"
    )
    token_ids = pad_sequences(token_ids,
                              maxlen=MAX_LEN,
                              dtype="long",
                              value=0,
                              truncating="post",
                              padding="post")
    return token_ids


def create_attention_masks(padding_token_ids: list) -> list:
    """
	Create attention masks
	"""
    attention_masks = []
    for sentence in padding_token_ids:
        # Create the attention mask.
        #   - If a token ID is 0, then it's padding, set the mask to 0.
        #   - If a token ID is > 0, then it's a real token, set the mask to 1.
        att_mask = [int(token_id > 0) for token_id in sentence]

        # Store the attention mask for this sentence.
        attention_masks.append(att_mask)

    return attention_masks


def train_valid_split(processed_ids):
    """
	Use 90% for training and 10% for validation
	"""
    return train_test_split(processed_ids,
                            LABELS,
                            random_state=2020,
                            test_size=TEST_SIZE)


def train_valid_to_tensor(all_train_valid_lists: list) -> torch.tensor:
    """
	Convert all inputs and labels into torch tensors
	"""
    for to_be_converted in all_train_valid_lists:
        yield torch.tensor(to_be_converted)


def convert_labels_to_int(label_list: list) -> list:
    """
	Convert an element from LABEL_VALUES to int
	"""
    return [LABEL_VALUES.index(el) for el in label_list]


input_ids = tokenize_segments_to_id(segments)
padding_token_ids = pad_token_ids(input_ids)
attention_masks = create_attention_masks(padding_token_ids)

#------------------------------------------------------------------------------#

# preparing training & test data
train_inputs, valid_inputs, train_labels, valid_labels = train_valid_split(
    padding_token_ids)
train_masks, valid_masks, _, _ = train_valid_split(attention_masks)

train_labels = convert_labels_to_int(train_labels)
valid_labels = convert_labels_to_int(valid_labels)

# Convert all inputs and labels into torch tensors,
# the required datatype for our model.
tensor_convert = train_valid_to_tensor([
    train_inputs, valid_inputs, train_labels, valid_labels, train_masks,
    valid_masks
])
train_inputs = next(tensor_convert)
valid_inputs = next(tensor_convert)
train_labels = next(tensor_convert)
valid_labels = next(tensor_convert)
train_masks = next(tensor_convert)
valid_masks = next(tensor_convert)

# Create the DataLoader for our training set.
train_data = TensorDataset(train_inputs, train_masks, train_labels)
train_sampler = RandomSampler(train_data)
train_dataloader = DataLoader(train_data,
                              sampler=train_sampler,
                              batch_size=BATCH_SIZE)

# Create the DataLoader for our valid set.
valid_data = TensorDataset(valid_inputs, valid_masks, valid_labels)
valid_sampler = SequentialSampler(valid_data)
valid_dataloader = DataLoader(valid_data,
                              sampler=valid_sampler,
                              batch_size=BATCH_SIZE)
