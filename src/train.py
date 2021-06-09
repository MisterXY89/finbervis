"""
@author: Tilman Kerl
@version: 2020.11.25
---
Hold the Trainer class, which handles training & validation of the model with
the preprocessd data from bert_preprocess
"""

import time
import random

import numpy as np
import torch

from train_helper import get_optimizer, flat_accuracy, format_time, get_scheduler, plot_loss, save_model
from bert_preprocess import BertPreprocessor
from config import load_bert

# Tell pytorch to run this model on the GPU.
# model.cuda()


class Trainer:
    """
    Training code is based on the `run_glue.py` script here:
    https://github.com/huggingface/transformers/blob/5bfcd0485ece086ebcbed2d008813037968a9e58/examples/run_glue.py#L128
    """
    def __init__(self, drop_layers = False):
        self.model = load_bert(drop_layers = drop_layers)
        self.bert_processor = BertPreprocessor()
        self.bert_processor.preprocess()
        # self.model.cuda()
        # Number of training epochs (authors recommend between 2 and 4)
        self.epochs = 4
        # Total number of training steps is number of batches * number of epochs.
        self.total_training_steps = len(self.bert_processor.train_dataloader) * self.epochs
        self.optimizer = get_optimizer(self.model)
        self.scheduler = get_scheduler(self.optimizer,
                                       self.total_training_steps)
        # Set the seed value all over the place to make this reproducible.
        self.seed_value = 42
        self._set_seed_value()
        # Store the average loss after each epoch so we can plot them.
        self.loss_values = []
        self.total_loss = 0
        # If there's a GPU available...
        # if torch.cuda.is_available():
        # Tell PyTorch to use the GPU.
        #    self.device = torch.device("cuda")
        #    print('There are %d GPU(s) available.' % torch.cuda.device_count())
        #    print('We will use the GPU:', torch.cuda.get_device_name(0))
        #else:
        #    print('No GPU available, using the CPU instead.')
        self.device = torch.device("cpu")

    def _set_seed_value(self):
        random.seed(self.seed_value)
        np.random.seed(self.seed_value)
        torch.manual_seed(self.seed_value)
        torch.cuda.manual_seed_all(self.seed_value)

    def _loss_values_update(self):
        # Calculate the average loss over the training data.
        avg_train_loss = self.total_loss / len(self.bert_processor.train_dataloader)
        # Store the loss value for plotting the learning curve.
        self.loss_values.append(avg_train_loss)
        return avg_train_loss

    def _train_report(self, avg_train_loss, t0):
        print("\n  Average training loss: {0:.2f}".format(avg_train_loss))
        print("  Training epoch took: {:}".format(format_time(time.time() -
                                                              t0)))

    def _validate_report(self, eval_accuracy, nb_eval_steps, t0):
        print("  Accuracy: {0:.2f}".format(eval_accuracy / nb_eval_steps))
        print("  Validation took: {:}".format(format_time(time.time() - t0)))

    def train_and_validate(self):
        """
        actual training
        """
        for epoch_i in range(0, self.epochs):
            # Perform one full pass over the training set.
            print(f"\n======== Epoch {epoch_i+1} / {self.epochs} ========")
            print('Training...')
            # Reset the total loss for this epoch.
            self.total_loss = 0
            # Put the model into training mode
            self._train()
            self._validate()

        print("Training complete!")
        plot_loss(self.loss_values)
        save_model(self.model)

    def _validate(self):
        """
        After the completion of each training epoch, measure our performance on
        the  validation set.
        """
        print("\nRunning Validation...")
        t0 = time.time()
        # Put the model in evaluation mode
        # - the dropout layers behave differently during evaluation.
        self.model.eval()
        # Tracking variables
        eval_loss, eval_accuracy = 0, 0
        nb_eval_steps, nb_eval_examples = 0, 0
        for batch in self.bert_processor.valid_dataloader:

            # Add batch to GPU
            batch = tuple(t.to(self.device) for t in batch)

            # Unpack the inputs from our dataloader
            b_input_ids, b_input_mask, b_labels = batch

            # Telling the model not to compute or store gradients, saving memory and
            # speeding
            with torch.no_grad():
                # Forward pass, calculate logit predictions.
                # This will return the logits rather than the loss because we have
                # not provided labels.
                # token_type_ids is the same as the "segment ids", which
                # differentiates sentence 1 and 2 in 2-sentence tasks.
                # The documentation for this `model` function is here:
                # https://huggingface.co/transformers/v2.2.0/model_doc/bert.html#transformers.BertForSequenceClassification
                outputs = self.model(b_input_ids,
                                     token_type_ids=None,
                                     attention_mask=b_input_mask)

            # Get the "logits" output by the model. The "logits" are the output
            # values prior to applying an activation function like the softmax.
            logits = outputs[0]
            # Move logits and labels to CPU
            logits = logits.detach().cpu().numpy()
            label_ids = b_labels.to('cpu').numpy()

            # Calculate the accuracy for this batch of test sentences.
            tmp_eval_accuracy = flat_accuracy(logits, label_ids)

            # Accumulate the total accuracy.
            eval_accuracy += tmp_eval_accuracy
            # Track the number of batches
            nb_eval_steps += 1

        self._validate_report(eval_accuracy, nb_eval_steps, t0)

    def _report_progress(self, step, t0):
        """
        Report progress, via the elapsed time in minutes
        """
        elapsed = format_time(time.time() - t0)
        print("  Batch {:>5,}  of  {:>5,}.    Elapsed: {:}.".format(
            step, len(self.bert_processor.train_dataloader), elapsed))

    def _train(self):
        self.model.train()
        # Measure how long the training epoch takes.
        t0 = time.time()
        # For each batch of training data...
        for step, batch in enumerate(self.bert_processor.train_dataloader):
            # Progress update every 40 batches.
            if step % 40 == 0 and not step == 0:
                self._report_progress(step, t0)

            # Unpack training batch from dataloader and copy each tensor
            # to the GPU using the `to` method.
            # `batch` contains three pytorch tensors:
            #   [0]: input ids
            #   [1]: attention masks
            #   [2]: labels
            b_input_ids = batch[0].to(self.device)
            b_input_mask = batch[1].to(self.device)
            b_labels = batch[2].to(self.device)

            # Always clear any previously calculated gradients before performing a
            # backward pass. PyTorch doesn't do this automatically because
            # accumulating the gradients is "convenient while training RNNs".
            # (source: https://stackoverflow.com/questions/48001598/why-do-we-need-to-call-zero-grad-in-pytorch)
            self.model.zero_grad()

            # Perform a forward pass (evaluate the model on this training batch).
            # This will return the loss (rather than the model output) because we
            # have provided the `labels`.
            # The documentation for this `model` function is here:
            # https://huggingface.co/transformers/v2.2.0/model_doc/bert.html#transformers.BertForSequenceClassification
            outputs = self.model(torch.tensor(b_input_ids).to(
                self.device).long(),
                                 token_type_ids=None,
                                 attention_mask=b_input_mask,
                                 labels=b_labels)

            # The call to `model` always returns a tuple, so we need to pull the
            # loss value out of the tuple.
            loss = outputs[0]

            # Accumulate the training loss over all of the batches so that we can
            # calculate the average loss at the end. `loss` is a Tensor containing a
            # single value; the `.item()` function just returns the Python value
            # from the tensor.
            self.total_loss += loss.item()

            # Perform a backward pass to calculate the gradients.
            loss.backward()
            # Clip the norm of the gradients to 1.0.
            # This is to help prevent the "exploding gradients" problem.
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)

            # Update parameters and take a step using the computed gradient.
            # The optimizer dictates the "update rule"--how the parameters are
            # modified based on their gradients, the learning rate, etc.
            self.optimizer.step()
            # Update the learning rate.
            self.scheduler.step()

        avg_train_loss = self._loss_values_update()
        self._train_report(avg_train_loss, t0)


trainer = Trainer(drop_layers = [7])
trainer.train_and_validate()
