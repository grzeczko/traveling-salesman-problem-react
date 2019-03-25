import _ from 'lodash'

export default class Tsp {
	constructor() {
		this.pointDist = [];
    // stores all JSON data to this.pointLocations
    this.pointLocations = [];
    this.bestOrder = [];
    this.record = Number.MAX_SAFE_INTEGER;
    // total number of points on the map
    this.totalpoints = null;
    this.population = [];
    this.populationDensity = 2000;
    this.desirability = [];
	}

	getShortestRoute(data) {
		this.pointLocations = data;
		this.createPoints();
		this.totalpoints = this.pointDist[0].length - 1;

		this.initialSetup();

		/* Produces the desired number of generations. For now having it equal the this.population
        density seems to work well. May be changed at a later date to a more optimal solution */
        for (let i = 0; i < (this.totalpoints * 6); i += 1) {
            this.getDesirability();
            this.normalizeDesirability();
            this.nextGeneration();
        }
        // Return the best found order when all the generations have completed
        return (this.bestOrder);
	}

	initialSetup() {
        // Creates a default initial linear order - 0, 1, 2, 3..
        const order = Tsp.createLinearArray(this.totalpoints);

        // Shuffles the linear order into the required amount of random arrays to initially
        // fill our this.population with
        for (let i = 0; i < this.populationDensity; i += 1) {
            this.population[i] = order.slice();
            this.population[i] = _.shuffle(this.population[i]);
        }

    }

    static createLinearArray(size) {
        return Array.from(new Array(size + 1),(val,index)=>index);
    }

	createPoints() {
		this.pointLocations.forEach((pointLocation, i) => {
			this.pointDist[i] = [];
			this.pointLocations.forEach((pointLocation, j) => {
				this.pointDist[i][j] = Tsp.latDist(
            this.pointLocations[i].lat,
            this.pointLocations[i].lng,
            this.pointLocations[j].lat,
            this.pointLocations[j].lng,
        );
			});
		});
	}

	// Finds the total distance of a given order
    findTotalDistance(points, order) {
        // Steps through the array of points adding distance between each point based on the order
        let totalDistance = 0;
        for (let i = 0; i < this.totalpoints - 1; i += 1) {
            const pointIndexA = order[i];
            const pointIndexB = order[i + 1];
            const pointLocationA = Number(points[pointIndexA][pointIndexA]);
            const pointLocationB = Number(points[pointIndexB][pointIndexA]);
            const distance = pointLocationA + pointLocationB;
            totalDistance += distance;
        }
        // Return the total distance
        return totalDistance;
    }

    /* Credit to http:// www.movable-type.co.uk/scripts/latlong.html for the algorithm, slightly modified to fit our purposes
    Find the distance between two points given their longitudinal and latitudinal coordinates */
	static latDist(lat1, lon1, lat2, lon2) {
        const R = 6371; //  Radius of the earth in km
        const dLat = Tsp.deg2rad(lat2 - lat1); // Tsp.deg2rad below
        const dLon = Tsp.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(Tsp.deg2rad(lat1))
            * Math.cos(Tsp.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; //  Distance in meters
    }

    // Converts degrees to radians
    static deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    /*
        Get all possible permutations
        Steinhaus–Johnson–Trotter algorithm (http://en.wikipedia.org/wiki/Steinhaus%E2%80%93Johnson%E2%80%93Trotter_algorithm)
    */

    // Simple swap function
    swap(array, index1, index2) {
        if (array && array.length) {
            const temp = array[index1];
            array[index1] = array[index2];
            array[index2] = temp;
            return array;
        }
        return [];
    }

    setRecord(distance, index) {
        if (distance < this.record) {
            this.record = distance;
            this.bestOrder = this.population[index];
        }
    }

    //  Calculates the desirability for every population distribution
    getDesirability() {
        for (let i = 0; i < this.populationDensity; i += 1) {
            const distance = this.findTotalDistance(this.pointDist, this.population[i]);
            // Sets record to the shortest distance and bestOrder to the population spwaned it
            this.setRecord(distance, i);
            // Puts number to the power 12 to exacerbate the difference between good and bad gens
            this.desirability[i] = 1 / ((distance ** 12) + 1);
        }
    }

    // Turns the desirability values into the percentage of the total desirability
    normalizeDesirability() {
        // Adds up all of the this.desirability values
        let sum = 0;
        for (let i = 0; i < this.populationDensity; i += 1) {
            sum += this.desirability[i];
        }
        // Transforms each value into it's relevant percentage of the total desirability
        for (let i = 0; i < this.populationDensity; i += 1) {
            this.desirability[i] = this.desirability[i] / sum;
        }
    }

    // Creates a cross over of two arrays of orders
    static crossOver(orderA, orderB) {
        /* Generates a random start and end point, ensuring that the end is after the start. .slice
        makes it so we can go passed the last index of the order without getting an error. */
        const start = Math.floor(Math.random() * orderA.length);
        const end = Math.floor((Math.random() * orderA.length) + (start + 1));
        const newOrder = orderA.slice(start, end);
        // Add all the elements in from B as long as they're not already in A
        for (let i = 0; i < orderB.length; i += 1) {
            const point = orderB[i];
            if (!newOrder.includes(point)) {
                newOrder.push(point);
            }
        }
        // Return the newly created order
        return newOrder;
    }

    // Creates the next generation of the this.population
    nextGeneration() {
        const newPopulation = [];
        for (let i = 0; i < this.population.length; i += 1) {
            // Gets two of the best populations and then crosses them over
            const orderA = this.chooseDesirable(this.population, this.desirability);
            const orderB = this.chooseDesirable(this.population, this.desirability);
            let order = Tsp.crossOver(orderA, orderB);
            // Mutate at a rate of 8.5%
            order = this.mutate(order, 0.085);
            newPopulation[i] = order;
        }
        this.population = newPopulation;
    }

    // Picks a random number 0 - 1 and starts subtracting desirability
    chooseDesirable(list) {
        let index = 0;
        let r = Math.random(1);
        // While r is still a positive number, keep subtracting the next this.desirability index
        while (r > 0) {
            r -= this.desirability[index];
            index += 1;
        }
        // Compensates for the final unnecessary index increment
        index -= 1;
        // Return the desirability that caused r to go negative
        return list[index].slice();
    }

    // Mutates a given order by a given % mutation rate
    mutate(order, mutationRate) {
        let mutatedOrder = order.slice();
        for (let i = 0; i < this.totalpoints; i += 1) {
            // in mutationRate % of cases this happens
            if (Math.random(1) < mutationRate) {
                // Swaps two random elements in the array
                const indexA = Math.floor(Math.random() * this.totalpoints);
                const indexB = (indexA + 1) % this.totalpoints;
                mutatedOrder = this.swap(mutatedOrder, indexA, indexB);
            }
        }
        return mutatedOrder;
    }
}
