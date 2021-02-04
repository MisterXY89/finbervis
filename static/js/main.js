"use strict";
document.addEventListener("DOMContentLoaded", function () {
    scatter_plot({});
    var test_sent = "Joseph Robinette Biden Jr. was sworn in as the 46th president of the United States.";
    // "taking office at a moment of profound economic, health and political crises with a promise to seek unity after a tumultuous four years that tore at the fabric of American society.";
    console.log(test_sent);
    var spinner = d3.select("#spinning-overlay");
    var test_rule_button = d3.select("#test-rule");
    var test_rule_segment_field = d3.select("#test-rule-segment");
    var segment_attention_button = d3.select("#segment-attention");
    var explore_neighbours_button = d3.select("#explore-neighbours");
    var hide_heatmap_button = d3.select("#hide-heatmap");
    var layer_input = d3.select("#layer_input");
    var head_input = d3.select("#head_input");
    var layer_input_neighbours = d3.select("#layer_input_neighbours");
    var head_input_neighbours = d3.select("#head_input_neighbours");
    var attention_interaction_group = d3.select("#self-attention-interaction");
    var user_classification_select = d3.select("#user-classification");
    var confirm_user_classification_sentiment_button = d3.select("#confirm-user-classification-sentiment");
    test_rule_button.on("click", function () {
        attention_interaction_group.style("opacity", 1);
        spinner.style("display", "block");
        var segment = test_rule_segment_field.property("value");
        console.log(segment);
        var url = "/test_user_data"
            + ("?segment=" + segment);
        fetch(url)
            .then(function (response) { return response.json(); })
            .then(function (json) {
            console.log(json);
            // add_datapoint(json);
            scatter_plot(json);
            spinner.style("display", "none");
            user_classification_select.style("display", "block");
        });
    });
    segment_attention_button.on("click", function () {
        // show heatmap for selected node
        var layer = Number(layer_input.property("value")) - 1;
        var head = Number(head_input.property("value")) - 1;
        create_heatmap(window.segment, layer, head);
    });
    explore_neighbours_button.on("click", function () {
        var layer = Number(layer_input_neighbours.property("value")) - 1;
        var head = Number(head_input_neighbours.property("value")) - 1;
        create_heatmap(window.segment, layer, head);
    });
    hide_heatmap_button.on("click", function () {
        d3.select("#attention-heatmap").select("svg").remove();
    });
    confirm_user_classification_sentiment_button.on("click", function (evt) {
        console.log("clicked");
        var correct_sentiment = user_classification_select.property("value");
        var model_sentiment = d3.select("#model-sentiment").text();
        console.log(correct_sentiment);
        console.log(model_sentiment);
        if (correct_sentiment != model_sentiment) {
            var datapoint_id = "";
            // add_new_sentiment(correct_sentiment, datapoint_id);
        }
    });
});
