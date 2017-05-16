import * as constants from '../constants';

const canvas = document.getElementById('delaunayHero');
const PrettyDelaunay = require('pretty-delaunay');

// init delaunay plugin and get one triangulation
const delaunay = new PrettyDelaunay(canvas, constants.prettyDelaunayOptions);

generatePrettyDelaunay(true);

delaunay.options.colorPalette = constants.colorPalette;

export function generatePrettyDelaunay(firstTime) {
	// generate a random multiplier between max and min
	var max = 0.8;
	var min = 0.2;
	var multiplier = Math.random() * (max - min) + min;

	delaunay.options.multiplier = multiplier;

	if (!firstTime) {
		// randomize is run on init, so we dont need to do it again
		delaunay.randomize();
	}
}
