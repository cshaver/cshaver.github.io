let weightedSubheadIndeces = [];
let currentSubhead = {};
let currentSubheadIndex;

// add index to array "weight" number of times
// so an item with weight `2` will be added twice
export function initWeightedSubheadIndeces() {
	for (let i = 0; i < constants.subheads.length; i++) {
		for (let j = 0; j < constants.subheads[i].weight; j++) {
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

	let newSubhead;
	let i;

	// if current has a next, use next
	// this is for jokes
	if (currentSubhead.next) {
		newSubhead = currentSubhead.next.text;
		currentSubhead = currentSubhead.next;

		subhead.innerHTML = newSubhead;
		subhead.dataset.text = newSubhead;
	} else {
		// choose an index from the weighted array
		// weighted array contains indeces from subhead data array
		do {
			i = Math.floor(Math.random() * (weightedSubheadIndeces.length));
		} while (weightedSubheadIndeces[i] === currentSubheadIndex);

		// actual index from weighted array
		currentSubheadIndex = weightedSubheadIndeces[i];

		// save current subhead data so we can look at "next" later
		currentSubhead = constants.subheads[currentSubheadIndex];

		return currentSubhead;
	}
}

export const prettyDelaunayOptions = {
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
export const subheads = [{
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
