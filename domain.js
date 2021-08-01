class DataSet {
    constructor(accidentData, driverData, nodeData, vehicleData, lgaData) {
        this.accidentData = accidentData;
        this.driverData = driverData;
        this.nodeData = nodeData;
        this.vehicleData = vehicleData;
        /**
         * LGA: Australia Local Government Areas.
         */
        this.lgaData = lgaData;
    }

    accidents() {
        const nodes = this.nodes();
        const vehicles = this.vehicles();
        const drivers = this.drivers();
        const array = this.accidentData.map(function(d) {
            return new Accident(
                d.ACCIDENT_NO,
                new Date(d.Accident_Date_Time),
                Number.parseInt(d.NO_PERSONS_KILLED),
                d.Light_Condition_Category
            );
        });
        return new Accidents(array, nodes, vehicles, drivers);
    }

    nodes() {
        const array = this.nodeData.map(function(d) {
            return new Node(
                d.ACCIDENT_NO,
                d.POSTCODE_NO,
                d.Lat,
                d.Long,
                d.NODE_ID
            );
        });
        return new Nodes(array);
    }

    vehicles() {
        const array = this.vehicleData.map(function(d) {
            return new Vehicle(
                d.ACCIDENT_NO,
                d.VEHICLE_ID,
                d.Vehicle_Category,
                d.Vehicle_Type_Desc
            );
        });
        return new Vehicles(array);
    }

    drivers() {
        const array = this.driverData.map(function(d) {
            return new Driver(
                d.ACCIDENT_NO,
                d.PERSON_ID,
                d.VEHICLE_ID,
                d.Gender,
                d.Road_User_Type_Desc
            );
        });
        return new Drivers(array);
    }

    lga() {
        const victoria = this.lgaData;
        victoria.objects.states.geometries = victoria.objects.states.geometries.filter(function(geometry) {
            return geometry.id == "Victoria";
        });
        victoria.objects.lga.geometries = victoria.objects.lga.geometries.filter(function (geometry) {
            return geometry.properties.State == "Victoria";
        });
        return victoria;
    }

    static load() {
        return Promise.all([
            d3.csv("data/accident-cleaned.csv"),
            d3.csv("data/driver-cleaned.csv"),
            d3.csv("data/node-cleaned.csv"),
            d3.csv("data/vehicle-cleaned.csv"),
            d3.json("data/lga_state.json"),
        ]).then(function(files) {
            return new DataSet(...files);
        }).catch(function(err) {
            // handle error here
        });
    }
}

class Accident {
    constructor(id, dateTime, numberPersonsKilled, lightConditionCategory) {
        this.id = id;
        this.date = new Date(dateTime.toDateString());
        this.dateTime = dateTime;
        this.numberPersonsKilled = numberPersonsKilled;
        this.lightConditionCategory = lightConditionCategory;
    }

    hasDeath() {
        return this.numberPersonsKilled > 0;
    }
}

class Accidents {
    constructor(accidents, nodes, vehicles, drivers) {
        this.accidents = accidents;
        this.nodes = nodes;
        this.vehicles = vehicles;
        this.drivers = drivers;
    }

    groupByDate() {
        return this.groupByProperty("date");
    }

    groupByProperty(prop) {
        const groups = this.accidents.groupByProperty(prop);
        return this.groupByWrapper(groups);
    }

    groupByWrapper(groups) {
        const self = this;
        const accidentGroups = groups.map(function(item) {
            const group = new Accidents(item.group, self.nodes, self.vehicles, self.drivers);
            return { key: item.key, group: group };
        });
        return new GroupBy(accidentGroups);
    }

    groupByPostcode() {
        const self = this;
        return this.groupBy(function(accident) {
            const node = self.nodes.nodeOfAccident(accident.id);
            return node.postcode;
        });
    }

    groupBy(f) {
        const groups = this.accidents.groupBy(f);
        return this.groupByWrapper(groups);
    }

    totalDeaths() {
        return this.accidents.reduce((s, item) => s + item.numberPersonsKilled, 0);
    }

    filterByPostcode(postcode) {
        const self = this;
        const result = this.accidents.filter(function(accident) {
            const node = self.nodes.nodeOfAccident(accident.id);
            return node.postcode == postcode;
        });
        return new Accidents(result, this.nodes, this.vehicles, this.drivers);
    }

    groupByVehicleCategory() {
        const self = this;
        const byCategoryObject = this.accidents.reduce(function (acc, accident) {
            const vehiclesAtAccident = self.vehicles.vehiclesOfAccident(accident.id);
            const categories = vehiclesAtAccident.vehicleCategories();
            return categories.reduce(function(accInside, category) {
                if (!accInside.hasOwnProperty(category)) {
                    accInside[category] = [];
                }
                accInside[category].push(accident);
                return accInside;
            }, acc);
        }, {});
        const groups =  Object.entries(byCategoryObject).map(function(item) {
            return {key: item[0], group: item[1]};
        });
        return this.groupByWrapper(groups)
    }

    groupByDriverGender() {
        const self = this;
        const byGenderMap = this.accidents.reduce(function (acc, accident) {
            const driversOfAccident = self.drivers.driversOfAccident(accident.id);
            const genders = driversOfAccident.driverGenders();
            return genders.reduce(function(accInside, key) {
                if (!accInside.has(key)) {
                    accInside.set(key, []);
                }
                const group = accInside.get(key);
                group.push(accident);
                return accInside;
            }, acc);
        }, new Map());

        const groups = Array.from(byGenderMap, function(entry) {
            const [key, value] = entry;
            return {key: key, group: value};
        });
        return this.groupByWrapper(groups)
    }

    groupByLightCondition() {
        return this.groupByProperty("lightConditionCategory");
    }

    deathOnly() {
        const result = this.accidents.filter(item => item.hasDeath());
        return new Accidents(result, this.nodes, this.vehicles, this.drivers);
    }

    total() {
        return this.accidents.length;
    }

    firstGeoLocation() {
        const accident = this.accidents[0];
        const node = this.nodes.nodeOfAccident(accident.id);
        return {latitude: node.latitude, longitude: node.longitude};
    }

    data() {
        return this.accidents;
    }

    maxDeaths() {
        const deaths = this.accidents.map(a => a.numberPersonsKilled);
        return Math.max.apply(null, deaths);
    }

    static vehicleCategories = ["Other Vehicles", "Motor Cycles", "Heavy Vehicles", "Light Vehicles"];
    static lightConditionCategories = ["Dark Street lights on", "Dark Street no lights", "Day", "Others"];
    static genders = ["Female", "Male", "Unknown"];

    static startDate = new Date("2015-01-01");
    static endDate = new Date("2019-12-31");

    static startAccidentPlaceHolder = new Accident(null, Accidents.startDate, 0, null, null, null);
    static endAccidentPlaceHolder = new Accident(null, Accidents.endDate, 0, null, null, null);
}

class GroupBy {
    constructor(groups) {
        this.groups = groups;
    }

    sortByGroup(f) {
        const sorted = this.groups.sort(function (a, b) {
            return f(a.group, b.group);
        });

        return new GroupBy(sorted)
    }

    sortByKey() {
        const sorted = this.groups.sort(function (a, b) {
            return a.key.localeCompare(b.key);
        });

        return new GroupBy(sorted)
    }

    rangeByGroup(f, initialValue) {
        return this.groups.reduce(function (acc, item) {
            const value = f(item.group)
            acc[0] = Math.min(acc[0], value);
            acc[1] = Math.max(acc[1], value);
            return acc;
        }, initialValue);
    }

    reduce(f, initialValue) {
        return this.groups.reduce(f, initialValue);
    }

    take(n) {
        return new GroupBy(this.groups.slice(0, n));
    }
}

class Driver {
    constructor(accidentId, personId, vehicleId, gender, roadUserCategory) {
        this.accidentId = accidentId;
        this.personId = personId;
        this.vehicleId = vehicleId;
        this.gender = gender;
        this.roadUserCategory = roadUserCategory;
    }
}

class Drivers {
    constructor(drivers) {
        this.drivers = drivers;
        this.byAccident = drivers.reduce(function (acc, item) {
            if (!acc.has(item.accidentId)) {
                acc.set(item.accidentId, []);
            }
            const items = acc.get(item.accidentId);
            items.push(item);
            acc.set(item.accidentId, items)
            return acc;
        }, new Map());
    }

    driversOfAccident(accidentId) {
        if (this.byAccident.has(accidentId)) {
            return new Drivers(this.byAccident.get(accidentId));
        } else {
            throw new Error(`Unknown accidentId '${accidentId}'`)
        }
    }

    driverGenders() {
        const genders = this.drivers.reduce(function (acc, item) {
            acc.add(item.gender);
            return acc;
        }, new Set());
        return Array.from(genders);
    }
}

class Node {
    constructor(accidentId, postcode, latitude, longitude, nodeId) {
        this.accidentId = accidentId;
        this.postcode = postcode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.nodeId = nodeId;
    }
}

class Nodes {
    constructor(nodes) {
        this.nodes = nodes;
        this.byAccident = nodes.reduce(function (acc, node) {
            acc.set(node.accidentId, node)
            return acc;
        }, new Map());
    }

    nodeOfAccident(accidentId) {
        if (this.byAccident.has(accidentId)) {
            return this.byAccident.get(accidentId)
        } else {
            throw new Error(`Unknown accidentId '${accidentId}'`)
        }
    }
}

class Vehicle {
    constructor(accidentId, vehicleId, vehicleCategory, vehicleTypeDesc) {
        this.accidentId = accidentId;
        this.vehicleId = vehicleId;
        this.vehicleCategory = vehicleCategory;
        this.vehicleTypeDesc = vehicleTypeDesc;
    }
}

class Vehicles {
    constructor(vehicles) {
        this.vehicles = vehicles;
        this.byAccident = vehicles.reduce(function (acc, vehicle) {
            if (!acc.has(vehicle.accidentId)) {
                acc.set(vehicle.accidentId, []);
            }
            const vehiclesOfAccident = acc.get(vehicle.accidentId);
            vehiclesOfAccident.push(vehicle);
            acc.set(vehicle.accidentId, vehiclesOfAccident)
            return acc;
        }, new Map());
    }

    vehiclesOfAccident(accidentId) {
        if (this.byAccident.has(accidentId)) {
            return new Vehicles(this.byAccident.get(accidentId));
        } else {
            throw new Error(`Unknown accidentId '${accidentId}'`)
        }
    }

    vehicleCategories() {
        const categories = this.vehicles.reduce(function (acc, item) {
            acc.add(item.vehicleCategory);
            return acc;
        }, new Set());
        return Array.from(categories);
    }

    vehicleTypes() {
        return this.vehicles.map(v => v.vehicleTypeDesc);
    }
}

Array.prototype.groupBy = function(f) {
    const byKey = this.reduce(function (acc, item) {
        const key = f(item);
        if (!acc.has(key)) {
            acc.set(key, []);
        }
        const group = acc.get(key);
        group.push(item);
        return acc;
    }, new Map());
    return Array.from(byKey, function(entry) {
        const [key, group] = entry;
        return {key: key, group: group};
    });
    // const byKey = this.reduce(function (acc, item) {
    //     const key = f(item);
    //     if (!acc.hasOwnProperty(key)) {
    //         acc[key] = [];
    //     }
    //     acc[key].push(item);
    //     return acc;
    // }, {});
    // return Object.entries(byKey).map(function(item) {
    //     return {key: item[0], group: item[1]};
    // });
};

Array.prototype.groupByProperty = function(prop) {
    return this.groupBy(item => item[prop]);
}

Array.prototype.groupCount = function(f) {
    return this.groupBy(f).map(function(item) {
        const {key, group} = item;
        return {key: key, count: group.length};
    });
}