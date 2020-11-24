
import torch
import numpy as np
import torch.nn.functional as F

from transformers import BertForSequenceClassification
from torch.utils.data import TensorDataset, DataLoader, RandomSampler, SequentialSampler

from config import MODEL_DIR, BATCH_SIZE, LABEL_VALUES
from bert_preprocess import tokenize_segments_to_id, pad_token_ids, create_attention_masks, train_valid_split, train_valid_to_tensor, convert_labels_to_int

device = torch.device("cpu")



def prettify_probabilities(probabilities:list) -> list:
    """
    get the index with the highest prob and return corresponding label
    """
    return [LABEL_VALUES[prob_list.argmax()] for prob_list in probabilities]


def predict(model, dataloader, pretty=False):
    """
    Perform a forward pass on the trained BERT model to predict probabilities
    on the set.
    The probabilities for one element come as a 3-list where the index of the
    probability-list corresponds to the index of the label of the
    LABEL_VALUES = ["positive", "neutral", "negative"]
    """
    # Put the model into the evaluation mode, the dropout layers are disabled.
    model.eval()

    all_logits = []
    # For each batch in our test set...
    for batch in dataloader:
        # Load batch to GPU
        b_input_ids, b_attn_mask = tuple(t.to(device) for t in batch)[:2]

        # Compute logits
        with torch.no_grad():
            logits = model(b_input_ids, b_attn_mask)
        all_logits.append(logits)


    all_logits = all_logits[0]

    # Concatenate logits from each batch
    all_logits = torch.cat(all_logits, dim=0)

    # Apply softmax to calculate probabilities
    probs = F.softmax(all_logits, dim=1).cpu().numpy()

    if pretty:
        return prettify_probabilities(probs)
    return probs


def make_predictable(segment_list:list) -> DataLoader:
    """
    takes list of segments and returns a dataloader which has to be
    used for the predict function
    """
    # from bert_preprocess
    input_ids = tokenize_segments_to_id(segment_list)
    padding_token_ids = pad_token_ids(input_ids)
    attention_masks = create_attention_masks(padding_token_ids)

    data = TensorDataset(torch.tensor(padding_token_ids),
                        torch.tensor(attention_masks))

    dataloader = DataLoader(data,
                        sampler=SequentialSampler(data),
                        batch_size=BATCH_SIZE)

    return dataloader




latest_model_filename = MODEL_DIR + "/fine-tuned-model_24-11-2020_19-07.pt"
model = torch.load(latest_model_filename)

# positive
s1 = "Surgical strike by the Indian government was openly supported by all the political parties."
# positive
s2 = "Considering The threat of terrorism, it was a very practical decision by the Government."
# negative
s3 = "This is very bad."
# negative
s4 = "However, there was limited funding at the design stage which reduced opportunities for stakeholder consultation and involvement."
test_segments = [s1, s2, s3, s4]


dataloader = make_predictable(test_segments)
props = predict(model, dataloader, pretty=True)
print(props)
