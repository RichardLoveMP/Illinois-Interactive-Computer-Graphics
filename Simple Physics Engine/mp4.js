/** @global The WebGL context */
var gl;
/** @global The HTML5 canvas we draw on */
var canvas;



/** @global A simple GLSL shader program */
var shaderProgram;
/** @global The Modelview matrix */
var mvMatrix = mat4.create();
/** @global The Projection matrix */
var pMatrix = mat4.create();
/** @global The Normal matrix */
var nMatrix = mat3.create();
/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

// Create a place to store sphere geometry
var sphereVertexPositionBuffer;
// Create a place to store normals for shading
var sphereVertexNormalBuffer;



// -------------------- convention parameters for MP4 
// Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [20,20,20];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0.4,0.4,0.4];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [0.8,0.8,0.8];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular = [0.4,0.4,0.4];


// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,0.0,10.0);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,0.0);


// ------------------ My Own Para for MP4 ---------------------//

/** @global Balls structure 1. x,y,z 2. p[3] 3. v[3] 4. radius */
var Balls = [];

/** @global Number of the balls */
var BallNum = 0;

/** @global Initial Speed of the balls */
var INITSPEED = 3.0;

/** @global The container's limit */
var CubeDim = 2.3;

/** @global g of the earth */
var g = -0.049;

/** @global timer which measuring the time */
var Timer = 0.1;

/** @global Air Friction */
var friction = 0.9;

/** @global Velocity Factor */
var velfactor = 0.8;

// Constructor of the Ball structure
/** @global The ball structure */
class Ball {
    constructor() {
      // Math.random = [0,1]  2.0 * Math.Random - 1.0 = [-1,1]
      var posX = (2.0 * Math.random() - 1.0) * CubeDim;
      var posY = (2.0 * Math.random() - 1.0) * CubeDim;
      var posZ = (2.0 * Math.random() - 1.0) * CubeDim;
      var vX = (2.0 * Math.random() - 1.0) * INITSPEED;
      var vY = (2.0 * Math.random() - 1.0) * INITSPEED;
      var vZ = (2.0 * Math.random() - 1.0) * INITSPEED;
      this.p = vec3.fromValues(posX, posY, posZ);
      this.v = vec3.fromValues(vX, vY, vZ);
      this.x = posX;
      this.y = posY;
      this.z = posZ;
      this.radius = GetRandomRadius();
      this.color = 0;
      return this;
    }
  }



//-----------------------------------------------------------------
//Color conversion  helper functions
function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}

//-------------------------------------------------------------------------
/**
 * Populates buffers with data for spheres
 */
function setupSphereBuffers() {
    var sphereSoup = [];
    var sphereNormals = [];
    var numT = sphereFromSubdivision(6, sphereSoup, sphereNormals);
    console.log("Generated ", numT, " triangles");
    
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereSoup), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = numT*3;
    console.log(sphereSoup.length/9);
    
    // Specify normals to be able to do lighting calculations
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals), gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = numT*3;
    
    console.log("Normals ", sphereNormals.length/3);     
}

//-------------------------------------------------------------------------
/**
 * Draws a sphere from the sphere buffer
 */
function drawSphere(){
    // Bind vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,               sphereVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // Bind normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sphereVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);      
}

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
    mat3.fromMat4(nMatrix,mvMatrix);
    mat3.transpose(nMatrix,nMatrix);
    mat3.invert(nMatrix,nMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview/normal matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
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

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
    var shaderScript = document.getElementById(id);
  
    // If we don't find an element with the specified id
    // we do an early exit 
    if (!shaderScript) {
        return null;
    }
  
    // Loop through the children for the found DOM element and
    // build up the shader source code as a string
    var shaderSource = "";
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
            shaderSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    } 
    return shader;
}

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
    vertexShader = loadShaderFromDOM("shader-vs");
    fragmentShader = loadShaderFromDOM("shader-fs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");
    shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");
    shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
    shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
    shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");
    shaderProgram.uniformAmbientMatColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");
    shaderProgram.uniformDiffuseMatColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
    shaderProgram.uniformSpecularMatColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32Array} a diffuse material color
 * @param {Float32Array} a ambient material color
 * @param {Float32Array} a specular material color 
 * @param {Float32} the shininess exponent for Phong illumination
 */
function uploadMaterialToShader(dcolor,acolor,scolor,shiny) {
    gl.uniform1f(shaderProgram.uniformShininessLoc, shiny);
    gl.uniform3fv(shaderProgram.uniformAmbientMatColorLoc, acolor);
    gl.uniform3fv(shaderProgram.uniformDiffuseMatColorLoc, dcolor);
    gl.uniform3fv(shaderProgram.uniformSpecularMatColorLoc, scolor);
}
  
  //-------------------------------------------------------------------------
  /**
   * Sends light information to the shader
   * @param {Float32Array} loc Location of light source
   * @param {Float32Array} a Ambient light strength
   * @param {Float32Array} d Diffuse light strength
   * @param {Float32Array} s Specular light strength
   */
  function uploadLightsToShader(loc,a,d,s) {
    gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
    gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
    gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
    gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s); 
  }
  

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
    setupSphereBuffers();     
}

/**
 * Get a random radius
 */
function GetRandomRadius(){
    // I try to control the interval of the radius to be [0.11,0.15]
    var radi; //0.11-0.15  -> 0.11 + [0-0.04] == 0.11 + Math.random() * 0.04
    radi = 0.11 + Math.random() * 0.04;
    return radi;
}

/**
 * Get a random HEX color
 */
function GetRandomColor(){
    // get each component
    var g = Math.floor(Math.random()*256);
    var b = Math.floor(Math.random()*256);
    var r = Math.floor(Math.random()*256);
    // aggregate it
    var color = '#'+r.toString(16)+g.toString(16)+b.toString(16);
    return color;
}

/**
 * Draw a determined ball with a specific index
 * @param {Integer} let the Ball structure to determine which ball to draw
 */
function DrawOneBall(ballIdx){

   // console.log("ball's idx =", ballIdx,"  position ==",Balls[ballIdx].p[0]," ", Balls[ballIdx].p[1]," ",Balls[ballIdx].p[2]);
    
    var BallPos = vec3.create();
    // Specify the index with the magnitude of the ball
    vec3.set(BallPos,Balls[ballIdx].p[0],Balls[ballIdx].p[1],Balls[ballIdx].p[2]);
    // Move the matrix to the given position
    mat4.translate(mvMatrix,mvMatrix,BallPos);

    // Specify the size of the ball
    var BallSize = vec3.create();
    vec3.set(BallSize,Balls[ballIdx].radius,Balls[ballIdx].radius,Balls[ballIdx].radius);

    mat4.scale(mvMatrix,mvMatrix,BallSize);

    // Basic drawing progress
    // Upload Light to the shader
    uploadLightsToShader(lightPosition,lAmbient,lDiffuse,lSpecular);

    // Upload Material to the shader
//    uploadMaterialToShader(kDiffuse,kAmbient,kSpecular,shininess);


    if(Balls[ballIdx].color == 0)
        Balls[ballIdx].color = GetRandomColor();
    var colorVal = Balls[ballIdx].color;

    var R = hexToR(colorVal)/255.0;
    var G = hexToG(colorVal)/255.0;
    var B = hexToB(colorVal)/255.0;

  //  uploadLightsToShader([20,20,20],[0.0,0.0,0.0],[1.0,1.0,1.0],[1.0,1.0,1.0]);
    uploadMaterialToShader([R,G,B],[R,G,B],[1.0,1.0,1.0],22);

    // set uniform && draw
    setMatrixUniforms();
    drawSphere();
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    //var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    // below is the process of drawing multiple balls
    var i = 0;
    for (i = 0; i < BallNum; i++){
        mvPushMatrix();
        DrawOneBall(i);
        mvPopMatrix();
    }
    /*
    mvPushMatrix();
    vec3.set(transformVec,20,20,20);
    mat4.scale(mvMatrix, mvMatrix,transformVec);
    
    //Get material color
    colorVal = document.getElementById("mat-color").value
    console.log(colorVal);
    R = hexToR(colorVal)/255.0;
    G = hexToG(colorVal)/255.0;
    B = hexToB(colorVal)/255.0;
    
    //Get shiny
    shiny = document.getElementById("shininess").value
    
    uploadLightsToShader([20,20,20],[0.0,0.0,0.0],[1.0,1.0,1.0],[1.0,1.0,1.0]);
    uploadMaterialToShader([R,G,B],[R,G,B],[1.0,1.0,1.0],shiny);
    setMatrixUniforms();
    drawSphere();
    mvPopMatrix();
    */
}

//----------------------------------------------------------------------------------
/**
 * Key presses and its functions
 * @param {event} press which key
 */
function onKeyDown(event) {
    
    // Reset
    if(event.keyCode == "82"){
        BallNum = 0;
        Balls.length = 0;
    }


    // press enter to make a new ball
    if(event.keyCode == "13"){
        Balls.push(new Ball());
        BallNum++;
    }
  }

//----------------------------------------------------------------------------------
/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function animate() {
    // This part is the usage of Euler Integration
    var i;var j;
    for (i = 0; i < BallNum; i ++){
        // for three dimension
        for(j = 0; j < 3; j ++){
            Balls[i].p[j] += Balls[i].v[j]*Timer;
            // update the pos and velocity
            Balls[i].v[j] *= Math.pow(friction,Timer);
            // Update the y axis
            Balls[i].v[1] += g*Timer;
            // There is a collision
            if(Balls[i].p[j] >= CubeDim){
                Balls[i].v[j] *= -velfactor;
                // manage the position change
                Balls[i].p[j] =  -velfactor*(Balls[i].p[j]-CubeDim) + CubeDim;
                // Set the velocity to zero if it is too small
                if(Balls[i].v[j] <= 0.09 && Balls[i].v[j] >= -0.09)
                    Balls[i].v[j] = 0.0;
            }
            // There is a collision
            if(Balls[i].p[j] <= -CubeDim){
                Balls[i].v[j] *= -velfactor;
                Balls[i].p[j] =  -velfactor*(Balls[i].p[j]+CubeDim) - CubeDim;
                // Set the velocity to zero if it is too small
                if(Balls[i].v[j] <= 0.09 && Balls[i].v[j] >= -0.09)
                    Balls[i].v[j] = 0.0;
            }
        }
    }
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
    canvas = document.getElementById("myGLCanvas");
    window.addEventListener("keydown", onKeyDown, false);
    gl = createGLContext(canvas);
    setupShaders();
    setupBuffers();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    tick();
}

//----------------------------------------------------------------------------------
/**
 * Tick called for every animation frame.
 */
function tick() {
    draw();
    requestAnimFrame(tick);
    animate();
}