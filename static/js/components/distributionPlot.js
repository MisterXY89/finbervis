"use strict";
var DistributionPlot = /** @class */ (function () {
    function DistributionPlot(data, div_id, name, model_v) {
        this.model_v = model_v;
        this.data = data;
        console.log("distributionPlot", this.data);
        this.div_id = div_id;
        this.name = name;
        this.margin = {
            top: 10,
            right: 30,
            bottom: 30,
            left: 40
        };
        this.width = 260 - this.margin.left - this.margin.right;
        this.height = 240 - this.margin.top - this.margin.bottom;
        this.sentiments = ["positive", "neutral", "negative"];
        this.x = d3.scaleLinear()
            // .domain([d3.min(this.data, d => d.prop), d3.max(this.data, d => d.prop)])
            .domain([0, 1])
            .range([0, this.width]);
    }
    DistributionPlot.prototype.draw = function () {
        var _this = this;
        this.container = d3.select(this.div_id)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        this.container.append("g")
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(this.x));
        // set the parameters for the histogram
        var histogram = d3.histogram()
            .value(function (d) { return d.value; }) // I need to give the vector of value
            .domain(this.x.domain()) // then the domain of the graphic
            .thresholds(this.x.ticks(35)); // then the numbers of bins
        // And apply twice this function to data to get the bins.
        var bins = this.sentiments.map(function (sentiment) {
            return histogram(_this.data.filter(function (d) { return d.type === sentiment; }));
        });
        console.log("BINS", bins);
        // Y axis: scale and draw:
        var sentiment_sents = bins.map(function (li) { return d3.max(li.map(function (el) { return el.length; })); });
        var y_max = d3.max(sentiment_sents);
        this.y = d3.scaleLinear()
            .range([this.height, 0])
            .domain([0, y_max]); // d3.hist has to be called before the Y axis obviously
        this.container.append("g")
            .call(d3.axisLeft(this.y));
        bins.forEach(function (b, i) {
            _this.add_bin(b, get_sentiment_color(_this.sentiments[i]), i);
        });
        if (this.model_v > 0) {
            document.getElementById("pred-sent-distr-abs-" + this.model_v).innerHTML += " <br>positive: " + sentiment_sents[0] + " | neutral: " + sentiment_sents[1] + " | negative: " + sentiment_sents[2];
        }
    };
    DistributionPlot.prototype.add_bin = function (bin, color, i) {
        var _this = this;
        console.log("adding bin:", bin, "with color:", color);
        var bin_size = d3.sum(bin.map(function (el) { return el.length; }).flat());
        this.container.selectAll("rect_b_" + i)
            .data(bin)
            .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function (d) { return "translate(" + _this.x(d.x0) + "," + _this.y(d.length) + ")"; })
            .attr("width", function (d) { return _this.x(d.x1) - _this.x(d.x0) - 1; })
            .attr("height", function (d) { return _this.height - _this.y(d.length); })
            .style("fill", color)
            .style("opacity", 0.6);
    };
    return DistributionPlot;
}());
