"use strict";
var MatrixVis = /** @class */ (function () {
    function MatrixVis(data, div_id, name) {
        this.POS_TAGS = ['ADJ', 'ADV', 'INTJ', 'NOUN', 'PROPN', 'VERB', 'ADP', 'AUX', 'CONJ', 'DET', 'NUM', 'PART', 'PRON', 'SCONJ', 'PUNCT', 'SYM', 'X'];
        this.pos_classes_dict = {
            "open": ["ADJ", "ADV", "INTJ", "NOUN", "PROPN", "VERB"],
            "closed": ["ADP", "AUX", "CONJ", "DET", "NUM", "PART", "PRON", "SCONJ"],
            "other": ["PUNCT", "SYM", "X"]
        };
        this.data = data;
        this.div_id = div_id;
        this.one_hot_patterns = {};
        this.matrix = this.prep_data_for_vis();
        this.nodes = this.make_nodes();
        console.log("nodes: ", this.nodes);
        this.name = name;
        this.margin = {
            top: 80,
            right: 80,
            bottom: 0,
            left: 40
        };
        this.width = 600;
        this.height = this.nodes.length * 15;
        this.stats = this.compute_stats();
        console.log(this.stats);
    }
    MatrixVis.prototype.compute_stats = function () {
        var _this = this;
        var no_pattern_count = this.one_hot_patterns["00000000000000000"].elements.length;
        var pattern_idx = Object.keys(this.one_hot_patterns).filter(function (key) { return key != "00000000000000000"; }).map(function (key) { return _this.one_hot_patterns[key].elements; }).flat();
        var pattern_found_count = pattern_idx.length;
        var wrongly_classified = pattern_idx.filter(function (i) { return _this.data[i].truth_label != _this.data[i].sentiment; }).length;
        var props = pattern_idx.map(function (i) {
            return {
                type: _this.data[i].sentiment,
                value: d3.max(_this.data[i].props)
            };
        });
        var saliency_scores = pattern_idx.map(function (i) { return _this.data[i].saliency_score; });
        var pattern_amount = Object.keys(this.one_hot_patterns).length - 1;
        var distribution_plot = DistributionPlot(props, "#distribution_plot_" + this.div_id.slice(-1), "distribution over predicted sentiments propabilities");
        distribution_plot.draw();
        // let avg_saliency = 
        return {
            no_pattern_count: no_pattern_count,
            pattern_found_count: pattern_found_count,
            wrongly_classified: wrongly_classified,
            pattern_amount: pattern_amount,
            props: props,
            saliency_scores: saliency_scores
        };
    };
    MatrixVis.prototype.make_nodes = function () {
        var _this = this;
        var nodes = [];
        console.log(this.one_hot_patterns);
        Object.keys(this.one_hot_patterns).forEach(function (key) {
            if (key.length == 17) {
                nodes.push({
                    pattern: key,
                    count: _this.one_hot_patterns[key].elements.length,
                });
                // Object.keys(this.one_hot_patterns[key]).forEach(pi => {
                // 	console.log(pi);
                // 	this.one_hot_patterns[key].count = this.one_hot_patterns[key][pi].length;
                // });
            }
        });
        return nodes;
    };
    // color_scale(x) {
    // 	let sc = d3.scaleLinear().domain([-1,1]).range([0,1]);
    // 	return d3.interpolateBrBG(sc(x));
    // }
    MatrixVis.prototype.prep_data_for_vis = function (data) {
        var _this = this;
        var matrix = [];
        var vis_index = 0;
        this.data.forEach(function (row, row_i) {
            // console.log(row);			
            var str_one_hot_pattern = row.one_hot.join("");
            if (str_one_hot_pattern.length == 17) {
                if (!_this.one_hot_patterns.hasOwnProperty(str_one_hot_pattern)) {
                    var row_matrix_1 = [];
                    row.one_hot.forEach(function (el, one_hot_i) {
                        // x: one_hot_i,
                        // y: vis_index,
                        row_matrix_1.push({
                            x: _this.POS_TAGS[one_hot_i],
                            y: str_one_hot_pattern,
                            z: el,
                            c: row.one_hot_cluster
                            // pattern: str_one_hot_pattern,
                        });
                    });
                    matrix.push(row_matrix_1);
                    // vis_index ++;
                    _this.one_hot_patterns[str_one_hot_pattern] = {
                        elements: [],
                    };
                }
                _this.one_hot_patterns[str_one_hot_pattern].elements.push(row_i);
            }
        });
        return matrix;
    };
    MatrixVis.prototype.draw = function () {
        // this.container.append("rect")
        //   .attr("class", "matrix-background")
        //   .attr("width", this.width)
        //   .attr("height", this.height);
        this.container = d3.select(this.div_id)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        var myGroups = this.POS_TAGS; // x
        var myVars = Object.keys(this.one_hot_patterns);
        var cluster_scale = d3.scaleOrdinal(d3.schemeCategory20);
        console.log("matrix", this.matrix);
        // Build X scales and axis:
        var x = d3.scaleBand()
            .range([0, width])
            .domain(myGroups)
            .padding(0.1);
        this.container.append("g")
            .attr("transform", "translate(0," + 0 + ")")
            .call(d3.axisTop(x))
            .attr("class", "matrix-x-axis");
        this.container.select(".matrix-x-axis")
            .selectAll("text")
            // .attr("transform", "")
            .style("text-anchor", "start")
            .attr("transform", "rotate(-70) translate(" + (10) + "," + (10) + ")");
        // Build X scales and axis:
        var y = d3.scaleBand()
            .range([this.height, 0])
            .domain(myVars)
            .padding(0.02);
        // this.container.append("g")
        //   .call(d3.axisLeft(y));
        var color_scale = d3.scaleLinear()
            .range(["white", "#50514F"])
            .domain([0, 1]);
        var rows = this.container.selectAll(".matrix-row")
            .data(this.matrix)
            .enter().append("g")
            .attr("class", "matrix-row")
            .attr("cluster", function (d) { return d[0].c; });
        var cols = rows.selectAll(".cell")
            .data(function (d) { return d; })
            .enter().append("rect")
            .attr("class", "cell")
            .attr("x", function (d) { return x(d.x); })
            .attr("y", function (d) { return y(d.y); })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            // .on('mouseover', function() {
            //    d3.select(this)
            //        .style('fill', '#0F0');
            // })
            // .on('mouseout', function() {
            //    d3.select(this)
            //        .style('fill', '#FFF');
            // })       
            // .style("fill", d => color_scale(d.z))
            .style("fill", function (d) {
            if (d.z == 1) {
                if (d.c == -1) {
                    return "black";
                }
                return cluster_scale(d.c);
            }
            return color_scale(d.z);
        })
            // .style("stroke", '#555');
            .on('click', function (d, p) {
            console.log(d, p);
            console.log(d3.select(this));
        });
        var annotations = [
            {
                note: {
                    // label: "Here is the annotation label",
                    label: "",
                    title: "Closed class",
                    padding: 10,
                    wrap: 100
                },
                subject: {
                    width: 245,
                    height: 50
                },
                type: d3.annotationCalloutRect,
                x: 0,
                y: -50,
                dy: 50,
                dx: -40
            },
            {
                note: {
                    // label: "based on the universal dependencies .org",
                    label: "",
                    title: "Open class",
                    padding: 10,
                    wrap: 100
                },
                subject: {
                    width: 360,
                    height: 50
                },
                type: d3.annotationCalloutRect,
                x: 260,
                y: -50,
                dy: 50,
                dx: 400
            }
        ];
        // // Add annotation to the chart
        // let makeAnnotations = d3.annotation()
        //   .annotations(annotations)
        // this.container
        //   .append("g")
        //   .call(makeAnnotations)
        // TODO: sort open/closed (alle von open/closed/mixed) + cluster				
        // create vis new everytime
        // this.sort("cluster");
    };
    MatrixVis.prototype.sort = function (type) {
        // Features of the annotation		
        this.container.selectAll(".matrix-row").sort(function (a, b) {
            console.log("sort!", type);
            if (type == "cluster") {
                return d3.ascending(Number(a[0].c), Number(b[0].c));
            }
            return d3.ascending(Number(a[0].c), Number(b[0].c));
        })
            .attr("transform", function (d, i) {
            console.log(y(i));
            return "translate(0, " + y(i) + ")";
        });
    };
    return MatrixVis;
}());
