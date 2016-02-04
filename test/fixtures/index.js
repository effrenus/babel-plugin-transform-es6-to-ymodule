//SETMODULE: bubble.layout
import 'Map';
import 'Placemark';

var size = [100, 200],
	color = 'red';

const map = new Map({
	center: [55, 45],
	zoom: 10
});

export function getColor () {
	return color;
}

export function getMap () {
	return map;
}