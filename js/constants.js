(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.initWeightedSubheadIndeces = initWeightedSubheadIndeces;
exports.randomSubhead = randomSubhead;
var body = document.getElementsByTagName('body')[0];

var weightedSubheadIndeces = [];
var currentSubhead = {};
var currentSubheadIndex = void 0;

// add index to array "weight" number of times
// so an item with weight `2` will be added twice
function initWeightedSubheadIndeces() {
	for (var i = 0; i < subheads.length; i++) {
		for (var j = 0; j < subheads[i].weight; j++) {
			weightedSubheadIndeces.push(i);
		}
	}
}

// swap the hero subhead with something (weighted, sequence optional)
// random from the list of subheads
function randomSubhead() {
	if (!weightedSubheadIndeces.length) {
		initWeightedSubheadIndeces();
	}

	var i = void 0;
	var newSubhead = void 0;

	// if current has a next, use next
	// this is for jokes
	if (currentSubhead.next) {
		newSubhead = currentSubhead.next;
	} else {
		// choose an index from the weighted array
		// weighted array contains indeces from subhead data array
		do {
			i = Math.floor(Math.random() * weightedSubheadIndeces.length);
		} while (weightedSubheadIndeces[i] === currentSubheadIndex);

		// actual index from weighted array
		currentSubheadIndex = weightedSubheadIndeces[i];

		// save current subhead data so we can look at "next" later
		newSubhead = subheads[currentSubheadIndex];
	}

	if (!newSubhead.title && currentSubhead.title !== defaultTitle) {
		newSubhead.title = defaultTitle;
	}

	return currentSubhead = newSubhead;
}

var colorPalette = exports.colorPalette = [['hsla(330, 100%, 56%, 1)', 'hsla(320, 56%, 67%, 1)', 'hsla(255, 100%, 100%, 1)'], ['hsla(252, 85%, 66%, 1)', 'hsla(258, 77%, 80%, 1)', 'hsla(255, 100%, 100%, 1)'], ['hsla(177, 84%, 43%, 1)', 'hsla(171, 70%, 69%, 1)', 'hsla(255, 100%, 100%, 1)'], ['hsla(246, 70%, 47%, 1)', 'hsla(230, 55%, 64%, 1)', 'hsla(255, 100%, 100%, 1)']];

var prettyDelaunayOptions = exports.prettyDelaunayOptions = {
	// colors for triangulation to choose from
	// start with just pink
	colorPalette: [colorPalette[0]],
	showEdges: false,
	animate: true,
	gradient: {
		minY: function minY(width, height) {
			return -0.5 * height;
		},
		maxY: function maxY(width, height) {
			return 0;
		},
		minX: function minX(width, height) {
			return -0.2 * width;
		},
		maxX: function maxX(width, height) {
			return 1.2 * width;
		},
		minRadius: function minRadius(width, height, numGradients) {
			return height * 0.8;
		},
		maxRadius: function maxRadius(width, height, numGradients) {
			return height;
		},
		connected: false
	},
	minGradients: 4,
	maxGradients: 8,
	loopFrames: 200
};

var defaultTitle = exports.defaultTitle = 'Cristina Shaver.';

// list of weighted subheads
var subheads = exports.subheads = [{
	text: 'Web Developer.',
	weight: 10
}, {
	title: 'Critical Miss.',
	text: 'Hell on quads.',
	weight: 10
}, {
	text: 'Dungeon Master.',
	weight: 10
}, {
	text: 'Crazy Cat Lady.',
	weight: 10
}, {
	text: 'Taco Bell Junkie.',
	weight: 10
}, {
	text: 'Pokémon Master.',
	weight: 10
}, {
	text: 'Probably a Wizard?',
	weight: 10
}, {
	text: 'Magical Girl.',
	weight: 10
}, {
	text: 'What do you call a nosey pepper?',
	weight: 4,
	next: {
		text: 'Jalapeño business!'
	}
}];

},{}]},{},[1]);
