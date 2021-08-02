class AccidentBarChart {
    constructor(graph, graphSpec, svgSpec) {
        this.graph = graph;
        this.graphSpec = graphSpec;
        this.svgSpec = svgSpec;
        this.x = this.mapX();
        this.xAxis = this.createXAxis();
        this.xSubgroup = this.mapXSubgroup();
        this.y = this.mapY();
        this.yAxis = d3.axisLeft(this.y).tickFormat(d3.format("d"));
        this.yAxisGroup = graph.append("g");
        this.color = this.mapColor();
        this.barGroup = graph.append("g");

        this.initialize();
    }

    mapX() {
        throw new Error("Not.Implemented");
    }

    createXAxis() {
        throw new Error("Not.Implemented");
    }

    mapXSubgroup() {
        return d3.scaleBand()
            .domain(Accidents.vehicleCategories)
            .range([0, 20])
            .padding([0.05])
    }

    mapY() {
        return d3.scaleLinear()
            .domain([0, 5])
            .range([this.graphSpec.height(), 0]);
    }

    mapColor() {
        return d3.scaleOrdinal()
            .domain(Accidents.vehicleCategories)
            .range(["#4E79A7", "#F28E2B", "#76B7B2", "#E15759"]);

    }

    initialize() {
        this.addXAxisGroup();
        this.addYAxisGroup();
        this.addLegend();
    }

    addXAxisGroup() {
        const xAxisGroup = this.graph.append("g").attr("transform", `translate(0, ${this.graphSpec.height()})`)
        xAxisGroup.call(this.xAxis);

        xAxisGroup.selectAll("text")
            .attr("transform", "rotate(-30)")
            .attr("text-anchor", "end");
    }

    addYAxisGroup() {
        this.yAxisGroup.call(this.yAxis);
        // text label for the y axis
        // this.yAxisGroup.append("text")
        //     .attr("transform", "rotate(-90)")
        //     .attr("y", - this.graphSpec.margin.left - 30)
        //     .attr("x", - this.graphSpec.midY())
        //     .attr("dy", "1em")
        //     .text("Number of Killed")
        //     .style("text-anchor", "middle");

        // text label for the y axis
        this.graph.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -this.svgSpec.margin.left * (2 / 3))
            .attr("x", -this.graphSpec.midY())
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Number of Killed");
    }

    addLegend() {
        const legendGroup = this.graph.append("g").attr("transform", `translate(${this.graphSpec.width() - 200}, 0)`);

        const circleSpec = {cx: 10, cy: 10, r: 7};
        const gap = 25;
        legendGroup.selectAll("legendSymbol")
            .data(Accidents.vehicleCategories)
            .enter()
            .append("circle")
            .attr("cx", circleSpec.cx)
            .attr("cy", function (d, i) {
                return circleSpec.cy + i * gap
            })
            .attr("r", circleSpec.r)
            .style("fill", d => this.color(d));

        const textSpec = {x: circleSpec.cx + circleSpec.r + 5, y: circleSpec.cy}
        legendGroup.selectAll("legendLabels")
            .data(Accidents.vehicleCategories)
            .enter()
            .append("text")
            .attr("x", textSpec.x)
            .attr("y", function (d, i) {
                return textSpec.y + i * gap
            })
            .style("fill", d => this.color(d))
            .text(d => d)
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle");
    }

    render(accidents) {
        throw new Error("Not.Implemented");
    }
}

class Tooltip {
    constructor() {
        this.tooltip = d3.select(".canvas")
            .append("div")
            .style("position", "absolute")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
    }

    onMouseover(e) {
        this.tooltip.style("opacity", 1)
        d3.select(e.currentTarget)
            .style("stroke", "black")
            // .style("opacity", 1)
    }
    onMousemove(e, d, displayHtml) {
        // console.log((d3.pointer(e)[0]+70), (d3.pointer(e)[1]))
        this.tooltip.html(displayHtml)
            .style("left", `${e.pageX}px`)
            .style("top", `${e.pageY}px`)
            // .style("left", `${d3.pointer(e)[0]+300}px`)
            // .style("top", `${d3.pointer(e)[1]+220}px`)
    }
    onMouseleave(e) {
        this.tooltip.style("opacity", 0)
        d3.select(e.currentTarget)
            .style("stroke", "none")
            // .style("opacity", 0.8)
    }
}