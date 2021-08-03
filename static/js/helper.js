"use strict";
function toast_msg(msg) {
    $("#toast-msg").html(msg);
    $('.toast').toast("show");
}
function unzoom() {
    window.zoom = false;
    // click_point(window.d);
}
function create_heatmap(segment, layer, head, div_id) {
    load_attention_heatmap_data().then(function (data) {
        new Heatmap(data, div_id);
    });
}
function get_sentiment_html(sent, truth_label, is_truth_label) {
    truth_label = truth_label == undefined ? "" : truth_label;
    is_truth_label = is_truth_label == undefined ? false : is_truth_label;
    var truth_label_sentiment_class = "";
    if (is_truth_label && truth_label != sent) {
        console.log(truth_label);
        console.log(sent);
        truth_label_sentiment_class = "truth-label-sentiment";
        sent = truth_label;
    }
    return "<span class=\"badge badge-pill class-" + sent + " " + truth_label_sentiment_class + "\" style=\"line-height:1.5em;\">" + sent + "</span>";
}
function get_max_value(str_props, pretty) {
    pretty = pretty == undefined ? false : pretty;
    if (str_props == "NaN" || str_props == "Na" || str_props == undefined) {
        console.log(str_props);
        return (pretty) ? "-" : 0;
    }
    var max_val;
    if (typeof str_props == "object" && str_props.length == 3) {
        console.log("str_props", str_props);
        max_val = d3.max(str_props);
    }
    else {
        max_val = Number(d3.max(str_props.slice(1, -1).replace(" ", "").split(",").map(function (el) { return Number(el); })));
    }
    if (pretty) {
        max_val = ("" + max_val * 100).slice(0, 4) + "%";
    }
    return max_val;
}
function tok_to_array(string) {
    if (string == undefined) {
        return [];
    }
    if (typeof string == "object") {
        if (string.tokens != undefined) {
            return string.tokens;
        }
        return string;
    }
    // return string.replaceAll("', '##", "").slice(2, -1).split(", '").map(el => el.slice(0, -1))	
    string = string.split("', '");
    string[0] = "[CLS]";
    string[string.length - 1] = "[SEP]";
    return string;
}
function get_color(el, new_point) {
    // console.log(new_point);
    if (new_point) {
        return SELECT_COLOR;
    }
    if (typeof el == "string") {
        return COLORS[SENTIMENT_CLASSES.indexOf(el)];
    }
    return COLORS[el];
}
function get_color_truth(d) {
    if (d.sentiment != d.truth_label) {
        return "black";
    }
    return get_color(d.sentiment, d.new);
}
function get_radius(new_point) {
    if (new_point) {
        return SELECT_RADIUS;
    }
    return RADIUS;
}
function add_labeled_record(sentiment, segment) {
    console.log("add_label");
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
            // alert("Entry added");
            toast_msg("New sentiment added!");
            $("#userClassificationModal").modal("hide");
            window.added_segment = segment;
        }
        // console.log(json);
    });
}
