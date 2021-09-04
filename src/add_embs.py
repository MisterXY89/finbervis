
import numpy as np
import pandas as pd

from config import DATA_DIR
from interface import Interface

FILENAME = "drop_from_3_data.csv"
FILE = f"{DATA_DIR}/{FILENAME}"

interface = Interface()

df = pd.read_csv(FILE)
df["cls_embs"] = list(range(0, len(df)))

ec = 0

cls_embs_list = []
df["cls_embs"] = None
for index, row in df.iterrows():
    print(f"{index=}")
    segment = row["segment"]
    print(segment)
    try:
        cls_embs = interface.get_embeddings(segment)
    except Exception as e:
        print(40*"-")
        print(e)
        ec += 1
        cls_embs_list.append(None)
        print(40*"-")
        # row["cls_embs"] = None
        raise e
        # continue

    print(list(cls_embs))
    cls_embs_list.append(list(cls_embs))

print(type(cls_embs_list))
print(len(cls_embs_list))
df["cls_embs"] = cls_embs_list
df.to_csv(FILE, index=False)

print(f"{ec=}")
