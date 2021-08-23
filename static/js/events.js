"use strict";
function click_point(d, clicked_index) {
    $("#self-attention-heatmap svg").remove();
    document.getElementById("show-similar").disabled = false;
    document.getElementById("self-attention-collapse-btn").disabled = false;
    $("#similar-sents-display").css("opacity", 0.5);
    $("#similar-sents-ents-display").css("opacity", 0.5);
    $("#select-splits").hide();
    if (window.last_matrix_row != undefined) {
        window.last_matrix_row.style.filter = "sepia(0%)";
    }
    console.log(d, clicked_index);
    var current_target;
    if (typeof d == "number" || d3.event == null) {
        if (window.search_result_data[d] != undefined) {
            d = window.search_result_data[d];
        }
        console.log("d.id", d.id);
        current_target = document.getElementById("" + d.id);
        // current_target = d3.selectAll('circle')._groups[0][d.id];		
    }
    else {
        current_target = d3.event.currentTarget;
    }
    console.log(current_target);
    // console.log(window.d);
    var SideBar = d3.select("#point-data");
    var attention_interaction_group = d3.select("#self-attention-interaction");
    attention_interaction_group.style("opacity", 1);
    d3.select("#user-classification").style("display", "block");
    d3.select("#point_id_display").html("#<span id='point_id'>" + d.id + "</span>");
    var split_html = '<span> | <span href="#split" id="split-rule" onclick="split_select_sentence()" class="text-info">Split</span></span>';
    var sal_html = '<span> | <a href="#toggleGrads" id="saliency-show-selected-segment" onclick="toggle_grads()">Integrated Gradients</a></span>';
    var plain_sent_html = '<span> | <a href="#plainSent" id="show-plain-selected-sent" onclick="toggle_plain_sent()">Toggle Plain/Token</a></span>';
    var attention_sent_html = '<span> | <a href="#toggle-attention-select" id="toggle-attention-select" onclick="toggle_attention_select()">Toggle Attention</a></span>';
    SideBar
        .html('<table style="width:100%">'
        // + '<tr>'
        // 		+ '<th>Class</th>'
        // 		+ '<td>'}${d.cluster}</td>`
        // + '</tr>'
        // + '<tr>'
        // 		+ '<th>Datapoint</th>'
        // 		+ `<td>(${d.x},<br>${d.y})</td>`
        // + '</tr>'
        // + `<input type="hidden" value="${d.id}" id="point_id"/>`
        + '<tr>'
        + '<th>Sentiment</th>'
        + ("<td id=\"model-sentiment\"><div class=\"row\">" + get_sentiment_html(d.sentiment) + " <i class=\"material-icons\" data-toggle=\"modal\" data-target=\"#userClassificationModal\" id=\"confirm-user-classification-sentiment\">edit</i></div></td>")
        + '</tr>'
        + '<tr>'
        + '<th>Probability</th>'
        + ("<td>" + get_max_value(d.props, true) + "</td>")
        + '</tr>'
        + '<tr>'
        + '<th>True label</th>'
        + ("<td>" + get_sentiment_html(d.sentiment, d.truth_label, true) + "</td>")
        + '</tr>'
        + '</table>'
        + '<hr />'
        + ("<strong>Segment:</strong><span clas='right text-right'><a href='#selected_segement' onclick=\"toggle_ents();\">Toggle Entities</a></span> " + sal_html + " " + attention_sent_html + " " + plain_sent_html + " " + split_html + "<br /> <hr>")
        + "<span id=\"grad-info\" class=\"text-muted\"><i class=\"material-icons small\">info_outline</i> \n\t\t\t\tColor indicates importance for classification of predicted class, with <span class=\"color-grad-positive\"></span> \n\t\t\t\tcorresponding to predicted class and <span class=\"color-grad-negative\"></span> to the other classes.<br></span>"
        + "<span id=\"attention-info\" class=\"text-muted\"><i class=\"material-icons small\">info_outline</i> \n\t\t\t\tColor indicates influence of a token 'w' with <span class=\"color-attention-max\"></span> \n\t\t\t\trepresenting a high incluence.<br></span>"
        + ("<p id='selected-segment'>" + d.segment + "</p>")
        + ("<p id='selected-segment-tokens'>" + tok_to_array(d.tokens).map(function (tok) { return "<span>" + tok + "</span> "; }).join(" ") + " </p>")
        + "<p id='selected-segment-ents'>Loading</p>");
    window.d = d;
    window.segment = d.segment;
    var rad = RADIUS;
    var select_rad = SELECT_RADIUS;
    if (window.zoom) {
        rad = ZOOM_RADIUS;
        select_rad += 5;
    }
    if (window.last_target != undefined) {
        d3.select(window.last_target)
            .attr("r", rad)
            .style("fill", window.last_color);
    }
    window.last_target = current_target;
    window.last_color = get_color(d.sentiment);
    d3.select(current_target)
        .attr("r", select_rad)
        .style("fill", SELECT_COLOR).raise();
    // let model_v = 1;
    var model_v = current_target.parentNode.parentNode.parentNode.parentNode.id.slice(-1);
    var vis_id = "matrix_vis_" + model_v;
    var matrix_vis = model_v == 1 ? window.matrix_vis_1 : window.matrix_vis_2;
    var matrix_row_idx = Object.keys(matrix_vis.one_hot_patterns).indexOf(d.one_hot.join(""));
    var matrix_row = document.getElementById(vis_id).getElementsByClassName("matrix-row")[matrix_row_idx];
    window.last_matrix_row = matrix_row;
    matrix_row.style.filter = "sepia(100%)";
    console.log(matrix_row);
}
function get_mouse_events(data) {
    // TOOL-TIP & MOUSE EVENTS
    var Tooltip = d3.select(PLOT_ID)
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "0px")
        .style("padding", "5px");
    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function (d) {
        // console.log(d);
        Tooltip
            .style("opacity", 1);
    };
    var mousemove = function (d) {
        Tooltip
            .html('<table style="width:100%">'
            + '<tr>'
            + '<th>Datapoint</th>'
            + ("<td>(" + Number(d.x).toFixed(2) + ", " + Number(d.y).toFixed(2) + ")</td>")
            + '</tr>'
            + '<tr>'
            + '<th>Sentiment</th>'
            + ("<td>" + d.sentiment + "</td>")
            + '</tr>'
            // + '<tr>'
            // 		+ '<th>Propability</th>'
            // 		+ `<td>${get_max_value(d.props, true)}</td>`
            // + '</tr>'
            + '</table>')
            // .style("left", `${d3.event.pageX+90-width}px`)
            .style("top", d3.event.pageY - height + "px")
            .style("left", d3.event.pageX - 70 + "px")
            // .style("top", `${d3.event.pageY+70}px`)
            // .style('border-color', get_color(d.sentiment))
            .style('border-color', get_color(d.sentiment));
        // .style('border-color', get_color(d.cluster));
    };
    var mouseleave = function () {
        Tooltip.style("opacity", 0);
    };
    var click = click_point;
    return [
        mouseover,
        mousemove,
        mouseleave,
        click
    ];
}
d3.select("#positiveSentimentCheckbox").on("change", function () {
    update_visible_sentiments("positive");
});
d3.select("#neutralSentimentCheckbox").on("change", function () {
    update_visible_sentiments("neutral");
});
d3.select("#negativeSentimentCheckbox").on("change", function () {
    update_visible_sentiments("negative");
});
function update_visible_sentiments(sentiment) {
    var checked = d3.select("#" + sentiment + "SentimentCheckbox").property("checked");
    var display_style = (checked) ? "block" : "none";
    // d3.selectAll("circle").style("display", "none");				
    d3.selectAll("rect")
        .transition()
        .filter(function (el) { return el.sentiment == sentiment; })
        .duration(300)
        .style("display", display_style);
}
