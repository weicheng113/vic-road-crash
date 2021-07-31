class ByTimeBarChart extends AccidentBarChart {
    constructor(graph, graphSpec, svgSpec) {
        super(graph, graphSpec, svgSpec);
    }

    mapX() {
        return d3.scaleTime()
            .domain([Accidents.startDate, Accidents.endDate])
            .range([ 0, this.graphSpec.width() ]);
    }

    createXAxis() {
        const nTicks = 15;
        return d3.axisBottom(this.x).tickFormat(d3.timeFormat("%Y-%m")).ticks(nTicks);
    }

    mapXSubgroup() {
        return d3.scaleBand()
            .domain(Accidents.vehicleCategories)
            .range([0, 20])
            .padding([0.05])
    }

    render(accidents) {
        this.updateXAxis();
        this.updateYAxis(accidents);
        this.renderBars(accidents);
    }

    updateXAxis() {
    }

    updateYAxis(accidents) {
        const maxDeaths = accidents.maxDeaths();
        this.y.domain([0, maxDeaths]);

        this.yAxis.ticks(maxDeaths);

        this.yAxisGroup.call(this.yAxis);
    }

    renderBars(accidents) {
        const self = this;
        const byDateTime = accidents.groupByDateTime();

        const subBarGroups = this.barGroup
            .selectAll("g")
            .data(byDateTime.groups);

        // exit: remove redundant subBarGroup.
        subBarGroups.exit().remove();

        // enter: append subBarGroup if not enough.
        const subBarGroup = subBarGroups.enter()
            .append("g")
            .attr("transform", function (d) {
                const dateTime = d.key;
                return `translate(${self.x(dateTime)}, 0)`;
            })
            .selectAll("rect")
            .data(function (d) {
                const accidentsAtTime = d.group;
                const byVehicleCategory = accidentsAtTime.groupByVehicleCategory();
                return byVehicleCategory.groups;
            })

        // exit: remove redundant rect.
        subBarGroup.exit().remove();

        //enter: append rect if not enough.
        subBarGroup.enter()
            .append("rect")
            .attr("x", d => this.xSubgroup(d.key))
            .attr("y", d => this.y(d.group.totalDeaths()))
            .attr("width", this.xSubgroup.bandwidth())
            .attr("height", function (d) {
                return self.graphSpec.height() - self.y(d.group.totalDeaths());
            })
            .attr("fill", d => this.color(d.key));
    }
}