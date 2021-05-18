"use strict";
var DATA_DIR = "./data";
// const DATA_FILE:string = `${DATA_DIR}/projection_with_full_sents_SENT_PROPS.csv`;
var DATA_FILE = DATA_DIR + "/data_copy.csv";
// const COLORS = ["#440154", "#3CBB75", "#DCE319"];
var COLORS = ['#abe564', '#64abe5', '#9e64e5'];
// "#336338" = more medium sea blue
// "#67001F" = dark red
// "#6ece58" = april green
// "#440154" = dark purple
// "#fde725" = yellow
// "#3e4989" = medium sea blue
// "#26828e" = more turqoise medium sea blue
// "#1f9e89" = turqoise
// "#482878" = light purple
// "#424047" = gray
var SENTIMENT_CLASSES = ["positive", "neutral", "negative"];
var RADIUS = 2;
var ZOOM_RADIUS = 5;
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
// set the dimensions and margins of the graph
var margins = {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5
};
var width = 800;
var height = 750;
var visWidth = width - margins.left - margins.right;
var visHeight = height - margins.top - margins.bottom;
// append the svg object to the body of the page
// console.log(`> Loading file: ${DATA_FILE}`);
var x = d3.scaleLinear()
    .domain([-10, 20])
    .range([0, width]);
var y = d3.scaleLinear()
    .domain([-15, 20])
    .range([height, 0]);
function create_heatmap(segment, layer, head) {
    var csv_url = "/get-attention?layer=" + layer + "&head=" + head + "&segment=" + segment;
    // set the dimensions and margins of the graph
    var margin = { top: 80, right: 25, bottom: 30, left: 40 }, width = 450 - margin.left - margin.right, height = 450 - margin.top - margin.bottom;
    // append the svg object to the body of the page
    var svg = d3.select("#self-attention-heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    //Read the data
    d3.csv(csv_url, function (data) {
        console.log(data);
        // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
        var token_xs = d3.map(data, function (d) { return d.token_x; }).keys();
        var token_ys = d3.map(data, function (d) { return d.token_y; }).keys();
        // Build X scales and axis:
        var x = d3.scaleBand()
            .range([0, width])
            .domain(token_xs)
            .padding(0.05);
        svg.append("g")
            .style("font-size", 15)
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickSize(0))
            .select(".domain").remove();
        // Build Y scales and axis:
        var y = d3.scaleBand()
            .range([height, 0])
            .domain(token_ys)
            .padding(0.05);
        svg.append("g")
            .style("font-size", 15)
            .call(d3.axisLeft(y).tickSize(0))
            .select(".domain").remove();
        // Build color scale
        var heatmap_get_color = d3.scaleSequential()
            .interpolator(d3.interpolateInferno)
            .domain([0, 1]);
        console.log(heatmap_get_color(0.3));
        // create a tooltip
        var tooltip = d3.select("#my_dataviz")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");
        // Three function that change the tooltip when user hover / move / leave a cell
        var mouseover = function (d) {
            tooltip
                .style("opacity", 1);
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1);
        };
        var mousemove = function (d) {
            tooltip
                .html("The exact value of<br>this cell is: " + Number(d.value))
                .style("left", (d3.mouse(this)[0] + 70) + "px")
                .style("top", (d3.mouse(this)[1]) + "px");
        };
        var mouseleave = function (d) {
            tooltip
                .style("opacity", 0);
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.8);
        };
        // add the squares
        svg.selectAll()
            .data(data, function (d) { return d.token_x + ':' + d.token_y; })
            .enter()
            .append("rect")
            .attr("x", function (d) { return x(d.token_x); })
            .attr("y", function (d) { return y(d.token_y); })
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function (d) {
            // console.log(Number(d.value));
            return heatmap_get_color(Number(d.value));
        })
            .style("stroke-width", 4)
            .style("stroke", "none")
            .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
    });
    // Add title to graph
    svg.append("text")
        .attr("x", 0)
        .attr("y", -50)
        .attr("text-anchor", "left")
        .style("font-size", "22px")
        .text("Layer " + (layer + 1) + ", head " + (head + 1));
    // Add subtitle to graph
    svg.append("text")
        .attr("x", 0)
        .attr("y", -20)
        .attr("text-anchor", "left")
        .style("font-size", "14px")
        .style("fill", "grey")
        .style("max-width", 500)
        .style("min-height", 50)
        .html("Self-Attention heatmap of the respective token, in layer " + (layer + 1) + " and head " + (head + 1) + ".<br><a href='#hide-heatmap' id='hide-heatmap'>Hide</a>");
}
function create_scatter_plot(data) {
    // d3.select(PLOT_ID).select("svg").remove();
    d3.select("svg").remove();
    var container = d3.select(PLOT_ID)
        .append("svg")
        .attr("width", width + margins.left + margins.right)
        .attr("height", height + margins.top + margins.bottom)
        .append("g")
        .attr("transform", "translate(" + margins.left + "," + margins.top + ")");
    // // X-AXIS
    // let x_axis = container.append("g")
    // 	.attr("transform", "translate(0," + height + ")")
    // 	.call(d3.axisBottom(x));
    //
    // // Y-AXIS
    // let y_axis = container.append("g")
    // 	.call(d3.axisLeft(y));
    var mouse_events = get_mouse_events(data);
    // const mouseover 	= mouse_events[0];
    // const mousemove 	= mouse_events[1];
    // const mouseleave	= mouse_events[2];
    var click = mouse_events[3];
    var brush = d3.brush().extent([[0, 0], [width, height]]).on("end", brushended);
    var idleTimeout;
    var idleDelay = 350;
    // .style('fill', (d:any) => get_color(d.cluster))
    container.append("g")
        .attr("class", "brush")
        .call(brush);
    function restore() {
        x.domain([-10, 20]);
        y.domain([-15, 20]);
        var t = container.transition().duration(700);
        container.selectAll("circle").transition(t).attr("r", 3);
        window.zoom = false;
    }
    function brushended() {
        var s = d3.event.selection;
        var restore_b = false;
        if (!s) {
            if (!idleTimeout)
                return idleTimeout = setTimeout(idled, idleDelay);
            restore();
            restore_b = true;
        }
        else {
            x.domain([s[0][0], s[1][0]].map(x.invert, x));
            y.domain([s[1][1], s[0][1]].map(y.invert, y));
            container.select(".brush").call(brush.move, null);
        }
        zoom(restore_b);
        d3.select(window.last_target)
            .attr("r", SELECT_RADIUS)
            .style("fill", SELECT_COLOR).raise();
    }
    function idled() {
        idleTimeout = null;
    }
    function zoom(restore_b) {
        window.zoom = true;
        var rad = ZOOM_RADIUS;
        if (restore_b) {
            rad = RADIUS;
        }
        var t = container.transition().duration(650);
        container.selectAll("circle").transition(t)
            .attr("cx", function (d) { return x(d.x); })
            .attr("cy", function (d) { return y(d.y); })
            .filter(function () {
            return this != window.last_target;
        })
            .attr("r", rad);
    }
    // DATA-POINTS
    container.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
        // console.log(d.x);
        return x(d.x);
    })
        .attr("cy", function (d) { return y(d.y); })
        .attr("id", function (d) { return d.id; })
        .attr("r", function (d) { return get_radius(d.new); })
        .style("opacity", function (d) { return get_max_value(d.props, false); })
        .style('fill', function (d) {
        // console.log(d.new);
        return get_color(d.sentiment, d.new);
    })
        // .style("fill", "none")
        .style('stroke', function (d) {
        // console.log(d);
        return get_color_truth(d);
    })
        .style("stroke-width", 1)
        .attr("pointer-events", "all")
        // .on('mouseover', mouseover)
        // .on('mousemove', mousemove)
        // .on('mouseleave', mouseleave)
        .on('click', click);
}
function scatter_plot(custom_data, click) {
    custom_data = (custom_data == undefined) ? false : custom_data;
    click = (click == undefined) ? false : click;
    d3.csv(DATA_FILE, function (data) {
        console.log("custom_data", custom_data);
        if (Array.from(custom_data).length != 0) {
            data.push(custom_data);
        }
        console.log(data);
        create_scatter_plot(data);
        if (!$(".slider").is(":visible")) {
            var slider_data_vals = [0, 0.25, 0.5, 0.75, 0.8, 0.9, 0.95, 1];
            var sliderRange = d3
                .sliderBottom()
                .min(d3.min(slider_data_vals))
                .max(d3.max(slider_data_vals))
                .width(600)
                .tickFormat(d3.format('.2%'))
                .ticks(5)
                .default([0.70, 1])
                .fill('#2196f3')
                .on('onchange', function (val) {
                d3.select('p#value-range').text(val.map(d3.format('.2%')).join('-'));
                console.log(val);
                d3.selectAll("circle").style("display", "none");
                d3.selectAll("circle").transition()
                    .filter(function () {
                    var point_val = Number(this.style.opacity);
                    // console.log(point_val);
                    // console.log(point_val >= val[0]);
                    return point_val >= val[0] && point_val <= val[1];
                })
                    .duration(300)
                    .style("display", "block");
            });
            var gRange = d3
                .select('div#slider-range')
                .append('svg')
                .attr('width', 700)
                .attr('height', 100)
                .append('g')
                .attr('transform', 'translate(30,30)');
            gRange.call(sliderRange);
            d3.select('p#value-range').text(sliderRange
                .value()
                .map(d3.format('.2%'))
                .join('-'));
        }
        if (click) {
            console.log("click_point", click);
            click_point(custom_data);
        }
    });
}
