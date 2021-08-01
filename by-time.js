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
        this.renderAnnotation(accidents);
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
        const byDate = accidents.groupByDate();

        const subBarGroups = this.barGroup
            .selectAll("g")
            .data(byDate.groups);

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

    renderAnnotation(accidents) {
        const byDate = accidents.groupByDate()
            .sortByGroup(function(a, b) {
                return b.totalDeaths() - a.totalDeaths();
            });
        const top1 = byDate.take(1).groups[0];
        const {key: date, group} = top1;
        const label = group.accidents.map(function (accident, index) {
            const vehicles = group.vehicles.vehiclesOfAccident(accident.id);
            const vehiclesTypeGroups = vehicles.vehicleTypes().groupCount(i => i);
            const vehicleDesc = vehiclesTypeGroups.map(function(group) {
                if(group.count == 1) {
                    return `a ${group.key}`
                } else {
                    return `${group.count} ${group.key}`
                }
            }).join(", ");

            return `Accident${index+1}: ${accident.numberPersonsKilled} kills, involved ${vehicleDesc}.`
        }).join("<br>");

        const textLocation = {dx: 50, dy: 160};

        const annotations = [{
            note: {
                title: date.toLocaleDateString(),
                label: label
            },
            x: this.x(date) + 15,
            y: this.y(group.totalDeaths()),
            dx: textLocation.dx,
            dy: textLocation.dy
        }];

        // Add annotation to the chart
        const makeAnnotations = d3.annotation()
            .annotations(annotations)

        this.graph.append("g")
            .call(makeAnnotations)
    }
}