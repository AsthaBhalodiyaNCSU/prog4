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
var blendMode = 0; // 0 = replace (texture only), 1 = modulate (texture * lighting), 2 = modulate with transparency

/* animation variables */
var animationActive = false;
var animationTime = 0;
var animationDuration = 4.0; // 4 seconds for full cycle

/* webgl and geometry data */
var gl = null;
var inputTriangles = [];
var numTriangleSets = 0;
var inputEllipsoids = [];
var numEllipsoids = 0;
var vertexBuffers = [];
var normalBuffers = [];
var uvBuffers = [];
var triSetSizes = [];
var triangleBuffers = [];
var textureBuffers = [];
var viewDelta = 0;

/* shader parameter locations */
var vPosAttribLoc;
var vNormAttribLoc;
var vUVAttribLoc;
var pvmMatrixULoc;
var mMatrixULoc;
var nMatrixULoc;
var textureULoc;
var eyePosULoc;
var lightPosULoc;
var lightAmbientULoc;
var lightDiffuseULoc;
var lightSpecularULoc;
var ambientULoc;
var diffuseULoc;
var specularULoc;
var shininessULoc;
var blendModeULoc;
var alphaULoc;

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
    
    // ANIMATION TOGGLE - Press ! to start London Bridge animation
    if (event.key === "!") {
        animationActive = !animationActive;
        if (animationActive) {
            animationTime = 0;
            console.log("London Bridge animation started!");
        } else {
            console.log("Animation stopped");
            // Reset all models to original positions
            for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
                vec3.set(inputTriangles[whichTriSet].translation,0,0,0);
                vec3.set(inputTriangles[whichTriSet].xAxis,1,0,0);
                vec3.set(inputTriangles[whichTriSet].yAxis,0,1,0);
            }
        }
        return;
    }
    
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
            
        // BLEND MODE TOGGLE - Updated to support 3 modes
        case "KeyB":
            blendMode = (blendMode + 1) % 3;
            var modeNames = ["Replace (texture only)", "Modulate (texture × lighting)", "Modulate with transparency"];
            console.log("Blend mode: " + modeNames[blendMode]);
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
                inputTriangles[whichSet].glNormals = [];
                inputTriangles[whichSet].glUVs = [];
                var numVerts = inputTriangles[whichSet].vertices.length;
                for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++) {
                    vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert];
                    normToAdd = inputTriangles[whichSet].normals[whichSetVert];
                    uvToAdd = inputTriangles[whichSet].uvs[whichSetVert];
                    inputTriangles[whichSet].glVertices.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);
                    inputTriangles[whichSet].glNormals.push(normToAdd[0],normToAdd[1],normToAdd[2]);
                    inputTriangles[whichSet].glUVs.push(uvToAdd[0], 1.0 - uvToAdd[1]);
                    vec3.max(maxCorner,maxCorner,vtxToAdd);
                    vec3.min(minCorner,minCorner,vtxToAdd);
                    vec3.add(inputTriangles[whichSet].center,inputTriangles[whichSet].center,vtxToAdd);
                }
                vec3.scale(inputTriangles[whichSet].center,inputTriangles[whichSet].center,1/numVerts);

                vertexBuffers[whichSet] = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichSet]);
                gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glVertices),gl.STATIC_DRAW);
                
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
        uniform float uAlpha;
        
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUV;
            
        void main(void) {
            vec4 texColor = texture2D(uTexture, vUV);
            
            vec3 N = normalize(vNormal);
            vec3 L = normalize(uLightPos - vWorldPos);
            vec3 V = normalize(uEyePos - vWorldPos);
            vec3 R = reflect(-L, N);
            
            vec3 ambient = uAmbient * uLightAmbient;
            float diffuseFactor = max(dot(N, L), 0.0);
            vec3 diffuse = uDiffuse * uLightDiffuse * diffuseFactor;
            float specularFactor = pow(max(dot(R, V), 0.0), uShininess);
            vec3 specular = uSpecular * uLightSpecular * specularFactor;
            
            vec3 litColor = ambient + diffuse + specular;
            
            if (uBlendMode == 0) {
                gl_FragColor = texColor;
            } else if (uBlendMode == 1) {
                gl_FragColor = vec4(texColor.rgb * litColor, texColor.a);
            } else {
                gl_FragColor = vec4(texColor.rgb * litColor, texColor.a * uAlpha);
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
                
                vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition");
                gl.enableVertexAttribArray(vPosAttribLoc);
                vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal");
                gl.enableVertexAttribArray(vNormAttribLoc);
                vUVAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexUV");
                gl.enableVertexAttribArray(vUVAttribLoc);
                
                pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix");
                mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix");
                nMatrixULoc = gl.getUniformLocation(shaderProgram, "unMatrix");
                
                textureULoc = gl.getUniformLocation(shaderProgram, "uTexture");
                eyePosULoc = gl.getUniformLocation(shaderProgram, "uEyePos");
                lightPosULoc = gl.getUniformLocation(shaderProgram, "uLightPos");
                lightAmbientULoc = gl.getUniformLocation(shaderProgram, "uLightAmbient");
                lightDiffuseULoc = gl.getUniformLocation(shaderProgram, "uLightDiffuse");
                lightSpecularULoc = gl.getUniformLocation(shaderProgram, "uLightSpecular");
                ambientULoc = gl.getUniformLocation(shaderProgram, "uAmbient");
                diffuseULoc = gl.getUniformLocation(shaderProgram, "uDiffuse");
                specularULoc = gl.getUniformLocation(shaderProgram, "uSpecular");
                shininessULoc = gl.getUniformLocation(shaderProgram, "uShininess");
                blendModeULoc = gl.getUniformLocation(shaderProgram, "uBlendMode");
                alphaULoc = gl.getUniformLocation(shaderProgram, "uAlpha");
            }
        }
    } catch(e) {
        console.log(e);
    }
}

// render a single model
function renderModel(whichTriSet, pMatrix, vMatrix, pvMatrix) {
    var currSet = inputTriangles[whichTriSet];
    var mMatrix = mat4.create();
    var nMatrix = mat4.create();
    var pvmMatrix = mat4.create();
    var zAxis = vec3.create(), sumRotation = mat4.create(), temp = mat4.create(), negCtr = vec3.create();

    mat4.fromTranslation(mMatrix,vec3.negate(negCtr,currSet.center)); 
    
    if (currSet.on)
        mat4.multiply(mMatrix,mat4.fromScaling(temp,vec3.fromValues(1.2,1.2,1.2)),mMatrix);
    
    vec3.normalize(zAxis,vec3.cross(zAxis,currSet.xAxis,currSet.yAxis));
    mat4.set(sumRotation,
        currSet.xAxis[0], currSet.yAxis[0], zAxis[0], 0,
        currSet.xAxis[1], currSet.yAxis[1], zAxis[1], 0,
        currSet.xAxis[2], currSet.yAxis[2], zAxis[2], 0,
        0, 0,  0, 1);
    mat4.multiply(mMatrix,sumRotation,mMatrix);
    
    mat4.multiply(mMatrix,mat4.fromTranslation(temp,currSet.center),mMatrix);
    mat4.multiply(mMatrix,mat4.fromTranslation(temp,currSet.translation),mMatrix);
    
    mat4.multiply(pvmMatrix,pvMatrix,mMatrix);
    gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix);
    gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix);
    
    mat4.invert(nMatrix, mMatrix);
    mat4.transpose(nMatrix, nMatrix);
    gl.uniformMatrix4fv(nMatrixULoc, false, nMatrix);
    
    gl.uniform3fv(ambientULoc, currSet.material.ambient);
    gl.uniform3fv(diffuseULoc, currSet.material.diffuse);
    gl.uniform3fv(specularULoc, currSet.material.specular);
    gl.uniform1f(shininessULoc, currSet.material.n);
    
    var alpha = currSet.material.alpha !== undefined ? currSet.material.alpha : 1.0;
    gl.uniform1f(alphaULoc, alpha);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureBuffers[whichTriSet]);
    gl.uniform1i(textureULoc, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichTriSet]);
    gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[whichTriSet]);
    gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffers[whichTriSet]);
    gl.vertexAttribPointer(vUVAttribLoc,2,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffers[whichTriSet]);
    gl.drawElements(gl.TRIANGLES,3*triSetSizes[whichTriSet],gl.UNSIGNED_SHORT,0);
}

// render the loaded model
function renderModels() {
    
    var pMatrix = mat4.create();
    var vMatrix = mat4.create();
    var pvMatrix = mat4.create();
    
    window.requestAnimationFrame(renderModels);
    
    // Update animation if active
    if (animationActive) {
        animationTime += 0.016; // approximately 60fps
        if (animationTime > animationDuration) {
            animationTime = 0; // Loop animation
        }
        
        // Apply London Bridge breaking and rebuilding animation
        applyBridgeAnimation(animationTime);
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.perspective(pMatrix,0.5*Math.PI,1,0.1,10);
    mat4.lookAt(vMatrix,Eye,Center,Up);
    mat4.multiply(pvMatrix,pMatrix,vMatrix);

    gl.uniform3fv(eyePosULoc, Eye);
    gl.uniform3fv(lightPosULoc, lightPosition);
    gl.uniform3fv(lightAmbientULoc, lightAmbient);
    gl.uniform3fv(lightDiffuseULoc, lightDiffuse);
    gl.uniform3fv(lightSpecularULoc, lightSpecular);
    gl.uniform1i(blendModeULoc, blendMode);

    // Mode 2: Render with transparency
    if (blendMode === 2) {
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // PASS 1: Render opaque objects (alpha >= 1.0) with depth writing enabled
        gl.depthMask(true);
        for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
            var alpha = inputTriangles[whichTriSet].material.alpha !== undefined ? 
                        inputTriangles[whichTriSet].material.alpha : 1.0;
            if (alpha >= 1.0) {
                renderModel(whichTriSet, pMatrix, vMatrix, pvMatrix);
            }
        }
        
        // PASS 2: Render transparent objects (alpha < 1.0) with depth writing disabled
        gl.depthMask(false);
        for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
            var alpha = inputTriangles[whichTriSet].material.alpha !== undefined ? 
                        inputTriangles[whichTriSet].material.alpha : 1.0;
            if (alpha < 1.0) {
                renderModel(whichTriSet, pMatrix, vMatrix, pvMatrix);
            }
        }
        gl.depthMask(true);
        gl.disable(gl.BLEND);
    } else {
        // Modes 0 and 1: Render all objects normally (no blending)
        for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
            renderModel(whichTriSet, pMatrix, vMatrix, pvMatrix);
        }
    }
}

// Apply London Bridge breaking and rebuilding animation
function applyBridgeAnimation(time) {
    if (numTriangleSets < 3) return;
    
    var halfDuration = animationDuration / 2;
    var progress;
    
    // First half: bridge breaks apart (falling down)
    if (time < halfDuration) {
        progress = time / halfDuration; // 0 to 1
        
        // Ease out cubic for dramatic fall
        var easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Object 0 (left piece): Falls down and rotates left
        var fallDistance0 = easeProgress * -0.5;
        var rotateAmount0 = easeProgress * Math.PI * 0.4;
        vec3.set(inputTriangles[0].translation, -easeProgress * 0.3, fallDistance0, 0);
        
        var rotMat0 = mat4.create();
        mat4.fromRotation(rotMat0, -rotateAmount0, [0, 0, 1]);
        var xAxis0 = vec3.fromValues(1, 0, 0);
        var yAxis0 = vec3.fromValues(0, 1, 0);
        vec3.transformMat4(inputTriangles[0].xAxis, xAxis0, rotMat0);
        vec3.transformMat4(inputTriangles[0].yAxis, yAxis0, rotMat0);
        
        // Object 1 (middle piece): Falls straight down faster with spin
        var fallDistance1 = easeProgress * -0.7;
        var spinAmount1 = easeProgress * Math.PI * 2;
        vec3.set(inputTriangles[1].translation, 0, fallDistance1, easeProgress * 0.1);
        
        var rotMat1 = mat4.create();
        mat4.fromRotation(rotMat1, spinAmount1, [0, 1, 0]);
        var xAxis1 = vec3.fromValues(1, 0, 0);
        var yAxis1 = vec3.fromValues(0, 1, 0);
        vec3.transformMat4(inputTriangles[1].xAxis, xAxis1, rotMat1);
        vec3.transformMat4(inputTriangles[1].yAxis, yAxis1, rotMat1);
        
        // Object 2 (right piece): Falls down and rotates right
        var fallDistance2 = easeProgress * -0.6;
        var rotateAmount2 = easeProgress * Math.PI * 0.5;
        vec3.set(inputTriangles[2].translation, easeProgress * 0.4, fallDistance2, -easeProgress * 0.1);
        
        var rotMat2 = mat4.create();
        mat4.fromRotation(rotMat2, rotateAmount2, [0, 0, 1]);
        var xAxis2 = vec3.fromValues(1, 0, 0);
        var yAxis2 = vec3.fromValues(0, 1, 0);
        vec3.transformMat4(inputTriangles[2].xAxis, xAxis2, rotMat2);
        vec3.transformMat4(inputTriangles[2].yAxis, yAxis2, rotMat2);
        
    } else {
        // Second half: bridge rebuilds itself (rising up)
        progress = (time - halfDuration) / halfDuration; // 0 to 1
        
        // Ease in cubic for smooth reconstruction
        var easeProgress = Math.pow(progress, 2);
        var reverseProgress = 1 - easeProgress;
        
        // Object 0: Rises and rotates back to original position
        var fallDistance0 = reverseProgress * -0.5;
        var rotateAmount0 = reverseProgress * Math.PI * 0.4;
        vec3.set(inputTriangles[0].translation, -reverseProgress * 0.3, fallDistance0, 0);
        
        var rotMat0 = mat4.create();
        mat4.fromRotation(rotMat0, -rotateAmount0, [0, 0, 1]);
        var xAxis0 = vec3.fromValues(1, 0, 0);
        var yAxis0 = vec3.fromValues(0, 1, 0);
        vec3.transformMat4(inputTriangles[0].xAxis, xAxis0, rotMat0);
        vec3.transformMat4(inputTriangles[0].yAxis, yAxis0, rotMat0);
        
        // Object 1: Rises and un-spins
        var fallDistance1 = reverseProgress * -0.7;
        var spinAmount1 = reverseProgress * Math.PI * 2;
        vec3.set(inputTriangles[1].translation, 0, fallDistance1, reverseProgress * 0.1);
        
        var rotMat1 = mat4.create();
        mat4.fromRotation(rotMat1, spinAmount1, [0, 1, 0]);
        var xAxis1 = vec3.fromValues(1, 0, 0);
        var yAxis1 = vec3.fromValues(0, 1, 0);
        vec3.transformMat4(inputTriangles[1].xAxis, xAxis1, rotMat1);
        vec3.transformMat4(inputTriangles[1].yAxis, yAxis1, rotMat1);
        
        // Object 2: Rises and rotates back
        var fallDistance2 = reverseProgress * -0.6;
        var rotateAmount2 = reverseProgress * Math.PI * 0.5;
        vec3.set(inputTriangles[2].translation, reverseProgress * 0.4, fallDistance2, -reverseProgress * 0.1);
        
        var rotMat2 = mat4.create();
        mat4.fromRotation(rotMat2, rotateAmount2, [0, 0, 1]);
        var xAxis2 = vec3.fromValues(1, 0, 0);
        var yAxis2 = vec3.fromValues(0, 1, 0);
        vec3.transformMat4(inputTriangles[2].xAxis, xAxis2, rotMat2);
        vec3.transformMat4(inputTriangles[2].yAxis, yAxis2, rotMat2);
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
