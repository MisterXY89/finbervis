
import pandas as pd
from tqdm import tqdm

pos_classes = {
	"open": ["ADJ", "ADV", "INTJ", "NOUN", "PROPN", "VERB"],
	"closed": ["ADP", "AUX","CONJ","DET","NUM","PART","PRON","SCONJ"],
	"other": ["PUNCT", "SYM", "X"]
}

# open 0:5 
# closed 6:13
# other 14:16 // exclude 16
POS_TAGS = [el for key in pos_classes for el in pos_classes[key]]
print(POS_TAGS)

def mk_list(s_arr, tok=False, spacy=False):
	if s_arr == None or not "," in s_arr:
		return []
	if isinstance(s_arr, list):
		return s_arr
	if tok:        
		arr = s_arr.split("', '")
	else:
		s_arr = s_arr[1:-1]
		arr = s_arr.split(", ")
	if tok and not spacy:
		arr[0] = "[CLS]"
		arr[-1] = "[SEP]"
	else:
		arr = [*map(float, arr)]
	return arr

		
def make_one_hot(file, is_df=False, threshold=0.4):
	tt = 0
	if not is_df:
		df = pd.read_csv(file)
		df["one_hot"] = list(range(len(df)))
	else:
		df = file
	# if isinstance(str, file):
	#     df = file
	one_hot_vectors = []
	diff = 0
	for index, row in tqdm(df.iterrows(), total=len(df)):
		# print("--")
		if str(row.tokens) == "nan":
			# one_hot_vectors.append(0)
			one_hot_vectors.append([-1 for x in range(len(POS_TAGS))])
			continue
		toks = mk_list(row.tokens, tok=True)
		row.tokens = toks
		# print(toks, len(toks))
		sal = mk_list(row.saliency_score)
		row.saliency_score = sal
		if len(toks) != len(sal):
			one_hot_vectors.append([-1 for x in range(len(POS_TAGS))])
			diff += 1
			continue
		# print(sal, len(sal))
		pos = mk_list(row.pos_tags, tok=True)
		row.pos_tags = pos
		# pos = pos[1:-1]
		one_hot = [0 for x in range(len(POS_TAGS))]
		for i in range(1, len(sal)):
			tmp_pos_tag = pos[i]
			if tmp_pos_tag == "[SEP]":
				continue
			# print(tmp_pos_tag, i)
			if tmp_pos_tag == "CCONJ":
				tmp_pos_tag = "CONJ"
			pos_index = POS_TAGS.index(tmp_pos_tag)
			if sal[i] > threshold:
				tt += 1
				one_hot[pos_index] = 1
		one_hot_vectors.append(one_hot)
	print(tt)
	if not is_df:
		df["one_hot"] = one_hot_vectors
		print(diff)
		df.to_csv(file, index=False)
	return one_hot_vectors, df    


# load_data()
# make_one_hot("../data/drop_from_3_data.csv", threshold=0.3)
# make_one_hot("../data/drop_8_data.csv", threshold=0.3)
# make_one_hot("../data/data_copy.csv", threshold=0.3)