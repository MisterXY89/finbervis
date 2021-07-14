
// see https://observablehq.com/@mbostock/the-impact-of-vaccines

function transform_data(data) {
	data.map(row => {
		row.tokens = (row.tokens != undefined) ? tok_to_array(row.tokens) : [];
		row.saliency_score = (row.saliency_score != undefined) ? to_array(row.saliency_score) : [];
		row.embeddings = (row.embeddings != undefined) ? to_array(row.embeddings) : [];
		row.cls_embs = (row.cls_embs != undefined) ? to_array(row.cls_embs) : [];
		row.props = (row.props != undefined) ? to_array(row.props) : [];
		row.x = (row.x != undefined) ? Number(x) : 0;
		row.y = (row.y != undefined) ? Number(y) : 0;
	})
	console.log(data);
	return data;
}

async function load_pixel_vis_data() {
	const papa_config = {delimiter: ",", header: true};
	let data1 = await fetch("/data/data_copy.csv")
		.then(resp => resp.text())
		.then(t => Papa.parse(t, papa_config))
		.then(data1 => {
    	return transform_data(data1.data);
  	});
  let data2 = await fetch("/data/drop_4_data.csv")
  	.then(resp => resp.text())
  	.then(t => Papa.parse(t, papa_config))
  	.then(data2 => {
    	return transform_data(data2.data);
  	});
  return { data1, data2 }
}

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
			
	}
}
