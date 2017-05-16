const body = document.getElementsByTagName('body')[0];

let weightedSubheadIndeces = [];
let currentSubhead = {};
let currentSubheadIndex;

// add index to array "weight" number of times
// so an item with weight `2` will be added twice
export function initWeightedSubheadIndeces() {
	for (let i = 0; i < subheads.length; i++) {
		for (let j = 0; j < subheads[i].weight; j++) {
			weightedSubheadIndeces.push(i);
		}
	}
}

// swap the hero subhead with something (weighted, sequence optional)
// random from the list of subheads
export function randomSubhead() {
	if (!weightedSubheadIndeces.length) {
		initWeightedSubheadIndeces();
	}

	let i;
	let newSubhead;

	// if current has a next, use next
	// this is for jokes
	if (currentSubhead.next) {
		newSubhead = currentSubhead.next;
	} else {
		// choose an index from the weighted array
		// weighted array contains indeces from subhead data array
		do {
			i = Math.floor(Math.random() * (weightedSubheadIndeces.length));
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

export const colorPalette = [
	['hsla(330, 100%, 56%, 1)', 'hsla(320, 56%, 67%, 1)', 'hsla(255, 100%, 100%, 1)'],
	['hsla(252, 85%, 66%, 1)', 'hsla(258, 77%, 80%, 1)', 'hsla(255, 100%, 100%, 1)'],
	['hsla(177, 84%, 43%, 1)', 'hsla(171, 70%, 69%, 1)', 'hsla(255, 100%, 100%, 1)'],
	['hsla(246, 70%, 47%, 1)', 'hsla(230, 55%, 64%, 1)', 'hsla(255, 100%, 100%, 1)']
];

export const prettyDelaunayOptions = {
	// colors for triangulation to choose from
	// start with just pink
	colorPalette: [colorPalette[0]],
	showEdges: false,
	animate: true,
	gradient: {
		minY: (width, height) => -0.5 * height,
		maxY: (width, height) => 0,
		minX: (width, height) => -0.2 * width,
		maxX: (width, height) => 1.2 * width,
		minRadius: (width, height, numGradients) => height * 0.8,
		maxRadius: (width, height, numGradients) => height,
		connected: false
	},
	minGradients: 4,
	maxGradients: 8,
	loopFrames: 200
};

export const defaultTitle = 'Cristina Shaver.';

// list of weighted subheads
export const subheads = [
	{
		text: 'Web Developer.',
		weight: 10,
	},
	{
		title: 'Critical Miss.',
		text: 'Hell on quads.',
		weight: 10,
	},
	{
		text: 'Dungeon Master.',
		weight: 10,
	},
	{
		text: 'Crazy Cat Lady.',
		weight: 10,
	},
	{
		text: 'Taco Bell Junkie.',
		weight: 10,
	},
	{
		text: 'Pokémon Master.',
		weight: 10,
	},
	{
		text: 'Probably a Wizard?',
		weight: 10,
	},
	{
		text: 'Magical Girl.',
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
