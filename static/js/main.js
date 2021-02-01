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
    test_rule_button.on("click", function () {
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
        });
    });
    segment_attention_button.on("click", function () {
        // show heatmap for selected node
        create_heatmap(window.segment, 11, 11);
    });
    explore_neighbours_button.on("click", function () {
        // let segment = test_rule_segment_field.property("value");
        // create_heatmap(window.segment, 11, 11);
    });
    hide_heatmap_button.on("click", function () {
        d3.select("#attention-heatmap").select("svg").remove();
    });
});
