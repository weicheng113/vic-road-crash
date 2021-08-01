class ByLocationMap {
    constructor(graph, graphSpec, controller) {

        this.lga = null;
        this.graph = graph;
        this.graphSpec = graphSpec;
        this.controller = controller;

        this.color = this.mapColor();
        this.bubbleRadius = this.mapBubbleRadius();

        this.landGroup = graph.append("g")
        this.boundaryGroup = graph.append("g")
        this.circleGroup = graph.append("g");
    }

    mapColor() {
        return d3.scaleLinear()
            .range(["palegoldenrod", "darkred"]);
    }

    mapBubbleRadius() {
        return d3.scaleSqrt()
            .range([0, 15]);
    }

    render(accidents, lga) {
        // lga Australia Local Government Areas.
        const projection = d3.geoIdentity().reflectY(true).fitExtent(
            [[0, 0], [this.graphSpec.width(), this.graphSpec.height()]],
            topojson.feature(lga, lga.objects.lga));
        this.renderMap(lga, projection);

        this.renderBubbles(accidents, projection);
        this.renderAnnotation(accidents, projection);
        this.addLegend();
    }

    renderMap(lga, projection) {
        const geoPath = d3.geoPath().projection(projection);
        // Land
        this.landGroup.attr("class", "land")
            .append("path")
            .datum(topojson.feature(lga, lga.objects.lga))
            .attr("d", geoPath);

        // State boundaries
        this.boundaryGroup.attr("class", "border border--state")
            .append("path")
            .datum(topojson.mesh(lga, lga.objects.states, function(a, b) {
                return a !== b;
            }))
            .attr("d", geoPath);
    }

    renderBubbles(accidents, projection) {
        const self = this;

        const byPostcode = accidents.groupByPostcode()
            .sortByGroup(function(a, b) {
                return a.totalDeaths() - b.totalDeaths();
            });

        const numAccidentsDomain = byPostcode.rangeByGroup(group => group.total(), [0, 0]);
        this.bubbleRadius.domain(numAccidentsDomain);

        const numDeathsDomain = byPostcode.rangeByGroup(group => group.totalDeaths(), [0, 0]);
        this.color.domain(numDeathsDomain)

        // Bubbles
        const circles = this.circleGroup.selectAll("circle")
            .data(byPostcode.groups);

        // exit: remove redundant circles.
        circles.exit().remove();

        // enter: append circles if not enough.
        circles.enter()
            .append("circle")
            .attr("class", "bubble")
            .attr("id", d => `circle--${d.key}`)
            .attr("fill", d => this.color(d.group.totalDeaths()))
            .attr("transform", function(d) {
                const accidentsAtLocation = d.group;
                const location = accidentsAtLocation.firstGeoLocation();
                const centroid = projection([location.longitude, location.latitude]);
                return `translate(${centroid[0]}, ${centroid[1]})`
            })
            .attr("r", function(d) {
                const accidentsAtLocation = d.group;
                return self.bubbleRadius(accidentsAtLocation.total())
            });

        // add events
        const top2Postcode = byPostcode.groups.slice(-2).map(item => item.key);
        this.circleGroup.selectAll("circle")
            .on('mouseover', function(event, d) {
                if (top2Postcode.includes(d.key)) {
                    self.handleMouseOver(event, d);
                }
            })
            .on('mouseout', function(event, d) {
                if (top2Postcode.includes(d.key)) {
                    self.handleMouseOut(event, d);
                }
            })
            .on('click', function(event, d) {
                if (top2Postcode.includes(d.key)) {
                    self.handleClick(event, d);
                }
            });
    }

    handleMouseOver(event, d) {
        d3.select(event.currentTarget)
            .transition('changeBubbleFill').duration(300)
            .attr('fill', '#fff');
    }

    handleMouseOut(event, d) {
        d3.select(event.currentTarget)
            .transition('changeBubbleFill').duration(300)
            .attr("fill", d => this.color(d.group.totalDeaths()));
    }

    handleClick(event, d) {
        this.controller.onPostcodeClick(d.key);
    }

    renderAnnotation(accidents, projection) {
        const self = this;

        const byPostcode = accidents.groupByPostcode()
            .sortByGroup(function(a, b) {
                return b.totalDeaths() - a.totalDeaths();
            });
        const top2 = byPostcode.take(2)
        const textLocations = [{dx: 50, dy: -160}, {dx: 50, dy: 100}];

        const annotations = top2.groups.map(function(item, index) {
            const {key, group} = item;
            const title = `Postcode: ${key}`
            const label = `${group.totalDeaths()} deaths out of ${group.total()} accidents, click to see more`
            const location = group.firstGeoLocation();
            const centroid = projection([location.longitude, location.latitude]);
            const textLocation = textLocations[index];
            return {
                note: {
                    title: title,
                    label: label
                },
                x: centroid[0],
                y: centroid[1],
                dx: textLocation.dx,
                dy: textLocation.dy
            }
        });

        // Add annotation to the chart
        const makeAnnotations = d3.annotation()
            .annotations(annotations)

        this.graph.append("g")
            .call(makeAnnotations)
    }

    addLegend() {
        const legendGroup = this.graph.append("g").attr("transform", `translate(${this.graphSpec.width() - 300}, 0)`);

        const gap = {x: 30, y: 40};
        const circleSpecs = [
            //Size
            {cx: 200, cy: 10, r: 2, fill: "white"},
            {cx: 200 + gap.x, cy: 10, r: 15, fill: "white"},
            //Color
            {cx: 200, cy: 10 + gap.y, r: 10, fill: "palegoldenrod"},
            {cx: 200 + gap.x, cy: 10 + gap.y, r: 10, fill: "darkred"},
        ]

        legendGroup.selectAll("legendSymbol")
            .data(circleSpecs)
            .enter()
            .append("circle")
            .attr("class", "bubble")
            .attr("cx", d => d.cx)
            .attr("cy", d => d.cy)
            .attr("r", d => d.r)
            .style("fill", d => d.fill);

        const textSpecs = [
            {x: 10, y: circleSpecs[0].cy + 8, text: `No. Accidents(${this.bubbleRadius.domain().join("~")}):`},
            {x: 10 + 35, y: circleSpecs[2].cy + 5, text: `No. Deaths(${this.color.domain().join("~")}):`}
        ]
        legendGroup.selectAll("legendLabels")
            .data(textSpecs)
            .enter()
            .append("text")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .text(d => d.text)
            .attr("text-anchor", "right")
            .style("alignment-baseline", "bottom");
    }
}