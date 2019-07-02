
require('dotenv').config()
const huejay = require('huejay');

// Converts RGB into Hue color
const color = (r,g,b) => {
    // stolen from: https://npmjs.com/hue.js
    let rgb2hsv = function(r, g, b) {
        var r = (r / 255),
            g = (g / 255),
            b = (b / 255);
    
        var min = Math.min(Math.min(r, g), b),
            max = Math.max(Math.max(r, g), b),
            delta = max - min;
    
        var value = max,
            saturation,
            hue;
    
        // Hue
        if (max == min) {
            hue = 0;
        } else if (max == r) {
            hue = (60 * ((g-b) / (max-min))) % 360;
        } else if (max == g) {
            hue = 60 * ((b-r) / (max-min)) + 120;
        } else if (max == b) {
            hue = 60 * ((r-g) / (max-min)) + 240;
        }
    
        if (hue < 0) {
            hue += 360;
        }
    
        // Saturation
        if (max == 0) {
            saturation = 0;
        } else {
            saturation = 1 - (min/max);
        }
    
        return [Math.round(hue), Math.round(saturation), Math.round(value)];
    };
    let hsv = rgb2hsv(r,g,b);
    return {
        hue: 182*hsv[0],
        saturation: Math.ceil(254*hsv[1]),
        brightness: Math.ceil(254*hsv[2])
    };
}

const LIGHT_1 = parseInt(process.env.LIGHT_1);
const LIGHT_2 = parseInt(process.env.LIGHT_2);
const LIGHT_3 = parseInt(process.env.LIGHT_3);

const USA_RED   = process.env.USA_RED.split(',').map(e => parseInt(e))
const USA_WHITE = process.env.USA_WHITE.split(',').map(e => parseInt(e))
const USA_BLUE  = process.env.USA_BLUE.split(',').map(e => parseInt(e))

const ITERATION_DELAY = parseInt(process.env.ITERATION_DELAY_MS);
const TRANSITION_TIME = parseInt(process.env.TRANSITION_TIME_DS);

// Color cycle
const cycle = [
    color(...USA_RED),
    color(...USA_WHITE),
    color(...USA_BLUE)
];

// async function that updates the state of the Light
const mutateColor = async (light, color) => {
    light.hue        = color.hue;
    light.saturation = color.saturation;
    light.brightness = color.brightness;
    light.transitionTime = TRANSITION_TIME;
    return client.lights.save(light);
}

// Copies values from source to target
const copyColor = (target, source) => {
    target.hue        = source.hue;
    target.saturation = source.saturation;
    target.brightness = source.brightness;
}

// https://stackoverflow.com/a/39914235/4852536
const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let client = new huejay.Client({
    host:     process.env.HUE_HOST,
    username: process.env.HUE_USER,
});

// async closure
(async function(){
    let one   = await client.lights.getById(LIGHT_1);
    let two   = await client.lights.getById(LIGHT_2);
    let three = await client.lights.getById(LIGHT_3);

    let pre = color(0,0,0);
    let prepre = color(0,0,0);

    for(let i = 0; ; i++) {
        if(! (i < cycle.length)) i = 0; 
        
        // Save promises
        x = mutateColor(one, cycle[i])
        y = mutateColor(two, pre)
        z = mutateColor(three, prepre);

        // Perform color change simultaneously
        await Promise.all([x, y, z])

        // Wait for changing the colors again
        await sleep(ITERATION_DELAY);
        
        // Minimize object spawns
        copyColor(prepre, pre)
        copyColor(pre, cycle[i])
        // cycle[i] will change next iteration
    }
})()
