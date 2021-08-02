class Main extends ControllerListener {
    constructor() {
        super();
        this.btns = document.querySelectorAll('.tab button');
        this.desc3352Div = document.querySelector('#desc3352');
        this.desc3030Div = document.querySelector('#desc3030');
        this.descDivs = {"3352": this.desc3352Div, "3030": this.desc3030Div};
        this.byTimeBtn = document.querySelector('.tab #byTime');
        this.byLightConditionBtn = document.querySelector('.tab #byLightCondition');
        this.detailsDiv = document.querySelector('#details');
        this.mainDiv = document.querySelector("#main");
        this.detailSelected = "byTime";

        this.controller = new Controller(graph, graphSpec, svgSpec, this);

        this.initialize();
    }

    initialize() {
        const self = this;
        this.btns.forEach(function (btn) {
            btn.addEventListener("click", e => self.onButtonClick(self, e));
        })
    }

    clearDetailSelection() {
        this.btns.forEach(btn => btn.classList.remove("active"));
        Object.values(this.descDivs).forEach(div => div.style.display = "none");
    }

    onButtonClick(self, e) {
        self.clearDetailSelection();
        self.detailSelected = e.target.dataset.detail;

        e.target.classList.add("active");

        switch(self.detailSelected) {
            case "byTime":
                self.showByTimeChart();
                break;
            case "byGender":
                self.showByGenderChart();
                break;
            case "byLightCondition":
                self.showByLightConditionChart();
                break;
            case "byLocation":
                self.showMap();
                break;
            default:
                self.showMap();
        }
    }

    showByTimeChart() {
        this.controller.showByTimeChart();
        this.descDivs[this.controller.selectedPostcode].style.display = "block";
    }

    showByGenderChart() {
        this.controller.showByGenderChart();
        this.descDivs[this.controller.selectedPostcode].style.display = "block";
    }

    showByLightConditionChart() {
        this.controller.showByLightConditionChart();
        this.descDivs[this.controller.selectedPostcode].style.display = "block";
    }

    showMap() {
        this.selectByTime();

        this.mainDiv.style.display = "block";
        this.detailsDiv.style.display = "none";

        this.controller.showMap();
    }

    selectByTime() {
        this.detailSelected = "byTime"
        this.byTimeBtn.classList.add("active");
    }

    start() {
        this.controller.start();
    }

    onPostcodeSelected() {
        this.clearDetailSelection();
        this.descDivs[this.controller.selectedPostcode].style.display = "block";
        if(this.controller.selectedPostcode == "3030") {
            this.byLightConditionBtn.style.display = "none";
        } else {
            this.byLightConditionBtn.style.display = "block";
        }
        this.mainDiv.style.display = "none";
        this.detailsDiv.style.display = "block";
        this.selectByTime();

        this.showByTimeChart();
    }
}

new Main().start();



