const colorChangeElements = document.getElementsByClassName('color-change');

// on delaunay regen, change the color of the subhead
// and add a text shadow to the hero title if it's
// an especially light background
export function colorChange(color) {
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
export function lighterColor(lightness) {
	let diff = 25;
	let l = Math.min(lightness + diff, 100);

	if (Math.abs(lightness - l) < diff) {
		l = Math.max(lightness - diff, 0);
	}

	return l;
}

export function hslaGetLightness(color) {
	return parseInt(color.split(',')[2]);
}

export function hslaAdjustLightness(color, lightness) {
	color = color.split(',');

	if (typeof lightness !== 'function') {
		color[2] = lightness;
	} else {
		color[2] = lightness(parseInt(color[2]));
	}

	color[2] += '%';
	return color.join(',');
}
