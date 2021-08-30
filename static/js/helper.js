"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
function toast_msg(msg) {
    $("#toast-msg").html(msg);
    $('.toast').toast("show");
}
function unzoom() {
    window.zoom = false;
    // click_point(window.d);
}
function to_array(string) {
    // console.log(string);
    if (typeof string == "object") {
        return string;
    }
    if (string == undefined) {
        return [];
    }
    var arr = string.slice(1, -1).split(", ");
    if (Number.isNaN(Number(arr[0]))) {
        if (arr[0][0] == "''") {
            return arr.map(function (el) { return el.slice(1, -1); });
        }
        return arr;
    }
    return arr.map(Number);
}
function load_data(fi1, fi2) {
    return __awaiter(this, void 0, void 0, function () {
        var papa_config, data1, data2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    papa_config = { delimiter: ",", header: true };
                    return [4 /*yield*/, fetch("/data/" + fi1)
                            .then(function (resp) { return resp.text(); })
                            .then(function (t) { return Papa.parse(t, papa_config); })
                            .then(function (data1) {
                            console.log("pre trans ", data1);
                            return transform_data(data1.data);
                        })];
                case 1:
                    data1 = _a.sent();
                    if (!fi2) {
                        return [2 /*return*/, { data1: data1 }];
                    }
                    return [4 /*yield*/, fetch("/data/" + fi2)
                            .then(function (resp) { return resp.text(); })
                            .then(function (t) { return Papa.parse(t, papa_config); })
                            .then(function (data2) {
                            return transform_data(data2.data);
                        })];
                case 2:
                    data2 = _a.sent();
                    return [2 /*return*/, { data1: data1, data2: data2 }];
            }
        });
    });
}
function transform_data(data) {
    data.map(function (row) {
        row.tokens = (row.tokens != undefined) ? tok_to_array(row.tokens, true) : [];
        row.saliency_score = (row.saliency_score != undefined) ? to_array(row.saliency_score) : [];
        row.embeddings = (row.embeddings != undefined) ? to_array(row.embeddings) : [];
        row.cls_embs = (row.cls_embs != undefined) ? to_array(row.cls_embs) : [];
        row.props = (row.props != undefined) ? to_array(row.props) : [];
        row.x = (row.x != undefined) ? Number(row.x) : 0;
        row.y = (row.y != undefined) ? Number(row.y) : 0;
        row.id = (row.id != undefined) ? Number(row.id) : -1;
        row.one_hot_cluster = (row.one_hot_cluster != undefined) ? Number(row.one_hot_cluster) : -1;
        row.one_hot = (row.one_hot != undefined) ? to_array(row.one_hot, false) : [];
        row.pos_tag_classes = (row.pos_tag_classes != undefined) ? to_array(row.pos_tag_classes, false) : [];
        row.deRoseAttention = (row.deRoseAttention != undefined) ? to_array(row.deRoseAttention) : [];
        row.pos_tags = (row.pos_tags != undefined) ? to_array(row.pos_tags) : [];
    });
    console.log("transformed_data:", data);
    return data;
}
function get_sentiment_color(sentiment) {
    var color_sent_dict = {
        neutral: "#64abe5",
        negative: "#9e64e5",
        positive: "#abe564"
    };
    return color_sent_dict[sentiment];
}
function create_heatmap(segment, layer, head, div_id) {
    load_attention_heatmap_data(segment, layer, head).then(function (data) {
        new Heatmap(data, div_id);
    });
}
function get_sentiment_html(sent, truth_label, is_truth_label) {
    truth_label = truth_label == undefined ? "" : truth_label;
    is_truth_label = is_truth_label == undefined ? false : is_truth_label;
    var truth_label_sentiment_class = "";
    if (is_truth_label && truth_label != sent) {
        truth_label_sentiment_class = "truth-label-sentiment";
        sent = truth_label;
    }
    return "<span class=\"badge badge-pill class-" + sent + " " + truth_label_sentiment_class + "\" style=\"line-height:1.5em;\">" + sent + "</span>";
}
function get_max_value(str_props, pretty) {
    pretty = pretty == undefined ? false : pretty;
    if (str_props == "NaN" || str_props == "Na" || str_props == undefined) {
        // console.log(str_props);
        return (pretty) ? "-" : 0;
    }
    var max_val;
    if (typeof str_props == "object" && str_props.length == 3) {
        // console.log("str_props", str_props);
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
function tok_to_array(string, tok) {
    tok = (tok == undefined) ? true : tok;
    if (string == undefined) {
        return [];
    }
    if (typeof string == "object") {
        if (string.tokens != undefined) {
            return string.tokens;
        }
        return string;
    }
    if (!tok) {
        return string.slice(1, -1).split(",").map(Number);
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
    var data = new FormData();
    var json_string = JSON.stringify({ sentiment: sentiment, segment: segment });
    console.log("add_label", json_string);
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
