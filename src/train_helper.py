
import time
import torch
import datetime
import numpy as np
import pandas as pd
import plotly.express as px
from transformers import AdamW, BertConfig
from transformers import get_linear_schedule_with_warmup

from config import MODEL_PATH

def get_bert_parameters(model) -> bool:
	"""
	Get all of the model's parameters as a list of tuples.
	And print them to the console. This is soley for inspectation purposes
	"""
	params = list(model.named_parameters())
	print('The BERT model has {:} different named parameters.\n'.format(len(params)))
	print('==== Embedding Layer ====\n')
	for p in params[0:5]:
	    print("{:<55} {:>12}".format(p[0], str(tuple(p[1].size()))))
	print('\n==== First Transformer ====\n')
	for p in params[5:21]:
	    print("{:<55} {:>12}".format(p[0], str(tuple(p[1].size()))))
	print('\n==== Output Layer ====\n')
	for p in params[-4:]:
	    print("{:<55} {:>12}".format(p[0], str(tuple(p[1].size()))))


def get_optimizer(model):
	"""
	Configure and return the Adam optimizer
	"""
	return AdamW(model.parameters(),
	                  lr = 2e-5, # args.learning_rate - default is 5e-5
	                  eps = 1e-8 # args.adam_epsilon  - default is 1e-8
	                )


def get_scheduler(optimizer, total_training_steps):
	"""
	Create the learning rate scheduler.
	"""
	return get_linear_schedule_with_warmup(optimizer,
	                            num_warmup_steps = 0,
	                            num_training_steps = total_training_steps)


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
	f = pd.DataFrame(loss_values)
	f.columns=['Loss']
	fig = px.line(f, x=f.index, y=f.Loss)
	fig.update_layout(title='Training loss of the Model',
	                   xaxis_title='Epoch',
	                   yaxis_title='Loss')
	fig.show()


def save_model(model):
	torch.save(model, MODEL_PATH)
