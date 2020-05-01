/* Module that holds all game data in specialized structures for rendering */
import { GameObject, Instance, RenderType } from "./types.js";

var objects = {};
var materials = {};
var shaders = {};
var models = {};
var scripts = {};
var textures = {};

var levels = {};
var instances = [];
var new_instances = [];
var instance_object_tree = {}; //stores instances organized by objects
var baked_instances = [];

var instance_id = 0;

//null returned on error, so default is false
var globals = {"canvas":
               false,
               "glcontext":
               false,
               "camera_pos": //TODO add more camera proerties here
               null
              }

export function resizeCanvas() {
  var canvas = globals["canvas"];
  var cwidth = canvas.clientWidth;
  var cheight = canvas.clientHeight;
  if(canvas.width != cwidth || canvas.height != cheight) {
    canvas.width = cwidth;
    canvas.height = cheight;

    console.log("Dimensions");
    console.log(cwidth);
    console.log(cheight);
  }
}

export function getGlobal(name) {
  console.assert(name in globals, {name:name, errorMsg:"Key is not in globals!"});
  if(name in globals) {
    return globals[name];
  }
  return undefined;
}

export function setGlobal(name,val) {
  console.assert(name in globals, {name:name,val:val, errorMsg:"Key is not in globals!"});
  globals[name] = val;
  return true;

}

export function addObject(name,obj) {
  console.assert(!(name in objects), {name:name,obj:obj, errorMsg:"Object with the same name clobbered!"});
  objects[name] = obj;
  return true;
}

export function getObject(name) {
  console.assert(name in objects, {name:name, errorMsg:"Object does not exist!"});
  if(name in objects) {
    return objects[name];
  }
  return undefined;
}

export function addScript(name, script) {
  console.assert(!(name in scripts), {name:name,script:script, errorMsg:"Script with the same name clobbered!"});
  scripts[name] = script;
  return true;
}

export function getScript(name) {
  console.assert(name in scripts, {name:name, errorMsg:"Script does not exist!"});
  if(name in scripts) {
    return scripts[name];
  }
  return undefined;
}

export function addModel(name, model) {
  console.assert(!(name in models), {name:name,model:model, errorMsg:"Model with the same name clobbered!"});
  models[name] = model;
  return true;
}

export function getModel(name) {
  console.assert(name in models, {name:name, errorMsg:"Model does not exist!"});
  if(name in models) {
    return models[name];
  }
  return undefined;
}

export function addMaterial(name, material) {
  console.assert(!(name in materials), {name:name,material:material, errorMsg:"Material with the same name clobbered!"});
  materials[name] = material;
  return true;
}

export function getMaterial(name) {
  console.assert(name in materials, {name:name, errorMsg:"Material does not exist!"});
  if(name in materials) {
    return materials[name];
  }
  return undefined;
}

export function addShader(name, shader) {
  console.assert(!(name in shaders), {name:name,shader:shader, errorMsg:"Shader with the same name clobbered!"});
  shaders[name] = shader;
  return true;
}

export function getShader(name) {
  console.assert(name in shaders, {name:name, errorMsg:"Shader does not exist!"});
  if(name in shaders) {
    return shaders[name];
  }
  return undefined;
}

export function addLevel(name,level) {
  console.assert(!(name in levels), {name:name,level:level, errorMsg:"Level with the same name clobbered!"});
  levels[name] = level;
  return true;
}

export function getLevel(name) {
  console.assert(name in levels, {name:name, errorMsg:"Level does not exist!"});
  if(name in levels) {
    return levels[name];
  }
  return undefined;
}


export function getInstance(id) {
  console.assert(id < instances.length && id >= 0, {name:name, errorMsg:"Instance does not exist!"});
  if(id < instances.length && id >= 0) {
    return instances[id];
  }
  return undefined;
}

export function addTexture(name,texture) {
  console.assert(!(name in textures), {name:name,texture:texture, errorMsg:"Texture with the same name clobbered!"});
  textures[name] = texture;
  return true;
}

export function getTexture(name) {
  console.assert(name in textures, {name:name, errorMsg:"Texture does not exist!"});
  if(name in textures) {
    return textures[name];
  }
  return undefined;
}

export function addInstance(position, rotation, obj_name) {
  console.assert(obj_name in objects, {name:obj_name, errorMsg:"Object does not exist! Instance not created."});
  if(obj_name in objects) {
    var obj = objects[obj_name];
    var id = instance_id;
    instance_id++;
    var instance = obj.createInstance(position,rotation,id);
    //instance start at next frame
    if(obj_name in instance_object_tree) {
      instance_object_tree[obj_name].push(instance);
    } else {
      instance_object_tree[obj_name] = [instance];
    }
    instances[id] = instance;
    new_instances.push(instance);
    return id;
  }
  return null;
}

export function addBakedInstances(position, rotation, obj_name, models) {
  console.assert(obj_name in objects, {name:obj_name, errorMsg:"Object does not exist! Instance not created."});
  if(obj_name in objects) {
    var obj = objects[obj_name];
    var proxy_obj_name = obj_name + "-static";
    if(!(proxy_obj_name in objects)){ //proxy fix for objects that are instanced
      var proxy_obj = new GameObject(null,obj.material,null,RenderType.NORMAL,obj.layer);
      addObject(proxy_obj_name, proxy_obj);
    }
    var id = instance_id;
    instance_id++;
    var instance = new Instance(position, rotation, id, models, obj.material);
    if(proxy_obj_name in instance_object_tree) {
      instance_object_tree[proxy_obj_name].push(instance);
    } else {
      instance_object_tree[proxy_obj_name] = [instance];
    }
    instances[id] = instance;
    return id;
  }
  return null;
}

//Instances initialized at next frame
export const iterNewInstances = {
  *[Symbol.iterator]() {
    while(new_instances.length > 0) {
      yield new_instances.pop();
    }
  }
}

//Iterator of object ids
export const iterInstances = {
  [Symbol.iterator]() {
    let step = -1;
    const iterator = {
      next() {
        step++;
        if(step < instances.length) {
return { value: instances[step], done: false };
        }
        return { value: undefined, done:true };
      }
    }
    return iterator;
  }
}

//iterator by object type, no specific order
export const iterInstanceByObject = {
  *[Symbol.iterator]() {
    for(var obj_type in instance_object_tree) {
      var instance_list = instance_object_tree[obj_type];
      var list_iterator = {
name:
        obj_type,
        *[Symbol.iterator]() {
          var index = 0;
          while(index < instance_list.length) {
            yield instance_list[index++]
          }
        }
      };
      yield list_iterator;
    }
  }
}

//Iterate Instances by Object Layer
//TODO: for now is always dynamic sorted, but list is very small
export const iterInstanceByLayer = {
  *[Symbol.iterator]() {
    var objects_types = Object.keys(instance_object_tree);
    var object_pairs = [];
    for(var obj_name of objects_types) {
      var obj = objects[obj_name];
      object_pairs.push([obj_name,obj]);
    }
    object_pairs.sort(compare_layers);

    for(var obj_pair of object_pairs) {
      var instance_list = instance_object_tree[obj_pair[0]];
      var list_iterator = {
name:
        obj_pair[0],
        *[Symbol.iterator]() {
          var index = 0;
          while(index < instance_list.length) {
            yield instance_list[index++]
          }
        }
      };
      yield list_iterator;
    }
  }
}

//Iterator of object ids
export const iterBakedInstances = {
  [Symbol.iterator]() {
    let step = -1;
    const iterator = {
      next() {
        step++;
        if(step < baked_instances.length) {
return { value: baked_instances[step], done: false };
        }
        return { value: undefined, done:true };
      }
    }
    return iterator;
  }
}


function compare_layers(a,b) {
  if(a[1].layer < b[1].layer) {
    return -1;
  } else if(a[1].layer > b[1].layer) {
    return 1;
  } else {
    return 0;
  }
}
