import * as constants from './constants';
import * as colors from './utilities/colors';
import * as prettyDelaunay from './utilities/pretty-delaunay';

const PrettyDelaunay = require('pretty-delaunay');

const header = document.getElementById('header');

const title = document.getElementById('title');
const subhead = document.getElementById('subhead');


header.addEventListener('click', (e) => {
	prettyDelaunay.generatePrettyDelaunay();

	let randomSubhead = constants.randomSubhead();
	subhead.innerHTML = randomSubhead.text;

	if (randomSubhead.title) {
		title.innerHTML = randomSubhead.title
	}
})
