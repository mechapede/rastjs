#!/usr/bin/node
/* Imports an object and converts to the engine format for webgl 
   Assumes model uses the right hand rule(Blender) and converts to left hand rule */
const fs = require('fs');

if( process.argv.length != 3  && process.argv.length != 4 ){
    console.log("Usage: importobj.js INPUTFILE.obj [scale]");
    process.exit();
}
var name = "";
var scale = 1;
var name_regex = /(\w+)\.obj/;

var uv_warn = false;
var smooth_warning = false;
var name_warning = false;

var verts = [];
var normals = [];
var uvs = [];
var indeces = [];

let regcomment = /^#/;
let regvert = /^v\s/;
let regnormal = /^vn\s/;
let reguv  = /^vt\s/;
let regface = /^f\s/;
let regsmooth = /^s\s/;
let regname = /^g\s/;
let regempty = /^\s*$/
let fpformat = /-?\d+\.\d+/g;
let indexformat = /\d+\/\d+\/\d+/g;

var matches = process.argv[2].match(name_regex);
if( matches.length != 2){
    console.log("Name must be alphanumeric be of type .obj");
    process.exit(0);
}
name = matches[1];

if( process.argv.length == 4 ){ //TODO: more robust command line parsing
    scale = Number(process.argv[3]);
    if( isNaN(scale) || scale == 0 ){
        console.log("scale arguement must be a non-zero number.");
        console.log("Usage: importobj.js INPUTFILE.obj [scale]");
    }
}

fs.readFile(process.argv[2], 'ascii', function(err,contents) {
    if(err) throw err;
    var lines = contents.split("\n");

    for(var i=0; i < lines.length; i++){
        var line = lines[i];
        if( line.match(regcomment) || line.match(regempty) ){
            //ignored
        }else if(line.match(regvert)){ //invert for directx
            var v = line.match(fpformat).map(x=>Number(x));
            v[2] = -1.0*v[2]; //xxx
            verts.push(...v);
        }else if(line.match(regnormal)){
            var n = line.match(fpformat).map(x=>Number(x));
            n[2] = -1.0*n[2]; //xxx
            normals.push(...n);
        }else if(line.match(reguv)){
            var u = line.match(fpformat).map(x=>Number(x));
            if(u.length != 2){
                if(!uv_warn){
                    uv_warn = true;
                    console.log("UV with " + u.length + " coordintates read, all uvs are truncated to 2 coordinates!");
                }
                u.length = 2;
            }
            u[1] = 1.0 - u[1]; //xxx
            if( u[1] < 1.0 ) console.log("bar door");
            uvs.push(...u);
        }else if( line.match(regface) ){
            var p = line.match(indexformat).map(x=>x.split("/")).map(x=>x.map(y=>Number(y)));
            if(p.length == 4){
                p = polyconvert(p);
            }else if(p.length != 3){
                console.log("Polygon with " + p.length + " verts is not supported, line " + i + ". Skipping it");
                continue;
            }
            var tmp = p[0]; //xxxxxxxx
            p[0] = p[2];
            p[2] = tmp;
            indeces.push(...p);
        }else if( line.match(regsmooth) ){
            console.log("Smooth groups not supported, skiping line " + i);
        }else if( line.match(regname) ){
            console.log("Name groups are ignored, skiping line " + i);
        }else{
            console.log("Unrecognized line: \"" + line + "\" , line" + i + ". Skipping it.");
        }
    }
    verts = verts.map(x=>x/scale);
    //generate indeces, and remove duplicate vert pairs
    var buff = [];
    var engine_indeces = [];
    var engine_verts = [];
    var engine_normals = [];
    var engine_uvs = [];
    for(var i=0; i < indeces.length; i++){
        buff.push([indeces[i],i,0]);
    }   
    buff.sort((a,b)=>compare_array(a[0],b[0]));
    var index = 0;
    //generate engine verts
    engine_verts.push(verts[(buff[0][0][0]-1)*3],verts[(buff[0][0][0]-1)*3+1],verts[(buff[0][0][0]-1)*3+2]);
    engine_normals.push(normals[(buff[0][0][1]-1)*3],normals[(buff[0][0][1]-1)*3+1],normals[(buff[0][0][1]-1)*3+2]);
    engine_uvs.push(uvs[(buff[0][0][2]-1)*3],uvs[(buff[0][0][2]-1)*3+1]);
    buff[0][2] = index;
    index++;
    for(var i=1; i<buff.length; i++){
        if( buff[i-1][0] != buff[i][0] ){
            engine_verts.push(verts[(buff[i][0][0]-1)*3],verts[(buff[i][0][0]-1)*3+1],verts[(buff[i][0][0]-1)*3+2]);
            engine_uvs.push(uvs[(buff[i][0][1]-1)*2],uvs[(buff[i][0][1]-1)*2+1]); 
            engine_normals.push(normals[(buff[i][0][2]-1)*3],normals[(buff[i][0][2]-1)*3+1],normals[(buff[i][0][2]-1)*3+2]);
            buff[i][2] = index;
            index++;
        }else{
            buff[i][2] = index-1;
        }
    }
    //map indeces to engine
    for(var i=0; i<buff.length; i++){
        engine_indeces[buff[i][1]] = buff[i][2];
    }
    var gamemodel = {"name":name,"indeces":engine_indeces,"verts":engine_verts,"normals":engine_normals,"uvs":engine_uvs};
    fs.writeFile(name + ".mdl",JSON.stringify(gamemodel),(err)=>{
            if(err) throw err;
            console.log("Convesion Completed!");
    })
});

/* For sorting number based arrays */
function compare_array(a,b){
    for(var i=0; i<a.length && i<b.length; i++){
        if( a[i] < b[i] ){
            return -1;
        }else if( a[i] > b[i]){
            return 1;
        }
    }
    if( a.length > b.length){
        return -1;
    }else if( a.length == b.length ){
        return 0;
    }else{
        return 1;
    }
}

/* Converts a quad into two triangles */
function polyconvert(verts){
    //return [verts[0],verts[1],verts[2],verts[2],verts[3],verts[1]];
    return [verts[2],verts[1],verts[0],verts[1],verts[3],verts[2]];
}
