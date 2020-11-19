"""
@author: Tilman Kerl
@version: 2020.11.19
---
Description of train.py
"""

# from transformers import AdamW, BertConfig
from config import load_bert

model = load_bert()
# run this model on the GPU.
model.cuda()
