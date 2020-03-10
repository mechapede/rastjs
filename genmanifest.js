#!/usr/bin/node
/* Generates the manifest files based on assets/ directory
 * Expects the following subdirectories
 *   levels/
 *   materials/
 *   modles/
 *   objects/
 *   scripts/
 *   textures/
 *
 * The engine/ directory for source
 * And generates the executable */

const fs = require('fs');
var directory = "assets";
//TODO take arguement to directory

var levels = {};
var materials = {};
var models = [];
var objects = {};
var scripts = [];
var shaders = [];
var textures = [];
var texture_configs = {};

var reglevel = /^(\w+)\.lvl$/;
var regmaterial = /^(\w+)\.mtl$/;
var regmodel = /^(\w+)\.mdl$/;
var regobj = /^(\w+)\.obj$/;
var regscr = /^(\w+)\.js$/;
var regshader = /^(\w+)\.(vrt)\.glsl$/;
var regtex = /^(\w+)\.(?:png|jpg)$/;
var regtex_config = /^(\w+)\.tx$/;


function writeFile(path,contents) {
    return new Promise((resolve,reject)=> {
        fs.writeFile(path,contents, (err)=> {
            if(err) reject(err);
            else resolve();
        });
    });
}

function readDir(path) {
    return new Promise((resolve,reject)=> {
        fs.readdir(path,(err,dir)=> {
            if(err) reject(err);
            else resolve(dir);
        });
    });
}

function readFile(path) {
    return new Promise((resolve,reject)=> {
        fs.readFile(path,(err,file)=> {
            if(err) reject(err);
            else resolve(file);
        });
    });
}

var level_promises = readDir(directory + "/levels/").then(entrys=> {
    var evalid = entrys.filter( e=>e.match(reglevel)).map(e=>e.match(reglevel)[1]);
    var p = [];
    evalid.forEach( entry => {
        p.push(readFile(directory + "/levels/" + entry + ".lvl").then(contents=> {
            var level = JSON.parse(contents);
            levels[entry]=level;
            //TODO Validate names of json vs filenames
        }));
    });
    return Promise.all(p);
});

var material_promises = readDir(directory + "/materials/").then(entrys=> {
    var evalid = entrys.filter( e=>e.match(regmaterial)).map(e=>e.match(regmaterial)[1]) ;
    var p = [];
    evalid.forEach( entry => {
        p.push(readFile(directory + "/materials/" + entry + ".mtl").then(contents=> {
            var material = JSON.parse(contents);
            materials[entry]=material;
        }));
    });
    return Promise.all(p);
});

var model_promises = readDir(directory + "/models/").then(entrys=> {
    var evalid = entrys.filter( e=>e.match(regmodel)).map(e=>e.match(regmodel)[1]);
    models.push(...evalid);
});

var object_promises = readDir(directory + "/objects/").then(entrys=> {
    var evalid = entrys.filter( e=>e.match(regobj)).map(e=>e.match(regobj)[1]);
    var p = [];
    evalid.forEach( entry => {
        p.push(readFile(directory + "/objects/" + entry + ".obj").then(contents=> {
            var obj = JSON.parse(contents);
            objects[entry]=obj;
        }));
    });
    return Promise.all(p);
});

var script_promises = readDir(directory + "/scripts/").then(entrys=> {
    var evalid = entrys.filter( e=>e.match(regscr)).map(e=>e.match(regscr)[1]);
    scripts.push(...evalid);
});

var shader_promises = readDir(directory + "/shaders/").then(entrys=> {
    var evalid = entrys.filter( e=>e.match(regshader)).map(e=>e.match(regshader)[1]);
    shaders.push(...evalid);
});

var texture_promises = readDir(directory + "/textures/").then(entrys=> {
    var evalid = entrys.filter( e=>e.match(regtex_config)).map(e=>e.match(regtex_config)[1]);
    var evalid_textures = entrys.filter( e=>e.match(regtex));
    textures.push(...evalid_textures);
    var p = [];
    evalid.forEach( entry => {
        p.push(readFile(directory + "/textures/" + entry + ".tx").then(contents=> {
            var tex = JSON.parse(contents);
            texture_configs[entry]=tex;
        }));
    });
    return Promise.all(p);
});

Promise.all([level_promises,material_promises,object_promises,script_promises,shader_promises,texture_promises]).then(()=> {
    if(!("start" in levels)) {
        console.log("Warning: No level named 'start' found!");
    }
    for(var tex_key in texture_configs) {
        var tex_list = texture_configs[tex_key]["textures"];
        tex_list.forEach((tex)=> {
            if(!textures.includes(tex)) {
                console.log("Waning: texture " + tex + " used in texture " + tex_key + " not found!");
            }
        });
    }
    for(var mat_key in materials) {
        var tex_list = materials[mat_key]["textures"];
        var shader = materials[mat_key]["shader"];
        tex_list.forEach((tex)=> {
            if( !(tex in texture_configs)) {
                console.log("Warning: texture " + tex + " used in material " + mat_key + " not found!");
            }
        });
    }
    for(var obj_key in objects) {
        var obj = objects[obj_key];
        if( "material" in obj && !(obj["material"] in materials) ) {
            console.log("Warning: material " + obj["material"] + " used in object " + obj_key + " not found.");
        }
        if( "model" in obj && !( models.includes(obj["model"]))) {
            console.log("Warning: model " + obj["model"] + " used in object " + obj_key + " not found.");
        }
        if( "scripts" in obj ) {
            obj["scripts"].forEach(scr=> {
                if(!scripts.includes(scr)) {
                    console.log("Warning: script " + scr + " used in object " + obj_key + " not found.");
                }
            });
        }
    }
    for(var level_key in levels) {
        var level = levels[level_key];
        if( "instances" in level ) {
            level["instances"].forEach( ins => {
                if( !(ins in objects) ) {
                    console.log("Warning: object " + ins + " used in level " + level + " not found.");
                }
            });
        }
    }

    var manifest = {"levels":
                    levels, "materials":
                    materials, "models":
                    models, "objects":
                    objects,
                    "scripts":
                    scripts,
                    "shaders":shaders,
                    "textures":
                    textures,
                    "texture_configs":texture_configs
                   };
    writeFile("manifest.auto",JSON.stringify(manifest));

}).catch((err)=>console.log("Error in manifest generation: ",err)); //TODO: add better error messages
