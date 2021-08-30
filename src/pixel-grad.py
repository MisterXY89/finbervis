import numpy as np
import pandas as pd
import plotly.express as px
import types
from tqdm import tqdm

from config import NEW_EMBS_FILE

FILL_VAL = 0

data = pd.read_csv(NEW_EMBS_FILE)

def extrac_grad(gs):
    return list(map(lambda el: float(el), str(gs)[1:-1].split(", ")))
  

gradient_data = []
max_len = 0
for index, row in tqdm(data.iterrows()):
    saliency_score = row.saliency_score
    if saliency_score == "ERROR":
        gradient_data.append([FILL_VAL for x in range(max_len)])
        continue
    row_grads = extrac_grad(saliency_score)
    
    if len(row_grads) > max_len:
        max_len = len(row_grads)
        
    gradient_data.append(row_grads)
  
  
print(max_len)
print(len(gradient_data))
print(gradient_data[12])

def fill(x):
    if isinstance(x, types.GeneratorType):
        print(x)
        print(dir(x))
        x = next(x)
        print(x)
    if len(x) < max_len:
        x = x[:max_len] + [FILL_VAL]*(max_len - len(x))
    return x

list(map(lambda x: fill(x), gradient_data))

fig = px.imshow(gradient_data)
fig.show()