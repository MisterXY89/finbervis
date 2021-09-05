"""
@author: Tilman Kerl
@version: 2021.09.04
---
Evaluate patterns
"""

import json
import numpy as np
import pandas as pd
from collections import Counter

from cluster_one_hot_vectors import cluster_one_hot
from create_one_hot_vector import make_one_hot


files = ["../data/drop_from_3_data.csv", 
		"../data/drop_8_data.csv", 
		"../data/data_copy.csv"
  ]
  
pos_classes = {
	 "open": ["ADJ", "ADV", "INTJ", "NOUN", "PROPN", "VERB"],
	 "closed": ["ADP", "AUX","CONJ","DET","NUM","PART","PRON","SCONJ"],
	 "other": ["PUNCT", "SYM", "X"]
 }
 
POS_TAGS = pos_classes["open"] + pos_classes["closed"] + pos_classes["other"]

dfs = [pd.read_csv(file) for file in files]

def evaluate():
	all_results = []
	for df in dfs:
		# exclude with more than one 1
		# count num of function words + content words
		results = {
			"accuracy": len(df.query("sentiment == truth_label"))/len(df),
			"results": []
		}
		for t in np.arange(0.2, 1, 0.05):
			open_class = 0
			closed_class = 0
			relevant_pos_tags = []
			vecs, oh_df = make_one_hot(df, is_df = True, threshold=t)			
			oh_df = oh_df.copy()
			num_with_one = len([v for v in vecs if v.count(1) == 1])
			anti_num = len(vecs) - num_with_one			
			vecs = [*filter(lambda x: x.count(1) == 1, vecs)]
			for v in vecs:
				pos_tag = POS_TAGS[v.index(1)]
				relevant_pos_tags.append(pos_tag)
				if pos_tag in pos_classes["open"]:
					open_class += 1 
				elif pos_tag in pos_classes["closed"]:
					closed_class += 1
					
			oh_df["one_hot"] = oh_df.one_hot.apply(lambda x: "".join(map(str, x)))
			vecs = ["".join(map(str, v)) for v in vecs]
			oh_df = oh_df.loc[ oh_df.one_hot.isin(vecs), : ]
			try:
				accuracy = len(oh_df.query("sentiment == truth_label"))/len(oh_df) * 100
				accuracy = round(accuracy, 2)
				accuracy = str(accuracy) + "%"
			except Exception as e:
				print(vecs)
				print(oh_df)
				accuracy = -1				
			
			try:
				ratio = closed_class/open_class
				ratio = round(ratio, 4)
			except Exception as e:
				if closed_class == 0:
					ratio = open_class
				elif open_class == 0:
					ratio = closed_class
				else:
					ratio = -1
				if open_class == closed_class == 0:
					ratio = -1
					
			# for sample_size in range(10, 200, 10):
			# cluster_dict = {}
			# for epsilon in np.arange(0.05, 2.5, 0.05):				
			# 	cluster_list, cl_df, no_clusters, no_noise, clusters = cluster_one_hot(df, epsilon = epsilon, min_samples = 3, is_df = True)
			# 	cluster_dict[str(epsilon)] = {
			# 		"no_clusters": float(no_clusters),
			# 		"no_noise": float(no_noise)
			# 	}
			results["results"].append({
				# "vecs": vecs,
				"threshold": round(t, 2),
				"with_one": num_with_one,
				"anti_num": anti_num, 
				"closed_class": closed_class,
				"open_class": open_class,
				"ratio": ratio,
				"accuracy": accuracy,				
				# "cluster": cluster_dict,
				"relevant_pos_tags": Counter(relevant_pos_tags)
			})
			
		all_results.append(results)
	
	return all_results
			
			
# res = evaluate()
# with open("evaluate_3_result.json", "w") as file:
# 	json.dump(res, file)

def get_accuracy(acc, x):
	if isinstance(acc, int):
		val = str(acc)
	else:
		val = f"{acc.split('%')[0]}\%"
	
	if x < 2:
		return "\\multicolumn{1}{l|}{" + val + "}&"
	return val
		
		
def get_long_data(res, short, x, i):
	if short:
		return " "	
	return f"{res[x]['results'][i]['with_one']} &"
	

def gen_latex(short=True):
	
	with open("evaluate_3_result.json", "r") as file:
		res = json.load(file)			
	
	latex_rows = ""
	for i, row in enumerate(res[0]["results"]):
		latex_rows += "\\multicolumn{1}{l|}{" + str(row['threshold']) +  "}& " 
		for x in range(0, 3):
			latex_rows += get_long_data(res, short, 0, i) + f"{res[x]['results'][i]['closed_class']} & {res[x]['results'][i]['open_class']} & {res[x]['results'][i]['ratio']} & " + get_accuracy(res[x]['results'][i]['accuracy'], x)
		latex_rows += "\\\\ \n"
		
		with open("latex_rows.tex", "w") as file:
			file.write(latex_rows)
	

gen_latex(short=True)	
	
