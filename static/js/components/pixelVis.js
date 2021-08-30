"use strict";
// see https://observablehq.com/@mbostock/the-impact-of-vaccines
// async function load_pixel_vis_data(fi1, fi2) {
// 	const papa_config = {delimiter: ",", header: true};
// 	let data1 = await fetch(`/data/${fi1}`)
// 		.then(resp => resp.text())
// 		.then(t => Papa.parse(t, papa_config))
// 		.then(data1 => {
// 			console.log("pre trans ", data1);
//     	return transform_data(data1.data);
//   	});
//   let data2 = await fetch(`/data/${fi2}`)
//   	.then(resp => resp.text())
//   	.then(t => Papa.parse(t, papa_config))
//   	.then(data2 => {
//     	return transform_data(data2.data);
//   	});
//   return { data1, data2 }
// }
function create_sentence_view(data, is_one) {
    console.log("create_sentence_view", data);
    var div_id = "#pixel-sentence-view";
    // document.getElementById(div_id.slice(1)).innerHTML = "";
    // if (is_one) {
    // 	let data1 = data;
    // 	let data2 = window.pixelVis2.data[data.y];
    // 	console.log("data2", data2);
    // } else {
    // 	let data1 = window.pixelVis1.data[data.y];
    // 	let data2 = data;
    // 	console.log("data1", data1);
    // }
    var data1 = window.pixelVis1.data[data.y];
    var data2 = window.pixelVis2.data[data.y];
    data = [data1, data2];
    console.log("- data - ", data);
    var dims = {
        height: 600,
        width: 300
    };
    var sentence_pixel_vis = new PixelVis(data, div_id, "Sentence View", false, dims);
    sentence_pixel_vis.draw();
}
var PixelVis = /** @class */ (function () {
    function PixelVis(data, div_id, name, is_one, dims) {
        // console.log(dims);
        this.sentence_view = (div_id == "#pixel-sentence-view") ? true : false;
        this.dims = (dims == undefined) ? {} : dims;
        this.is_one = (is_one == undefined) ? true : is_one;
        this.name = name;
        this.data = data;
        this.div_id = div_id;
        this.left_margin = (this.sentence_view) ? 100 : 150;
        this.margin = {
            top: 80,
            right: 100,
            bottom: 120,
            left: this.left_margin
        };
        // console.log(this.sentence_view);
        // console.log(this.dims);
        this.width = (this.dims.width == undefined) ? 600 : this.dims.width;
        this.width -= this.margin.left - this.margin.right;
        var variable_height = this.data.length * 20;
        if (variable_height > 900) {
            variable_height = 900;
        }
        this.height = (this.dims.height == undefined) ? variable_height : this.dims.height;
        this.height -= this.margin.top - this.margin.bottom;
        // this.color_scale = d3.scaleLinear()
        //   .range(["blue","white", "red"])
        //   .domain([-1, 0, 1]);
    }
    PixelVis.prototype.color_scale = function (x) {
        var sc = d3.scaleLinear().domain([-1, 1]).range([0, 1]);
        return d3.interpolateBrBG(sc(x));
    };
    PixelVis.prototype.prep_data_for_vis = function () {
        var matrix = [];
        var y_labels = [];
        var x_labels = [];
        var to_value = this.data.length == 2 ? 2 : 100;
        this.data.slice(0, to_value).forEach(function (row, index) {
            // let y = (row.id == undefined) ? index : row.id;
            var y = index;
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
                    sentiment: row.sentiment,
                    tokens: row.tokens,
                    saliency_score: row.saliency_score,
                    truth_label: row.truth_label,
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
        // console.log(rd);
        var vis_data = rd.matrix;
        // Labels of row and columns
        // console.log(this.sentence_view);
        if (this.sentence_view) {
            var x_axis_labels = rd.matrix[0].tokens;
        }
        else {
            var x_axis_labels = rd.x_labels;
        }
        var x_axis_labels_domain = rd.x_labels;
        var y_axis_labels = rd.y_labels;
        // Build X scales and axis:
        var x = d3.scaleBand()
            .range([0, this.width])
            .domain(x_axis_labels_domain)
            .padding(0.01);
        // .tickFormat(function(d) { console.log("dd", d)})
        var info_labels = this.data.map(function (d) { return "[" + d.one_hot_cluster + "]"; });
        var prop_infos = this.data.map(function (d) { return d.sentiment; });
        // Build X scales and axis:
        var y = d3.scaleBand()
            .range([this.height, 0])
            .domain(y_axis_labels)
            .padding(0.01);
        if (!this.sentence_view) {
            container.append("g")
                .attr("class", "row-stats-pixel-vis") // , d => `class-${d.sentiment}`)
                .call(d3.axisLeft(y));
        }
        container.selectAll(".row-stats-pixel-vis text")
            .style("fill", function (d) {
            // console.log("dddd", d, this);
            return get_sentiment_color(_this.data[d].sentiment);
        })
            .style("font-size", 11.5)
            .text(function (d) {
            return _this.data[d].sentiment + ", " + d3.max(_this.data[d].props).toString().slice(0, 4);
        });
        container.selectAll(".row-stats-pixel-vis line")
            .style("stroke-width", this.height / this.data.length)
            .style("stroke", function (d) {
            var el = _this.data[d];
            return el.sentiment != el.truth_label ? "red" : "white";
        });
        var tooltip = d3.select(this.div_id)
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("width", "450px")
            .style("border-radius", "5px")
            .style("padding", "5px");
        var mouseover = function (d) {
            tooltip.style("opacity", 1);
        };
        var mousemove = function (d) {
            // console.log(d3.mouse(this))
            tooltip
                .html("\n\t\t\t\t\t<table>\n\t\t\t\t\t\t<thead>\n\t\t\t\t\t\t</thead>\n\t\t\t\t\t\t<tbody>\n\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t      <th scope=\"row\">Tokens</th>\n\t\t\t\t\t      <td>" + d.token + "</td>\n\t\t\t\t\t    </tr>\n\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t      <th scope=\"row\">Saliency score</th>\n\t\t\t\t\t      <td>" + d.z + "</td>\n\t\t\t\t\t    </tr>\n\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t      <th scope=\"row\">Segment</th>\n\t\t\t\t\t      <td>" + d.segment + "</td>\n\t\t\t\t\t    </tr>\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t      <th scope=\"row\">Truth Label</th>\n\t\t\t\t\t      <td>" + get_sentiment_html(d.sentiment, d.truth_label, true) + "</td>\n\t\t\t\t\t    </tr>\n\t\t\t\t\t\t\t<tr>\n\t\t\t\t\t      <th scope=\"row\">Sentiment</th>\n\t\t\t\t\t      <td>" + get_sentiment_html(d.sentiment) + "</td>\n\t\t\t\t\t    </tr>\n\t\t\t\t\t\t</tbody>\n\t\t\t\t\t")
                .style("left", (d3.mouse(this)[0] + 120) + "px")
                .style("top", (d3.mouse(this)[1]) + 100 + "px");
        };
        var mouseleave = function (d) {
            tooltip.style("opacity", 0);
        };
        var click = function (d) {
            console.log(d);
            create_sentence_view(d, this.is_one);
        };
        if (this.sentence_view) {
            var xs_1 = d3.scaleBand()
                .range([0, this.width])
                .domain(y_axis_labels)
                .padding(0.01);
            var ys_1 = d3.scaleBand()
                .range([0, this.height])
                .domain(x_axis_labels_domain)
                .padding(0.01);
            container.append("g")
                .call(d3.axisLeft(ys_1).tickFormat(function (d) { return x_axis_labels[d]; }));
            // USE AXIS RIGHT FOR POS TAGS?
            container.append("g")
                .call(d3.axisRight(ys_1))
                .attr("class", "pos-token-sentence-view-pixl-vis")
                .style("transform", "translateX(" + this.width + "px)");
            // 	"translate(" + this.width + "," + 0 + ")");
            // .tickFormat(d => x_axis_labels[d]))
            container.selectAll(".pos-token-sentence-view-pixl-vis text")
                .text(function (d) { return _this.data[0].pos_tags[d].slice(1, -1); });
            container.selectAll()
                .data(vis_data, function (d) { return d.x + ':' + d.y; })
                .enter()
                .append("rect")
                .attr("x", function (d) { return xs_1(d.y); })
                .attr("y", function (d) { return ys_1(d.x); })
                .attr("width", xs_1.bandwidth())
                .attr("height", ys_1.bandwidth())
                .style("fill", function (d) { return _this.color_scale(d.z); })
                // .style("stroke", d => get_sentiment_color(d.sentiment))
                .on("click", click)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                .on("mouseover", mouseover);
        }
        else {
            container.selectAll()
                .data(vis_data, function (d) { return d.x + ':' + d.y; })
                .enter()
                .append("rect")
                .attr("x", function (d) { return x(d.x); })
                // .attr("class", `row_${d.y}`)
                .attr("y", function (d) { return y(d.y); })
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .style("fill", function (d) { return _this.color_scale(d.z); })
                // .style("stroke", d => get_sentiment_color(d.sentiment))
                .on("click", click)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                .on("mouseover", mouseover);
        }
        container.append("text")
            .attr("class", "pixelVisHeader")
            .attr("x", 0)
            .attr("y", -30)
            .attr("text-anchor", "left")
            .style("font-size", "22px")
            .text(this.name);
        // if (this.sentence_view) {
        // container.attr("transform", "rotate(90)");			
        // }
    };
    return PixelVis;
}());
