"""
see https://github.com/pytorch/captum/issues/150
and https://github.com/pytorch/captum/blob/master/tutorials/Bert_SQUAD_Interpret.ipynb

"""

import numpy as np

import torch
import torch.nn as nn
import torch.nn.functional as F

from transformers import BertTokenizer
from transformers import BertForSequenceClassification, BertConfig

from captum.attr import IntegratedGradients
from captum.attr import InterpretableEmbeddingBase, TokenReferenceBase
from captum.attr import visualization
from captum.attr import configure_interpretable_embedding_layer, remove_interpretable_embedding_layer


class SaliencyCalculator:
    """
    organiser class
    """

    def __init__(self, tokenizer, model):
        self.tokenizer = tokenizer
        self.model = model
        self.model_wrapper = BertModelWrapper(self.model)
        self.ig = IntegratedGradients(self.model_wrapper)

        # accumalate couple samples in this array for visualization purposes
        self.vis_data_records_ig = []
        
    def get_scores(self, sentences):
        self.vis_data_records_ig = []
        for s_data in sentences:
            label = s_data["label"]
            sent = s_data["sent"]
            interpret_sentence(self.model_wrapper, self.ig, self.tokenizer, sent, self.vis_data_records_ig, label=label)
            # v = visualization.visualize_text(self.vis_data_records_ig)
            
        # sm = lambda wa: F.softmax(torch.tensor(wa), dim=0).cpu().numpy()
        return list(map(lambda rec: (rec.word_attributions.tolist(), rec.raw_input), self.vis_data_records_ig))



def compute_bert_outputs(model_bert, embedding_output, attention_mask=None, head_mask=None):
    if attention_mask is None:
        attention_mask = torch.ones(embedding_output.shape[0], embedding_output.shape[1]).to(embedding_output)

    extended_attention_mask = attention_mask.unsqueeze(1).unsqueeze(2)

    extended_attention_mask = extended_attention_mask.to(dtype=next(model_bert.parameters()).dtype) # fp16 compatibility
    extended_attention_mask = (1.0 - extended_attention_mask) * -10000.0

    if head_mask is not None:
        if head_mask.dim() == 1:
            head_mask = head_mask.unsqueeze(0).unsqueeze(0).unsqueeze(-1).unsqueeze(-1)
            head_mask = head_mask.expand(model_bert.config.num_hidden_layers, -1, -1, -1, -1)
        elif head_mask.dim() == 2:
            head_mask = head_mask.unsqueeze(1).unsqueeze(-1).unsqueeze(-1)  # We can specify head_mask for each layer
        head_mask = head_mask.to(dtype=next(model_bert.parameters()).dtype) # switch to fload if need + fp16 compatibility
    else:
        head_mask = [None] * model_bert.config.num_hidden_layers

    encoder_outputs = model_bert.encoder(embedding_output,
                                         extended_attention_mask,
                                         head_mask=head_mask)
    sequence_output = encoder_outputs[0]
    pooled_output = model_bert.pooler(sequence_output)
    outputs = (sequence_output, pooled_output,) + encoder_outputs[1:]  # add hidden_states and attentions if they are here
    return outputs  # sequence_output, pooled_output, (hidden_states), (attentions)    


class BertModelWrapper(nn.Module):
    
    def __init__(self, model):
        super(BertModelWrapper, self).__init__()
        self.model = model
        
    def forward(self, embeddings):        
        outputs = compute_bert_outputs(self.model.bert, embeddings)
        pooled_output = outputs[1]
        pooled_output = self.model.dropout(pooled_output)
        logits = self.model.classifier(pooled_output)
        return torch.softmax(logits, dim=1)[:, 1].unsqueeze(1)

    
def interpret_sentence(model_wrapper, ig, tokenizer, sentence, vis_data_records_ig, label=1):

    model_wrapper.eval()
    model_wrapper.zero_grad()
    
    input_ids = torch.tensor([tokenizer.encode(sentence, add_special_tokens=True)])
    input_embedding = model_wrapper.model.bert.embeddings(input_ids)
    
    # predict
    pred = model_wrapper(input_embedding).item()
    pred_ind = round(pred)

    # compute attributions and approximation delta using integrated gradients
    attributions_ig, delta = ig.attribute(input_embedding, n_steps=500, return_convergence_delta=True)

    print('pred: ', pred_ind, '(', '%.2f' % pred, ')', ', delta: ', abs(delta))

    tokens = tokenizer.convert_ids_to_tokens(input_ids[0].numpy().tolist())    
    add_attributions_to_visualizer(attributions_ig, tokens, pred, pred_ind, label, delta, vis_data_records_ig)
    
    
def add_attributions_to_visualizer(attributions, tokens, pred, pred_ind, label, delta, vis_data_records):
    attributions = attributions.sum(dim=2).squeeze(0)
    attributions = attributions / torch.norm(attributions)
    attributions = attributions.detach().numpy()
    
    # storing couple samples in an array for visualization purposes
    vis_data_records.append(visualization.VisualizationDataRecord(
                            attributions,
                            pred,
                            pred_ind,
                            label,
                            "label",
                            attributions.sum(),       
                            tokens[:len(attributions)],
                            delta))
    # return vis_data_records


# 
# interface = Interface()
# tok = interface.bert_preprocesser.tokenizer
# model = interface.sent_pred.model
# 
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
# 
# 
# sal_calc = SaliencyCalculator(tokenizer=tok, model=model)       
# scores = sal_calc.get_scores(sents)
# 
# 
# print(scores)