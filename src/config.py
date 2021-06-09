"""
@author: Tilman Kerl
@version: 2020.11.23
---
specifying constants and som general config
"""
import os
import copy
import datetime
import pandas as pd
import torch.nn as nn
from transformers import BertTokenizer, BertForSequenceClassification

# GENERAL CONSTANTS
# setiment string values
LABEL_VALUES = ["positive", "neutral", "negative"]

# recommended size is 16 or 32
BATCH_SIZE = 32

# Set the maximum sequence length;
# 153 is max length of all sentences
MAX_LEN = 195

# SETTING TEST SIZE TO 10%
TEST_SIZE = 0.1

# FILE CONSTANTS
WORKING_DIR = os.getcwd()
BASE_DIR = WORKING_DIR
if "src" in WORKING_DIR:
    BASE_DIR = WORKING_DIR.split("/src")[0]
DATA_DIR = BASE_DIR + "/data"
MODEL_DIR = BASE_DIR + "/model"

DATASET_FILENAME = "hand_coded_text_segments.csv"
DATASET_FILE = f"{DATA_DIR}/{DATASET_FILENAME}"

CLEANED_DATASET_FILENAME = "text_segments_cleaned.csv"
CLEANED_DATASET_FILE = f"{DATA_DIR}/{CLEANED_DATASET_FILENAME}"

CLEANED_PROCESSED_DATASET_FILENAME = "text_segments_cleaned_processed.csv"
CLEANED_PROCESSED_DATASET_FILE = \
                    f"{DATA_DIR}/{CLEANED_PROCESSED_DATASET_FILENAME}"

# to be added
EVALUATE_DATASET_FILENAME = "evaluate_text_segments_cleaned.csv"
EVALUATE_DATASET_FILE = f"{DATA_DIR}/{EVALUATE_DATASET_FILENAME}"

EMBEDDINGS_DATASET_FILENAME = "embeddings_text_segments.csv"
EMBEDDINGS_DATASET_FILE = f"{DATA_DIR}/{EMBEDDINGS_DATASET_FILENAME}"

# CLUSTER_DATASET_FILENAME = "cluster_segments.csv"
# CLUSTER_DATASET_FILENAME = "projection_with_full_sents.csv"
CLUSTER_DATASET_FILENAME = "projection_with_full_sents_SENT_PROPS.csv"
CLUSTER_DATASET_FILE = f"{DATA_DIR}/{CLUSTER_DATASET_FILENAME}"

NEW_EMBS_FILENAME = "data_copy.csv"
NEW_EMBS_FILE = f"{DATA_DIR}/{NEW_EMBS_FILENAME}"

NEW_DATA_FILENAME = "new_training_data.csv"
NEW_DATA_FILE = f"{DATA_DIR}/{NEW_DATA_FILENAME}"

def get_model_filename():
    """
    use current date as verison for possible multiple different models
    """
    model_version = datetime.datetime.now().strftime("%d-%m-%Y_%H-%M")
    return f"fine-tuned-model_{model_version}.pt"


def get_model_path():
    """
    use a function in order to set the version-time to the time of
    finished execution of training
    """
    return f"{MODEL_DIR}/{get_model_filename()}"


# TESTING DATA
test_df = pd.read_csv(DATASET_FILE)


# BERT PREPROCESSING
def get_tokenizer():
    """
	Getting BERT-Tokenizer:
	BERT-Base, Uncased: 12-layer, 768-hidden, 12-heads, 110M parameters
	"""
    print("Downloading BERT-Tokenizer...")
    return BertTokenizer.from_pretrained('bert-base-uncased',
                                         do_lower_case=True)


def drop_layers_for_model(model, layer_i_list):
    """
    remove all layers in layer_i_list:
    see https://github.com/huggingface/transformers/issues/2483
    """
    oldModuleList = model.bert.encoder.layer
    newModuleList = nn.ModuleList()

    # Now iterate over all layers, only keepign only the relevant layers.
    for i in range(0, 12):
        if not i in layer_i_list:
            print(f"adding layer: {i}")
            newModuleList.append(oldModuleList[i])
        else:
            print(f"Dropping layer: {i}")

    # create a copy of the model, modify it with the new list, and return
    copyOfModel = copy.deepcopy(model)
    copyOfModel.bert.encoder.layer = newModuleList

    return copyOfModel



def load_bert(drop_layers=False):
    """
	Load BertForSequenceClassification, the pretrained BERT model with a single
	linear classification layer on top.
	Using the 12-layer BERT model, with an uncased vocab -> see tokenizer
	"""
    print("Loading BERT Model for sequence classification")
    model = BertForSequenceClassification.from_pretrained(
        "bert-base-uncased",
        # The number of output labels = 3:
        # positive, neutral, negative
        num_labels=3,
        output_attentions=True,  # return attentions weights?
        output_hidden_states=True,  # return all hidden-states?
    )
    print(drop_layers)
    if drop_layers:
        print("hhhh")
        model = drop_layers_for_model(model, drop_layers)
    return model
