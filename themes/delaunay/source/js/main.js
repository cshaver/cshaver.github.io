var PrettyDelaunay = require('pretty-delaunay');

// set up DOM elements
var canvasHero = document.getElementById('delaunayHero');
var canvasFooter = document.getElementById('delaunayFooter');
var body = document.getElementsByTagName('body')[0];
var footer = document.getElementsByTagName('footer')[0];
var header = document.getElementById('header');
var subhead = document.getElementById('subhead');
// var redoButton = document.getElementById('delaunayRedo');
var colorChangeElements = document.getElementsByClassName('color-change');

var options = {
	// colors for triangulation to choose from
	colorPalette: [
		['hsla(330,100%,56%, 1)', 'hsla(320,56%,67%, 1)', 'hsla(255,100%,100%, 1)']
	],
	showEdges: false,
	animate: true,
	// onDarkBackground: colorChange,
	// onLightBackground: colorChange,
};

// list of weighted subheads
var thingsIBe = [{
		text: 'Web Developer',
		weight: 10,
	},
	{
		text: 'Dungeon Master',
		weight: 10,
	},
	{
		text: 'Good at Google',
		weight: 10,
	},
	{
		text: 'Crazy Cat Lady',
		weight: 10,
	},
	{
		text: 'Wannabe Magician',
		weight: 10,
	},
	{
		text: 'Neat-o Person',
		weight: 10,
	},
	{
		text: 'Taco Bell Fangirl',
		weight: 10,
	},
	{
		text: 'Pokémon Master',
		weight: 10,
	},
	{
		text: 'Rabid Trekkie',
		weight: 10,
	},
	{
		text: 'Power Metal Warrior',
		weight: 10,
	},
	{
		text: 'Probably a Wizard',
		weight: 10,
	},
	{
		text: 'Magical Girl',
		weight: 10,
	},
	{
		text: 'Aspiring Sailor Scout',
		weight: 10,
	},
	{
		text: 'Cries at animals that are friends',
		weight: 4,
	},
	{
		text: 'Mathematical!',
		weight: 10,
	},
	{
		text: 'What do you call a nosey pepper?',
		weight: 4,
		next: {
			text: 'Jalapeño business!',
		}
	},
];

var weightedThings = [];
var thingsIndex = 0;
var currentThing = {};

initWeightedThings();


// add 'focus' class to focused elements, also .tile-items
document.addEventListener('focus', function(e) {
	var focusedItems = document.getElementsByClassName('focus');
	for (var i = 0; i < focusedItems.length; i++) {
		focusedItems[i].classList.remove('focus');
	}

	e.target.classList.add('focus');

	var tileItem = e.target.closest('.tile-item');
	if (tileItem) {
		tileItem.classList.add('focus');
	}
}, true);

// on redo button make a new triangulation and get a new subhead
// redoButton.addEventListener('click', function() {
// 	generatePrettyDelaunay();
// });

// init delaunay plugin and get one triangulation
var heroDelaunay = new PrettyDelaunay(canvasHero, options);
// var footerDelaunay = new PrettyDelaunay(canvasFooter, {});
generatePrettyDelaunay(true);

/**
 * Helper Functions
 **/

// generate pretty delaunay with synced colors for hero and footer
function generatePrettyDelaunay(firstTime) {
	// generate a random multiplier between max and min
	var max = 0.8;
	var min = 0.2;
	var multiplier = Math.random() * (max - min) + min;

	// set multiplier on both prettydelanay instances
	heroDelaunay.options.multiplier = multiplier;
	// footerDelaunay.options.multiplier = multiplier;

	if (!firstTime) {
		// randomize is run on init, so we dont need to do it again
		heroDelaunay.randomize();
		// leave "web developer" as first subhead
		randomSubhead();
	}

	// sync the hero colors with the footer since hero
	// will choose randomly from color palette
	// footerDelaunay.colors = heroDelaunay.getColors();
	// footerDelaunay.randomize();
}

// add index to array "weight" number of times
// so an item with weight two will be added twice
function initWeightedThings() {
	for (var i = 0; i < thingsIBe.length; i++) {
		for (var j = 0; j < thingsIBe[i].weight; j++) {
			weightedThings.push(i);
		}
	}
}

// swap the hero subhead with something (weighted, sequence optional)
// random from the list of subheads
function randomSubhead() {
	var newSubhead;
	var i;

	// if current has a next, use next
	// this is for jokes
	if (currentThing.next) {
		newSubhead = currentThing.next.text;
		currentThing = currentThing.next;

		subhead.innerHTML = newSubhead;
		subhead.dataset.text = newSubhead;
	} else {
		// choose an index from the weighted array
		// weighted array contains indeces from subhead data array
		do {
			i = Math.floor(Math.random() * (weightedThings.length));
		} while (weightedThings[i] === thingsIndex);

		// actual index from weighted array
		thingsIndex = weightedThings[i];

		// save current subhead data so we can look at "next" later
		currentThing = thingsIBe[thingsIndex];

		// get the actual text
		newSubhead = thingsIBe[thingsIndex].text;

		subhead.innerHTML = newSubhead;
		subhead.dataset.text = newSubhead;
	}
}

// on delaunay regen, change the color of the subhead
// and add a text shadow to the hero title if it's
// an especially light background
function colorChange(color) {
	var lightness = hslaGetLightness(color);

	// get a more contrasted version of the color
	color = hslaAdjustLightness(color, lighterColor);

	// always change the subhead text to match new color
	subhead.style.color = color;

	// for really light colors, add a shadow to the title
	// so that its a little more readable
	if (lightness > 70) {
		header.style.color = color;
		header.className = 'with-shadow';
	} else {
		header.style.color = '';
		header.className = '';
	}

	for (var i = 0; i < colorChangeElements.length; i++) {
		colorChangeElements[i].style.color = color;
	}
}

// use maths to get a more contrasted color
function lighterColor(lightness) {
	let diff = 25;
	let l = Math.min(lightness + diff, 100);

	if (Math.abs(lightness - l) < diff) {
		l = Math.max(lightness - diff, 0);
	}

	return l;
}

function hslaGetLightness(color) {
	return parseInt(color.split(',')[2]);
}

function hslaAdjustLightness(color, lightness) {
	color = color.split(',');

	if (typeof lightness !== 'function') {
		color[2] = lightness;
	} else {
		color[2] = lightness(parseInt(color[2]));
	}

	color[2] += '%';
	return color.join(',');
}
})();
