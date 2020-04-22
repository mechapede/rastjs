/* Event driven movement controll for update */
import * as data from "./data.js";

//due to run to completion, these will not be updated during drawing
var key_state = {}; //0 up, 1 down
var mouse_x = 0; //movement since last
var mouse_y = 0;


export function start(canvas){
    
    var canvas = data.getGlobal("canvas");
    var mouse_locked = 0;
    
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        key_state[key] = 1;
    }, false);
    document.addEventListener('keyup', (event) => {
        const key = event.key;
        key_state[key] = 0;
    }, false);
    document.addEventListener("pointerlockchange", function(event) {
        if ( document.pointerLockElement === canvas ) {
            mouse_locked = 1;
        } else {
            mouse_locked = 0;
        }
    });
    canvas.addEventListener("click", function() {
        canvas.requestPointerLock();
    });
    //TODO: make movement one value inbetween frames of updating
    document.addEventListener("mousemove", function(event) {
        if ( mouse_locked ) {
            mouse_x += event.movementX;
            mouse_y +=  event.movementY;
        } else {
            mouse_x = 0;
            mouse_y = 0;
        }
    });
};

export function get_key(keycode){
    if(keycode in key_state){
      return key_state[keycode];  
    } else {
        return 0; 
    }
}

export function frame_done(){
    mouse_x = 0;
    mouse_y = 0;
}

//fix reset when unlocking mouse
export function get_mouse_x(){
    return mouse_x;
}

export function get_mouse_y(){
    return mouse_y;
}
