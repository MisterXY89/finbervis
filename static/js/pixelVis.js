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
function transform_data(data) {
    data.map(function (row) {
        row.tokens = (row.tokens != undefined) ? tok_to_array(row.tokens) : [];
        row.saliency_score = (row.saliency_score != undefined) ? to_array(row.saliency_score) : [];
        row.embeddings = (row.embeddings != undefined) ? to_array(row.embeddings) : [];
        row.cls_embs = (row.cls_embs != undefined) ? to_array(row.cls_embs) : [];
        row.props = (row.props != undefined) ? to_array(row.props) : [];
        row.x = (row.x != undefined) ? Number(row.x) : 0;
        row.y = (row.y != undefined) ? Number(row.y) : 0;
        row.id = (row.id != undefined) ? Number(row.id) : -1;
    });
    console.log(data);
    return data;
}
function load_pixel_vis_data(fi1, fi2) {
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
var PixelVis = /** @class */ (function () {
    function PixelVis(data, div_id) {
        this.data = data;
        this.div_id = div_id;
        this.margin = {
            top: 20,
            right: 40,
            bottom: 100,
            left: 40
        };
        this.width = 900;
        this.height = 1100;
        this.color_scale = d3.scaleLinear()
            .range(["blue", "white", "red"])
            .domain([-1, 0, 1]);
    }
    PixelVis.prototype.prep_data_for_vis = function () {
        var matrix = [];
        var y_labels = [];
        var x_labels = [];
        this.data.slice(0, 100).forEach(function (row) {
            var y = row.id;
            y_labels.push(y);
            // console.log(row.saliency_score);
            row.saliency_score.forEach(function (score, i) {
                if (!x_labels.includes(i)) {
                    x_labels.push(i);
                }
                // console.log(score, i, y)
                matrix.push({
                    x: i,
                    y: y,
                    z: score,
                    token: row.tokens[i],
                    segment: row.segment,
                    sentiment: row.sentiment
                });
            });
        });
        return { matrix: matrix, x_labels: x_labels, y_labels: y_labels };
    };
    PixelVis.prototype.draw = function () {
        var _this = this;
        // append the svg object to the body of the page
        var container = d3.select(this.div_id)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        var rd = this.prep_data_for_vis();
        console.log(rd);
        var vis_data = rd.matrix;
        // Labels of row and columns
        var x_axis_labels = rd.x_labels;
        var y_axis_labels = rd.y_labels;
        // Build X scales and axis:
        var x = d3.scaleBand()
            .range([0, this.width])
            .domain(x_axis_labels)
            .padding(0.01);
        container.append("g")
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(x));
        // Build X scales and axis:
        var y = d3.scaleBand()
            .range([this.height, 0])
            .domain(y_axis_labels)
            .padding(0.01);
        container.append("g")
            .call(d3.axisLeft(y));
        var tooltip = d3.select(this.div_id)
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");
        var mouseover = function (d) {
            tooltip.style("opacity", 1);
        };
        var mousemove = function (d) {
            tooltip
                .html("Tokens: " + d.token + " <br> Saliency score: " + d.z + " <br> Segment: " + d.segment)
                .style("left", (d3.mouse(this)[0] + 70) + "px")
                .style("top", (d3.mouse(this)[1]) + "px");
        };
        var mouseleave = function (d) {
            tooltip.style("opacity", 0);
        };
        var click = function (d) {
            console.log(d);
        };
        container.selectAll()
            .data(vis_data, function (d) { return d.x + ':' + d.y; })
            .enter()
            .append("rect")
            .attr("x", function (d) { return x(d.x); })
            .attr("y", function (d) { return y(d.y); })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function (d) { return _this.color_scale(d.z); })
            .on("click", click)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .on("mouseover", mouseover);
    };
    return PixelVis;
}());
