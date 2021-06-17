"""
@author: Tilman Kerl
@version: 2020.18.05
---
Contains everything the app needs // 
is the interface to all backend-functionality
"""


import math
import umap
import torch
import numba
import pickle
import numpy as np
import pandas as pd
from tqdm import tqdm

import spacy
from spacy import displacy

from predict import SentimentPredictor
from bert_preprocess import BertPreprocessor
from config import (
    EMBEDDINGS_DATASET_FILE, 
    DATA_DIR,
    LABEL_VALUES, 
    get_tokenizer
)
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
        self.load_reducer()
        
    def load_reducer(self):
        with open(f"{DATA_DIR}/reducer.pk", "rb") as file:
            self.reducer = pickle.load(file)
        with open(f"{DATA_DIR}/reducer_embs.pk", "rb") as file:
            reducer_embs = pickle.load(file)
        reducer_embs_ready = numba.typed.List([np.array(rel) for rel in np.array(reducer_embs)])
        self.reducer.embeddings_ = reducer_embs_ready

    def get_embeddings(self, segment):
        input_ids = self.bert_preprocesser.tokenize_segments_to_id([segment])        
        input_ids = torch.tensor(input_ids)#.unsqueeze(0)

        # input_ids = torch.tensor(self.tokenizer.encode(segment)).unsqueeze(0) # Batch size 1
        print(input_ids)
        outputs = self.sent_pred.model(input_ids, output_hidden_states=True)        
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
        """
        csv_string = "token_x,token_y,value\n"
        tokens = self.get_tokens(segment)        
        for y, row in enumerate(attention_list):
            for x, col in enumerate(row):
                try:
                    token_y = tokens[int(y)]
                    token_x = tokens[int(x)]
                    if token_x == ",":
                        token_x = "COMMA"
                    if token_y == ",":
                        token_y = "COMMA"
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
        print(len(sentences))
        if not dict:
            sentences = [self.nlp(s) for s in sentences]
        else:
            sentences = [self.nlp(s["segment"]) for s in sentences]
        html = displacy.render(sentences, style="ent", minify=False)
        html = "</div><hr>".join(html.split("</div>"))
        return html
        
    def update_UMAP(self, vecs):
        # vecs = np.array([list_of_embeddings])
        print(vecs)
        # vecs = np.array(vecs)
        reducer_embs = self.reducer.embeddings_
        relation_dict_up = {i:i for i in range(sum(map(len, reducer_embs))+len(vecs)-len(reducer_embs[0]))}
        self.reducer.update(vecs, relations = relation_dict_up)
        return list(list(self.reducer.embeddings_)[-1])
        
    def get_entities_for_tokens(self, res):
        for r in res:
            ents = self._get_entity_token_mapping(r["segment"], r["tokens"])
            r["entities"] = ents
        return res
        
    def _fix_bert_tokens(self, bt):
        return list(map(lambda el: el[0:-1], str(bt).replace("', '##", "")[2:-1].split(", '")))
        
    def _get_entity_token_mapping(self, sentence, bert_tokens):
        doc = self.nlp(sentence)
        entity_list = [el.ent_type_ for el in doc]
        spacy_tokens = list(doc)
        
        bert_tokens = bert_tokens[1:-1]
        new_entity_list = [] # [CLS]
        
        bert_tokens = self._fix_bert_tokens(bert_tokens)
        
        e = 0
        for i, token in enumerate(spacy_tokens):    
            if token.text.lower() == bert_tokens[e]:
                new_entity_list.append(entity_list[i])
                e += 1
                continue
                    
            length_of_spacy_token = len(token.text)
            count_string = ""
            while len(count_string) < length_of_spacy_token:
                new_entity_list.append(entity_list[i])
                count_string += bert_tokens[e]
                e += 1
                
        new_entity_list.append("") # [SEP]
        return new_entity_list
        
    def get_mean(self, attention_list):
        return [sum(x)/len(x) for x in zip(*attention_list)]
        
    def get_deRose_attention(self, segment):                
        # To calculate the influence for a token w at the last layer L, the
        # number of heads is counted, which are used to get to the [CLS] token
        # (c_L (w, [CLS])). 
        # For the previous layer L − 1 holds, with c_{L−1} (w, w ′ )
        # is the number of heads used from w to w ′ :
        
        # wie viele heads attended CLS? mit a > 0.5        
        
        tokens = self.get_tokens(segment)
        
        def c(l, w):
            attention_for_l = [self.get_attention_for_segment(segment, layer=l-1, head=head) for head in range(12)]
            count = 0
            # w_L = [self.get_attention_for_segment(segment, layer=11, head=head) for head in range(12)]
            for head in attention_for_l:
                # from w to w' 
                w_index = tokens.index(w)       
                num = list(filter(lambda x: x > 0.65, head[w_index]))
                if num:
                    count += 1                          
            return count
    
        def infl(w, l=1):
            last_layer = 12
            summe = sum([math.pow(0.5, (last_layer-li))*c(li, w) for li in range(1, last_layer+1)])
            score = 1/(last_layer-l+1) * summe
            if score > 5:
                return 5
        
        infl_toks = [infl(tok) for tok in tokens]        
        # print(infl_toks)
        # infl_toks_transformed = list(map(lambda val: np.interp(val,[min(infl_toks),max(infl_toks)],[0,1]), infl_toks))
        # print(infl_toks_transformed)
        return infl_toks
        

    def get_mean_attention_for_layer(self, segment, layer):
        # print(self.get_attention_for_segment(segment, layer=11, head=0))
        # print("####################")
        # print(self.get_attention_for_segment(segment, layer=11, head=1))
        at = [self.get_attention_for_segment(segment, layer=layer, head=head) for head in range(12)]
        attention_list = self.get_mean([self.get_mean(self.get_attention_for_segment(segment, layer=layer, head=head)) for head in range(12)])        
        attention_list = list(map(float, attention_list))
        # attention_list = list(map(lambda x: sum(x)/len(x),zip(*attention_list)))
        # print(len(attention_list))
        # with open ("debug.txt", "w") as df:
        #     df.write(str(attention_list))
        # print(attention_list)'
        return attention_list
        
    def get_tokens(self, segment):
        input_ids = self.tokenizer.encode(segment)
        tokenized_text = self.tokenizer.convert_ids_to_tokens(input_ids)
        return tokenized_text

    def get_text_by_id(self, id):
        return list(self.search(seg_id=id)["segment"])[0]

    def get_similar_sents(self, id=0, n=5, return_sents=False):
        print(id)
        dists = self.dist.get_similar_sents_for(id=id, n=n, return_sents=return_sents)        
        return dists

    def search(self, seg_id=None, q=None):
        if seg_id:
            return self.dist.df.query(f"id == {seg_id}")
        if q == "=all":
            return self.dist.df
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
        combis = ["".join(char_split[0:i]) for char_split in f_splits for i in range(1, len(char_split))][1:]
        f_splits.append(combis)        
        f_splits = [x for char_split in f_splits for x in char_split if x != segment]
        return f_splits

    def pred_split(self, splits):
        preds = []
        if not splits:
            return False
        for e, split in enumerate(splits):
            props = self.sent_pred.predict([split], pretty=False)
            preds.append({
                "segment": split,
                "sentiment": self.sent_pred._prettify_probabilities(props, shorten=False)[0],
                "props": props,
                "embeddings": np.array(self.get_embeddings(split)),
                "tokens": self.get_tokens(split),
                "new": True,
                "id": len(self.dist.df)+e,
                "deRoseAttention": [],
                # "truth_label": ""
            })
            
        embs = list(map(lambda x: x["embeddings"], preds))
        while len(embs) < 4:
            embs.append(embs[0])
        embs = np.array(embs)
        trans_embs = self.update_UMAP(embs)
        for i, pr in enumerate(preds):
            pr.update({
                "x": float(trans_embs[i][0]),
                "y": float(trans_embs[i][1]),
            })
            pr["embeddings"] = list(map(float, list(pr["embeddings"])))
            pr["props"] = list(map(float, list(pr["props"])))
            self.dist.update_df(pr)
            
        return preds
        
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
        
        
# interface = Interface()
# 
# sents = [
#     {
#         "sent": "The government could have done more to prevent this from happening",
#         "label": 2,
#     },
#     {
#         "sent": "They did great",
#         "label": 0
#     }
# ]
# 
# import time
# 
# t1 = time.time()
# rose_1 = interface.get_deRose_attention(sents[0]["sent"])
# # rose_2 = interface.get_deRose_attention(sents[1]["sent"])
# print(f"{rose_1=}")
# print(time.time()-t1)
# print(f"{rose_2=}")

# interface.dist.df["deRoseAttention"] = list(range(len(interface.dist.df)))
# deRoseAttentions = []
# for index, row in tqdm(interface.dist.df.iterrows(), total=len(interface.dist.df)):
#     seg = str(row.segment)
#     # print(seg)
#     try:
#         dr_att = interface.get_deRose_attention(seg)
#     except Exception as e:
#         print(e)
#         dr_att = []
#     deRoseAttentions.append(dr_att)
    
# interface.dist.df["deRoseAttention"] = deRoseAttentions
# interface.dist.df.to_csv(NEW_EMBS_FILE, index=False)

# sents = ["The government is negative", "They did great to fail"]
# scores = interface.get_gradient_scores([sents[0]["sent"], sents[1]["sent"]])
# print(f"{scores=}")
# 
# for sc in scores:    
#     print("--------------------")
#     print(sc[0])
#     print(sc[1])
