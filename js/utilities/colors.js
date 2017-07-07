(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.colorChange = colorChange;
exports.lighterColor = lighterColor;
exports.hslaGetLightness = hslaGetLightness;
exports.hslaAdjustLightness = hslaAdjustLightness;
var colorChangeElements = document.getElementsByClassName('color-change');

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
	var diff = 25;
	var l = Math.min(lightness + diff, 100);

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

},{}]},{},[1]);
