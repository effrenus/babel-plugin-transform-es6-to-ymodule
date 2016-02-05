# Babel plugin

Transform ES6 module syntax to YModule declarations

## Plugin settings

* `namespace` - modules prefix

## Example

```
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
```

transformed to

```
'use strict';

ymaps.modules.define('bubble.layout', ['Map', 'Placemark'], function (provide, Map, Placemark) {

	var size = [100, 200],
	    color = 'red';

	var map = new Map({
		center: [55, 45],
		zoom: 10
	});

	provide({
		'getColor': function getColor() {
			return color;
		},
		'getMap': function getMap() {
			return map;
		}
	});
})
```
