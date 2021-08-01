class ControllerListener {
    onPostcodeSelected() {
        throw new Error("Not Implemented");
    }
}

class Controller {
    constructor(graph, graphSpec, svgSpec, listener) {
        this.graph = graph;
        this.graphSpec = graphSpec;
        this.svgSpec = svgSpec;

        this.listener = listener;

        this.accidents = null;
        this.lga = null;
        this.selectedPostcode = null;
    }

    onPostcodeClick(postcode) {
        this.selectedPostcode = postcode;
        if (this.listener) {
            this.listener.onPostcodeSelected();
        }
    }

    start() {
        const self = this;
        DataSet.load().then(function (dataset) {
            self.lga = dataset.lga();
            self.accidents = dataset.accidents();
            self.showMap();
            // self.onPostcodeClick("3030")
        });
    }

    showMap() {
        this.clearGraph();
        const byLocation = new ByLocationMap(this.graph, this.graphSpec, this);
        byLocation.render(this.accidents, this.lga);
    }

    clearGraph() {
        this.graph.selectAll("*").remove();
    }

    showByTimeChart() {
        this.clearGraph();
        const byTimeBarChart = new ByTimeBarChart(this.graph, this.graphSpec, this.svgSpec);

        const accidentsAtPostcode = this.accidents.filterByPostcode(this.selectedPostcode);
        const accidentsDeathOnly = accidentsAtPostcode.deathOnly();
        byTimeBarChart.render(accidentsDeathOnly);
    }

    showByGenderChart() {
        this.clearGraph();
        const byGender = new ByGenderChart(this.graph, this.graphSpec, this.svgSpec);

        const accidentsAtPostcode = this.accidents.filterByPostcode(this.selectedPostcode);
        const accidentsDeathOnly = accidentsAtPostcode.deathOnly();
        byGender.render(accidentsDeathOnly);
    }

    showByLightConditionChart() {
        this.clearGraph();
        const byLightCondition = new ByLightConditionChart(this.graph, this.graphSpec, this.svgSpec);

        const accidentsAtPostcode = this.accidents.filterByPostcode(this.selectedPostcode);
        const accidentsDeathOnly = accidentsAtPostcode.deathOnly();
        byLightCondition.render(accidentsDeathOnly);
    }
}