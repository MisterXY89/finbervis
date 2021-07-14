"use strict";
// function click_point(point_id) {
// 	$(`#${id}`).click();
// }
function edit_sentiment() {
    var correct_sentiment = d3.select("#sentiment-classes-user-classification").property("value");
    var model_sentiment = d3.select("#model-sentiment").text();
    var selected_segement = d3.select("#selected-segment").text();
    if (window.added_segment == selected_segement) {
        alert("You already added this segment.");
    }
    if (correct_sentiment == model_sentiment) {
        alert("Your choosen sentiment and the predicted sentiment are identical.");
    }
    if (correct_sentiment != model_sentiment && window.added_segment != selected_segement) {
        add_labeled_record(correct_sentiment, selected_segement);
    }
}
function toggle_attention_select() {
    $("#selected-segment").hide();
    $("#selected-segment-ents").hide();
    $("#selected-segment-tokens").show();
    var sent = document.getElementById("selected-segment-tokens");
    // let sent_attention = to_array(window.d["mean_attention"]);
    var sent_attention = to_array(window.d["deRoseAttention"]);
    Array.from(sent.getElementsByTagName("span")).forEach(function (span, span_i) {
        if (span.style.borderTop == "" || span.style.borderTop == undefined || span.style.borderTop == "unset") {
            $("#attention-info").show();
            var max_val = d3.max(sent_attention);
            var min_val = d3.min(sent_attention);
            var color = d3.scaleLinear()
                .domain([min_val, max_val])
                .range(["#d9d9d9", "#ff5921"]);
            // var color = d3.scaleLinear()
            // 	.domain([0, 1])
            // 	.range(["#ffd6a1", "#e35f00"]);   // output for opacity between .3 and 1 %
            // white edf6f9
            // ffb600 - warm yellow
            // ff4800 - warm orange			
            var color_val = color(sent_attention[span_i]);
            span.style.borderTop = "3px " + color_val + " solid";
        }
        else {
            span.style.borderTop = "unset";
            $("#attention-info").hide();
        }
    });
}
function split_select_sentence() {
    if ($("#select-splits").is(":visible")) {
        $("#select-splits").hide();
    }
    else {
        $("#select-splits").show();
        if ($("#splits-spinner").is(":visible")) {
            var seg_id = Number(d3.select("#point_id").text());
            var url = "/split_rule?seg_id=" + seg_id;
            fetch(url)
                .then(function (resp) { return resp.json(); })
                .then(function (json) {
                var split_points = json.result;
                console.log(split_points);
                if (!split_points) {
                    toast_msg("No splits found!");
                    $("#select-splits").hide();
                }
                else {
                    var split_html_1 = "<div> <strong>Splits</strong><br><small>Splits can be toggled by clicking again on 'Split'</small><hr>";
                    split_points.forEach(function (el) {
                        split_html_1 += "<div class=\"row\">\n\t\t\t\t\t\t\t<div class=\"col-10\">" + el.segment + "</div>\n\t\t\t\t\t\t\t<div class='col-2'>\n\t\t\t\t\t\t\t\t<span class='text-muted'>ID: #" + el.id + "</span> <br>\n\t\t\t\t\t\t\t\t" + get_sentiment_html(el.sentiment) + " <br>\n\t\t\t\t\t\t\t\t<span class='text-muted'>" + get_max_value(el.props, true) + "</span> <br>\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div><hr><br>";
                        // ${get_sentiment_html(el.truth_label)} <br>
                    });
                    split_html_1 += "</div></hr>";
                    $("#select-splits").html(split_html_1);
                    $("#select-splits").show();
                }
            });
        }
    }
}
function toggle_ents() {
    $("#grad-info").hide();
    $("#attention-info").hide();
    if ($("#selected-segment-ents").text() != "Loading" && !$("#selected-segment-ents").is(":visible")) {
        $("#selected-segment-ents").show();
        $("#selected-segment").hide();
        $("#selected-segment-tokens").hide();
        console.log("not visible but calculated");
        return 1;
    }
    else if ($("#selected-segment-ents").is(":visible")) {
        $("#selected-segment-ents").hide();
        $("#selected-segment-tokens").show();
    }
    else {
        var seq_id = d3.select("#point_id").text();
        var url = "/get_entities?seq_id=" + seq_id;
        fetch(url)
            .then(function (resp) { return resp.json(); })
            .then(function (json) {
            // let res = json.result;
            var ents_html = json.result;
            if (ents_html.indexOf("<mark") == -1) {
                toast_msg("No entities found");
            }
            d3.select("#selected-segment-ents").html(ents_html);
            $("#selected-segment").hide();
            $("#selected-segment-tokens").hide();
            $("#selected-segment-ents").show();
            // $("#selected-segment-ents").toggle();
            // $("#selected-segment").toggle();
        });
    }
}
function to_array(string) {
    // console.log(string);
    if (typeof string == "object") {
        return string;
    }
    if (string == undefined) {
        return [];
    }
    return string.slice(1, -1).split(", ").map(function (el) { return Number(el); });
}
function get_segment_html(seg) {
    // type="button" class="btn btn-secondary"
    return "<div class=\"search-seg\" title=\"" + seg + "\">\n  \t" + seg.slice(0, 120) + "...\n\t</div>";
}
function prep_search_vis(res) {
    var html = "";
    // .slice(0,10)
    window.search_result_data = [];
    res.forEach(function (element, i) {
        window.search_result_data.push(element);
        html += '<div class="card" style="width: 100%;">'
            + '<div class="card-body">'
            + "<div class=\"card-title row\">"
            + "<div class=\"col-8\">"
            // + `<h5>Result #${i+1}</h5>`
            + ("<strong>Segment</strong> <span class=\"text-muted\">#" + element.id + "</span><br>")
            + "</div>"
            + "<div class=\"col-4\">"
            + ("<a href=\"#\" class=\"btn btn-primary\" onclick='click_point(" + i + ");'>Select</a>")
            + "</div>"
            + "</div>"
            + "<p class=\"card-text\">"
            // + `<strong>ID</strong> ${element.id}<hr>`
            + (get_segment_html(element.segment) + "<br>")
            + "<div class=\"row\">"
            + "<div class=\"col-8\">"
            + "<strong>Sentiment</strong>"
            + "</div>"
            + "<div class=\"col-4\">"
            + ("" + get_sentiment_html(element.sentiment))
            + "</div>"
            + "</div>"
            + '</p>'
            + '</div>'
            + '</div><br>';
    });
    return html;
}
// todo rem
function visualize_saliency(res, el) {
    var tokens = res.tokens;
    var scores = res.scores;
    var label = res.sentiment;
    var token_html = "<div class='sal-text'>";
    tokens.forEach(function (tok, i) {
        var opacity = Math.abs(scores[i]);
        // todo: scale change
        var token_grad_color = "58,100,229"; // negative values
        if (scores[i] > 0) {
            token_grad_color = "221,89,100";
        }
        var color = "rgba(" + token_grad_color + ", " + opacity + ")";
        token_html += "<span style=\"background-color: " + color + ";\">" + tok + " </span>";
    });
    token_html += "</div>";
    // console.log(token_html);
    // console.log(el.parentElement.parentElement.getElementsByTagName("div")[0]);
    el.parentElement.parentElement.getElementsByTagName("div")[0].innerHTML += token_html;
    var parent = el.parentElement.parentElement.getElementsByTagName("div")[0];
    var sal_div = parent.getElementsByClassName("sal-text")[0];
    var plain_div = parent.getElementsByClassName("plain-text")[0];
    sal_div.style.display == "block";
    plain_div.style.display == "none";
    // toggle_sal_plain(el);	
    // return token_html;
}
function toggle_sal_plain(el) {
    var parent = el.parentElement.parentElement.getElementsByTagName("div")[0];
    // console.log(parent);
    var sal_div = parent.getElementsByClassName("sal-text")[0];
    var plain_div = parent.getElementsByClassName("plain-text")[0];
    if (sal_div.style.display == "block") {
        sal_div.style.display == "none";
        plain_div.style.display == "block";
    }
    else {
        sal_div.style.display == "block";
        plain_div.style.display == "none";
    }
}
function get_saliency_scores(el, seg_id) {
    // console.log(el);
    var spinner = el.getElementsByClassName("saliency-calc-spinner")[0];
    // let graph_icon = el.getElementById("graph_icon")[0];
    spinner.style.display = "block";
    // graph_icon.style.display = "none";
    var url = "/get_scores?seg_id=" + seg_id;
    fetch(url)
        .then(function (resp) { return resp.json(); })
        .then(function (json) {
        var res = json.result;
        console.log(res);
        // graph_icon.style.display = "block";
        spinner.style.display = "none";
        // visualize_saliency(res, el);	
    });
    return 1;
}
function get_mean_attention_html(tokens, attention, sent) {
    // tokens = ("[CLS]" + sent).split(" ");
    var att_html = "";
    tokens.forEach(function (tok, i) {
        tok = tok.replace("##", "");
        // let color_val = attention[i];
        // border-top: 3px and map value to color
        var color = d3.scaleLinear()
            .domain([0, 0.9])
            .range(["#ddd", "#540012"]); // output for opacity between .3 and 1 %
        // white edf6f9
        // ffb600 - warm yellow
        // ff4800 - warm orange
        // console.log(attention[i]);
        var color_val = color(attention[i]);
        att_html += "<span style=\"border-top: 3px " + color_val + " solid;\">" + tok + " </span>";
    });
    return att_html;
}
function search_data(search_q) {
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
        .then(function (resp) {
        if (search_q == ")()UJIH=all") {
            return resp.text();
        }
        return resp.json();
    })
        .then(function (json) {
        console.log(json);
        $("#search_results-wrapper").show();
        if (search_q == "OJOJOJOO =all") {
            alert("=all");
            $("#search-header").html("All Segments");
            $("#search-results").html(json);
            $("#search-results").show();
        }
        else {
            var res = json.result;
            // console.log(res);
            d3.select("#search-results").html(prep_search_vis(res));
            d3.select("#total-results").text(res.length);
        }
    });
}
function extract_ents_json(html, res) {
    var json = [];
    var doc = document.createElement('html');
    doc.innerHTML = html;
    var ents = Array.from(doc.getElementsByClassName("entities")); //.slice(1);
    console.log(ents);
    console.log(ents.length);
    // html = 
    ents.forEach(function (ent_sent, i) {
        console.log("#### SENT ", i);
        var curr_i = 0;
        Array.from(ent_sent.getElementsByTagName("mark")).forEach(function (el, mark_i) {
            console.log("-----");
            var el_toks = el.textContent;
            var el_style = el.style;
            var el_ent_type = el.getElementsByTagName("span")[0].textContent;
            el_toks = el_toks.replace(el_ent_type, "").replace(/\n/g, "").replace(/\s\s+/g, " ");
            el_toks = (el_toks[0] == " ") ? el_toks.slice(1) : el_toks;
            el_toks = (el_toks[el_toks.length - 1][-1] == " ") ? el_toks.slice(-1) : el_toks;
            el_toks = el_toks.split(" ").filter(function (el) { return el.length > 0; });
            var el_toks_copy = [];
            el_toks.forEach(function (et) {
                if (et.includes(",")) {
                    var ets = et.split(",");
                    el_toks_copy.push(ets[0]);
                    el_toks_copy.push(",");
                    el_toks_copy.push(ets[1]);
                }
                else {
                    el_toks_copy.push(et);
                }
            });
            el_toks = el_toks_copy;
            // let el_tok_index = ent_sent.textContent.slice(curr_i, Number(ent_sent.textContent.slice(curr_i).indexOf(el_toks.join(" "))) +el_toks.join(" ").length+curr_i).split(" ").map(el => el.replace(/\n/g, "")).filter(el => el.length > 0).length-el_toks.length-6;
            var split_index_end = ent_sent.textContent.slice(curr_i).indexOf(el_toks.join(" "));
            if (split_index_end == -1) {
                split_index_end = ent_sent.textContent.slice(curr_i).indexOf(el_toks[0]);
            }
            split_index_end += el_toks.join(" ").length;
            var el_tok_index = ent_sent.textContent.slice(0, split_index_end).split(" ").map(function (el) { return el.replace(/\n/g, ""); }).filter(function (el) { return el.length > 0; }).length - 5;
            curr_i = el_tok_index;
            console.log(el_toks);
            console.log(el_tok_index);
            el_toks = el_toks.map(function (s) { return s.toLowerCase(); });
            // console.log(el_ent_type);
            // console.log(el_toks);
            var count = el_toks.length;
            if (res[i]["entity_styles"] == undefined) {
                res[i]["entity_styles"] = {};
            }
            if (res[i]["entities"] == undefined) {
                res[i]["entities"] = [];
            }
            res[i]["entity_styles"][el_ent_type] = el_style;
            res[i].tokens.forEach(function (tok, tok_i) {
                if (count == 0 && res[i]["entities"].length == res[i].tokens.length) {
                    return;
                }
                var push_ent_type = "";
                if (res[i]["entities"][tok_i] == undefined) {
                    res[i]["entities"][tok_i] = "";
                }
                if (res[i]["entities"][tok_i] == "") {
                    console.log(tok_i, tok);
                    if (el_toks.includes(tok) && tok_i >= el_tok_index && tok_i <= el_tok_index + 12) {
                        console.log("SAME");
                        console.log(el_ent_type);
                        push_ent_type = el_ent_type + "_" + mark_i;
                        count--;
                    }
                    res[i]["entities"][tok_i] = push_ent_type;
                    console.log(res[i]["entities"]);
                }
            });
        });
    });
    return res;
}
function toggle_grads() {
    $("#selected-segment").hide();
    $("#selected-segment-ents").hide();
    var sent = document.getElementById("selected-segment-tokens");
    Array.from(sent.getElementsByTagName("span")).forEach(function (span, span_i) {
        var sal_scores = window.d["saliency_score"];
        sal_scores = to_array(sal_scores);
        var opacity = Math.abs(sal_scores[span_i]);
        var token_grad_color = "252,186,3"; // negative values
        if (sal_scores[span_i] > 0) {
            token_grad_color = "221,89,100";
        }
        var color = "rgba(" + token_grad_color + ", " + opacity + ")";
        // if (span.classList.contains("identical-token")) {
        // 	span.classList.remove("identical-token");
        // }
        // if (span.classList.contains("identical-token-stopword")) {
        // 	span.classList.remove("identical-token-stopword");
        // }
        if (span.classList.contains("saliency-active") && $("#selected-segment-tokens").is(":visible")) {
            span.style.backgroundColor = "transparent";
            span.classList.remove("saliency-active");
            $("#grad-info").hide();
        }
        else {
            $("#grad-info").show();
            span.style.backgroundColor = color;
            span.classList.add("saliency-active");
        }
    });
    $("#selected-segment-tokens").show();
    // sent += '<span id="info-grad"><br /> <i class="material-icons">info_outline</i> Red indicated importance for predicted label</span>';
}
function toggle_plain_sent() {
    if ($("#selected-segment").is(':visible')) {
        $("#selected-segment-ents").hide();
        $("#selected-segment").hide();
        $("#selected-segment-tokens").show();
    }
    else {
        $("#selected-segment-tokens").hide();
        $("#selected-segment-ents").hide();
        $("#selected-segment").show();
        $("#info-grad").hide();
    }
}
document.addEventListener("DOMContentLoaded", function () {
    load_pixel_vis_data().then(function (data) {
        pixelVis = new PixelVis(data, "#pixelVis");
    });
    document.getElementById("show-similar").disabled = true;
    document.getElementById("self-attention-collapse-btn").disabled = true;
    // search_data("=all");
    $('.toast').toast({
        delay: 12500
    });
    // $('#toast').toast('hide');
    scatter_plot({}, false);
    var test_sent = "Joseph Robinette Biden Jr. was sworn in as the 46th president of the United States.";
    // "taking office at a moment of profound economic, health and political crises with a promise to seek unity after a tumultuous four years that tore at the fabric of American society.";
    console.log(test_sent);
    var spinner = d3.select("#spinning-overlay");
    var test_rule_button = d3.select("#test-rule");
    var test_rule_segment_field = d3.select("#segmentInput");
    var segment_attention_button = d3.select("#segment-attention");
    var explore_neighbours_button = d3.select("#explore-neighbours");
    var hide_heatmap_button = d3.select("#hide-heatmap");
    var layer_input = d3.select("#layer_input");
    var head_input = d3.select("#head_input");
    var layer_input_neighbours = d3.select("#layer_input_neighbours");
    var head_input_neighbours = d3.select("#head_input_neighbours");
    var attention_interaction_group = d3.select("#self-attention-interaction");
    var confirm_user_classification_sentiment_button = d3.select("#confirm-user-classification-sentiment");
    var similar_sents_display = d3.select("#similar-sents-display");
    var similar_sents_display_plain = d3.select("#similar_sents_display_plain");
    var show_similar_sents_button = d3.select("#show-similar");
    var toggle_ents_sim_sents_button = d3.select("#toggle_ents_sim_sents");
    var toggle_ents = d3.select("#toggle-ents");
    var search_button = d3.select("#searchButton");
    var search_input = d3.select("#searchInput");
    var toggle_identical_words_sim_sents_button = d3.select("#toggle_identical_words_sim_sents_button");
    var split_rule_button = d3.select("#split-rule");
    var toggle_mean_attention_button = d3.select("#toggle_mean_attention");
    var similar_sents_display_attention = d3.select("#similar_sents_display_attention");
    var toggle_gradients_button = d3.select("#toggle_gradients");
    test_rule_button.on("click", function () {
        attention_interaction_group.style("opacity", 1);
        spinner.style("display", "block");
        var segment = test_rule_segment_field.property("value");
        // console.log(segment);
        var url = "/test_user_data"
            + ("?segment=" + segment);
        fetch(url)
            .then(function (response) { return response.json(); })
            .then(function (json) {
            console.log(json);
            // add_datapoint(json);
            spinner.style("display", "none");
            scatter_plot(json, true);
            // click_point(json);
            // user_classification_select.style("display", "block");
        });
    });
    toggle_gradients_button.on("click", function () {
        $("#show-simmilar").show();
        $("#similar-sents-ents-display").hide();
        Array.from(document.getElementsByClassName("sim-sentence")).forEach(function (sent, sent_i) {
            Array.from(sent.getElementsByTagName("span")).forEach(function (span, span_i) {
                var sal_scores = window.sim_res[sent_i]["saliency_score"];
                sal_scores = to_array(sal_scores);
                var opacity = Math.abs(sal_scores[span_i]);
                var token_grad_color = "252,186,3"; // negative values
                if (sal_scores[span_i] > 0) {
                    token_grad_color = "221,89,100";
                }
                var color = "rgba(" + token_grad_color + ", " + opacity + ")";
                if (span.classList.contains("identical-token")) {
                    span.classList.remove("identical-token");
                }
                if (span.classList.contains("identical-token-stopword")) {
                    span.classList.remove("identical-token-stopword");
                }
                if (span.classList.contains("saliency-active") && $("#similar-sents-display").is(":visible")) {
                    span.style.backgroundColor = "transparent";
                    span.classList.remove("saliency-active");
                    $("#grad-info").hide();
                }
                else {
                    span.style.backgroundColor = color;
                    span.classList.add("saliency-active");
                    $("#grad-info").show();
                }
            });
        });
        $("#similar-sents-display").show();
    });
    show_similar_sents_button.on("click", function () {
        $("#show-simmilar").show();
        var id = d3.select("#point_id").text();
        var url = "/get_similar_segments?seg_id=" + id + "&return_sents=True";
        console.log(url);
        // TODO: disable button & add loading cirlcle next to it
        $("#sim-sent-spinner").toggle();
        document.getElementById("show-similar").disabled = true;
        fetch(url)
            .then(function (resp) { return resp.json(); })
            .then(function (json) {
            var res = json.result;
            res = res.map(function (el) {
                return {
                    id: el.id,
                    mean_attention: el.mean_attention,
                    deRoseAttention: el.deRoseAttention,
                    props: el.props,
                    saliency_score: el.saliency_score,
                    segment: el.segment,
                    sentiment: el.sentiment,
                    tokens: tok_to_array(el.tokens),
                    entities: el.entities,
                    truth_label: el.truth_label
                };
            });
            window.sim_res = res;
            // console.log(res);
            if (!res.length == 0) {
                var ents_html = json.ent_html;
                // let ents_json = extract_ents_json(ents_html, res);
                // console.log(ents_json);
                var new_origin = json.origin_sent_ent_html;
                var sim_sent_html_1 = "";
                res.forEach(function (el) {
                    console.log(el);
                    sim_sent_html_1 += "<div class='row'>\n\t\t\t\t\t<div class='sim-sentence col-10'> \n\t\t\t\t\t\t" + el.tokens.map(function (tok) { return "<span>" + tok + "</span> "; }).join(" ") + " \n\t\t\t\t\t</div>\n\t\t\t\t\t<div class='col-2'>\n\t\t\t\t\t\t<span class='text-muted'>ID: #" + el.id + "</span> <br>\n\t\t\t\t\t\t" + get_sentiment_html(el.sentiment) + " <br>\n\t\t\t\t\t\t<span class='text-muted'>" + get_max_value(el.props, true) + "</span> <br>\n\t\t\t\t\t\t" + get_sentiment_html(el.truth_label) + " <br>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<hr/>";
                });
                $("#similar-sents-display").html(sim_sent_html_1);
                $("#selected-segment-ents").html(new_origin);
                $("#similar-sents-ents-display").html(ents_html);
                $("#toggle_ents_sim_sents").show();
                $("#toggle_mean_attention").show();
                $("#toggle_identical_words_sim_sents_button").show();
                $("#toggle_gradients").show();
            }
            else {
                $("#similar-sents-display").html("No similiar sentences below the similiarity threshold (10) could be found.");
            }
            $("#similar-sents-display").css("opacity", 1);
            $("#similar-sents-ents-display").css("opacity", 1);
            $("#sim-sent-spinner").toggle();
            document.getElementById("show-similar").disabled = false;
        });
    });
    toggle_ents_sim_sents_button.on("click", function () {
        $("#show-simmilar").show();
        $("#grad-info").hide();
        $("#attention-info").hide();
        $("#similar-sents-display").toggle();
        $("#similar-sents-ents-display").toggle();
        // let segment_select_tokens = tok_to_array(window.d.tokens).slice(1, -1);
        // 
        // Array.from(document.getElementsByClassName("sim-sentence")).forEach((sent, sent_i) => {
        // 	let index = 0;
        // 	let element = window.sim_res[sent_i];
        // 	let ents = element["entities"];
        // 	Array.from(sent.getElementsByTagName("span")).forEach((span, span_i) => {
        // 
        // 		if (span.backgroundColor != "") {
        // 			span.style.backgroundColor = "";
        // 			span.classList.remove("saliency-active");
        // 		}
        // 
        // 		if (span.classList.contains("saliency-active")) {
        // 			span.style.backgroundColor = "transparent";
        // 			span.classList.remove("entity");
        // 			span.classList.remove(`entity entity-${ent_type}`);
        // 		}
        // 
        // 		let el_entity = ents[span_i];
        // 		if (el_entity != "") {
        // 				console.log(el_entity);
        // 				console.log(ents[span_i+1]);
        // 				// if (span_i +1 >= ents.length) {
        // 				if (ents[span_i+1] != el_entity) {
        // 					// let next_el = Array.from(sent.getElementsByTagName("span"))[span_i+1];
        // 					span.textContent += `(${el_entity})`;
        // 				}
        // 
        // 				if (span.classList.contains("entity")) {
        // 					span.style.backgroundColor = "transparent";
        // 					span.classList.remove("entity");
        // 					span.classList.remove(`entity-${el_entity}`);
        // 				} else {
        // 					span.classList.add("entity");
        // 					span.classList.add(`entity-${el_entity}`);
        // 				}
        // 		}
        // 
        // 	});
        // });
    });
    toggle_mean_attention_button.on("click", function () {
        $("#show-simmilar").show();
        $("#similar-sents-display").show();
        $("#similar-sents-ents-display").hide();
        Array.from(document.getElementsByClassName("sim-sentence")).forEach(function (sent, sent_i) {
            var deRose_attention = window.sim_res[sent_i]["deRoseAttention"];
            deRose_attention = to_array(deRose_attention);
            var max_val = d3.max(deRose_attention);
            var min_val = d3.min(deRose_attention);
            // let mean_attention = window.sim_res[sent_i]["mean_attention"];			
            Array.from(sent.getElementsByTagName("span")).forEach(function (span, span_i) {
                // console.log(deRose_attention[span_i]);
                // var scale = d3.scale.linear().domain([0, max]).range([0, 100]);
                var color = d3.scaleLinear()
                    .domain([min_val, max_val])
                    .range(["#d9d9d9", "#ff5921"]);
                var color_val = color(deRose_attention[span_i]);
                // console.log(color_val);
                // console.log(color_val);
                if (span.style.borderTop == "none" || span.style.borderTop == "") {
                    $("#attention-info").show();
                    span.style.borderTop = "3px solid " + color_val;
                }
                else {
                    span.style.borderTop = "none";
                    $("#attention-info").hide();
                }
            });
        });
    });
    toggle_identical_words_sim_sents_button.on("click", function () {
        $("#show-simmilar").show();
        // let segment_select_display = window.tokens.toLowerCase();
        var segment_select_tokens = tok_to_array(window.d.tokens).slice(1, -1);
        Array.from(document.getElementsByClassName("sim-sentence")).forEach(function (sent, sent_i) {
            Array.from(sent.getElementsByTagName("span")).forEach(function (span, span_i) {
                var token_low = span.textContent;
                if (span.backgroundColor != "") {
                    span.style.backgroundColor = "";
                    span.classList.remove("saliency-active");
                }
                if (segment_select_tokens.includes(token_low)) {
                    var class_name = "identical-token";
                    if (stop_words.includes(token_low)) {
                        class_name += " " + class_name + "-stopword";
                    }
                    if (span.classList.contains("identical-token")) {
                        span.classList.remove("identical-token");
                        if (span.classList.contains("identical-token-stopword")) {
                            span.classList.remove("identical-token-stopword");
                        }
                    }
                    else {
                        class_name.split(" ").forEach(function (n) { return span.classList.add(n); });
                    }
                }
            });
        });
    });
    $("#toggle-ente").on("click", function () {
        $("#show-simmilar").show();
        // let segment_select_display = window.tokens.toLowerCase();
        var segment_select_tokens = tok_to_array(window.d.tokens).slice(1, -1);
        Array.from(document.getElementsByClassName("sim-sentence")).forEach(function (sent, sent_i) {
            var index = 0;
            var element = window.sim_res[sent_i];
            var ents = element["entities"];
            Array.from(sent.getElementsByTagName("span")).forEach(function (span, span_i) {
                var el_entity = ents[span_i];
                // console.log(el_entity);
                // let ent_type = el_entity
                if (span.backgroundColor != "") {
                    span.style.backgroundColor = "";
                    span.classList.remove("saliency-active");
                }
                if (span.classList.contains("saliency-active")) {
                    span.style.backgroundColor = "transparent";
                    span.classList.remove("entity");
                    span.classList.remove("entity entity-" + ent_type);
                }
                else {
                    span.classList.remove("entity");
                }
            });
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
        edit_sentiment();
    });
    search_button.on("click", function () {
        var search_q = search_input.property("value");
        search_data(search_q);
    });
    split_rule_button.on("click", function () {
        // old split rule 
    });
});
