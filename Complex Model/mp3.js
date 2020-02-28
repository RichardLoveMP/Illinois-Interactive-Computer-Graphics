
/**
 * @file mp3.js
 */
/** @global The WebGL context */
var gl;
/** @global canvas */
var canvas;
/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];
/** @global An object holding the geometry for a 3D mesh */
var myMesh;
/** @global Stores the texture */
var TextureCoordinates = new Array(6);
/** @global Stores the coordinate direction */
var CoordinateDirection = [
    // LEFT
    [0.0, 0.0,0.0, 1.0,1.0, 1.0,1.0, 0.0],
    // RIGHT
    [0.0, 0.0,0.0, 1.0,1.0, 1.0,1.0, 0.0],
    // BOTTOM
    [0.0, 0.0,0.0, 1.0,1.0, 1.0,1.0, 0.0],
    // TOP
    [0.0, 0.0,0.0, 1.0,1.0, 1.0,1.0, 0.0],
    // BACK
    [0.0, 0.0,0.0, 1.0,1.0, 1.0,1.0, 0.0],
    // FRONT
    [0.0, 0.0,0.0, 1.0,1.0, 1.0,1.0, 0.0]
];
/** @global Store the vertices of the cube */
var CubeVertices = new Array(6);
/** @global Store the direction of the cube */
var CubeDirection = [
    // LEFT
    [-0.5, -0.5, -0.5,-0.5, -0.5,  0.5,-0.5,0.5,  0.5,-0.5,  0.5, -0.5],
    // RIGHT
    [0.5, -0.5, -0.5,0.5,  0.5, -0.5, 0.5,  0.5,  0.5, 0.5, -0.5,  0.5],
    // BOTTOM
    [-0.5, -0.5, -0.5,0.5, -0.5, -0.5,0.5, -0.5,  0.5,-0.5, -0.5,  0.5],
    // TOP
    [-0.5,  0.5, -0.5,-0.5,  0.5,  0.5,0.5,  0.5,  0.5,0.5,  0.5, -0.5],
    // BACK
    [-0.5, -0.5, -0.5,-0.5,  0.5, -0.5,0.5,  0.5, -0.5,0.5, -0.5, -0.5],
    // FRONT
    [-0.5, -0.5,  0.5,0.5, -0.5,  0.5,0.5,  0.5,  0.5,-0.5,  0.5,  0.5]
];
/** @global Store the face index */
var FaceIndcies = new Array(6);
/** @global Store the face index direction */
var IndciesDirection = [
    [0,1,2,0,2,3],[0,1,2,0,2,3],[0,1,2,0,2,3],[0,1,2,0,2,3],[0,1,2,0,2,3],[0,1,2,0,2,3]
];
/** @global texture of the 6 faces cube */
var texcube = new Array(6);
/** @global texture of the image */
var teximage = new Array(6);

/** @global storing a series of the name of png */
var ImName = new Array("negx.jpg","posx.jpg","negy.jpg","posy.jpg","negz.jpg","posz.jpg");

/** @global Variable to store a surroundings of the environment */
var EnvironmentSurroundings;
/** @global Boolean value for checking if cube is loaded */
var LoadCubeSuccessfully =0.0;
/** @global Boolean value for checking if reflection buttion is checked */
var isReflective=1.0;

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,0.0,1.1);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// For rotation
/** @global Direction axis in which the teapot orbits */
var xAxis = vec3.fromValues(1.0,0.0,0.0);
/** @global A quaternion variable used for rotation */
var quaternion = quat.create();

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [1,1,1];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0.1,0.1,0.1];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [0.8,0.8,0.8];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular = [0.4,0.4,0.4];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [1,1,1];
/** @global Shininess exponent for Phong reflection */
var shininess = 23;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];

// For affine transformations
/** @global Angle in y-direction */
var eulerY=0;
/** @global Angle w.r.t. left and right */
var LRangle=0;
/** @global Vector solely used for affine transformations */
var transformVec = vec3.create();

//------------------- para for drawing the teapot --------------

/** @global shaderprogram for the teapot */
var shaderProgram;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The View matrix */
var vMatrix = mat4.create();
/** @global The Reflection matrix */
var rMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Normal matrix */
var nMatrix = mat3.create();
//------------------- para for drawing the environment --------------
/** @global Shader Program for enviroment */
var shaderProgram_enviroment;

/** @global Model view for enviroment */
var mvMatrix_enviroment = mat4.create();
/** @global normal for enviroment */
var nMatrix_enviroment = mat3.create();
/** @global project for enviroment */
var pMatrix_enviroment = mat4.create();

/** @global denoting the rotate degree */
/* Coordinate X,Y,Z, respectively */
var Rotate_Deg = [90,180,90,0,180,-90];
/** @global inverseViewTransform */
var inverseViewTransform = mat3.create();

/**
 * Get file for the caller function
 * @param {url} name of the file
 */
function asyncGetFile(url) {
    console.log("Getting text file");
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.responseType = "text";
        xhr.onload = () => resolve(xhr.responseText);
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
        console.log("Made promise");
    });
}

/**
 * uploadModelViewMatrixToShader 
 * upload a model view matrix to shader 
 * @param NONE
 * @return NONE
 */
function uploadModelViewMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

/*
  upload our view direction vector to shader
*/
function uploadViewDirToShader(){
	gl.uniform3fv(gl.getUniformLocation(shaderProgram, "viewDir"), viewDir);
}

/**
 * uploadinverseViewTransformMatrixToShader 
 * upload a matrix to shader 
 * @param NONE
 * @return NONE
 */
function uploadinverseViewTransformMatrixToShader() {
    gl.uniformMatrix3fv(shaderProgram.inverseViewTransform, false, inverseViewTransform);
  }

/**
 * uploadProjectionMatrixToShader 
 * upload a projection matrix to shader 
 * @param NONE
 * @return NONE
 */
function uploadProjectionMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/**
 * uploadProjectionMatrixToShader 
 * upload a project matrix to shader 
 * @param NONE
 * @return NONE
 */
function uploadNormalMatrixToShader() {
    mat3.fromMat4(nMatrix,mvMatrix);
    mat3.transpose(nMatrix,nMatrix);
    mat3.invert(nMatrix,nMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

/**
 * uploadReflectionMatrixToShader 
 * upload a reflection matrix to shader 
 * @param NONE
 * @return NONE
 */
function uploadReflectionMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.rMatrixUniform, false, rMatrix);
}

/**
 * mvPushMatrix
 * push matrix to the drawing stack
 * @param NONE
 * @return NONE
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

/**
 * mvPopMatrix
 * pop matrix from the stack (including error checking)
 * @param NONE
 * @return NONE
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

/**
 * setMatrixUniforms
 * set the matrix uniforms helper function
 * @param NONE
 * @return NONE
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
    uploadReflectionMatrixToShader();
}


/**
 *  Provided FUNCTION
 *  degToRad
 *  @param {degrees} to be changed to rad
 *  @return rad
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 *  Provided FUNCTION
 *  createGLContext
 *  @param {canvas} canvas
 *  WebGL Context
 */
function createGLContext(canvas) {
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for (var i=0; i < names.length; i++) {
        try {
            context = canvas.getContext(names[i]);
        } catch(e) {}
            if (context) {
                break;
        }
    }
    if (context) {
        context.viewportWidth = canvas.width;
        context.viewportHeight = canvas.height;
    } else {
        alert("Failed to create WebGL context!");
    }
    return context;
}

/**
 *  Provided FUNCTION
 *  loadShaderFromDOM
 *  @param {id} id String for shader to load
 *  WebGL Context
 */
function loadShaderFromDOM(id) {
    var shaderScript = document.getElementById(id);
  

    if (!shaderScript) {
        return null;
    }
    // shader source with the current child (init)
    var shaderSource = "";
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) { 
            shaderSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }
    // shader initilization and shader constructor
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    // complie the shader
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
 
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    } 
    return shader;
}

/**
 *  Provided setupShaders
 *  setupShaders of both teapot and the outside cube environment
 *  WebGL Context
 */
function setupShaders() {
    // get vertex and fragment shader
    vertexShader = loadShaderFromDOM("shader-vs");
    fragmentShader = loadShaderFromDOM("shader-fs");
  
    // get the shader program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // sanity checking, if failed, alert it
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    // use the shader program
    gl.useProgram(shaderProgram);

    // Set vertex position and the normal
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    // set the matrix and interacting with the interface with HTML file
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.rMatrixUniform = gl.getUniformLocation(shaderProgram, "uRMatrix");
    shaderProgram.uniformReflectionLoc = gl.getUniformLocation(shaderProgram, "uReflect");
    shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
    shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
    shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
    shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
    shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");
    shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");  
    shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
    shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");
    shaderProgram.cubeSampler = gl.getUniformLocation(shaderProgram, "uCSampler");
    shaderProgram.inverseViewTransform = gl.getUniformLocation(shaderProgram, "uInverseViewTransform");


    // set up shader of environment
    vertexShader = loadShaderFromDOM("SkyVertexShader");
    fragmentShader = loadShaderFromDOM("SkyFragmentShader");
  
    // Make the gl create program, shader for ENVIRONMENT CUBE
    shaderProgram_enviroment = gl.createProgram();
    gl.attachShader(shaderProgram_enviroment, vertexShader);
    gl.attachShader(shaderProgram_enviroment, fragmentShader);
    gl.linkProgram(shaderProgram_enviroment);

    // Sanity Check for the environment shader
    if (!gl.getProgramParameter(shaderProgram_enviroment, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    // use program of the outside shader cube
    gl.useProgram(shaderProgram_enviroment);

    // environment shader progress
    shaderProgram_enviroment.vertexPositionAttribute = gl.getAttribLocation(shaderProgram_enviroment, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram_enviroment.vertexPositionAttribute);

    shaderProgram_enviroment.vertexTexCoordAttribute = gl.getAttribLocation(shaderProgram_enviroment, "aTextureCoordinate");
    gl.enableVertexAttribArray(shaderProgram_enviroment.vertexTexCoordAttribute);

    // set the related matrixuniform
    shaderProgram_enviroment.mvMatrixUniform = gl.getUniformLocation(shaderProgram_enviroment, "uMVMatrix");
    shaderProgram_enviroment.pMatrixUniform = gl.getUniformLocation(shaderProgram_enviroment, "uPMatrix");
    shaderProgram_enviroment.nMatrixUniform = gl.getUniformLocation(shaderProgram_enviroment, "uNMatrix");
}


// GIVEN FUNCTION
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
    gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
    gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
    gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
    gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}

// GIVEN FUNCTION
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
    gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
    gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
    gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
    gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}
/**
 * Populate buffers with data
 * @param filename -- the name of the file
 */
function setupMesh(filename) {
    myMesh = new TriMesh();
    myPromise = asyncGetFile(filename);
    myPromise.then((retrievedText) => {
        myMesh.loadFromOBJ(retrievedText);
        console.log("Yay! got the file");
    })
    .catch(
        // Log the rejection reason
        (reason) => {
            console.log('Handle rejected promise ('+reason+') here.');
        });
}
/**
 * set the texture buffer bind it to the texture in gl
 * @param i (ith texture to be solved [from 0-6])
 */
function setText(i){

    // texcube is the texture of the cube
    texcube[i] = gl.createTexture();
    // bind the ith texture with gl
    gl.bindTexture(gl.TEXTURE_2D, texcube[i]);

    //get 2D texImage
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
    
    // Set the teximage with the function
    teximage[i] = new Image();
    teximage[i].onload = function() { 
        ReviseTexture(teximage[i], texcube[i]); 
    }
    // set the ith textImage with the name of the picture       
    teximage[i].src = ImName[i];

}

/**
 * setupTextures
 * Set up all of the texture in the scene
 * Usually from 0-5
 */
function setupTextures() {
    // Shade the six part of the cube
    for(var i = 0; i < 6; i++){
        setText(i);
    }
}

/**
 * ReviseTexture
 * @param image (the image of the scene)
 * @param texture (the texture of the scene)
 * Set up all of the texture in the scene
 * Usually from 0-5
 */
function ReviseTexture(image, texture) {

    // bind the texture with texImage2D
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
    // sanity check process
    var t1 = ((image.width) & (image.width - 1));
    var t2 = ((image.height) & (image.height - 1));
    var flag = 0;
    if(t1 == 0  && t2 == 0)
        flag = 1;
    else    
        flag = 0;
    
    // Choose whether we should use Mipmap or texParameteri to get the final solution
    if (flag) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    // texure parameter
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

/**
 * ConstructEnvironment
 * Construct all of the environment in the scene
 * Usually from 0-5
 */
function ConstructEnvironment() {
    
    // if we got this, it denotes that we've loaded the cube successfully
    LoadCubeSuccessfully = 1.0;
    // console.log("Load the Cube Successfully");
    // set the environment
    EnvironmentSurroundings = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, EnvironmentSurroundings);
    
    // set the texture parameter with the given data
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // set six directions' appearance
    for(var i = 0; i < 6; i++){
        if(i >= 0 && i <= 1){
            // x coordinate
            if(i & 1){// neg-x
                SetEnvironment(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, EnvironmentSurroundings, ImName[0]); 
            }else{// pos-x
                SetEnvironment(gl.TEXTURE_CUBE_MAP_POSITIVE_X, EnvironmentSurroundings, ImName[1]); 
            }
        }
        if(i >= 2 && i <= 3){
            // Y coordinate
            if(i & 1){// neg-y
                SetEnvironment(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, EnvironmentSurroundings, ImName[2]); 
            }else{// pos-y
                SetEnvironment(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, EnvironmentSurroundings, ImName[3]); 
            }
        }
        if(i >= 4 && i <= 5){
            // Z coordinate
            if(i & 1){// neg-z
                SetEnvironment(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, EnvironmentSurroundings, ImName[4]); 
            }else{// pos-z
                SetEnvironment(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, EnvironmentSurroundings, ImName[5]); 
            }
        }
    }
}

/**
 * ConstructEnvironment
 * Construct all of the environment in the scene
 * @param Direct -- Direction
 * @param Para_tex -- the texture of the environment
 * @param picture_name -- the name of hte picture (storing in the picture)
 * Usually from 0-5
 */
function SetEnvironment(Diret, Para_tex, picture_name){

    // get a new image
    var image = new Image();
    image.src = picture_name;

    // set the onload function
	image.onload = function(){
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, Para_tex);
        gl.texImage2D(Diret,0,gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);        
        var t1 = ((image.width) & (image.width - 1));
        var t2 = ((image.height) & (image.height - 1));
        var flag = 0;
        // sanity check
        if(t1 == 0  && t2 == 0)
            flag = 1;
        else    
            flag = 0;

        // set the flag of the Mipmap (take it or not)
        if (flag) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        } else {// set the textureParameter
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   }
}

/**
 * CubeBufferConstructor
 * Construct 18 buffers
 * 6 direction * (coordinate of the texture + indicies of the direction + vertex of the cube)
 * Usually from 0-5
 */
function CubeBufferConstructor(){
    // six directions
    for(var i = 0; i < 6; i++){
        TextureCoordinates[i] = gl.createBuffer();
        FaceIndcies[i] = gl.createBuffer();
        CubeVertices[i] = gl.createBuffer();
    }
}

/**
 * BindCubeVerticesWithBuffer
 * Bind Cube Vertices With Buffer
 * 6 direction 
 * Usually from 0-5
 */
function BindCubeVerticesWithBuffer(){
    // six directions
    for(var i = 0; i < 6; i++){
        gl.bindBuffer(gl.ARRAY_BUFFER, CubeVertices[i]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(CubeDirection[i]), gl.STATIC_DRAW);
    }
}

/**
 * BindTextureCoordinateWithBuffer
 * Bind Texture Coordinate With Buffer
 * 6 direction 
 * Usually from 0-5
 */
function BindTextureCoordinateWithBuffer(){
    // six -> faces = six -> directions
    for(var i = 0; i < 6; i++){
        gl.bindBuffer(gl.ARRAY_BUFFER, TextureCoordinates[i]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(CoordinateDirection[i]), gl.STATIC_DRAW);
    }
}

/**
 * BindFaceIndciesWithBuffer
 * Bind Face Indcies With Buffer
 * 6 direction 
 * Usually from 0-5
 */
function BindFaceIndciesWithBuffer(){
    // six directions
    for(var i = 0; i < 6; i++){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FaceIndcies[i]);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(IndciesDirection[i]), gl.STATIC_DRAW);
    }
}

/**
 * setup buffer
 * set the buffer
 */
function setupBuffers() {
    // Init the value which will be modified later
    CubeBufferConstructor()  
    
    // bind buffer
    BindCubeVerticesWithBuffer();   
    BindTextureCoordinateWithBuffer();
    BindFaceIndciesWithBuffer();
    // setup the mesh
    setupMesh("teapot_0.obj");
}

/**
 * DrawLoadedMesh
 * Draw the mesh that loaded in the buffer
 */
function DrawLoadedMesh(){
    // stack drawing
    mvPushMatrix();
    mat4.rotateY(rMatrix, rMatrix, degToRad(LRangle));
    vec3.set(transformVec, 0.0, -0.1, 0.0);
    mat4.translate(mvMatrix, mvMatrix, transformVec);
    vec3.set(transformVec, 0.075, 0.075, 0.075);

    // scalie the matrix
    mat4.scale(mvMatrix, mvMatrix, transformVec);
    mat4.rotateY(mvMatrix, mvMatrix, degToRad(eulerY));

    mat4.multiply(mvMatrix,vMatrix,mvMatrix);
    setMatrixUniforms();

    // decide whether it is reflective
    gl.uniform1f(shaderProgram.uniformReflectionLoc, isReflective);

    setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);  
    setMaterialUniforms(shininess,kAmbient,kDiffuse,kSpecular);

    // activate process
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, EnvironmentSurroundings);
    gl.uniform1i(shaderProgram.cubeSampler, 1);
    myMesh.drawTriangles();
    mvPopMatrix();
}

/**
 * Draw
 * Draw the mesh that loaded in the buffer
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    // get the shader program
    gl.useProgram(shaderProgram);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Prospective Set
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight,0.1, 200.0);
    mat4.identity(rMatrix);
    // make the eyepoint   
    vec3.add(viewPt, eyePt, viewDir);
    // set the eyepoint
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);
    // decide whether it is reflect or shaded
    if(document.getElementById("reflect").checked) {
        isReflective = 1.0;
    }
    if(document.getElementById("shaded").checked) {
        isReflective = 0.0;
    }
    if(document.getElementById("refract").checked){
        isReflective = 2.0;
    }
    
    // To draw my own mesh
    if(myMesh.loaded()) {
        DrawLoadedMesh();
        mat3.fromMat4(inverseViewTransform, mvMatrix);
        mat3.invert(inverseViewTransform, inverseViewTransform);
        mat4.rotateY(mvMatrix,mvMatrix,eulerY);
        uploadinverseViewTransformMatrixToShader();
        
        uploadViewDirToShader();
    }
}

/**
 * DrawEnvironmentFace
 * Draw environment mesh that loaded in the buffer
 * Draw call that applies matrix transformations to model of environment and draws model of environment in frame
 */
function DrawEnvironmentFace(){
    // six directions
    for(var i = 0; i < 6; i++){
        // Process for drawing ith shader
        mvPushMatrixByEnvironment();
        gl.bindBuffer(gl.ARRAY_BUFFER, CubeVertices[i]);
        gl.vertexAttribPointer(shaderProgram_enviroment.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        // bindbuffer process
        gl.bindBuffer(gl.ARRAY_BUFFER, TextureCoordinates[i]);
        gl.vertexAttribPointer(shaderProgram_enviroment.vertexTexCoordAttribute, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texcube[i]);
        gl.uniform1i(gl.getUniformLocation(shaderProgram_enviroment, "uSampler"), 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FaceIndcies[i]);
        if( i >= 0 && i <= 1 ){ // X Rotation
            if(i & 1){
                mat4.rotateX(mvMatrix_enviroment, mvMatrix_enviroment, degToRad(Rotate_Deg[i])); 
            }else{    
                mat4.rotateX(mvMatrix_enviroment, mvMatrix_enviroment, degToRad(Rotate_Deg[i])); 
            }
        }
        if( i >= 2 && i <= 3 ){ // Y Rotation
            if(i & 1){
                mat4.rotateY(mvMatrix_enviroment, mvMatrix_enviroment, degToRad(Rotate_Deg[i])); 
            }else{    
                mat4.rotateY(mvMatrix_enviroment, mvMatrix_enviroment, degToRad(Rotate_Deg[(i|1) -1 ])); 
            }
        }
        if( i >= 4 && i <= 5 ){ // Z rotation
            if(i & 1){
                mat4.rotateZ(mvMatrix_enviroment, mvMatrix_enviroment, degToRad(Rotate_Deg[i])); 
            }else{    
                mat4.rotateZ(mvMatrix_enviroment, mvMatrix_enviroment, degToRad(Rotate_Deg[(i|1) -1 ])); 
            }
        }
        // set matrix by the environment
        setMatrixUniformsByEnvironment();
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        mvPopMatrixByEnvironment();
    }
}

/**
 * Background_Drawing
 * Drawing the buffer stored the background value
 * Similiar to Draw function
 */
function Background_Drawing() { // draw the background
    gl.useProgram(shaderProgram_enviroment);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    mat4.perspective(pMatrix_enviroment,degToRad(90), gl.viewportWidth / gl.viewportHeight,0.1, 200.0);
    // make an eyepoint
    vec3.add(viewPt, eyePt, viewDir);
    // using an eyepoint
    mat4.lookAt(mvMatrix_enviroment,eyePt,viewPt,up);
    // set the vector
    vec3.set(transformVec, 10.0, 10.0, 10.0);
    mat4.scale(mvMatrix_enviroment, mvMatrix_enviroment, transformVec);
    // draw environment face
    DrawEnvironmentFace(); 
}

/**
 * uploadModelViewMatrixToShaderByEnvironment
 * uploadModelViewMatrixToShade version for environment
 */
function uploadModelViewMatrixToShaderByEnvironment() {
    gl.uniformMatrix4fv(shaderProgram_enviroment.mvMatrixUniform, false, mvMatrix_enviroment);
}
/**
 * mvPushMatrixByEnvironment
 * mvPushMatrix version for environment
 */
function mvPushMatrixByEnvironment() {
    var copy = mat4.clone(mvMatrix_enviroment);
    mvMatrixStack.push(copy);
}
/**
 * uploadNormalMatrixToShaderByEnvironment
 * uploadNormalMatrixToShader version for environment
 */
function uploadNormalMatrixToShaderByEnvironment() {
    mat3.fromMat4(nMatrix_enviroment,mvMatrix_enviroment);
    mat3.transpose(nMatrix_enviroment,nMatrix_enviroment);
    mat3.invert(nMatrix_enviroment,nMatrix_enviroment);
    gl.uniformMatrix3fv(shaderProgram_enviroment.nMatrixUniform, false, nMatrix_enviroment);
}
/**
 * mvPopMatrixByEnvironment
 * mvPopMatrix version for environment
 */
function mvPopMatrixByEnvironment() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix_enviroment = mvMatrixStack.pop();
}
/**
 * uploadProjectionMatrixToShaderByEnvironment
 * uploadProjectionMatrixToShader version for environment
 */
function uploadProjectionMatrixToShaderByEnvironment() {
    gl.uniformMatrix4fv(shaderProgram_enviroment.pMatrixUniform, false, pMatrix_enviroment);
}
/**
 * setMatrixUniformsByEnvironment
 * setMatrixUniforms version for environment
 */
function setMatrixUniformsByEnvironment() {
    uploadModelViewMatrixToShaderByEnvironment();
    uploadNormalMatrixToShaderByEnvironment();
    uploadProjectionMatrixToShaderByEnvironment();
}

/**
 * PressKey
 * @param {EventListener} event 
 * Dealing with the interact with the users
 */
function PressKey(event)
{
    if(event.keyCode =="37"){
        // key Left
        quat.setAxisAngle(quaternion, up, degToRad(2.0));
        vec3.transformQuat(eyePt, eyePt, quaternion);
        vec3.transformQuat(viewDir, viewDir, quaternion);
    //    vec3.transformQuat(xAxis, xAxis, quaternion);
        LRangle+=2.0;
    }
    
    if(event.keyCode =="39"){
        // key Right
        quat.setAxisAngle(quaternion, up, degToRad(-2.0));   
        vec3.transformQuat(eyePt, eyePt, quaternion);
        vec3.transformQuat(viewDir, viewDir, quaternion);
    //    vec3.transformQuat(xAxis, xAxis, quaternion);
        LRangle-=2.0;
    }
    if (event.keyCode =="65") {
        // key A
        eulerY-= 2;
    }
    if (event.keyCode == "68") {
        // key D
        eulerY+= 2;
    } 
}

/**
  * Update any model transformations
  */
 /*
 function animate() {
    //console.log(eulerX, " ", eulerY, " ", eulerZ); 
    document.getElementById("eY").value=eulerY;
    document.getElementById("eZ").value=eyePt[2];   
 }
 */
/**
 * Startup function called from html code to start program.
 */
 function startup() {
     canvas = document.getElementById("myGLCanvas");
     window.addEventListener('keydown', PressKey, false);
     gl = createGLContext(canvas);
     setupShaders();
     setupTextures();
     ConstructEnvironment();
     setupBuffers();
     gl.clearColor(1.0, 1.0, 1.0, 1.0);
     gl.enable(gl.DEPTH_TEST);
     tick();
}
/**
 * Keeping drawing frames....
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    if(LoadCubeSuccessfully == 1.0) {
        Background_Drawing();
    }
  // animate();
}
