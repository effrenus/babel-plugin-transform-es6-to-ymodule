'use strict';

ymaps.modules.define('bubble.layout', ['Map', 'Placemark'], function (provide, Map, Placemark) {
    //SETMODULE: bubble.layout

    var size = [100, 200],
        color = 'red';

    var map = new Map({
        center: [55, 45],
        zoom: 10
    });

    provide({});
})
