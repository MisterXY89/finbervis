
import spacy
import pandas as pd

df = pd.read_csv("../data/data.csv")
nlp = spacy.load('en_core_web_sm')

s = "These include more than 70,000 displaced from High Security Zones and 65,000 Muslims forcibly displaced from LTTE-held areas in the early 1990s and currently residing in Puttalam district in north- western Sri Lanka."
bt = ['[CLS]', 'these', 'include', 'more', 'than', '70', ',', '000', 'displaced', 'from', 'high', 'security', 'zones', 'and', '65', ',', '000', 'muslims', 'forcibly', 'displaced', 'from', 'ltte', '-', 'held', 'areas', 'in', 'the', 'early', '1990s', 'and', 'currently', 'residing', 'in', 'puttalam', 'district', 'in', 'north', '-', 'western', 'sri', 'lanka', '.', '[SEP]']


def get_entity_token_mapping(sentence, bert_tokens):
    doc = nlp(sentence)
    entity_list = [el.ent_type_ for el in doc]
    spacy_tokens = list(doc)
    
    bert_tokens = bert_tokens[1:-1]
    new_entity_list = [""] # [CLS]
    
    e = 0
    for i, token in enumerate(spacy_tokens):    
        if token.text.lower() == bert_tokens[e]:
            new_entity_list.append(entity_list[i])
            e += 1
            continue
                
        length_of_spacy_token = len(token.text)
        count_string = ""
        while len(count_string) < length_of_spacy_token:
            new_entity_list.append(entity_list[i])
            count_string += bert_tokens[e]
            e += 1
            
    new_entity_list.append("") # [SEP]
    return new_entity_list
    
print(df.loc[1468, "segment"])
print(s)
print(df.loc[1468, "tokens"])
print(bt)

l = get_entity_token_mapping(s, bt)
print(l)
