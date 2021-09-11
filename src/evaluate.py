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

import seaborn as sns
import matplotlib.pyplot as plt

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

def evaluate(exclude_tag = False, file=None):
	if exclude_tag:
		print("EXCLUDE")
		print(POS_TAGS.index(exclude_tag))
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
			vecs = [*filter(lambda x: x.count(1) == 1, vecs)]
			total = len(vecs)
			if exclude_tag:
				vecs = [*filter(lambda x: x[POS_TAGS.index(exclude_tag)] == 1, vecs)]
			num_with_one = len([v for v in vecs if v.count(1) == 1])
			anti_num = len(vecs) - num_with_one			
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
				accuracy = str(accuracy) + "\%"
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
					
			try:
				frequency = (num_with_one/total) * 100
				frequency = round(frequency, 2)
				frequency = str(frequency) + "\%"
			except Exception as e:
				print("num_with_one", num_with_one)
				print("total", total)
				frequency = -1
					
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
				"total": total,
				"frequency": frequency,
				# "cluster": cluster_dict,
				"relevant_pos_tags": Counter(relevant_pos_tags)
			})
			
		all_results.append(results)
		
	if file:
		with open(file, "w") as file:
			json.dump(all_results, file)
	
	return all_results
			
			
def get_accuracy(acc, x):
	if isinstance(acc, int):
		val = str(acc)
	else:
		val = str(acc)# f"{acc.split('%')[0]}\%"
	
	if x < 2:
		return "\\multicolumn{1}{l|}{" + val + "}&"
	return val
		
		
def get_long_data(res, short, x, i):
	if short:
		return " "	
	return f"{res[x]['results'][i]['with_one']} &"
	
	
def get_header(tag):
	return """
%% """ + tag + """ results%%
\\begin{table}[t]
\\centering
\\begin{tabular}{lllllll} % l
\\hline

\\multicolumn{1}{c}{}& 
\\multicolumn{1}{c}{\\texttt{first-3}} & \\multicolumn{1}{l|}{60.05\\%} 
& \\multicolumn{1}{l}{\\texttt{drop-8}} & \\multicolumn{1}{l|}{73.00\\%}
& \\multicolumn{1}{l}{\\texttt{full-layer}} & 73.64\\%
\\\\ \\hline
\\multicolumn{1}{l|}{\\textbf{t}} &
\\multicolumn{1}{l|}{\\textbf{frequency}} & 
\\multicolumn{1}{l|}{\\textbf{accuracy}} & 
\\multicolumn{1}{l|}{\\textbf{frequency}} & 
\\multicolumn{1}{l|}{\\textbf{accuracy}} & 
\\multicolumn{1}{l|}{\\textbf{frequency}} & 
\\multicolumn{1}{l|}{\\textbf{accuracy}} \\\\ \\hline
	"""
	
def get_end(tag):
	return """
%% end content

\\\\ \\hline
\\end{tabular}
\\caption[Model Evaluation for only \\texttt{""" + tag + """} tokens]{Results for systematic evaluation of one-hot-vector patterns (\\textbf{only \\texttt{""" + tag + """} tokens}) for multiple integrated gradient thresholds $t$.}
\\label{tab:evalResults""" + tag + """}
\\end{table}
	"""
	

def gen_latex(file, tag, short=True):
	
	with open(file, "r") as file:
		res = json.load(file)			
	
	latex_rows = get_header(tag)
	for i, row in enumerate(res[0]["results"]):
		latex_rows += "\\multicolumn{1}{l|}{" + str(row['threshold']) +  "}& " 
		for x in range(0, 3):
			# latex_rows += get_long_data(res, short, 0, i) + f"{res[x]['results'][i]['closed_class']} & {res[x]['results'][i]['open_class']} & {res[x]['results'][i]['ratio']} & " + get_accuracy(res[x]['results'][i]['accuracy'], x)
			latex_rows += get_long_data(res, short, 0, i) + f"{res[x]['results'][i]['frequency']} & " + get_accuracy(res[x]['results'][i]['accuracy'], x)
		latex_rows += "\\\\ \n"
	
	latex_rows += get_end(tag)	
	with open(f"latex_tables/latex_rows_{tag}.tex", "w") as file:
		file.write(latex_rows)
		


for tag in POS_TAGS:
	file = f"results/evaluation_results_only_{tag}.json"
	res = evaluate(exclude_tag=tag, file=file)
	# res = evaluate()
	gen_latex(short=True, tag=tag, file=file)

def make_plt_df(res):
	df = pd.DataFrame(res[0]["results"])
	df["model"] = [0 for i in range(len(df))]	
	for x in range(1,3):
		tmp_df = pd.DataFrame(res[x]["results"])
		tmp_df["model"] = [x for i in range(len(tmp_df))]
		df = df.merge(tmp_df, on="threshold", how="inner")
	return df

def plot_distr():
	with open("evaluation_results.json", "r") as file:
		res = json.load(file)	
	
	df = make_plt_df(res)
	print(df)
	print(df.keys())
	# fig, ax = sns.plt.subplots(1, 1, figsize=(7,5))
	# sns.factorplot(x="items", y="clicks", hue="exp_name", col="status", data=df, kind="bar")
	# plt.show()
	df.rename(columns={"ratio": "decentralized-full", "ratio_x": "decentralized-first-3", "ratio_y": "decentralized-drop-8"}, inplace=True)
	ax = df.plot.bar(x="threshold", y=["decentralized-full", "decentralized-drop-8", "decentralized-first-3"])
	ax.set_ylabel("ratio")

# plot_distr()
# plt.show()
