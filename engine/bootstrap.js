/* Sets up canvas and loads in all asset game data */
import { loadFiles } from "./utils.js";
import { loadTexture, loadShaderProgram } from "./shader.js";
import { GameObject, Material, Model, Script, Level, RenderType } from "./types.js";
import * as engine from "./gameloop.js"; 
import * as input from "./input.js";
import * as data from "./data.js";


export function bootstrap(canvas_name,asset_path) {
  var canvas = getCanvas("game_canvas");
  var glcontext = getWebglContext(canvas);
  data.setGlobal("canvas",canvas);
  data.setGlobal("glcontext",glcontext);

  var cwidth = canvas.clientWidth;
  var cheight = canvas.clientHeight;

  //TODO: dynamic resize... support
  if(canvas.width != cwidth || canvas.height != cheight) {
    canvas.width = cwidth;
    canvas.height = cheight;
  }
  //TODO button presses and other varriable input
  glcontext.enable(glcontext.CULL_FACE);
  glcontext.viewport(0,0, glcontext.canvas.width, glcontext.canvas.height);
  glcontext.blendFunc(glcontext.SRC_ALPHA, glcontext.ONE_MINUS_SRC_ALPHA);
  glcontext.enable(glcontext.BLEND);
  glcontext.enable(glcontext.DEPTH_TEST);


  loadFiles([asset_path + "manifest.auto"]).then(files=> {
    var manifest = JSON.parse(files[0]);
    var promises = [];
    var shaders = manifest["shaders"];
    var shader_promises = [];
    shaders.forEach(shader_name=> {
      promises.push(loadFiles([asset_path + "shaders/" + shader_name + ".vrt.glsl",asset_path + "shaders/" + shader_name + ".vry.glsl"]).then(files=> {
        var shader_program = loadShaderProgram(glcontext,files[0],files[1]);
        data.addShader(shader_name,shader_program);
      }));
    });
    var models = manifest["models"];
    models.forEach(model_name=> {
      promises.push(loadFiles([asset_path + "models/" + model_name + ".mdl"]).then(files=> {
        var mmodel_manifest = JSON.parse(files[0]);
        var normals = null;
        var uvs = null;
        var indeces = mmodel_manifest['indeces'].map(Number);
        var verts = mmodel_manifest["verts"].map(Number);
        if("normals" in mmodel_manifest) {
          normals = mmodel_manifest["normals"].map(Number);
        }
        if("uvs" in mmodel_manifest) {
          uvs = mmodel_manifest["uvs"].map(Number);
        }
        var model = new Model(verts,indeces,normals,uvs);
        data.addModel(model_name,model)
      }));
    });
    var scripts = manifest["scripts"];
    scripts.forEach(script_name=> {
      promises.push(import(asset_path + "scripts/" + script_name + ".js").then(module=> {
        data.addScript(script_name,module[script_name]);
      }));
    });
    var texture_manifests = manifest["texture_configs"];
    for(var tex_key in texture_manifests) {
      var texture_manifest = texture_manifests[tex_key];
      var gltex = loadTexture(glcontext,asset_path,texture_manifest);
      var texture = {"texture":gltex,"type":texture_manifest["type"]};
      data.addTexture(tex_key,texture);
    }

    Promise.all(promises).then(()=> {
      var material_manifests = manifest["materials"];
      for(var material_key in material_manifests) {
        var material_manifest = material_manifests[material_key];
        var textures = [];
        material_manifest["textures"].forEach(function(name) {
          textures.push(data.getTexture(name));
        });
        var shader = data.getShader(material_manifest["shader"]);
        var engine_attributes = {};
        var attributes = {}; //TODO
        const numAttribs = glcontext.getProgramParameter(shader,glcontext.ACTIVE_ATTRIBUTES);
        for(let i = 0; i < numAttribs; ++i) {
          const info = glcontext.getActiveAttrib(shader, i);
          if(["a_position","a_uv","a_normal"].includes(info.name)) {
            engine_attributes[info.name] = i;
          } else if(info.name) {
            //TODO if in manifest then use it, custom parameters
          } else {
            //TODO error checking
          }
        }
        var engine_uniforms = {};
        var uniforms = {};
        const numUniforms = glcontext.getProgramParameter(shader,glcontext.ACTIVE_UNIFORMS);
        var texture_locations = []; //dirty hack
        for(let i = 0; i < numUniforms; i++) {
          const info = glcontext.getActiveUniform(shader, i);
          if(info.type != glcontext.SAMPLER_2D && info.type != glcontext.SAMPLER_CUBE) { //TODO: move definitions to common place
            if(["u_matrix","u_matrix_inverse","u_camera_pos","u_time","u_model_matrix","u_normal_matrix","u_light_pos"].includes(info.name)) {
              engine_uniforms[info.name] = glcontext.getUniformLocation(shader,info.name);
            } else if(info.name) {
              //TODO if in manifest then use it
            } else {
              //TODO error checking
            }
          }
        }
        var texture_locations = [];
        for(var i = 0; i < textures.length; i++) {
          var texture_location = glcontext.getUniformLocation(shader,"u_tex" + i); //TODO: remove these texture calls...
          texture_locations.push(texture_location);
        }
        
        var material = new Material(shader,textures,engine_attributes,attributes, engine_uniforms, uniforms);
        material.texture_locations = texture_locations;
        
        data.addMaterial(material_key,material);
      }

      var object_manifests = manifest["objects"];
      for(var object_key in object_manifests) {
        var object_manifest = object_manifests[object_key];
        var model = null;
        var material = null;
        var scripts = [];
        var render_type = RenderType.NORMAL;
        var layer = 0;
        if("model" in object_manifest) {
          model = data.getModel(object_manifest["model"]);
        }
        if("material" in object_manifest) {
          material = data.getMaterial(object_manifest["material"]);
        }
        if("instanced" in object_manifest && object_manifest["instanced"]){
          render_type = RenderType.INSTANCED;
        }
        if("invisible" in object_manifest && object_manifest["invisible"]){
          render_type = RenderType.INVISIBLE;
        }
        if("scripts" in object_manifest) {
          object_manifest["scripts"].forEach(function(name) {
            scripts.push(data.getScript(name));
          });
        }
        if("layer" in object_manifest) {
          layer = object_manifest["layer"];
        }
        
        var object = new GameObject(model,material,scripts,render_type,layer);
        data.addObject(object_key,object);
      }

      var level_manifests = manifest["levels"];
      for(var level_key in level_manifests) {
        var level_manifest = level_manifests[level_key];
        var level = new Level(level_manifest["instances"]);
        data.addLevel(level_key,level);
      }

      var level = data.getLevel("start");
      level.start();

      input.start();
      engine.start();
    });
  });
}

function getCanvas(canvas_id) {
  var canvas;

  canvas = document.getElementById(canvas_id);
  if(!canvas || canvas.nodeName !== "CANVAS") {
    console.log('Fatal error: Canvas "' + canvas_id + '" could not be found');
  }
  return canvas;
}

function getWebglContext(canvas) {
  var context = canvas.getContext('webgl');
  if(!context) {
    console.log("No WebGL context could be found.");
  }
  return context;
};
