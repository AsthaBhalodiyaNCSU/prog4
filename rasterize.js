// /* GLOBAL CONSTANTS AND VARIABLES */

// /* assignment specific globals */
// const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog4/triangles.json"; // triangles file loc
// const INPUT_ELLIPSOIDS_URL = "https://ncsucgclass.github.io/prog4/ellipsoids.json"; // ellipsoids file loc
// var defaultEye = vec3.fromValues(0.5,0.5,-0.5); // default eye position in world space
// var defaultCenter = vec3.fromValues(0.5,0.5,0.5); // default view direction in world space
// var defaultUp = vec3.fromValues(0,1,0); // default view up vector
// var rotateTheta = Math.PI/50; // how much to rotate models by with each key press

// /* webgl and geometry data */
// var gl = null; // the all powerful gl object. It's all here folks!
// var inputTriangles = []; // the triangle data as loaded from input files
// var numTriangleSets = 0; // how many triangle sets in input scene
// var inputEllipsoids = []; // the ellipsoid data as loaded from input files
// var numEllipsoids = 0; // how many ellipsoids in the input scene
// var vertexBuffers = []; // this contains vertex coordinate lists by set, in triples
// var uvBuffers = []; // this contains uv coordinate lists by set, in pairs
// var triSetSizes = []; // this contains the size of each triangle set
// var triangleBuffers = []; // lists of indices into vertexBuffers by set, in triples
// var textureBuffers = []; // texture objects for each triangle set
// var viewDelta = 0; // how much to displace view with each key press

// /* shader parameter locations */
// var vPosAttribLoc; // where to put position for vertex shader
// var vUVAttribLoc; // where to put UV coordinates for vertex shader
// var pvmMatrixULoc; // where to put project view model matrix for vertex shader
// var mMatrixULoc; // where to put model matrix for vertex shader
// var textureULoc; // where to put texture sampler for fragment shader

// /* interaction variables */
// var Eye = vec3.clone(defaultEye); // eye position in world space
// var Center = vec3.clone(defaultCenter); // view direction in world space
// var Up = vec3.clone(defaultUp); // view up vector in world space

// // ASSIGNMENT HELPER FUNCTIONS

// // get the JSON file from the passed URL
// function getJSONFile(url,descr) {
//     try {
//         if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
//             throw "getJSONFile: parameter not a string";
//         else {
//             var httpReq = new XMLHttpRequest(); // a new http request
//             httpReq.open("GET",url,false); // init the request
//             httpReq.send(null); // send the request
//             var startTime = Date.now();
//             while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
//                 if ((Date.now()-startTime) > 3000)
//                     break;
//             } // until its loaded or we time out after three seconds
//             if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
//                 throw "Unable to open "+descr+" file!";
//             else
//                 return JSON.parse(httpReq.response); 
//         } // end if good params
//     } // end try    
    
//     catch(e) {
//         console.log(e);
//         return(String.null);
//     }
// } // end get input json file

// // load texture from URL
// function loadTexture(url) {
//     var texture = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, texture);
    
//     // Placeholder 1x1 pixel until image loads
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
//                   new Uint8Array([255, 255, 255, 255]));
    
//     var image = new Image();
//     image.crossOrigin = "anonymous";
//     image.onload = function() {
//         gl.bindTexture(gl.TEXTURE_2D, texture);
//         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
//         gl.generateMipmap(gl.TEXTURE_2D);
//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
//         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//     };
//     image.src = url;
    
//     return texture;
// }

// // does stuff when keys are pressed
// function handleKeyDown(event) {
    
//     const modelEnum = {TRIANGLES: "triangles", ELLIPSOID: "ellipsoid"}; // enumerated model type
//     const dirEnum = {NEGATIVE: -1, POSITIVE: 1}; // enumerated rotation direction
    
//     function highlightModel(modelType,whichModel) {
//         if (handleKeyDown.modelOn != null)
//             handleKeyDown.modelOn.on = false;
//         handleKeyDown.whichOn = whichModel;
//         if (modelType == modelEnum.TRIANGLES)
//             handleKeyDown.modelOn = inputTriangles[whichModel]; 
//         else
//             handleKeyDown.modelOn = inputEllipsoids[whichModel]; 
//         handleKeyDown.modelOn.on = true; 
//     } // end highlight model
    
//     function translateModel(offset) {
//         if (handleKeyDown.modelOn != null)
//             vec3.add(handleKeyDown.modelOn.translation,handleKeyDown.modelOn.translation,offset);
//     } // end translate model

//     function rotateModel(axis,direction) {
//         if (handleKeyDown.modelOn != null) {
//             var newRotation = mat4.create();

//             mat4.fromRotation(newRotation,direction*rotateTheta,axis); // get a rotation matrix around passed axis
//             vec3.transformMat4(handleKeyDown.modelOn.xAxis,handleKeyDown.modelOn.xAxis,newRotation); // rotate model x axis tip
//             vec3.transformMat4(handleKeyDown.modelOn.yAxis,handleKeyDown.modelOn.yAxis,newRotation); // rotate model y axis tip
//         } // end if there is a highlighted model
//     } // end rotate model
    
//     // set up needed view params
//     var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create(); // lookat, right & temp vectors
//     lookAt = vec3.normalize(lookAt,vec3.subtract(temp,Center,Eye)); // get lookat vector
//     viewRight = vec3.normalize(viewRight,vec3.cross(temp,lookAt,Up)); // get view right vector
    
//     // highlight static variables
//     handleKeyDown.whichOn = handleKeyDown.whichOn == undefined ? -1 : handleKeyDown.whichOn; // nothing selected initially
//     handleKeyDown.modelOn = handleKeyDown.modelOn == undefined ? null : handleKeyDown.modelOn; // nothing selected initially

//     switch (event.code) {
        
//         // model selection
//         case "Space": 
//             if (handleKeyDown.modelOn != null)
//                 handleKeyDown.modelOn.on = false; // turn off highlighted model
//             handleKeyDown.modelOn = null; // no highlighted model
//             handleKeyDown.whichOn = -1; // nothing highlighted
//             break;
//         case "ArrowRight": // select next triangle set
//             highlightModel(modelEnum.TRIANGLES,(handleKeyDown.whichOn+1) % numTriangleSets);
//             break;
//         case "ArrowLeft": // select previous triangle set
//             highlightModel(modelEnum.TRIANGLES,(handleKeyDown.whichOn > 0) ? handleKeyDown.whichOn-1 : numTriangleSets-1);
//             break;
//         case "ArrowUp": // select next ellipsoid
//             highlightModel(modelEnum.ELLIPSOID,(handleKeyDown.whichOn+1) % numEllipsoids);
//             break;
//         case "ArrowDown": // select previous ellipsoid
//             highlightModel(modelEnum.ELLIPSOID,(handleKeyDown.whichOn > 0) ? handleKeyDown.whichOn-1 : numEllipsoids-1);
//             break;
            
//         // view change
//         case "KeyA": // translate view left, rotate left with shift
//             Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,viewDelta));
//             if (!event.getModifierState("Shift"))
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,viewDelta));
//             break;
//         case "KeyD": // translate view right, rotate right with shift
//             Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,-viewDelta));
//             if (!event.getModifierState("Shift"))
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,-viewDelta));
//             break;
//         case "KeyS": // translate view backward, rotate up with shift
//             if (event.getModifierState("Shift")) {
//                 Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
//                 Up = vec3.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye)); /* global side effect */
//             } else {
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,-viewDelta));
//                 Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,-viewDelta));
//             } // end if shift not pressed
//             break;
//         case "KeyW": // translate view forward, rotate down with shift
//             if (event.getModifierState("Shift")) {
//                 Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
//                 Up = vec3.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye)); /* global side effect */
//             } else {
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,viewDelta));
//                 Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,viewDelta));
//             } // end if shift not pressed
//             break;
//         case "KeyQ": // translate view up, rotate counterclockwise with shift
//             if (event.getModifierState("Shift"))
//                 Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,-viewDelta)));
//             else {
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,viewDelta));
//                 Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
//             } // end if shift not pressed
//             break;
//         case "KeyE": // translate view down, rotate clockwise with shift
//             if (event.getModifierState("Shift"))
//                 Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,viewDelta)));
//             else {
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,-viewDelta));
//                 Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
//             } // end if shift not pressed
//             break;
//         case "Escape": // reset view to default
//             Eye = vec3.copy(Eye,defaultEye);
//             Center = vec3.copy(Center,defaultCenter);
//             Up = vec3.copy(Up,defaultUp);
//             break;
            
//         // model transformation
//         case "KeyK": // translate left, rotate left with shift
//             if (event.getModifierState("Shift"))
//                 rotateModel(Up,dirEnum.NEGATIVE);
//             else
//                 translateModel(vec3.scale(temp,viewRight,viewDelta));
//             break;
//         case "Semicolon": // translate right, rotate right with shift
//             if (event.getModifierState("Shift"))
//                 rotateModel(Up,dirEnum.POSITIVE);
//             else
//                 translateModel(vec3.scale(temp,viewRight,-viewDelta));
//             break;
//         case "KeyL": // translate backward, rotate up with shift
//             if (event.getModifierState("Shift"))
//                 rotateModel(viewRight,dirEnum.POSITIVE);
//             else
//                 translateModel(vec3.scale(temp,lookAt,-viewDelta));
//             break;
//         case "KeyO": // translate forward, rotate down with shift
//             if (event.getModifierState("Shift"))
//                 rotateModel(viewRight,dirEnum.NEGATIVE);
//             else
//                 translateModel(vec3.scale(temp,lookAt,viewDelta));
//             break;
//         case "KeyI": // translate up, rotate counterclockwise with shift 
//             if (event.getModifierState("Shift"))
//                 rotateModel(lookAt,dirEnum.POSITIVE);
//             else
//                 translateModel(vec3.scale(temp,Up,viewDelta));
//             break;
//         case "KeyP": // translate down, rotate clockwise with shift
//             if (event.getModifierState("Shift"))
//                 rotateModel(lookAt,dirEnum.NEGATIVE);
//             else
//                 translateModel(vec3.scale(temp,Up,-viewDelta));
//             break;
//         case "Backspace": // reset model transforms to default
//             for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
//                 vec3.set(inputTriangles[whichTriSet].translation,0,0,0);
//                 vec3.set(inputTriangles[whichTriSet].xAxis,1,0,0);
//                 vec3.set(inputTriangles[whichTriSet].yAxis,0,1,0);
//             } // end for all triangle sets
//             for (var whichEllipsoid=0; whichEllipsoid<numEllipsoids; whichEllipsoid++) {
//                 vec3.set(inputEllipsoids[whichEllipsoid].translation,0,0,0);
//                 vec3.set(inputEllipsoids[whichEllipsoid].xAxis,1,0,0);
//                 vec3.set(inputEllipsoids[whichEllipsoid].yAxis,0,1,0);
//             } // end for all ellipsoids
//             break;
//     } // end switch
// } // end handleKeyDown

// // set up the webGL environment
// function setupWebGL() {
    
//     // Set up keys
//     document.onkeydown = handleKeyDown; // call this when key pressed

//     var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
//     var cw = imageCanvas.width, ch = imageCanvas.height; 
//     imageContext = imageCanvas.getContext("2d"); 
//     var bkgdImage = new Image(); 
//     bkgdImage.crossOrigin = "Anonymous";
//     bkgdImage.src = "https://ncsucgclass.github.io/prog3/sky.jpg";
//     bkgdImage.onload = function(){
//         var iw = bkgdImage.width, ih = bkgdImage.height;
//         imageContext.drawImage(bkgdImage,0,0,iw,ih,0,0,cw,ch);   
//     }
     
//     // Get the canvas and context
//     var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
//     gl = canvas.getContext("webgl"); // get a webgl object from it
    
//     try {
//         if (gl == null) {
//             throw "unable to create gl context -- is your browser gl ready?";
//         } else {
//             gl.clearColor(0.0, 0.0, 0.0, 0.0); // transparent background
//             gl.clearDepth(1.0); // use max when we clear the depth buffer
//             gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
//         }
//     } // end try
    
//     catch(e) {
//         console.log(e);
//     } // end catch
 
// } // end setupWebGL

// // read models in, load them into webgl buffers
// function loadModels() {
    
//     inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles"); // read in the triangle data

//     try {
//         if (inputTriangles == String.null)
//             throw "Unable to load triangles file!";
//         else {
//             var whichSetVert; // index of vertex in current triangle set
//             var whichSetTri; // index of triangle in current triangle set
//             var vtxToAdd; // vtx coords to add to the coord array
//             var uvToAdd; // uv coords to add to the uv array
//             var triToAdd; // tri indices to add to the index array
//             var maxCorner = vec3.fromValues(Number.MIN_VALUE,Number.MIN_VALUE,Number.MIN_VALUE); // bbox corner
//             var minCorner = vec3.fromValues(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE); // other corner
        
//             // process each triangle set to load webgl vertex and triangle buffers
//             numTriangleSets = inputTriangles.length; // remember how many tri sets
//             for (var whichSet=0; whichSet<numTriangleSets; whichSet++) { // for each tri set
                
//                 // set up hilighting, modeling translation and rotation
//                 inputTriangles[whichSet].center = vec3.fromValues(0,0,0);  // center point of tri set
//                 inputTriangles[whichSet].on = false; // not highlighted
//                 inputTriangles[whichSet].translation = vec3.fromValues(0,0,0); // no translation
//                 inputTriangles[whichSet].xAxis = vec3.fromValues(1,0,0); // model X axis
//                 inputTriangles[whichSet].yAxis = vec3.fromValues(0,1,0); // model Y axis 

//                 // set up the vertex and uv arrays, define model center and axes
//                 inputTriangles[whichSet].glVertices = []; // flat coord list for webgl
//                 inputTriangles[whichSet].glUVs = []; // flat uv list for webgl
//                 var numVerts = inputTriangles[whichSet].vertices.length; // num vertices in tri set
//                 for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++) { // verts in set
//                     vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert]; // get vertex to add
//                     uvToAdd = inputTriangles[whichSet].uvs[whichSetVert]; // get uv to add
//                     inputTriangles[whichSet].glVertices.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]); // put coords in set coord list
//                     inputTriangles[whichSet].glUVs.push(uvToAdd[0],uvToAdd[1]); // put uv in set uv list
//                     vec3.max(maxCorner,maxCorner,vtxToAdd); // update world bounding box corner maxima
//                     vec3.min(minCorner,minCorner,vtxToAdd); // update world bounding box corner minima
//                     vec3.add(inputTriangles[whichSet].center,inputTriangles[whichSet].center,vtxToAdd); // add to ctr sum
//                 } // end for vertices in set
//                 vec3.scale(inputTriangles[whichSet].center,inputTriangles[whichSet].center,1/numVerts); // avg ctr sum

//                 // send the vertex coords to webGL
//                 vertexBuffers[whichSet] = gl.createBuffer(); // init empty webgl set vertex coord buffer
//                 gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichSet]); // activate that buffer
//                 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glVertices),gl.STATIC_DRAW); // data in
                
//                 // send the uv coords to webGL
//                 uvBuffers[whichSet] = gl.createBuffer(); // init empty webgl set uv coord buffer
//                 gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffers[whichSet]); // activate that buffer
//                 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glUVs),gl.STATIC_DRAW); // data in
            
//                 // set up the triangle index array, adjusting indices across sets
//                 inputTriangles[whichSet].glTriangles = []; // flat index list for webgl
//                 triSetSizes[whichSet] = inputTriangles[whichSet].triangles.length; // number of tris in this set
//                 for (whichSetTri=0; whichSetTri<triSetSizes[whichSet]; whichSetTri++) {
//                     triToAdd = inputTriangles[whichSet].triangles[whichSetTri]; // get tri to add
//                     inputTriangles[whichSet].glTriangles.push(triToAdd[0],triToAdd[1],triToAdd[2]); // put indices in set list
//                 } // end for triangles in set

//                 // send the triangle indices to webGL
//                 triangleBuffers.push(gl.createBuffer()); // init empty triangle index buffer
//                 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[whichSet]); // activate that buffer
//                 gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(inputTriangles[whichSet].glTriangles),gl.STATIC_DRAW); // data in

//                 // load texture
//                 var textureURL = inputTriangles[whichSet].material.texture;
//                 textureBuffers[whichSet] = loadTexture(textureURL);
//             } // end for each triangle set 
        
//             var temp = vec3.create();
//             viewDelta = vec3.length(vec3.subtract(temp,maxCorner,minCorner)) / 100; // set global
//         } // end if triangle file loaded
//     } // end try 
    
//     catch(e) {
//         console.log(e);
//     } // end catch
// } // end load models

// // setup the webGL shaders
// function setupShaders() {
    
//     // define vertex shader in essl using es6 template strings
//     var vShaderCode = `
//         attribute vec3 aVertexPosition; // vertex position
//         attribute vec2 aVertexUV; // vertex UV coordinate
        
//         uniform mat4 upvmMatrix; // the project view model matrix
        
//         varying vec2 vUV; // interpolated UV for frag shader

//         void main(void) {
//             gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);
//             vUV = aVertexUV;
//         }
//     `;
    
//     // define fragment shader in essl using es6 template strings
//     var fShaderCode = `
//         precision mediump float; // set float to medium precision

//         uniform sampler2D uTexture; // texture sampler
        
//         varying vec2 vUV; // UV coordinate from vertex shader
            
//         void main(void) {
//             vec2 flippedUV = vec2(vUV.x, 1.0 - vUV.y);
//             gl_FragColor = texture2D(uTexture, flippedUV);
//         }
//     `;
    
//     try {
//         var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
//         gl.shaderSource(fShader,fShaderCode); // attach code to shader
//         gl.compileShader(fShader); // compile the code for gpu execution

//         var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
//         gl.shaderSource(vShader,vShaderCode); // attach code to shader
//         gl.compileShader(vShader); // compile the code for gpu execution
            
//         if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
//             throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
//             gl.deleteShader(fShader);
//         } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
//             throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
//             gl.deleteShader(vShader);
//         } else { // no compile errors
//             var shaderProgram = gl.createProgram(); // create the single shader program
//             gl.attachShader(shaderProgram, fShader); // put frag shader in program
//             gl.attachShader(shaderProgram, vShader); // put vertex shader in program
//             gl.linkProgram(shaderProgram); // link program into gl context

//             if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
//                 throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
//             } else { // no shader program link errors
//                 gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
//                 // locate and enable vertex attributes
//                 vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition"); // ptr to vertex pos attrib
//                 gl.enableVertexAttribArray(vPosAttribLoc); // connect attrib to array
//                 vUVAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexUV"); // ptr to vertex uv attrib
//                 gl.enableVertexAttribArray(vUVAttribLoc); // connect attrib to array
                
//                 // locate vertex uniforms
//                 pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix"); // ptr to pvmmat
                
//                 // locate fragment uniforms
//                 textureULoc = gl.getUniformLocation(shaderProgram, "uTexture"); // ptr to texture sampler
//             } // end if no shader program link errors
//         } // end if no compile errors
//     } // end try 
    
//     catch(e) {
//         console.log(e);
//     } // end catch
// } // end setup shaders

// // render the loaded model
// function renderModels() {
    
//     // construct the model transform matrix, based on model state
//     function makeModelTransform(currModel) {
//         var zAxis = vec3.create(), sumRotation = mat4.create(), temp = mat4.create(), negCtr = vec3.create();

//         // move the model to the origin
//         mat4.fromTranslation(mMatrix,vec3.negate(negCtr,currModel.center)); 
        
//         // scale for highlighting if needed
//         if (currModel.on)
//             mat4.multiply(mMatrix,mat4.fromScaling(temp,vec3.fromValues(1.2,1.2,1.2)),mMatrix); // S(1.2) * T(-ctr)
        
//         // rotate the model to current interactive orientation
//         vec3.normalize(zAxis,vec3.cross(zAxis,currModel.xAxis,currModel.yAxis)); // get the new model z axis
//         mat4.set(sumRotation, // get the composite rotation
//             currModel.xAxis[0], currModel.yAxis[0], zAxis[0], 0,
//             currModel.xAxis[1], currModel.yAxis[1], zAxis[1], 0,
//             currModel.xAxis[2], currModel.yAxis[2], zAxis[2], 0,
//             0, 0,  0, 1);
//         mat4.multiply(mMatrix,sumRotation,mMatrix); // R(ax) * S(1.2) * T(-ctr)
        
//         // translate back to model center
//         mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.center),mMatrix); // T(ctr) * R(ax) * S(1.2) * T(-ctr)

//         // translate model to current interactive orientation
//         mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.translation),mMatrix); // T(pos)*T(ctr)*R(ax)*S(1.2)*T(-ctr)
        
//     } // end make model transform
    
//     var pMatrix = mat4.create(); // projection matrix
//     var vMatrix = mat4.create(); // view matrix
//     var mMatrix = mat4.create(); // model matrix
//     var pvMatrix = mat4.create(); // proj * view matrices
//     var pvmMatrix = mat4.create(); // proj * view * model matrices
    
//     window.requestAnimationFrame(renderModels); // set up frame render callback
    
//     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
//     // set up projection and view
//     mat4.perspective(pMatrix,0.5*Math.PI,1,0.1,10); // create projection matrix
//     mat4.lookAt(vMatrix,Eye,Center,Up); // create view matrix
//     mat4.multiply(pvMatrix,pMatrix,vMatrix); // projection * view

//     // render each triangle set
//     var currSet; // the tri set and its material properties
//     for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
//         currSet = inputTriangles[whichTriSet];
        
//         // make model transform, add to view project
//         makeModelTransform(currSet);
//         mat4.multiply(pvmMatrix,pvMatrix,mMatrix); // project * view * model
//         gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the pvm matrix
        
//         // activate texture
//         gl.activeTexture(gl.TEXTURE0);
//         gl.bindTexture(gl.TEXTURE_2D, textureBuffers[whichTriSet]);
//         gl.uniform1i(textureULoc, 0);
        
//         // vertex buffer: activate and feed into vertex shader
//         gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichTriSet]); // activate
//         gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
        
//         // uv buffer: activate and feed into vertex shader
//         gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffers[whichTriSet]); // activate
//         gl.vertexAttribPointer(vUVAttribLoc,2,gl.FLOAT,false,0,0); // feed

//         // triangle buffer: activate and render
//         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffers[whichTriSet]); // activate
//         gl.drawElements(gl.TRIANGLES,3*triSetSizes[whichTriSet],gl.UNSIGNED_SHORT,0); // render
        
//     } // end for each triangle set
// } // end render model


// /* MAIN -- HERE is where execution begins after window load */

// function main() {
  
//   setupWebGL(); // set up the webGL environment
//   loadModels(); // load in the models from tri file
//   setupShaders(); // setup the webGL shaders
//   renderModels(); // draw the triangles using webGL
  
// } // end main

/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog4/triangles.json";
const INPUT_ELLIPSOIDS_URL = "https://ncsucgclass.github.io/prog4/ellipsoids.json";
var defaultEye = vec3.fromValues(0.5,0.5,-0.5);
var defaultCenter = vec3.fromValues(0.5,0.5,0.5);
var defaultUp = vec3.fromValues(0,1,0);
var rotateTheta = Math.PI/50;

/* lighting globals */
var lightPosition = vec3.fromValues(-1, 3, -0.5);
var lightAmbient = vec3.fromValues(1, 1, 1);
var lightDiffuse = vec3.fromValues(1, 1, 1);
var lightSpecular = vec3.fromValues(1, 1, 1);

/* blending mode */
var blendMode = 0; // 0 = replace (texture only), 1 = modulate (texture * lighting)

/* webgl and geometry data */
var gl = null;
var inputTriangles = [];
var numTriangleSets = 0;
var inputEllipsoids = [];
var numEllipsoids = 0;
var vertexBuffers = [];
var normalBuffers = []; // Added for lighting
var uvBuffers = [];
var triSetSizes = [];
var triangleBuffers = [];
var textureBuffers = [];
var viewDelta = 0;

/* shader parameter locations */
var vPosAttribLoc;
var vNormAttribLoc; // Added for lighting
var vUVAttribLoc;
var pvmMatrixULoc;
var mMatrixULoc; // Added for lighting calculations
var nMatrixULoc; // Added for normal transformation
var textureULoc;
var eyePosULoc; // Added for lighting
var lightPosULoc; // Added for lighting
var lightAmbientULoc; // Added for lighting
var lightDiffuseULoc; // Added for lighting
var lightSpecularULoc; // Added for lighting
var ambientULoc; // Added for material
var diffuseULoc; // Added for material
var specularULoc; // Added for material
var shininessULoc; // Added for material
var blendModeULoc; // Added for blend mode toggle

/* interaction variables */
var Eye = vec3.clone(defaultEye);
var Center = vec3.clone(defaultCenter);
var Up = vec3.clone(defaultUp);

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest();
            httpReq.open("GET",url,false);
            httpReq.send(null);
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            }
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        }
    } catch(e) {
        console.log(e);
        return(String.null);
    }
}

// load texture from URL
function loadTexture(url) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([255, 255, 255, 255]));
    
    var image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image.src = url;
    
    return texture;
}

// does stuff when keys are pressed
function handleKeyDown(event) {
    
    const modelEnum = {TRIANGLES: "triangles", ELLIPSOID: "ellipsoid"};
    const dirEnum = {NEGATIVE: -1, POSITIVE: 1};
    
    function highlightModel(modelType,whichModel) {
        if (handleKeyDown.modelOn != null)
            handleKeyDown.modelOn.on = false;
        handleKeyDown.whichOn = whichModel;
        if (modelType == modelEnum.TRIANGLES)
            handleKeyDown.modelOn = inputTriangles[whichModel]; 
        else
            handleKeyDown.modelOn = inputEllipsoids[whichModel]; 
        handleKeyDown.modelOn.on = true; 
    }
    
    function translateModel(offset) {
        if (handleKeyDown.modelOn != null)
            vec3.add(handleKeyDown.modelOn.translation,handleKeyDown.modelOn.translation,offset);
    }

    function rotateModel(axis,direction) {
        if (handleKeyDown.modelOn != null) {
            var newRotation = mat4.create();
            mat4.fromRotation(newRotation,direction*rotateTheta,axis);
            vec3.transformMat4(handleKeyDown.modelOn.xAxis,handleKeyDown.modelOn.xAxis,newRotation);
            vec3.transformMat4(handleKeyDown.modelOn.yAxis,handleKeyDown.modelOn.yAxis,newRotation);
        }
    }
    
    var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create();
    lookAt = vec3.normalize(lookAt,vec3.subtract(temp,Center,Eye));
    viewRight = vec3.normalize(viewRight,vec3.cross(temp,lookAt,Up));
    
    handleKeyDown.whichOn = handleKeyDown.whichOn == undefined ? -1 : handleKeyDown.whichOn;
    handleKeyDown.modelOn = handleKeyDown.modelOn == undefined ? null : handleKeyDown.modelOn;

    switch (event.code) {
        
        // model selection
        case "Space": 
            if (handleKeyDown.modelOn != null)
                handleKeyDown.modelOn.on = false;
            handleKeyDown.modelOn = null;
            handleKeyDown.whichOn = -1;
            break;
        case "ArrowRight":
            highlightModel(modelEnum.TRIANGLES,(handleKeyDown.whichOn+1) % numTriangleSets);
            break;
        case "ArrowLeft":
            highlightModel(modelEnum.TRIANGLES,(handleKeyDown.whichOn > 0) ? handleKeyDown.whichOn-1 : numTriangleSets-1);
            break;
        case "ArrowUp":
            highlightModel(modelEnum.ELLIPSOID,(handleKeyDown.whichOn+1) % numEllipsoids);
            break;
        case "ArrowDown":
            highlightModel(modelEnum.ELLIPSOID,(handleKeyDown.whichOn > 0) ? handleKeyDown.whichOn-1 : numEllipsoids-1);
            break;
            
        // BLEND MODE TOGGLE - Added
        case "KeyB":
            blendMode = (blendMode + 1) % 2;
            console.log("Blend mode: " + (blendMode === 0 ? "Replace (texture only)" : "Modulate (texture × lighting)"));
            break;
            
        // view change
        case "KeyA":
            Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,viewDelta));
            if (!event.getModifierState("Shift"))
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,viewDelta));
            break;
        case "KeyD":
            Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,-viewDelta));
            if (!event.getModifierState("Shift"))
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,-viewDelta));
            break;
        case "KeyS":
            if (event.getModifierState("Shift")) {
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
                Up = vec3.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye));
            } else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,-viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,-viewDelta));
            }
            break;
        case "KeyW":
            if (event.getModifierState("Shift")) {
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
                Up = vec3.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye));
            } else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,viewDelta));
            }
            break;
        case "KeyQ":
            if (event.getModifierState("Shift"))
                Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,-viewDelta)));
            else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
            }
            break;
        case "KeyE":
            if (event.getModifierState("Shift"))
                Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,viewDelta)));
            else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,-viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
            }
            break;
        case "Escape":
            Eye = vec3.copy(Eye,defaultEye);
            Center = vec3.copy(Center,defaultCenter);
            Up = vec3.copy(Up,defaultUp);
            break;
            
        // model transformation
        case "KeyK":
            if (event.getModifierState("Shift"))
                rotateModel(Up,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,viewRight,viewDelta));
            break;
        case "Semicolon":
            if (event.getModifierState("Shift"))
                rotateModel(Up,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,viewRight,-viewDelta));
            break;
        case "KeyL":
            if (event.getModifierState("Shift"))
                rotateModel(viewRight,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,lookAt,-viewDelta));
            break;
        case "KeyO":
            if (event.getModifierState("Shift"))
                rotateModel(viewRight,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,lookAt,viewDelta));
            break;
        case "KeyI":
            if (event.getModifierState("Shift"))
                rotateModel(lookAt,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,Up,viewDelta));
            break;
        case "KeyP":
            if (event.getModifierState("Shift"))
                rotateModel(lookAt,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,Up,-viewDelta));
            break;
        case "Backspace":
            for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
                vec3.set(inputTriangles[whichTriSet].translation,0,0,0);
                vec3.set(inputTriangles[whichTriSet].xAxis,1,0,0);
                vec3.set(inputTriangles[whichTriSet].yAxis,0,1,0);
            }
            for (var whichEllipsoid=0; whichEllipsoid<numEllipsoids; whichEllipsoid++) {
                vec3.set(inputEllipsoids[whichEllipsoid].translation,0,0,0);
                vec3.set(inputEllipsoids[whichEllipsoid].xAxis,1,0,0);
                vec3.set(inputEllipsoids[whichEllipsoid].yAxis,0,1,0);
            }
            break;
    }
}

// set up the webGL environment
function setupWebGL() {
    
    document.onkeydown = handleKeyDown;

    var imageCanvas = document.getElementById("myImageCanvas");
    var cw = imageCanvas.width, ch = imageCanvas.height; 
    imageContext = imageCanvas.getContext("2d"); 
    var bkgdImage = new Image(); 
    bkgdImage.crossOrigin = "Anonymous";
    bkgdImage.src = "https://ncsucgclass.github.io/prog3/sky.jpg";
    bkgdImage.onload = function(){
        var iw = bkgdImage.width, ih = bkgdImage.height;
        imageContext.drawImage(bkgdImage,0,0,iw,ih,0,0,cw,ch);   
    }
     
    var canvas = document.getElementById("myWebGLCanvas");
    gl = canvas.getContext("webgl");
    
    try {
        if (gl == null) {
            throw "unable to create gl context -- is your browser gl ready?";
        } else {
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clearDepth(1.0);
            gl.enable(gl.DEPTH_TEST);
        }
    } catch(e) {
        console.log(e);
    }
}

// read models in, load them into webgl buffers
function loadModels() {
    
    inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");

    try {
        if (inputTriangles == String.null)
            throw "Unable to load triangles file!";
        else {
            var whichSetVert, whichSetTri, vtxToAdd, normToAdd, uvToAdd, triToAdd;
            var maxCorner = vec3.fromValues(Number.MIN_VALUE,Number.MIN_VALUE,Number.MIN_VALUE);
            var minCorner = vec3.fromValues(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE);
        
            numTriangleSets = inputTriangles.length;
            for (var whichSet=0; whichSet<numTriangleSets; whichSet++) {
                
                inputTriangles[whichSet].center = vec3.fromValues(0,0,0);
                inputTriangles[whichSet].on = false;
                inputTriangles[whichSet].translation = vec3.fromValues(0,0,0);
                inputTriangles[whichSet].xAxis = vec3.fromValues(1,0,0);
                inputTriangles[whichSet].yAxis = vec3.fromValues(0,1,0);

                inputTriangles[whichSet].glVertices = [];
                inputTriangles[whichSet].glNormals = []; // Added for lighting
                inputTriangles[whichSet].glUVs = [];
                var numVerts = inputTriangles[whichSet].vertices.length;
                for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++) {
                    vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert];
                    normToAdd = inputTriangles[whichSet].normals[whichSetVert]; // Added for lighting
                    uvToAdd = inputTriangles[whichSet].uvs[whichSetVert];
                    inputTriangles[whichSet].glVertices.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);
                    inputTriangles[whichSet].glNormals.push(normToAdd[0],normToAdd[1],normToAdd[2]); // Added for lighting
                    inputTriangles[whichSet].glUVs.push(uvToAdd[0], 1.0 - uvToAdd[1]); // Flip V coordinate
                    vec3.max(maxCorner,maxCorner,vtxToAdd);
                    vec3.min(minCorner,minCorner,vtxToAdd);
                    vec3.add(inputTriangles[whichSet].center,inputTriangles[whichSet].center,vtxToAdd);
                }
                vec3.scale(inputTriangles[whichSet].center,inputTriangles[whichSet].center,1/numVerts);

                vertexBuffers[whichSet] = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichSet]);
                gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glVertices),gl.STATIC_DRAW);
                
                // Added normal buffer for lighting
                normalBuffers[whichSet] = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[whichSet]);
                gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glNormals),gl.STATIC_DRAW);
                
                uvBuffers[whichSet] = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffers[whichSet]);
                gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glUVs),gl.STATIC_DRAW);
            
                inputTriangles[whichSet].glTriangles = [];
                triSetSizes[whichSet] = inputTriangles[whichSet].triangles.length;
                for (whichSetTri=0; whichSetTri<triSetSizes[whichSet]; whichSetTri++) {
                    triToAdd = inputTriangles[whichSet].triangles[whichSetTri];
                    inputTriangles[whichSet].glTriangles.push(triToAdd[0],triToAdd[1],triToAdd[2]);
                }

                triangleBuffers.push(gl.createBuffer());
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[whichSet]);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(inputTriangles[whichSet].glTriangles),gl.STATIC_DRAW);

                var textureURL = inputTriangles[whichSet].material.texture;
                textureBuffers[whichSet] = loadTexture(textureURL);
            }
        
            var temp = vec3.create();
            viewDelta = vec3.length(vec3.subtract(temp,maxCorner,minCorner)) / 100;
        }
    } catch(e) {
        console.log(e);
    }
}

// setup the webGL shaders
function setupShaders() {
    
    // Updated vertex shader with lighting support
    var vShaderCode = `
        attribute vec3 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aVertexUV;
        
        uniform mat4 upvmMatrix;
        uniform mat4 umMatrix;
        uniform mat4 unMatrix;
        
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUV;

        void main(void) {
            vec4 worldPos = umMatrix * vec4(aVertexPosition, 1.0);
            vWorldPos = worldPos.xyz;
            vNormal = normalize((unMatrix * vec4(aVertexNormal, 0.0)).xyz);
            vUV = aVertexUV;
            gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);
        }
    `;
    
    // Updated fragment shader with lighting and blend modes
    var fShaderCode = `
        precision mediump float;

        uniform sampler2D uTexture;
        uniform vec3 uEyePos;
        uniform vec3 uLightPos;
        uniform vec3 uLightAmbient;
        uniform vec3 uLightDiffuse;
        uniform vec3 uLightSpecular;
        uniform vec3 uAmbient;
        uniform vec3 uDiffuse;
        uniform vec3 uSpecular;
        uniform float uShininess;
        uniform int uBlendMode;
        
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUV;
            
        void main(void) {
            // Get texture color
            vec4 texColor = texture2D(uTexture, vUV);
            
            // Calculate lighting (Phong model)
            vec3 N = normalize(vNormal);
            vec3 L = normalize(uLightPos - vWorldPos);
            vec3 V = normalize(uEyePos - vWorldPos);
            vec3 R = reflect(-L, N);
            
            // Ambient component
            vec3 ambient = uAmbient * uLightAmbient;
            
            // Diffuse component
            float diffuseFactor = max(dot(N, L), 0.0);
            vec3 diffuse = uDiffuse * uLightDiffuse * diffuseFactor;
            
            // Specular component
            float specularFactor = pow(max(dot(R, V), 0.0), uShininess);
            vec3 specular = uSpecular * uLightSpecular * specularFactor;
            
            // Combine lighting components
            vec3 litColor = ambient + diffuse + specular;
            
            // Apply blend mode
            if (uBlendMode == 0) {
                // Replace mode: texture only (no lighting)
                gl_FragColor = texColor;
            } else {
                // Modulate mode: texture × lighting
                gl_FragColor = vec4(texColor.rgb * litColor, texColor.a);
            }
        }
    `;
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader,fShaderCode);
        gl.compileShader(fShader);

        var vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader,vShaderCode);
        gl.compileShader(vShader);
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else {
            var shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, fShader);
            gl.attachShader(shaderProgram, vShader);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else {
                gl.useProgram(shaderProgram);
                
                // Vertex attributes
                vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition");
                gl.enableVertexAttribArray(vPosAttribLoc);
                vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal"); // Added
                gl.enableVertexAttribArray(vNormAttribLoc);
                vUVAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexUV");
                gl.enableVertexAttribArray(vUVAttribLoc);
                
                // Matrix uniforms
                pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix");
                mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix"); // Added
                nMatrixULoc = gl.getUniformLocation(shaderProgram, "unMatrix"); // Added
                
                // Texture and lighting uniforms
                textureULoc = gl.getUniformLocation(shaderProgram, "uTexture");
                eyePosULoc = gl.getUniformLocation(shaderProgram, "uEyePos"); // Added
                lightPosULoc = gl.getUniformLocation(shaderProgram, "uLightPos"); // Added
                lightAmbientULoc = gl.getUniformLocation(shaderProgram, "uLightAmbient"); // Added
                lightDiffuseULoc = gl.getUniformLocation(shaderProgram, "uLightDiffuse"); // Added
                lightSpecularULoc = gl.getUniformLocation(shaderProgram, "uLightSpecular"); // Added
                ambientULoc = gl.getUniformLocation(shaderProgram, "uAmbient"); // Added
                diffuseULoc = gl.getUniformLocation(shaderProgram, "uDiffuse"); // Added
                specularULoc = gl.getUniformLocation(shaderProgram, "uSpecular"); // Added
                shininessULoc = gl.getUniformLocation(shaderProgram, "uShininess"); // Added
                blendModeULoc = gl.getUniformLocation(shaderProgram, "uBlendMode"); // Added
            }
        }
    } catch(e) {
        console.log(e);
    }
}

// render the loaded model
function renderModels() {
    
    function makeModelTransform(currModel) {
        var zAxis = vec3.create(), sumRotation = mat4.create(), temp = mat4.create(), negCtr = vec3.create();

        mat4.fromTranslation(mMatrix,vec3.negate(negCtr,currModel.center)); 
        
        if (currModel.on)
            mat4.multiply(mMatrix,mat4.fromScaling(temp,vec3.fromValues(1.2,1.2,1.2)),mMatrix);
        
        vec3.normalize(zAxis,vec3.cross(zAxis,currModel.xAxis,currModel.yAxis));
        mat4.set(sumRotation,
            currModel.xAxis[0], currModel.yAxis[0], zAxis[0], 0,
            currModel.xAxis[1], currModel.yAxis[1], zAxis[1], 0,
            currModel.xAxis[2], currModel.yAxis[2], zAxis[2], 0,
            0, 0,  0, 1);
        mat4.multiply(mMatrix,sumRotation,mMatrix);
        
        mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.center),mMatrix);
        mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.translation),mMatrix);
    }
    
    var pMatrix = mat4.create();
    var vMatrix = mat4.create();
    var mMatrix = mat4.create();
    var nMatrix = mat4.create(); // Added for normal transformation
    var pvMatrix = mat4.create();
    var pvmMatrix = mat4.create();
    
    window.requestAnimationFrame(renderModels);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.perspective(pMatrix,0.5*Math.PI,1,0.1,10);
    mat4.lookAt(vMatrix,Eye,Center,Up);
    mat4.multiply(pvMatrix,pMatrix,vMatrix);

    // Set lighting uniforms (same for all models)
    gl.uniform3fv(eyePosULoc, Eye);
    gl.uniform3fv(lightPosULoc, lightPosition);
    gl.uniform3fv(lightAmbientULoc, lightAmbient);
    gl.uniform3fv(lightDiffuseULoc, lightDiffuse);
    gl.uniform3fv(lightSpecularULoc, lightSpecular);
    gl.uniform1i(blendModeULoc, blendMode); // Pass blend mode to shader

    var currSet;
    for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
        currSet = inputTriangles[whichTriSet];
        
        makeModelTransform(currSet);
        mat4.multiply(pvmMatrix,pvMatrix,mMatrix);
        gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix);
        gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // Added
        
        // Calculate and pass normal matrix (inverse transpose of model matrix)
        mat4.invert(nMatrix, mMatrix);
        mat4.transpose(nMatrix, nMatrix);
        gl.uniformMatrix4fv(nMatrixULoc, false, nMatrix);
        
        // Set material properties
        gl.uniform3fv(ambientULoc, currSet.material.ambient);
        gl.uniform3fv(diffuseULoc, currSet.material.diffuse);
        gl.uniform3fv(specularULoc, currSet.material.specular);
        gl.uniform1f(shininessULoc, currSet.material.n);
        
        // Activate texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureBuffers[whichTriSet]);
        gl.uniform1i(textureULoc, 0);
        
        // Vertex buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichTriSet]);
        gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0);
        
        // Normal buffer: activate and feed into vertex shader (Added)
        gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[whichTriSet]);
        gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0);
        
        // UV buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffers[whichTriSet]);
        gl.vertexAttribPointer(vUVAttribLoc,2,gl.FLOAT,false,0,0);

        // Triangle buffer: activate and render
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffers[whichTriSet]);
        gl.drawElements(gl.TRIANGLES,3*triSetSizes[whichTriSet],gl.UNSIGNED_SHORT,0);
    }
}

/* MAIN -- HERE is where execution begins after window load */

function main() {
    setupWebGL();
    loadModels();
    setupShaders();
    renderModels();
}

// Start the program
main();
