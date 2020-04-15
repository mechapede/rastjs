//all internal data for gameengine
import { GameObject } from "/engine/types.js";

var objects = {};
var materials = {};
var shaders = {};
var models = {};
var scripts = {};
var textures = {};

var levels = {};
var instances = [];
var instance_object_tree = {};  //stores instances organized by objects

var instance_id = 0;

//null returned on error, so default is false
var globals = {"canvas":
               false,
               "glcontext":
               false,
               "u_matrix":
               null,
               "u_matrix_inverse":
               null,
               "u_camera_pos":
               null
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


//creates instance, add error checking
export function addInstance(obj_name) {
  console.assert(obj_name in objects, {name:obj_name, errorMsg:"Object does not exist! Instance not created."});
  if(obj_name in objects) {
    var obj = objects[obj_name];
    var id = instance_id;
    instance_id++;
    var instance = obj.createInstance(id);
    instance.start();
    if(obj_name in instance_object_tree) {
      instance_object_tree[obj_name].push(instance);
    } else {
      instance_object_tree[obj_name] = [instance];
    }
    instances[id] = instance;
    return id;
  }
  return null;
}

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

export const iterInstanceByObject = {
  *[Symbol.iterator]() {
    for(var obj_type in instance_object_tree) {
      var instance_list = instance_object_tree[obj_type]
      var list_iterator = {
name:
        obj_type,
        *[Symbol.iterator]() {
          var index = 0;
          while(index < instance_list.length) {
            yield instance_list[index++]
          }
        }
      }
      yield list_iterator;
    }
  }
}


