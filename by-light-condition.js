class ByLightConditionChart extends AccidentBarChart {
    constructor(graph, graphSpec, svgSpec) {
        super(graph, graphSpec, svgSpec);
    }

    mapX() {
        return d3.scaleBand()
            .domain(Accidents.lightConditionCategories)
            .range([0, this.graphSpec.width()])
            .padding([0.2]);
    }

    createXAxis() {
        const nTicks = Accidents.lightConditionCategories.length;
        return d3.axisBottom(this.x).ticks(nTicks)
    }

    mapXSubgroup() {
        return d3.scaleBand()
            .domain(Accidents.vehicleCategories)
            .range([0, this.graphSpec.width()/Accidents.lightConditionCategories.length/2])
    }

    render(accidents) {
        this.updateXAxis();
        this.updateYAxis(accidents);
        this.renderBars(accidents);
        this.yAxisGroup.call(this.yAxis);
    }

    updateXAxis() {
    }

    updateYAxis(accidents) {
        const byLightCondition = accidents.groupByLightCondition();
        const numDeathsDomain = byLightCondition.rangeByGroup(group => group.totalDeaths(), [0, 0]);
        this.y.domain(numDeathsDomain);

        const nTicks = Math.min(5, numDeathsDomain[1])
        this.yAxis.ticks(nTicks);
    }

    renderBars(accidents) {
        const self = this;
        const byLightCondition = accidents.groupByLightCondition();

        const subBarGroups = this.barGroup
            .selectAll("g")
            .data(byLightCondition.groups);

        // exit: remove redundant subBarGroup.
        subBarGroups.exit().remove();

        // enter: append subBarGroup if not enough.
        const subBarGroup = subBarGroups.enter()
            .append("g")
            .attr("transform", function (d) {
                return `translate(${self.x(d.key)}, 0)`;
            })
            .selectAll("rect")
            .data(function (d) {
                const accidentsOfLightCondition = d.group;
                const byVehicleCategory = accidentsOfLightCondition.groupByVehicleCategory();
                return byVehicleCategory.groups;
            })

        // exit: remove redundant rect.
        subBarGroup.exit().remove();

        const tooltip = new Tooltip();
        //enter: append rect if not enough.
        subBarGroup.enter()
            .append("rect")
            .attr("x", d => this.xSubgroup(d.key))
            .attr("y", d => this.y(d.group.totalDeaths()))
            .attr("width", this.xSubgroup.bandwidth())
            .attr("height", function (d) {
                return self.graphSpec.height() - self.y(d.group.totalDeaths());
            })
            .attr("fill", d => this.color(d.key))
            .on("mouseover", function(e) {
                return tooltip.onMouseover(e);
            })
            .on("mousemove", function(e, d) {
                return tooltip.onMousemove(e, d,`<b>${d.key}</b><br>Total deaths: ${d.group.totalDeaths()}`);
            })
            .on("mouseleave", function(e) {
                return tooltip.onMouseleave(e);
            });

    }
}