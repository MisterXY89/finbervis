
import random

import spacy
import pandas as pd

import tokenizations

nlp = spacy.load("en_core_web_sm")
df = pd.read_csv("../data/data_copy.csv")


row = df.loc[1]
bert_tokens = row.tokens
segment = row.segment
pos_tags = [token.pos_ for token in nlp(segment)]
spacy_tokens = [token.text.lower() for token in nlp(segment)]
print(spacy_tokens)
print(bert_tokens)

a2b,b2a = tokenizations.get_alignments(bert_tokens, spacy_tokens)
print(a2b)



def merge_bert_tokens(tokens, spacy=False):
    sentence = " ".join(tokens).replace(" ##", "")
    if spacy:
        # get rid of CLS & SEP token
        sentence = sentence.replace("[CLS] ", "")
        sentence = sentence.replace(" [SEP]", "")
        sentence = sentence.replace("[CLS]", "")
        sentence = sentence.replace("[SEP]", "")
    sentence_list = sentence.split(" ")
    return sentence_list, sentence


def merge_saliency(saliency_score, tokens, spacy=True):
    print(tokens)
    # split_tokens = [*map(lambda x: "##" in x, tokens)]
    idx = []
    flip_values = []
    for i, x in enumerate(tokens):
        if "##" in x:            
            idx.append(i)
            if "##" in tokens[i-2] and not "##" in tokens[i-1]:
                flip_values.append((i-1))
            idx.append(i-1)
            
    idx.sort()
    print(flip_values)
                
    # [-v for v in idx if v in flip_values]
    idx = [*map(lambda v: -v if v in flip_values else v, idx)]
    
    # idx = [*set(idx)]
    print(idx)
    # print(idx)
    idx_groups = []
    group = 0
    for e, i_idx in enumerate(idx):
        if len(idx_groups) <= group:
            idx_groups.append([])
        idx_groups[group].append(i_idx)
        if (e+1) < len(idx):
            if (idx[e+1]-1) != idx[e] and idx[e+1]-1 != abs(idx[e]):
                group += 1
            # print(idx[e+1]-1, abs(idx[e]))
            if idx[e] < 0 and idx[e+1]-1 == abs(idx[e]):
                idx[e] = abs(idx[e])
                # group += 1
                
    # remove duplicates to speed up
    # idx_groups = [*set(idx_groups)]
    print(idx_groups)
    
    new_sal_scores = []    
        
    for x in range(0, len(saliency_score)):
        sal_value = saliency_score[x]
        su_list = [sublist for sublist in idx_groups if x in sublist]
        if su_list:
            su_list = [*map(abs, su_list[0])]
            print(su_list)
            # print(saliency_score[su_list[0]])
            # print(saliency_score[su_list[1]])
            su_list_sal_vals = saliency_score[su_list[0]:su_list[1]]
            # flag sentences?
            sal_value = sum(su_list_sal_vals)/len(su_list_sal_vals)
        if su_list and sal_value in new_sal_scores:
            continue
        new_sal_scores.append(sal_value)
    
    if spacy:
        # remove CLS & SEP token
        new_sal_scores.pop()
        new_sal_scores.pop(0)
    return new_sal_scores
                

def mk_list(s_arr, tok=False, spacy=False):
    if tok:
        arr = s_arr.split("', '")
    else:
        s_arr = s_arr[1:-1]
        arr = s_arr.split(", ")
    if tok:        
        arr[0] = "[CLS]"
        arr[-1] = "[SEP]"
    else:
        arr = [*map(float, arr)]
    return arr

def get_max_sal_indicies(merged_saliency, n=5):
    index_max_scores = []
    for i in range(0, n):
        max_el = max(merged_saliency)
        i_max_el = merged_saliency.index(max_el)
        index_max_scores.append((i_max_el-1, i_max_el))
        merged_saliency[i_max_el] = -2
    return index_max_scores
        

def inspect_pos_tags(i, log = False):
    # excludes SEP & CLS token
    row = df.iloc[i]
    tokens = mk_list(row.tokens, tok=True)
    saliency_score = mk_list(row.saliency_score)
    # if 1<2: return
    merged_saliency = merge_saliency(saliency_score, tokens, spacy=True)
    clean_tokens, clean_sentence = merge_bert_tokens(tokens, spacy=True)
    # for token in nlp(clean_sentence):
    #     print(token, token.pos_)
        
    pos_tags = [token.pos_ for token in nlp(clean_sentence)]
    max_sal_indicies = get_max_sal_indicies(merged_saliency, n=3)
    if log:
        print(len(saliency_score), len(tokens))
        print(len(merged_saliency))
        print(len(clean_tokens))
        print(len(clean_tokens), len(pos_tags))
    max_pos_tags = []
    for mi in max_sal_indicies:
        pos_tuple = (pos_tags[mi[0]], pos_tags[mi[1]])
        max_pos_tags.append(pos_tuple)
        # print(clean_tokens[mi], "\t: ", pos_tags[mi])
    return max_pos_tags


def get_relevant_pos_tags(index_list=None, random_idx_list_size = 100):
    high_sal_pos_tags = {}    
    if not index_list:
        # generate random list of index
        index_list = [*set([random.randint(0, len(df)) for x in range(0, random_idx_list_size+10)])][:random_idx_list_size]
        print(index_list)
    
    e_counter = 0
    for i in index_list:
        try:            
            el_pos_tags = inspect_pos_tags(i, log=True)
        except Exception as e:
            print(e)
            e_counter += 1
            continue
        # print(pos_tags)
        for pos_tag in el_pos_tags:
            if not pos_tag in high_sal_pos_tags:
                high_sal_pos_tags[pos_tag] = 0
            high_sal_pos_tags[pos_tag] += 1
            
    return high_sal_pos_tags, e_counter

# index_list = [1029, 3078, 4109, 3601, 2072, 1049, 5149, 36, 4651, 2611, 5175, 55, 1593, 63, 3659, 1104, 3164, 3167, 99, 2148, 6247, 1131, 4716, 2166, 120, 5254, 6279, 4744, 5262, 145, 5265, 4763, 6303, 1192, 4270, 692, 4789, 3770, 5833, 2776, 220, 734, 432, 9, 6381, 1791, 2304, 2822, 3335, 4360, 3340, 1805, 2320, 3350, 5917, 5409, 2340, 294, 4902, 5929, 301, 5422, 307, 823, 6464, 5953, 3394, 4423, 1357, 5966, 2894, 4433, 4435, 4958, 1380, 3429, 363, 3439, 6514, 370, 5492, 1918, 2947, 1415, 908, 4, 495, 1425, 6546, 5012, 5015, 922, 1947, 6048, 2976, 2469, 1462, 1979, 3006, 446, 6591, 4032]
# random_idx_list_size = 6000

index_list = list(df.query("sentiment == truth_label").index)
relevant_pos_tags, e_counter = get_relevant_pos_tags(index_list=index_list)
relevant_pos_tags = dict(sorted(relevant_pos_tags.items(), key=lambda x:x[1]))
print(relevant_pos_tags)
print(e_counter)


