
class DistributionPlot {
	
	constructor(data, div_id, name) {		
		
		this.data = data;
		this.div_id = div_id;

		this.name = name;
		this.margin = {
			top: 10,
			right: 30,
			bottom: 30,
			left: 60
		};
		this.width = 200;
    this.height = 100;
		
		this.sentiments = ["positive", "neutral", "negative"];
		
		// Add Y axis
		this.y = d3.scaleLinear()
			.range([this.height, 0])
			.domain([0, 1]);
			 
		this.x = d3.scaleLinear()
			// .domain([d3.min(this.data, d => d.prop), d3.max(this.data, d => d.prop)])
	    .domain([-10, 15])
	    .range([ 0, this.width ]);
	}
	
	
	draw() {
		this.container = d3.select(this.div_id)
		  .append("svg")
		    .attr("width", this.width + this.margin.left + this.margin.right)
		    .attr("height", this.height + this.margin.top + this.margin.bottom)
		  .append("g")
		    .attr("transform",
		          "translate(" + this.margin.left + "," + this.margin.top + ")");
										    
    this.container.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(this.x));

    
    this.container.append("g")
      .call(d3.axisLeft(this.y));

		let kde = this.kernelDensityEstimator(this.kernelEpanechnikov(7), this.x.ticks(60))
		let densities = [];
		this.sentiments.forEach(sentiment => {
			densities.push(
				kde( this.data
					.filter(d => d.type === sentiment)
		    	.map(d => d.value))
				)
		});
		
		densities.forEach((d, i) => {
			this.add_density_path(d, get_sentiment_color[this.sentiments[i]])
		});

	}
	
	add_density_path(density, color) {
		this.container.append("path")
		    .attr("class", "predicted-distribution-path")
		    .datum(density)
		    .attr("fill", color)
		    .attr("opacity", ".6")
		    .attr("stroke", "#000")
		    .attr("stroke-width", 1)
		    .attr("stroke-linejoin", "round")
		    .attr("d",  d3.line()
		      .curve(d3.curveBasis)
		        .x((d, p) => {
							console.log(d, p)
							return this.x(p)
						})
		        .y(d => this.y(d[1]))
		    )
	}
	
	// Function to compute density
	kernelDensityEstimator(kernel, X) {
  	return function(V) {
    	return X.map(function(x) {
      	return [x, d3.mean(V, function(v) { return kernel(x - v); })];
    	});
  	};
	}
	
	kernelEpanechnikov(k) {
  	return function(v) {
    	return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
  	};
	}
}
		
}
