
import umap
import torch
import spacy
from spacy import displacy
import numpy as np
# import transformers
# import transformers.models.bert.modeling_bert
# import transformers.modeling_outputs
# import transformers.modeling_tf_outputs
# import transformers.modeling_tf_pytorch_utils
# import transformers.modeling_tf_utils
# import transformers.modeling_utils
# from transformers.modeling_bert import BertModel
import pandas as pd
import tensorflow as tf

# from allennlp.predictors.predictor import Predictor
# from allennlp.interpret.saliency_interpreters import SimpleGradient
# 
# from allennlp.data.vocabulary import Vocabulary
# 
# from allennlp.predictors.text_classifier import TextClassifierPredictor
# from allennlp.data.dataset_readers import TextClassificationJsonReader
# 
# from allennlp.models import Model

from predict import SentimentPredictor
from bert_preprocess import BertPreprocessor
from config import EMBEDDINGS_DATASET_FILE, get_tokenizer
from dist import Dist


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
        self.nlp = spacy.load('en_core_web_sm')        
        self.dist = Dist()
        self.bert_preprocesser = BertPreprocessor()

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
        
    def get_gradient(self, segement, context=""):
        """
        Return gradient of input (segement) wrt to model output span prediction
        Args:
            segement (str): text of input segement
            context (str): text of segement context/passage
            model (QA model): Hugging Face BERT model for QA transformers.modeling_tf_distilbert.TFDistilBertForQuestionAnswering, transformers.modeling_tf_bert.TFBertForQuestionAnswering
            tokenizer (tokenizer): transformers.tokenization_bert.BertTokenizerFast
        Returns:
             (tuple): (gradients, token_words, token_types, answer_text)
        """
        props = self.sent_pred.predict([segement], pretty=False)
        print(props)
    
        embedding_matrix = self.sent_pred.model.bert.embeddings.word_embeddings
        embedding_matrix = torch.tensor(embedding_matrix.weight, dtype=torch.long)
        # print(t)
        # print("#####")
        # print(dir(embedding_matrix.weight))
        # print("#####")
        # print(embedding_matrix.weight.size)
        # print("#####")
        encoded_tokens = self.tokenizer.encode_plus(segement, add_special_tokens=True, return_tensors="tf")
        # encoded_tokens = tokenizer.encode_plus(segement, context, add_special_tokens=True, return_tensors="tf")
        token_ids = list(encoded_tokens["input_ids"].numpy()[0])
        vocab_size = list(embedding_matrix.shape)[0]
    
        # convert token ids to one hot. We can't differentiate wrt to int token ids hence the need for one hot representation
        token_ids_tensor = tf.constant([token_ids], dtype='int32')
        token_ids_tensor_one_hot = tf.one_hot(token_ids_tensor, vocab_size)
    
    
        with tf.GradientTape(watch_accessed_variables=False) as tape:
            # (i) watch input variable
            tape.watch(token_ids_tensor_one_hot)
    
            # multiply input model embedding matrix; allows us do backprop wrt one hot input
            inputs_embeds = tf.matmul(token_ids_tensor_one_hot,embedding_matrix)
    
            print(inputs_embeds)
            print(type(inputs_embeds))
            print(dir(inputs_embeds))
    
            # (ii) get prediction
            props = self.sent_pred.predict([segement], pretty=False)
            props = torch.tensor(props)
            tf.cast(props, dtype=tf.float16)
            # answer_start, answer_end = get_best_start_end_position(start_scores, end_scores)
            # 
            # start_output_mask = get_correct_span_mask(answer_start, len(token_ids))
            # end_output_mask = get_correct_span_mask(answer_end, len(token_ids))
            # 
            # # zero out all predictions outside of the correct span positions; we want to get gradients wrt to just these positions
            # predict_correct_start_token = tf.reduce_sum(start_scores * start_output_mask)
            # predict_correct_end_token = tf.reduce_sum(end_scores * end_output_mask)
    
            # (iii) get gradient of input with respect to both start and end output
            gradient_non_normalized = tf.norm(
                tape.gradient(props, token_ids_tensor_one_hot),axis=2)
    
            # (iv) normalize gradient scores and return them as "explanations"
            gradient_tensor = (
                gradient_non_normalized /
                tf.reduce_max(gradient_non_normalized)
            )
            gradients = gradient_tensor[0].numpy().tolist()
    
            token_words = self.tokenizer.convert_ids_to_tokens(token_ids)
            token_types = list(encoded_tokens["token_type_ids"].numpy()[0])
            answer_text = self.tokenizer.convert_tokens_to_string(token_ids[answer_start:answer_end])
    
            return  gradients,  token_words, token_types,answer_text

    def sal(self, sent):
        grad = ""
        
        # predictor = Predictor.from_path("https://storage.googleapis.com/allennlp-public-models/ner-elmo.2021-02-12.tar.gz")
        # grad = SimpleGradient(self.sent_pred).saliency_interpret_from_json(sent)        
        # grad = SimpleGradient(predictor).saliency_interpret_from_json(sent)
        return grad

interface = Interface()
# m = int.sent_pred.model
# print(type(m))
test_sent = "my name is ben and this is jack ass"
# test_sent2 = {"sentence": "This shirt was bought at Grandpa Joes in downtown Deep Learning"}

# embs = int.get_embeddings(test_sent)
# av = np.average(embs)
# print(av)
# print(f"{embs=}")
#
# trans_embs = int.make2D(embs)
# print(f"{trans_embs=}")

# grad = int.sal(test_sent2)

grad, tw, tt, at = interface.get_gradient(test_sent)
print(grad)
# 
# int.get_sentiment(test_sent)
# s = int.get_similar_sents(id=13, n=5, return_sents=True)
# print(s)


# class ModelWrapper(Model):
#     def __init__(self, vocab, your_model):
#         super().__init__(vocab)
#         self.your_model = int.sent_pred.model
#         self.logits_to_probs = torch.nn.Softmax()
#         self.loss = torch.nn.CrossEntropyLoss()
# 
#     def forward(self, tokens, label=None):
#         if label is not None:
#             outputs = self.your_model(tokens, label=label)
#         else:
#             outputs = self.your_model(tokens)
#         probs = self.logits_to_probs(outputs["logits"])
#         if label is not None:
#             loss = self.loss(outputs["logits"], label)
#             outputs["loss"] = loss
#         outputs["probs"] = probs
#         return outputs
# 
# class PredictorWrapper(TextClassifierPredictor):
#     def get_interpretable_layer(self):
#         return self._model.model.bert.embeddings.word_embeddings # This is the initial layer for huggingface's `bert-base-uncased`; change according to your custom model.
# 
#     def get_interpretable_text_field_embedder(self):
#         return self._model.model.bert.embeddings.word_embeddings
# 
# predictor = PredictorWrapper(model=ModelWrapper(["they", "are", "yo"], int.sent_pred.model),
#                              dataset_reader=TextClassificationJsonReader())
# 
# grad = SimpleGradient(predictor).saliency_interpret_from_json(test_sent2)
# print(grad)