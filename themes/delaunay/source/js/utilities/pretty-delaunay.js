import * as constants from '../constants';

const canvas = document.getElementById('delaunayHero');
const PrettyDelaunay = require('pretty-delaunay');

// init delaunay plugin and get one triangulation
const delaunay = new PrettyDelaunay(canvas, constants.prettyDelaunayOptions);

generatePrettyDelaunay(true);

// generate pretty delaunay with synced colors for hero and footer
export function generatePrettyDelaunay(firstTime) {
	// generate a random multiplier between max and min
	var max = 0.8;
	var min = 0.2;
	var multiplier = Math.random() * (max - min) + min;

	// set multiplier on both prettydelanay instances
	delaunay.options.multiplier = multiplier;
	// footerDelaunay.options.multiplier = multiplier;

	if (!firstTime) {
		// randomize is run on init, so we dont need to do it again
		delaunay.randomize();
		// leave "web developer" as first subhead
		randomSubhead();
	}

	// sync the hero colors with the footer since hero
	// will choose randomly from color palette
	// footerDelaunay.colors = delaunay.getColors();
	// footerDelaunay.randomize();
}

// const redoButton = document.getElementById('delaunayRedo');

// on redo button make a new triangulation and get a new subhead
// redoButton.addEventListener('click', function() {
// 	generatePrettyDelaunay();
// });
