
import umap
import torch
import numpy as np
import pandas as pd

import spacy
from spacy import displacy

from predict import SentimentPredictor
from bert_preprocess import BertPreprocessor
from config import EMBEDDINGS_DATASET_FILE, get_tokenizer, LABEL_VALUES
from dist import Dist

from saliency_calc import SaliencyCalculator


class Interface:
    """
    contains all methods for the flask app,
    if not provied via other classes
    """

    def __init__(self):
        self.__name__ = "Interface"
        self.sent_pred = SentimentPredictor()
        self.sent_pred.load_model()
        self.bert_preprocesser = self.sent_pred.bp
        self.tokenizer = self.bert_preprocesser.tokenizer
        self.nlp = spacy.load('en_core_web_sm')        
        self.dist = Dist()
        self.sal_calc = SaliencyCalculator(self.tokenizer, self.sent_pred.model)
            

    def get_embeddings(self, segment):
        input_ids = self.bert_preprocesser.tokenize_segments_to_id([segment])
        # segments_ids = [1]*len(input_ids)
        # segments_tensors = torch.tensor([segments_ids])
        # print(input_ids)
        input_ids = torch.tensor(input_ids)#.unsqueeze(0)

        # input_ids = torch.tensor(self.tokenizer.encode(segment)).unsqueeze(0) # Batch size 1
        print(input_ids)

        outputs = self.sent_pred.model(input_ids, output_hidden_states=True)
        # 'attentions', 'clear', 'copy', 'fromkeys', 'get', 'hidden_states', 'items',
        # 'keys', 'logits', 'loss', 'move_to_end', 'pop', 'popitem', 'setdefault', 'to_tuple', 'update', 'values'
        # print(outputs)
        # layer, layer 11 (0 = initial )
        # print(outputs[1][0])
        # hs = outputs["hidden_states"]
        # 0 = embeddings
        # one for the output of the embeddings + one for the output of each layer
        # layer 11 = index 11
        # Hidde n-states of the model at the output of each layer plus the initial embedding outputs.
        outputs = outputs[1][11][0]
        cls_embedding = outputs[0]
        print(len(cls_embedding))
        return cls_embedding.detach().numpy()

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
        """
        TODO: check for error
        (2.4943597316741943,
         4.123290061950684)
        """
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

    def get_ents_vis(self, sentences, dict=True):
        print(sentences[0])
        print(sentences[0]["segment"])
        print(sentences[0].keys())
        sentences = [self.nlp(s["segment"]) for s in sentences]
        html = displacy.render(sentences, style="ent", minify=False) #page=True)
        html = "</div><hr>".join(html.split("</div>"))
        return html

    def get_mean(self, attention_list):
        return [sum(x)/len(x) for x in zip(*attention_list)]

    def get_mean_attention_for_layer(self, segment, layer):
        # print(self.get_attention_for_segment(segment, layer=11, head=0))
        # print("####################")
        # print(self.get_attention_for_segment(segment, layer=11, head=1))
        at = [self.get_attention_for_segment(segment, layer=layer, head=head) for head in range(12)]
        attention_list = self.get_mean([self.get_mean(self.get_attention_for_segment(segment, layer=layer, head=head)) for head in range(12)])        
        # attention_list = list(map(lambda x: sum(x)/len(x),zip(*attention_list)))
        # print(len(attention_list))
        # with open ("debug.txt", "w") as df:
        #     df.write(str(attention_list))
        # print(attention_list)'
        return attention_list

    def get_text_by_id(self, id):
        return list(self.search(seg_id=id)["segment"])[0]

    def get_similar_sents(self, id=0, n=5, return_sents=False):
        print(id)
        dists = self.dist.get_similar_sents_for(id=id, n=n, return_sents=return_sents)
        if return_sents:
            for d in dists:
                # index 10 for layer 11
                # attention_list = [self.get_attention_for_segment(d["segment"], layer=10, head=head) for head in range(12)]
                # attention_list
                d["attention"] = self.get_mean_attention_for_layer(d["segment"], 10)
                d["segment"] = f"[CLS] {d['segment']} [SEP]"
        return dists

    def search(self, seg_id=None, q=None):
        if seg_id:
            return self.dist.df.query(f"id == {seg_id}")
        if q[-1] == " ":
            q = q[0:-1]
        return self.dist.df[self.dist.df['segment'].str.contains(q)]

    def get_splits(self, seg_id):
        segment = list(self.search(seg_id = seg_id).segment)[0]
        splits = []
        split_chars = [",", ";", ":", "-"]
        for sc in split_chars:
        	splits.append(segment.split(sc))
        f_splits = list(filter(lambda el: el, splits))
        # f_splits = f_splits[0] if len(f_splits) == 1 else f_splits
        flattened = [val for sublist in f_splits for val in sublist]
        return flattened

    def _prep_return(self, segment):
        props = self.sent_pred.predict([segment], pretty=False)
        print(props)
        prediction_label = self.sent_pred._prettify_probabilities(props, shorten=False)[0]
        embs = list(self.get_embeddings(segment))
        print(f"{embs=}")
        trans_embs = self.make2D(embs)
        x = float(trans_embs[0].view())
        y = float(trans_embs[1].view())
        dict = {
            "embeddings": list(map(lambda x: float(x.view()), list(embs))),
            "x": x,
            "y": y,
            "sentiment": prediction_label,
    		"segment": segment,
    		"new": True,
    		"id": len(self.dist.df.index),
    		"props": props
    	}
        self.dist.update_df({
    		"segment": segment,
    		"sentiment": prediction_label,
    		"embeddings": embs,
    		"cluster": None,
    		"x": x,
    		"y": y,
    		"id": len(self.dist.df.index),
    		"props": props
        })
        print(dict)
        return dict
        
    def get_gradient_scores(self, sentences):
        sentences_data = []
        for sent in sentences:
            pred_label = self.get_sentiment(sent)[0]
            label = LABEL_VALUES.index(pred_label)            
            sentences_data.append({
                "sent": sent,
                "label": label
            })
        output = self.sal_calc.get_scores(sentences_data)
        print(output)
        return output
        
        
interface = Interface()

# sents = [
#     {
#         "sent": "The government could have done more",
#         "label": 2,
#     },
#     {
#         "sent": "They did great",
#         "label": 0
#     }
# ]

sents = ["The government is negative", "They did great to fail"]
scores = interface.get_gradient_scores(sents)

for sc in scores:    
    print("--------------------")
    print(sc[0])
    print(sc[1])
