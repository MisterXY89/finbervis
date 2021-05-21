
import pandas as pd

df = pd.read_csv("../data/data_copy.csv")
old = pd.read_csv("../data/projection_with_full_sents.csv")

print(len(df))
print(len(old))

truth_labels = old.sentiment

print(df[["segment"]].compare(old[["segment"]]))

df_truth = df.truth_label
print(df_truth)

# print(df.truth_label.compare(truth_labels))

# df.truth_label = truth_labels


# df.to_csv("../data/data_copy.csv", index=False)
