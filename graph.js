class GraphSpec {
  constructor(content, margin) {
    this.content = content;
    this.margin = margin;
  }

  width() {
    return this.content.width + this.margin.left + this.margin.right;
  }

  height() {
    return this.content.width + this.margin.top + this.margin.bottom;
  }

  midX() {
    return this.width() / 2;
  }

  midY() {
    return this.height() / 2;
  }

  contentSpec(contentMargin) {
    const content = {
      width: this.content.width - contentMargin.left - contentMargin.right,
      height: this.content.height - this.content.top - this.content.bottom };
    return new GraphSpec(content, contentMargin)
  }
}

// set the dimensions and margins of the graph
const svgSpec = new GraphSpec(
    content = { width: 700, height: 700 },
    margin = {top: 10, right: 30, bottom: 60, left: 60});
const graphSpec = svgSpec.contentSpec({top: 0, right: 0, bottom: 0, left: 0});

// append the svg object to the body of the page
const graph = d3.select(".canvas")
  .append("svg")
    .attr("width", svgSpec.width())
    .attr("height", svgSpec.height())
  .append("g")
    .attr("transform", `translate(${svgSpec.margin.left}, ${svgSpec.margin.top})`);


