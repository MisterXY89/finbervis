"use strict";
// see https://observablehq.com/@mbostock/the-impact-of-vaccines
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
function transform_data_hm(data) {
    console.log("hm transform_data: ", data);
    data.map(function (row) {
        row.tokens = (row.tokens != undefined) ? tok_to_array(row.tokens) : [];
        row.saliency_score = (row.saliency_score != undefined) ? to_array(row.saliency_score) : [];
        row.embeddings = (row.embeddings != undefined) ? to_array(row.embeddings) : [];
        row.cls_embs = (row.cls_embs != undefined) ? to_array(row.cls_embs) : [];
        row.props = (row.props != undefined) ? to_array(row.props) : [];
        row.x = (row.x != undefined) ? Number(row.x) : 0;
        row.y = (row.y != undefined) ? Number(row.y) : 0;
        row.id = (row.id != undefined) ? Number(row.id) : -1;
        row.tokens.map(function (el) { return el == "," ? "COMMA" : el; });
    });
    console.log(data);
    return data;
}
function hide_heatmap(hm_id) {
    $("#" + hm_id).hide();
    if (Array.from($("#self-attention-heatmap g")).length <= 0) {
        $(".modal").first().modal("hide");
    }
}
function load_attention_heatmap_data(segment, layer, head) {
    return __awaiter(this, void 0, void 0, function () {
        var csv_url, papa_config, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    csv_url = "/get-attention?layer=" + layer + "&head=" + head + "&segment=" + segment;
                    papa_config = { delimiter: ",", header: true };
                    return [4 /*yield*/, fetch(csv_url)
                            .then(function (resp) { return resp.text(); })
                            .then(function (t) { return Papa.parse(t, papa_config); })
                            .then(function (data) {
                            return transform_data_hm(data.data);
                        })];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, {
                            data: data,
                            layer: layer,
                            head: head
                        }];
            }
        });
    });
}
var Heatmap = /** @class */ (function () {
    function Heatmap(data, div_id) {
        this.data = data.data;
        this.layer = data.layer;
        this.head = data.head;
        this.div_id = div_id;
        this.margin = {
            top: 125,
            right: 30,
            bottom: 80,
            left: 80
        },
            this.width = 650;
        this.height = 650;
        this.vis_width = this.width - this.margin.left - this.margin.right;
        this.vis_height = this.height - this.margin.top - this.margin.bottom;
    }
    Heatmap.prototype.color_scale = function (x) {
        var sc = d3.scaleLinear().domain([-1, 1]).range([0, 1]);
        return d3.interpolateBrBG(sc(x));
    };
    Heatmap.prototype.draw = function () {
        var svg = d3.select(this.div_id)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("id", "hm" + d.id)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        var token_data = this.data.map(function (e) { return e.token_x; });
        var b_tokens = token_data.slice(0, token_data.indexOf("[SEP]") + 1);
        var token_xs = b_tokens;
        var token_ys = b_tokens;
        // var token_xs = segment_tokens;
        // var token_ys = segment_tokens;
        console.log(token_xs);
        console.log(token_ys);
        // Build X scales and axis:
        var x = d3.scaleBand()
            .range([0, width])
            .domain(token_xs)
            .padding(0.02);
        svg.append("g")
            .style("font-size", 15)
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(x).tickSize(0))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)")
            .style("padding-bottom", "2em");
        var y = d3.scaleBand()
            .range([this.height, 0])
            .domain(token_ys)
            .padding(0.02);
        svg.append("g")
            .style("font-size", 15)
            .call(d3.axisLeft(y).tickSize(0))
            .select(".domain").remove();
        // Build color scale
        var heatmap_get_color = d3.scaleSequential()
            .interpolator(d3.interpolateInferno)
            .domain([0, 1]);
        // create a tooltip
        // var tooltip = d3.select("#my_dataviz")
        //   .append("div")
        //   .style("opacity", 0)
        //   .attr("class", "tooltip")
        //   .style("background-color", "white")
        //   .style("padding", "5px")
        // add the squares
        svg.selectAll()
            .data(this.data, function (d) { return d.token_x + ':' + d.token_y; })
            .enter()
            .append("rect")
            .attr("x", function (d) { return x(d.token_x); })
            .attr("y", function (d) { return y(d.token_y); })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function (d) {
            return heatmap_get_color(Number(d.value));
        });
        // Add title to graph
        svg.append("text")
            .attr("x", 0)
            .attr("y", -65)
            .attr("text-anchor", "left")
            .style("font-size", "22px")
            .text("Self-Attention: Layer " + (this.layer + 1) + ", head " + (this.head + 1));
        // Add subtitle to graph
        svg.append("text")
            .attr("x", 0)
            .attr("y", -35)
            .attr("text-anchor", "left")
            .style("font-size", "14px")
            .style("fill", "grey")
            .html("Self-Attention heatmap of the respective token, in layer " + (this.layer + 1) + " and head " + (this.head + 1) + ".");
        svg.append("text")
            .attr("x", 0)
            .attr("y", -15)
            .attr("text-anchor", "left")
            .style("font-size", "14px")
            .style("fill", "grey")
            .html("Y-Axis tokens attend to X-Axis tokens, Scale from black to blue to yellow. <a href='#hide-heatmap' onclick='hide_heatmap(\"hm" + d.id + "\")'>Hide</a>");
    };
    return Heatmap;
}());
