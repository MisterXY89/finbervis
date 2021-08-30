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
        this.myGroups = this.POS_TAGS; // x
        this.myVars = Object.keys(this.one_hot_patterns);
        this.name = name;
        this.margin = {
            top: 80,
            right: 80,
            bottom: 0,
            left: 100
        };
        this.width = 600;
        this.height = this.nodes.length * 15;
        this.y = d3.scaleBand()
            .range([this.height, 0])
            .domain(this.myVars)
            .padding(0.3);
        this.x = d3.scaleBand()
            .range([0, this.width])
            .domain(this.myGroups)
            .padding(0.1);
        this.stats = this.compute_stats();
        console.log("stats", this.stats);
        this.cluster_sort = false;
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
        var distr_pred_classes_list = pattern_idx.map(function (i) { return _this.data[i].sentiment; });
        var distr_pred_classes = { "positive": 0, "neutral": 0, "negative": 0 };
        distr_pred_classes_list.forEach(function (el) { return distr_pred_classes[el]++; });
        // let saliency_scores = pattern_idx.map(i => this.data[i].saliency_score);
        var pattern_amount = Object.keys(this.one_hot_patterns).length - 1;
        var clusters_found = pattern_idx.map(function (i) { return _this.data[i].one_hot_cluster; }).reduce(function (acc, curr) {
            return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc;
        }, {});
        // console.log("cluster-found:", clusters_found)
        var stats_html = "<td>" + Object.keys(clusters_found).length + "</td>"
            + ("<td>" + pattern_found_count + "</td>")
            + ("<td>" + no_pattern_count + "</td>")
            + ("<td>" + wrongly_classified + "</td>");
        var model_num = this.div_id.slice(-1);
        if (document.getElementById("stats-table-row-model-" + model_num) != undefined) {
            document.getElementById("stats-table-row-model-" + model_num).innerHTML = stats_html;
        }
        if (document.getElementById("distribution_plot_" + model_num) != undefined) {
            document.getElementById("distribution_plot_" + model_num).innerHTML = "";
        }
        var distribution_plot = new DistributionPlot(props, "#distribution_plot_" + this.div_id.slice(-1), "distribution over predicted sentiments propabilities", model_num);
        distribution_plot.draw();
        return {
            no_pattern_count: no_pattern_count,
            pattern_found_count: pattern_found_count,
            wrongly_classified: wrongly_classified,
            pattern_amount: pattern_amount,
            props: props,
            // saliency_scores,
            distr_pred_classes: distr_pred_classes
        };
    };
    MatrixVis.prototype.make_nodes = function () {
        var _this = this;
        var nodes = [];
        // console.log(this.one_hot_patterns);
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
    MatrixVis.prototype.compute_stats_for_pixel_vis = function (data, pattern) {
        var _this = this;
        // let no_pattern_count = this.one_hot_patterns["00000000000000000"].elements.length;
        var pattern_idx = this.one_hot_patterns[pattern].elements;
        var pattern_found_count = pattern_idx.length;
        var wrongly_classified = pattern_idx.filter(function (i) { return _this.data[i].truth_label != _this.data[i].sentiment; }).length;
        var props = pattern_idx.map(function (i) {
            return {
                type: _this.data[i].sentiment,
                value: d3.max(_this.data[i].props)
            };
        });
        var clusters_found = pattern_idx.map(function (i) { return _this.data[i].one_hot_cluster; }).reduce(function (acc, curr) {
            return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc;
        }, {});
        var stats_html = "<td>" + Object.keys(clusters_found).length + "</td>"
            + ("<td>" + pattern_found_count + "</td>")
            + "<td>-</td>"
            + ("<td>" + wrongly_classified + "</td>");
        if (document.getElementById("stats-table-row-pixel-vis") != undefined) {
            document.getElementById("stats-table-row-pixel-vis").innerHTML = stats_html;
        }
        // distribution_plot_pixel_vis
        // pred-sent-distr-abs-pixel-vis
        // stats-table-row-pixel-vis
        if (document.getElementById("distribution_plot_pixel_vis") != undefined) {
            document.getElementById("distribution_plot_pixel_vis").innerHTML = "";
        }
        var distribution_plot = new DistributionPlot(props, "#distribution_plot_pixel_vis", "distribution over predicted sentiments propabilities", -1);
        distribution_plot.draw();
    };
    MatrixVis.prototype.draw = function () {
        var _this = this;
        document.getElementById(this.div_id.slice(1)).innerHTML = "";
        this.container = d3.select(this.div_id)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        var cluster_scale = d3.scaleOrdinal(d3.schemeCategory20);
        console.log("matrix", this.matrix);
        // Build X scales and axis:		
        this.container.append("g")
            .attr("transform", "translate(0," + 0 + ")")
            .call(d3.axisTop(this.x))
            .attr("class", "matrix-x-axis");
        this.container.select(".matrix-x-axis")
            .selectAll("text")
            // .attr("transform", "")
            .style("text-anchor", "start")
            .attr("transform", "rotate(-70) translate(" + (10) + "," + (10) + ")");
        // Build X scales and axis:		
        this.container.append("g")
            .call(d3.axisLeft(this.y).tickFormat(function (d) {
            return _this.one_hot_patterns[d].elements.length;
        }));
        var color_scale = d3.scaleLinear()
            .range(["white", "#353333"])
            .domain([0, 1]);
        var rows = this.container.selectAll(".matrix-row")
            .data(this.matrix)
            .enter().append("g")
            .attr("class", "matrix-row")
            .attr("cluster", function (d) { return d[0].c; })
            .on("mouseover", function (d, p) {
            var el = document.getElementById("" + _this.div_id.slice(1)).getElementsByClassName("matrix-row")[p];
            el.style.opacity = "0.4";
        })
            .on("mouseout", function (d, p) {
            var el = document.getElementById("" + _this.div_id.slice(1)).getElementsByClassName("matrix-row")[p];
            el.style.opacity = "1";
        })
            .on('click', function (d, p) {
            var model_num = _this.div_id.slice(-1);
            var pattern = d[0].y;
            document.getElementById("sentence-select-info-matrix").innerHTML = "Sentences with pattern: <code>" + pattern + "</code> from <code>model " + model_num + "</code>";
            var idx = _this.one_hot_patterns[pattern].elements;
            // console.log("IDX", idx)
            var data1 = window.data1.filter(function (el, i) { return idx.includes(i); });
            var data2 = window.data2.filter(function (el, i) { return idx.includes(i); });
            document.getElementById("pixelVis1").innerHTML = "";
            document.getElementById("pixelVis2").innerHTML = "";
            document.getElementById("pixel-sentence-view").innerHTML = "";
            _this.compute_stats_for_pixel_vis(data1, pattern);
            var pixelVis1 = new PixelVis(data1, "#pixelVis1", "Centralized Reports", true);
            window.pixelVis1 = pixelVis1;
            pixelVis1.draw();
            var pixelVis2 = new PixelVis(data2, "#pixelVis2", "Remove layer 9", false);
            window.pixelVis2 = pixelVis2;
            pixelVis2.draw();
            scatter_plot(data1, false, DATA_FILE_ONE, "#projection_model_1");
            scatter_plot(data2, false, DATA_FILE_TWO, "#projection_model_2");
            d3.select("#patternProjectionSelection").html("<code>" + pattern + "</code>");
            d3.select("#resetSelectionCol").style("display", "block");
        });
        console.log("cluster_sort", this.cluster_sort);
        var cols = rows.selectAll(".cell")
            .data(function (d) { return d; })
            .enter().append("rect")
            .attr("class", "cell")
            .attr("x", function (d) { return _this.x(d.x); })
            .attr("y", function (d) { return _this.y(d.y); })
            .attr("width", this.x.bandwidth())
            .attr("height", this.y.bandwidth())
            .style("stroke", "grey")
            // .on('mouseover', function() {
            //    d3.select(this)
            //        .style('fill', '#0F0');
            // })
            // .on('mouseout', function() {
            //    d3.select(this)
            //        .style('fill', '#FFF');
            // })       
            .style("fill", function (d) {
            if (_this.cluster_sort) {
                if (d.z == 1) {
                    return cluster_scale(d.c);
                }
            }
            return color_scale(d.z);
        });
        // TODO: sort open/closed (alle von open/closed/mixed) + cluster				
        // create vis new everytime		
    };
    MatrixVis.prototype.sort = function (type) {
        var _this = this;
        this.cluster_sort = false;
        if (type == "cluster") {
            this.cluster_sort = true;
        }
        var sorted_rows = [];
        var sorted_one_hots = {};
        this.container.selectAll(".matrix-row").sort(function (a, b) {
            if (type == "cluster") {
                return d3.descending(Number(a[0].c), Number(b[0].c));
            }
            else { // count == default
                return d3.descending(_this.one_hot_patterns[a[0].y].elements.length, _this.one_hot_patterns[b[0].y].elements.length);
            }
            // sorted_rows = d3.ascending(Number(a[0].c), Number(b[0].c));
        }).attr("transform", function (d) {
            sorted_rows.push(d);
            sorted_one_hots[d[0].y] = _this.one_hot_patterns[d[0].y];
            return "x";
        });
        // .attr("transform", (d, i) => {
        // 	let key = Object.keys(this.one_hot_patterns)[i];
        // 	console.log(d[0].y, key, i);
        // 	return "translate(0, " + (this.y(key)) + ")"; 
        // })
        console.log("sorted_rows", sorted_rows);
        this.matrix = sorted_rows;
        this.one_hot_patterns = sorted_one_hots;
        var sorted_vars = Object.keys(this.one_hot_patterns);
        this.y = d3.scaleBand()
            .range([this.height, 0])
            .domain(sorted_vars)
            .padding(0.3);
        this.draw();
    };
    return MatrixVis;
}());
