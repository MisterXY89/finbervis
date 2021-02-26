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
    var user_classification_select = d3.select("#sentiment-classes-user-classification");
    var confirm_user_classification_sentiment_button = d3.select("#confirm-user-classification-sentiment");
    var similar_sents_display = d3.select("#similar-sents-display");
    var show_similar_sents_button = d3.select("#show-similar");
    var prop_slider = d3.select("#prop-slider").node();
    var prop_slider_output = d3.select('#prop-slider-output').node();
    prop_slider_output.innerHTML = prop_slider.value;
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
    show_similar_sents_button.on("click", function () {
        var id = d3.select("#point_id").property("value");
        var url = "/get_similar_segments?seg_id=" + id + "&return_sents=True";
        console.log(url);
        fetch(url)
            .then(function (resp) { return resp.json(); })
            .then(function (json) {
            console.log(json);
            var sents = json["result"];
            var sents_html = "<ul>";
            sents.forEach(function (sent) {
                sents_html += "<li>" + sent + "</li>";
            });
            sents_html += "</ul>";
            similar_sents_display.html(sents_html);
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
        var selected_segement = d3.select("#selected-segment").text();
        console.log(correct_sentiment);
        console.log(model_sentiment);
        if (window.added_segment == selected_segement) {
            alert("You already added this segment.");
        }
        if (correct_sentiment == model_sentiment) {
            alert("Your choosen sentiment and the predicted sentiment are identical.");
        }
        if (correct_sentiment != model_sentiment && window.added_segment != selected_segement) {
            add_labeled_record(correct_sentiment, selected_segement);
        }
    });
    prop_slider.oninput = function () {
        var slider_val = this.value;
        prop_slider_output.innerHTML = slider_val;
        // console.log(this.value);
        // let all_els = document.getElementsByTagName("circle");
        // console.log(all_els):
        // let all_ids = Array.from(all_els).map(c => c.id);
        d3.selectAll("circle").transition()
            .filter(function () {
            // console.log(Number(this.style.opacity));
            return Number(this.style.opacity) <= slider_val;
        })
            .duration(200)
            .style("opacity", 0.2);
        // d3.selectAll("circle").transition()
        //  .filter(function() {
        // 	 // console.log(Number(this.style.opacity));
        // 	 return Number(this.style.opacity) > slider_val;
        //  })
        //  .duration(50)
        //  .style("opacity", 1);
    };
});
