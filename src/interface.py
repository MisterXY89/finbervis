
import umap
import torch
import spacy
import numpy as np
import pandas as pd

from .predict import SentimentPredictor
from .bert_preprocess import get_tokenizer
from .config import EMBEDDINGS_DATASET_FILE


class Interface:
    """
    contains all methods for the flask app,
    if not provied via other classes
    """

    def __init__(self):
        self.__name__ = "Interface"
        self.sent_pred = SentimentPredictor()
        self.sent_pred.load_model()
        self.tokenizer = get_tokenizer()
        self.nlp = spacy.load('en')


    def get_embeddings(self, segment):
        input_ids = torch.tensor(self.tokenizer.encode(segment)).unsqueeze(0)  # Batch size 1
        outputs = self.sent_pred.model(input_ids)
        hs = outputs[0]
        embedding_arr = hs.detach().numpy()[0]
        return embedding_arr

    def get_sentiment(self, segment):
        return self.sent_pred.predict([segment])

    def make2D(self, new_embeddings):
        data = pd.read_csv(EMBEDDINGS_DATASET_FILE)
        embs_list = list(data["embeddings"].apply(lambda r: list(filter(lambda x: len(x) > 1, r[:-1][1:].split(" ")))))
        embs_vecs = np.empty((0, 3), float)
        for em_l in embs_list:
            embs_vecs = np.append(embs_vecs, np.array([em_l]), axis=0)

        g_embs = umap.UMAP().fit_transform(embs_vecs)
        print(type(g_embs))
        return g_embs[len(g_embs)-1]

    def prep_for_d3_plot(self, attention_list, segment):
        csv_string = "token_x,token_y,value\n"
        doc = self.nlp(segment)
        tokens = ["[CLS]"] + [token.text for token in doc] + ["[SEP]"]
        print(tokens)
        for y, row in enumerate(attention_list):
            for x, col in enumerate(row):
                try:
                    token_y = tokens[int(y)]
                    token_x = tokens[int(x)]
                    csv_string += f"{token_x},{token_y},{float(attention_list[y][x])}\n"
                except:
                    print("ERROR:")
                    print(f"{tokens=}")
                    print(f"{row=}")
                    print(f"{col=}")
                    print(f"{y=}")
                    print(f"{x=}")
                    continue

        return csv_string

    def get_attention_for_segment(self, segment, layer, head):
        input_ids = torch.tensor(self.tokenizer.encode(segment)).unsqueeze(0)
        outputs = self.sent_pred.model(input_ids, return_dict=True, output_attentions=True)
        attentions = outputs["attentions"][layer] # index indicates layer
        attentions = attentions.detach().numpy()
        return attentions[0][head].tolist()


# int = Interface()
# test_sent = "My name is tilman and why does this not work the way I want it to"
#
# embs = int.get_embeddings(test_sent)
# print(f"{embs=}")
#
# trans_embs = int.make2D(embs)
# print(f"{trans_embs=}")
