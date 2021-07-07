
import pandas as pd

dec = pd.read_csv("../data/decentralized_data.csv")
cent = pd.read_csv("../data/new_training_data.csv")

dec = dec[["segment", "sentiment"]]
cent = cent[["segment", "sentiment"]]

df = pd.concat([dec, cent])
df = df.reset_index(drop=True)
df["id"] = df.index
# print(df.tail(10))
print(df)
print(len(df))

# df.to_csv("../data/combi_training_data.csv")
