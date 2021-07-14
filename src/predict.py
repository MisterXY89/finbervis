"""
@author: Tilman Kerl
@version: 2021.05.18
---
Use the fine-tunded model to predict sentiment of segments
"""

import os
import glob
import torch
import numpy as np
import torch.nn.functional as F
from torch.utils.data import (
    DataLoader,
    SequentialSampler,
    TensorDataset
)

from .bert_preprocess import BertPreprocessor
from .config import (
    load_bert,
    BATCH_SIZE,
    LABEL_VALUES,
    MODEL_DIR
)    


class SentimentPredictor:
    """
    Interface for interacting with the fine-tunded model
    """
    def __init__(self):
        """
        set device, init BertPreprocessor and get latest model
        """
        self.device = torch.device("cpu")
        self.bp = BertPreprocessor()
        self.latest_model_filename = self._get_latest_model_filename()
        # init model for fallback
        self.model = None

    def _get_latest_model_filename(self):
        """
        get the latest file with an .pt ending
        """
        list_of_files = glob.glob(f"{MODEL_DIR}/*.pt")
        return max(list_of_files, key=os.path.getctime)

    def load_model(self):
        """
        load the latest model for later usage
        """
        print("Loading model...")
        # print(self.latest_model_filename)
        # self.latest_model_filename
        # state_dict = torch.load(f"{MODEL_DIR}/pytorch_model.bin")
        # self.model = load_bert()
        # self.model.load_state_dict(state_dict)
        # self.model.from_pretrained(f"{MODEL_DIR}/pytorch_model.bin")        
        # self.model = torch.load(self.latest_model_filename)        
        self.model = torch.load(f"{MODEL_DIR}/fine-tuned-model_drop_layer_8.pt", map_location=torch.device('cpu'))
        # self.model = torch.load(f"{MODEL_DIR}/fine-tuned-model_08-04-2021_23-42.pt")
        # self.model.eval()

    def _prettify_probabilities(self,
                                probabilities: list,
                                shorten=False) -> list:
        """
        get the index with the highest prob and return corresponding label
        """
        print(probabilities)
        print(type(probabilities))
        if isinstance(probabilities, list):
            probabilities = probabilities[0]
        cut_index = len(LABEL_VALUES[np.argmax(LABEL_VALUES)])
        if shorten:
            cut_index = 3
        return [
            LABEL_VALUES[probabilities.argmax()][:cut_index]
            # for prob_list in probabilities
        ]

    def _get_probabilies(self, dataloader):
        """
        Perform a forward pass on the trained BERT model to predict
        probabilities on the set.
        The probabilities for one element come as a 3-list where
        the index of the probability-list corresponds to the index of
        the label of the
        LABEL_VALUES = ["positive", "neutral", "negative"]
        """
        # Put the model into the evaluation mode,
        # the dropout layers are disabled.
        self.model.eval()

        all_logits = []
        predictions , true_labels = [], []
        # For each batch in our test set...
        for batch in dataloader:
            # Load batch to device(CPU)
            b_input_ids, b_attn_mask = tuple(t.to(self.device)
                                             for t in batch)[:2]

            # Compute logits
            with torch.no_grad():
                logits = self.model(b_input_ids, b_attn_mask)
            all_logits.append(logits)
            
        
        all_logits = all_logits[0]
        all_logits = all_logits.logits

        
        #>> logits.detach().cpu().numpy()
        
        # Concatenate logits from each batch
        all_logits = torch.cat(tuple(all_logits), dim=0)

        # Apply softmax to calculate probabilities
        probs = F.softmax(all_logits, dim=0).cpu().numpy()

        return probs

    def _make_predictable(self, segment_list: list) -> DataLoader:
        """
        takes list of segments and returns a dataloader which has to be
        used for the predict function
        """
        # from bert_preprocess
        _, padding_token_ids, attention_masks = self.bp.preprocess(
            slim=True, segments=segment_list)

        data = TensorDataset(torch.tensor(padding_token_ids),
                             torch.tensor(attention_masks))

        return DataLoader(data,
                          sampler=SequentialSampler(data),
                          batch_size=BATCH_SIZE)

    def predict(self, segment_list: list, pretty=True, shorten=False) -> list:
        """
        predict the sentiment of each element in segment_list
        pretty prints by default.
        shorten does only effect the output if pretty=True
        """
        dataloader = self._make_predictable(segment_list)
        if self.model is None:
            self.load_model()
        probabilities = self._get_probabilies(dataloader)        
        if pretty:
            return self._prettify_probabilities(probabilities, shorten=shorten)
        return probabilities


# positive -> positive
SENTENCE_1 = "Surgical strike by the Indian government was openly supported by all the political parties."
# positive -> positive
SENTENCE_2 = "Considering The threat of terrorism, it was a very practical decision by the Government."
# negative -> neutral
SENTENCE_3 = "Limited funding is no excuse for this solution, which is not applicable at all."
# negative -> negative
SENTENCE_4 = "However, there was limited funding at the design stage which reduced opportunities for stakeholder consultation and involvement."
# negative -> negative
SENTENCE_5 = "The government could have done more to prevent this from happening."
# negative -> neutral
SENTENCE_5a = "The government could have done more."

test_segments = [
    SENTENCE_1,
    SENTENCE_2,
    SENTENCE_3,
    SENTENCE_4,
    SENTENCE_5,
    SENTENCE_5a
]


sent_pred = SentimentPredictor()
sent_pred.load_model()
predictions = sent_pred.predict([SENTENCE_5a], pretty=True, shorten=False)
# predictions = sent_pred.predict([test_segments[0]], pretty=True, shorten=False)
# 
print(predictions)
# print(sent_pred._prettify_probabilities([predictions]))
