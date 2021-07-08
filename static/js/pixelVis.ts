
// see https://observablehq.com/@mbostock/the-impact-of-vaccines

class PixelVis {
	
	constructor(data, div_id) {
		this.data = data;
		this.div_id = div_id;
		this.margin = {
				top: 20, 
				right: 1, 
				bottom: 40, 
				left: 40
			};
		this.width = 500;
		this.height = 400;
	}
	
	draw() {
			
		chart = {
			const svg = d3.create("svg")
					.attr("viewBox", [0, 0, width, innerHeight + margin.top + margin.bottom])
					.attr("font-family", "sans-serif")
					.attr("font-size", 10);

			svg.append("g")
					.call(xAxis);

			svg.append("g")
					.call(yAxis);

			svg.append("g")
				.selectAll("g")
				.data(data.values)
				.join("g")
					.attr("transform", (d, i) => `translate(0,${y(data.names[i])})`)
				.selectAll("rect")
				.data(d => d)
				.join("rect")
					.attr("x", (d, i) => x(data.years[i]) + 1)
					.attr("width", (d, i) => x(data.years[i] + 1) - x(data.years[i]) - 1)
					.attr("height", y.bandwidth() - 1)
					.attr("fill", d => isNaN(d) ? "#eee" : d === 0 ? "#fff" : color(d))
				.append("title")
					.text((d, i) => `${format(d)} per 100,000 people in ${data.years[i]}`);

			return svg.node();
		}


		data = {
			const names = ["Alaska", "Ala.", "Ark.", "Ariz.", "Calif.", "Colo.", "Conn.", "D.C.", "Del.", "Fla.", "Ga.", "Hawaii", "Iowa", "Idaho", "Ill.", "Ind.", "Kan.", "Ky.", "La.", "Mass.", "Md.", "Maine", "Mich.", "Minn.", "Mo.", "Miss.", "Mont.", "N.C.", "N.D.", "Neb.", "N.H.", "N.J.", "N.M", "Nev.", "N.Y.", "Ohio", "Okla.", "Ore.", "Pa.", "R.I.", "S.C.", "S.D.", "Tenn.", "Texas", "Utah", "Va.", "Vt.", "Wash.", "Wis.", "W.Va.", "Wyo."];
			const data = await FileAttachment("vaccines.json").json();
			const values = [];
			const year0 = d3.min(data[0].data.values.data, d => d[0]);
			const year1 = d3.max(data[0].data.values.data, d => d[0]);
			const years = d3.range(year0, year1 + 1);
			for (const [year, i, value] of data[0].data.values.data) {
				if (value == null) continue;
				(values[i] || (values[i] = []))[year - year0] = value;
			}
			return {
				values,
				names,
				years,
				year: data[0].data.chart_options.vaccine_year
			};
		}
			
	}
}
