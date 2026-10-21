/* Isolated art process. No same-origin capability or network connections. */
(() => {
  const channel = 'ccnyc-custom-art';
  let gl, program, canvas, sketch, hooks, current, language, queue=Promise.resolve();
  const send = (type,id,extra={}) => parent.postMessage({channel,type,id,...extra},'*',extra.bitmap?[extra.bitmap]:[]);
  const rgb = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const compile = (type,code) => { const shader=gl.createShader(type);gl.shaderSource(shader,code);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(error||'Shader compilation failed.');}return shader; };
  async function init(data) {
    language=data.art.language;current=data.params;
    if(language==='glsl') {
      canvas=document.createElement('canvas');document.body.append(canvas);
      gl=canvas.getContext('webgl',{preserveDrawingBuffer:true,alpha:false});if(!gl)throw Error('WebGL is unavailable in this browser. Try p5.js.');
      program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.0,1.0);}'));
      gl.attachShader(program,compile(gl.FRAGMENT_SHADER,data.art.code));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'Shader link failed.');
      gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const attribute=gl.getAttribLocation(program,'a_position');if(attribute>=0){gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);}
    } else {
      await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/vendor/p5.min.js';script.onload=resolve;script.onerror=()=>reject(Error('Could not load the local p5.js runtime.'));document.head.append(script);});
      hooks=new Function('"use strict";'+data.art.code+';return {setup:typeof setup==="function"?setup:null,draw:typeof draw==="function"?draw:null};')();
      if(!hooks.draw)throw Error('Define function draw(p, frame) to draw your artwork.');
      p5.disableFriendlyErrors=true;
      await new Promise((resolve,reject)=>{sketch=new p5(p=>{p.setup=()=>{try{p.pixelDensity(1);p.createCanvas(current.width,current.height);p.randomSeed(current.seed);p.noiseSeed(current.seed);if(hooks.setup)hooks.setup(p,current);p.noLoop();canvas=p.canvas;resolve();}catch(error){reject(error);}};p.draw=()=>{};});});
    }
    send('ready',0);
  }
  async function render(data) {
    current=data.params;
    const width=current.width,height=current.height;
    if(language==='glsl') {
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);gl.useProgram(program);
      const scalar=(name,value)=>{const location=gl.getUniformLocation(program,name);if(location!==null)gl.uniform1f(location,value);};
      const vector=(name,value)=>{const location=gl.getUniformLocation(program,name);if(location!==null)gl.uniform3fv(location,value);};
      const resolution=gl.getUniformLocation(program,'u_resolution');if(resolution!==null)gl.uniform2f(resolution,width,height);
      for(const key of ['time','phase','seed','motion','scale','density','weight','distortion','noiseScale','travel','deformation','rotation','tempo'])scalar('u_'+key,current[key]);
      vector('u_paper',rgb(current.paper));vector('u_ink',rgb(current.ink));current.colors.forEach((color,i)=>vector('u_color'+(i+1),rgb(color)));
      gl.drawArrays(gl.TRIANGLES,0,6);gl.flush();if(gl.isContextLost())throw Error('The shader context was lost. Simplify the shader and run it again.');
    } else {
      if(sketch.width!==width||sketch.height!==height)sketch.resizeCanvas(width,height,true);
      sketch.resetMatrix();sketch.randomSeed(current.seed);sketch.noiseSeed(current.seed);
      hooks.draw(sketch,current);sketch.noLoop();canvas=sketch.canvas;
    }
    const bitmap=await createImageBitmap(canvas);send('frame',data.id,{bitmap,width,height});
  }
  addEventListener('message',event=>{
    if(event.source!==parent||event.data?.channel!==channel)return;
    const data=event.data;
    queue=queue.then(()=>data.type==='init'?init(data):data.type==='render'?render(data):undefined).catch(error=>send('error',data.type==='init'?0:data.id,{message:String(error?.message||error).slice(0,4000)}));
  });
})();
