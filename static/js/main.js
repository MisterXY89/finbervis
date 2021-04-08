"use strict";
// function click_point(point_id) {
// 	$(`#${id}`).click();
// }
function toggle_ents() {
    console.log("click");
    var seq_id = d3.select("#point_id").text();
    var url = "/get_entities?seq_id=" + seq_id;
    console.log(url);
    fetch(url)
        .then(function (resp) { return resp.json(); })
        .then(function (json) {
        console.log(json);
        // let res = json.result;
        var ents_html = json.result;
        d3.select("#selected-segment-ents").html(ents_html);
        $("#selected-segment-ents").toggle();
        $("#selected-segment").toggle();
    });
}
function get_segment_html(seg) {
    // type="button" class="btn btn-secondary"
    return "<div title=\"" + seg + "\">\n  \t" + seg.slice(0, 50) + "...\n\t</div>";
}
function prep_search_vis(res) {
    var html = "";
    // .slice(0,10)
    window.search_result_data = [];
    res.forEach(function (element, i) {
        window.search_result_data.push(element);
        html += '<div class="card" style="width: 100%;">'
            + '<div class="card-body">'
            + ("<h5 class=\"card-title\">Result #" + (i + 1) + "</h5>")
            + "<p class=\"card-text\">"
            + ("<strong>ID</strong><br>" + element.id + "<hr>")
            + ("<strong>Segment</strong><br>" + get_segment_html(element.segment) + "<br>")
            + ("<strong>Sentiment</strong><br>" + get_sentiment_html(element.sentiment))
            + '</p>'
            + ("<a href=\"#\" class=\"btn btn-primary\" onclick='click_point(" + i + ");'>Select Point</a>")
            + '</div>'
            + '</div><br>';
    });
    return html;
}
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
    var similar_sents_display_plain = d3.select("#similar_sents_display_plain");
    var show_similar_sents_button = d3.select("#show-similar");
    var toggle_ents_sim_sents_button = d3.select("#toggle_ents_sim_sents");
    var toggle_ents = d3.select("#toggle-ents");
    var search_button = d3.select("#searchButton");
    var search_input = d3.select("#searchInput");
    var search_results = d3.select("#search-results");
    var toggle_identical_words_sim_sents_button = d3.select("#toggle_identical_words_sim_sents_button");
    var split_rule_button = d3.select("#split-rule");
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
        var id = d3.select("#point_id").text();
        var url = "/get_similar_segments?seg_id=" + id + "&return_sents=True";
        console.log(url);
        fetch(url)
            .then(function (resp) { return resp.json(); })
            .then(function (json) {
            var res = json.result;
            var plain_sents = res.map(function (el) { return el.segment; });
            var sents_html = json.ent_html;
            var new_origin = json.origin_sent_ent_html;
            var plain_sents_html = "";
            plain_sents.forEach(function (s) { return plain_sents_html += s + "<hr>"; });
            console.log(plain_sents_html);
            $("#toggle_ents_sim_sents").show();
            $("#toggle_identical_words_sim_sents_button").show();
            $;
            d3.select("#selected-segment-ents").html(new_origin);
            similar_sents_display.html(sents_html);
            similar_sents_display_plain.html(plain_sents_html);
        });
    });
    toggle_ents_sim_sents_button.on("click", function () {
        $("#similar-sents-display").toggle();
        $("#similar_sents_display_plain").toggle();
    });
    toggle_identical_words_sim_sents_button.on("click", function () {
        var segment_select_display = window.segment.toLowerCase();
        var active_dispaly;
        if ($("#similar-sents-display").css("display") == "block") {
            active_dispaly = $("#similar-sents-display");
        }
        else {
            active_dispaly = $("#similar_sents_display_plain");
        }
        if (active_dispaly.html().includes("identical-token")) {
            console.log("EXISTING");
            // toggle & return
            console.log($(".identical-token").first().css("background-color"));
            var bg_color = $(".identical-token").first().css("background-color");
            if (bg_color != "rgba(0, 0, 0, 0)") {
                $(".identical-token").css("background-color", "transparent");
            }
            else {
                $(".identical-token").css("background-color", "yellow");
            }
            return 1;
        }
        var segment_select_tokens = segment_select_display.split(" ");
        var similiar_sents = active_dispaly.html().split("<hr>");
        var check = function (sent) {
            return sent.split(" ").map(function (token) {
                var token_low = token.toLowerCase();
                if (segment_select_tokens.includes(token_low)) {
                    var class_name = "identical-token";
                    if (stop_words.includes(token_low)) {
                        class_name += " " + class_name + "-stopword";
                    }
                    return "<span class='" + class_name + "'>" + token + "</span>";
                }
                return token;
            }).join(" ");
        };
        similiar_sents = similiar_sents.map(function (sent) { return check(sent); });
        active_dispaly.html(similiar_sents.join("<hr>"));
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
    search_button.on("click", function () {
        var search_q = search_input.property("value");
        var params = "";
        if (search_q[0] == "#") {
            params = "?seg_id=" + search_q.slice(1);
            "";
        }
        else {
            params = "?q=" + search_q;
        }
        var url = "/search" + params;
        fetch(url)
            .then(function (resp) { return resp.json(); })
            .then(function (json) {
            var res = json.result;
            console.log(res);
            $("#search_results-wrapper").show();
            search_results.html(prep_search_vis(res));
            d3.select("#total-results").text(res.length);
        });
    });
    split_rule_button.on("click", function () {
        var seg_id = Number(d3.select("#point_id").text());
        var url = "/split_rule?seg_id=" + seg_id;
        fetch(url)
            .then(function (resp) { return resp.json(); })
            .then(function (json) {
            var split_points = json.result;
            console.log(split_points);
        });
    });
});
