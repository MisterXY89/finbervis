"""
@author: Tilman Kerl
@version: 2020.11.25
---
Helper for the training & validation of the model
"""

import datetime

import torch
import numpy as np
import pandas as pd
import plotly.express as px
from transformers import AdamW
from transformers import get_linear_schedule_with_warmup

from config import get_model_path


def get_bert_parameters(model) -> bool:
    """
	Get all of the model's parameters as a list of tuples.
	And print them to the console. This is soley for inspectation purposes
	"""
    params = list(model.named_parameters())
    print('The BERT model has {:} different named parameters.\n'.format(
        len(params)))
    print('==== Embedding Layer ====\n')
    for param in params[0:5]:
        print("{:<55} {:>12}".format(param[0], str(tuple(param[1].size()))))
    print('\n==== First Transformer ====\n')
    for param in params[5:21]:
        print("{:<55} {:>12}".format(param[0], str(tuple(param[1].size()))))
    print('\n==== Output Layer ====\n')
    for param in params[-4:]:
        print("{:<55} {:>12}".format(param[0], str(tuple(param[1].size()))))


def get_optimizer(model):
    """
	Configure and return the Adam optimizer
	"""
    return AdamW(
        model.parameters(),
        lr=2e-5,  # args.learning_rate - default is 5e-5
        eps=1e-8  # args.adam_epsilon  - default is 1e-8
    )


def get_scheduler(optimizer, total_training_steps):
    """
	Create the learning rate scheduler.
	"""
    return get_linear_schedule_with_warmup(
        optimizer, num_warmup_steps=0, num_training_steps=total_training_steps)


def flat_accuracy(preds, labels):
    """
	Function to calculate the accuracy of our predictions vs labels
	"""
    pred_flat = np.argmax(preds, axis=1).flatten()
    labels_flat = labels.flatten()
    return np.sum(pred_flat == labels_flat) / len(labels_flat)


def format_time(elapsed):
    """
    Takes a time in seconds and returns a string hh:mm:ss
    """
    # Round to the nearest second.
    elapsed_rounded = int(round((elapsed)))
    # Format as hh:mm:ss
    return str(datetime.timedelta(seconds=elapsed_rounded))


def plot_loss(loss_values):
    """
	takes loss_values after training is finished and plots it
	"""
    data_frame = pd.DataFrame(loss_values)
    data_frame.columns = ['Loss']
    fig = px.line(data_frame, x=data_frame.index, y=data_frame.Loss)
    fig.update_layout(title='Training loss of the Model',
                      xaxis_title='Epoch',
                      yaxis_title='Loss')
    fig.show()


def save_model(model):
    """
	Saves the model, from the doc [trying two different approaches]
	----
	This save/load process uses the most intuitive syntax and involves the
	least amount of code. Saving a model in this way will save the entire
	module using Python’s pickle module. The disadvantage of this approach
	is that the serialized data is bound to the specific classes and the
	exact directory structure used when the model is saved. The reason
	for this is because pickle does not save the model class itself.
	Rather, it saves a path to the file containing the class,
	which is used during load time. Because of this, your code can
	break in various ways when used in other projects or after refactors.
	"""

    torch.save(model, get_model_path())
    # try:
    #     # They can then be reloaded using `from_pretrained()`
    #     model_to_save = model.module if hasattr(
    #         model,
    #         'module') else model  # Take care of distributed/parallel training
    #     model_to_save.save_pretrained(MODEL_DIR)
    # except Exception as e2:
    #     print(e2)
