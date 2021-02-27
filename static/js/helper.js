"use strict";
var PLOT_ID = "#plot";
var SELECT_COLOR = "#ce0c0f";
var SELECT_RADIUS = 8;
function get_max_value(str_props, pretty) {
    pretty = pretty == undefined ? false : pretty;
    if (str_props == "NaN" || str_props == "Na" || str_props == undefined) {
        console.log(str_props);
        return (pretty) ? "-" : 0;
    }
    var max_val = Number(d3.max(str_props.slice(1, -1).replace(" ", "").split(",").map(function (el) { return Number(el); })));
    if (pretty) {
        max_val = ("" + max_val * 100).slice(0, 4) + "%";
    }
    return max_val;
}
function get_mouse_events(data) {
    console.log(data[2]);
    // TOOL-TIP & MOUSE EVENTS
    var SideBar = d3.select("#point-data");
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
            // + '<tr>'
            // 		+ '<th>Class</th>'
            // 		+ '<td>'}${d.cluster}</td>`
            // + '</tr>'
            + '<tr>'
            + '<th>Datapoint</th>'
            + ("<td>(" + d.x + ",<br>" + d.y + ")</td>")
            + '</tr>'
            + '<tr>'
            + '<th>Sentiment</th>'
            + ("<td id='model-sentiment'>" + d.sentiment + "</td>")
            + '</tr>'
            + '</table>')
            // .style("left", `${d3.event.pageX+90-width}px`)
            .style("top", d3.event.pageY - height / 2 + "px")
            .style("left", d3.event.pageX - 70 + "px")
            // .style("top", `${d3.event.pageY+70}px`)
            // .style('border-color', get_color(d.sentiment))
            .style('border-color', get_color(d.sentiment));
        // .style('border-color', get_color(d.cluster));
    };
    var mouseleave = function () {
        Tooltip.style("opacity", 0);
    };
    var click = function (d) {
        var attention_interaction_group = d3.select("#self-attention-interaction");
        attention_interaction_group.style("opacity", 1);
        d3.select("#user-classification").style("display", "block");
        d3.select("#point_id_display").html("#<span id='point_id'>" + d.id + "</span>");
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
            + ("<td>" + d.sentiment + "</td>")
            + '</tr>'
            + '<tr>'
            + '<th>Probability</th>'
            + ("<td>" + get_max_value(d.props, true) + "</td>")
            + '</tr>'
            + '</table>'
            + '<hr />'
            + "<strong>Segment:</strong><span clas='right text-right'><a href='#selected_segement' onclick=\"toggle_ents();\">Toggle Entities</a></span>"
            + ("<p id='selected-segment'>" + d.segment + "</p>")
            + "<p id='selected-segment-ents'>Loading</p>");
        window.segment = d.segment;
        if (window.last_target != undefined) {
            d3.select(window.last_target)
                .attr("r", RADIUS)
                .style("fill", get_color(Number(window.last_cluster)));
        }
        window.last_target = d3.event.currentTarget;
        window.last_cluster = Number(d.cluster);
        d3.select(d3.event.currentTarget)
            .attr("r", SELECT_RADIUS)
            .style("fill", SELECT_COLOR).raise();
    };
    return [
        mouseover,
        mousemove,
        mouseleave,
        click
    ];
}
function add_labeled_record(sentiment, segment) {
    var data = new FormData();
    var json_string = JSON.stringify({ sentiment: sentiment, segment: segment });
    console.log(json_string);
    data.append("json", json_string);
    fetch("/add_labeled_record", {
        method: "POST",
        body: data
    }).then(function (resp) { return resp.json(); })
        .then(function (json) {
        if (json["status"]) {
            alert("Entry added");
            window.added_segment = segment;
        }
        // console.log(json);
    });
}
