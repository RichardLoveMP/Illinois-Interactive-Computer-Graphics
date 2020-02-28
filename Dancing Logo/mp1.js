/**
 * @file A simple WebGL example drawing a circle
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The angle of rotation around the x axis */
var defAngle = 0;

/** @global Number of vertices around the circle boundary */
var numCircleVerts = 100;

/** @global Two times pi to save some multiplications...*/
var twicePi = 2.0 * 3.14159;

/** @global The translation offset in X and Y directions */
var translateX = 0;
var translateY = 0;

/** @global The scaling offset in X and Y directions */
var scaleFactorX = 1;
var scaleFactorY = 1;

/** @global The angle of rotation around the x axis */
var rotAngle = 0;

/** @global The angle of rotation used with sine function */
var sinAngle = 0;

/** @global Time stamp of previous frame in ms */
var lastTime = 0;
/** @global glmatrix vectors to use for transformations */
var translationVec = vec3.create();
var scaleVec = vec3.create();

// Vector Init
vec3.set(translationVec, 0.0, 0.0, -2.0);
vec3.set(scaleVec, 0.0, 0.0, -2.0);

/** @global boolean flag to define whether it is going left or right */
var flg = 0;

/** @global boolean vector to identify whether the animation is part3 */
var is_my = 0;

/** @global boolean vector to identify whether the animation is part2 */
var is_mp1 = 0;

/** @global intenger to measure how many frames have been operated */
var deLay = 0;

/** @global distance of the two different "I" when spliting */
var distsplit = 0;

/** @global boolean merge flag to identify whether two different I is merge or to split */
var mergeflag = 1;

/** @global Intenger to measure frame in each scene */
var Frametime = 0;

/** @global For part3: the red component of the background color */
var background_r;

/** @global For part3: the green component of the backgruond color */
var background_g;

/** @global For part3: the blue component of the background color */
var background_b;


/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/** 
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


/** 
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for (var i = 0; i < names.length; i++) {
        try {
            context = canvas.getContext(names[i]);
        } catch (e) {}
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

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

/**
 * Populate vertex buffer with data
 */
function loadVertices() {
  // Generate Vertex position buffer
  vertexPositionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  
  // Write down the triangle vertices
  var triangleVertices = [ 
      // small orange 
        -0.45*0.9,  0.6*0.9,  0.0,
        0.45*0.9,   0.3/0.9,  0.0,
        0.45*0.9,   0.6*0.9,  0.0,
      
        -0.45*0.9,  0.6*0.9,  0.0,
        -0.45*0.9,  0.3/0.9,  0.0,
        0.45*0.9,  0.3/0.9,  0.0,
      
        -0.23*0.7,  0.3/0.9,  0.0,
        -0.23*0.7,  -0.3/0.9,  0.0,
        0.23*0.7,  -0.3/0.9,  0.0,
      
        -0.23*0.7,  0.3/0.9,  0.0,
        0.23*0.7,  -0.3/0.9,  0.0,
        0.23*0.7, 0.3/0.9 , 0.0,
      
        -0.45*0.9,  -0.3/0.9,  0.0,
        -0.45*0.9,  -0.6*0.9,  0.0,
        0.45*0.9,  -0.6*0.9,  0.0,
      
        -0.45*0.9,  -0.3/0.9,  0.0,
        0.45*0.9,  -0.6*0.9,  0.0,
        0.45*0.9,  -0.3/0.9,  0.0,
      
        // big blue
        -0.45,  0.6,  0.0,
        0.45,   0.3,  0.0,
        0.45,   0.6,  0.0,

        -0.45,  0.6,  0.0,
        -0.45,  0.3,  0.0,
        0.45,  0.3,  0.0,

        -0.23,  0.3,  0.0,
        -0.23,  -0.3,  0.0,
        0.23,  -0.3,  0.0,

        -0.23,  0.3,  0.0,
        0.23,  -0.3,  0.0,
        0.23, 0.3 , 0.0,

        -0.45,  -0.3,  0.0,
        -0.45,  -0.6,  0.0,
        0.45,  -0.6,  0.0,

        -0.45,  -0.3,  0.0,
        0.45,  -0.6,  0.0,
        0.45,  -0.3,  0.0,
  ];
  
  // Get the data into the buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 36;
}

/**
 * Populate color buffer with data
 */
function loadColors() {
  // Generate the color buffer
  vertexColorBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
 
  // Write down the color value of two different I 
  var colors = [
    //orange 
    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,

    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,

    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,

    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,
    232/255, 74/255, 39/255, 1.0,
    
    // blue
    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,

    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,

    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,

    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,
    19/255, 41/255, 75/255, 1.0,
  ];

  // Get the color data into the buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 36;  
}

/**
 * Split two I (orange and blue) with a certain distance
 */
function spliti(){
    // First step: if the merge flag is zero, their split distance increases
	if(distsplit <= 0.5 && mergeflag == 0){
		distsplit += 0.01;
    }
    // Second step: place limit on the upper bound of split distance
	if(distsplit > 0.5){
		mergeflag = 1;
		distsplit -= 0.01;
    }
    // Third step: decrease the split distance
	if(mergeflag ==1 && distsplit >= 0){
		distsplit -= 0.01;
    }
    // Fourth step: place limit on the lower bound of split distance
	if(mergeflag == 1 && distsplit < 0){
		mergeflag = 0;
		distsplit = 0;
    }
    // Bind the buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
    // Prepare for the new blue vertices
    var bluei = [
		-0.45,  0.6,  0.0,
		 0.45,   0.3,  0.0,
		 0.45,   0.6,  0.0,
  
		-0.45,  0.6,  0.0,
		-0.45,  0.3,  0.0,
		 0.45,  0.3,  0.0,
  
		-0.23,  0.3,  0.0,
		-0.23,  -0.3,  0.0,
		 0.23,  -0.3,  0.0,
  
		-0.23,  0.3,  0.0,
		 0.23,  -0.3,  0.0,
		 0.23, 0.3 , 0.0,
  
		-0.45,  -0.3,  0.0,
		-0.45,  -0.6,  0.0,
		 0.45,  -0.6,  0.0,
  
		-0.45,  -0.3,  0.0,
		 0.45,  -0.6,  0.0,
		 0.45,  -0.3,  0.0,
    ];
    
	// Update the blue vertices by adding the split distance
	for (var i=0; i < 54; i+=3) {
		if(distsplit <= 0.5){
			bluei[i] += distsplit;
			bluei[i+1] += distsplit;
		}else{
			bluei[i+1] += 0.5;
			bluei[i+1]+=0.5
		}
    }
    
    // Update the data in the buffer
	gl.bufferSubData(gl.ARRAY_BUFFER, 54 * 4, new Float32Array(bluei));
}

/**
 * Populate buffers with data
 */
function setupBuffers() {

    //Generate the vertex positions    
    loadVertices();
    //Generate the vertex colors
	loadColors();
	
}

/**
 * Populate my own vertices buffers with data (For Part 3)
 * In my own animation: I choose to use a big mosaic to perform
 * an animation about ILLINI.
 */
function loadmyVertices(){
    // Load the vertices
	vertexPositionBuffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
    // Load the vertices about the canvas
    var triangleVertices = [ 
		// 1 
		-0.2, 0.2, 0.0,
		-0.2, 0.1, 0.0,
		-0.1, 0.1, 0.0,
		// 2  
		-0.2, 0.2, 0.0,
		-0.1, 0.1, 0.0, 
		-0.1, 0.2, 0.0,
		// 3
		-0.1, 0.2, 0.0,
		-0.1, 0.1, 0.0,
		0.0, 0.1, 0.0,
		// 4
		-0.1, 0.2, 0.0,
		0.0, 0.1, 0.0,
		0.0, 0.2, 0.0,
		
		//5 
		0.0,0.2,0.0,
		0.0,0.1,0.0,
		0.1,0.1,0.0,

		//6
		0.0,0.2,0.0,
		0.1,0.1,0.0,
		0.1,0.2,0.0,

		//7
		0.1,0.2,0.0,
		0.1,0.1,0.0,
		0.2,0.1,0.0,

		//8
		0.1,0.2,0.0,
		0.2,0.1,0.0,
		0.2,0.2,0.0,

		//9
		0.2,0.2,0.0,
		0.2,0.1,0.0,
		0.3,0.1,0.0,

		//10
		0.2,0.2,0.0,
		0.3,0.1,0.0,
		0.3,0.2,0.0,

	// second row
		// 1 
		-0.2, 0.2-0.1, 0.0,
		-0.2, 0.1-0.1, 0.0,
		-0.1, 0.1-0.1, 0.0,
	  // 2  
		-0.2, 0.2-0.1, 0.0,
		-0.1, 0.1-0.1, 0.0, 
		-0.1, 0.2-0.1, 0.0,
	  // 3
		-0.1, 0.2-0.1, 0.0,
		-0.1, 0.1-0.1, 0.0,
		0.0, 0.1-0.1, 0.0,
	  // 4
	    -0.1, 0.2-0.1, 0.0,
	    0.0, 0.1-0.1, 0.0,
	    0.0, 0.2-0.1, 0.0,
	  
	  //5 
	    0.0,0.2-0.1,0.0,
	    0.0,0.1-0.1,0.0,
	    0.1,0.1-0.1,0.0,

	  //6
	    0.0,0.2-0.1,0.0,
	    0.1,0.1-0.1,0.0,
	    0.1,0.2-0.1,0.0,

	  //7
	    0.1,0.2-0.1,0.0,
	    0.1,0.1-0.1,0.0,
	    0.2,0.1-0.1,0.0,

	  //8
	    0.1,0.2-0.1,0.0,
	    0.2,0.1-0.1,0.0,
	    0.2,0.2-0.1,0.0,

	  //9
	    0.2,0.2-0.1,0.0,
	    0.2,0.1-0.1,0.0,
	    0.3,0.1-0.1,0.0,

	  //10
	    0.2,0.2-0.1,0.0,
	    0.3,0.1-0.1,0.0,
	    0.3,0.2-0.1,0.0,	
	
	  // third row
		// 1 
		-0.2, 0.2-0.2, 0.0,
		-0.2, 0.1-0.2, 0.0,
		-0.1, 0.1-0.2, 0.0,
	  // 2  
		-0.2, 0.2-0.2, 0.0,
		-0.1, 0.1-0.2, 0.0, 
		-0.1, 0.2-0.2, 0.0,
	  // 3
		-0.1, 0.2-0.2, 0.0,
		-0.1, 0.1-0.2, 0.0,
		0.0, 0.1-0.2, 0.0,
	  // 4
	    -0.1, 0.2-0.2, 0.0,
	    0.0, 0.1-0.2, 0.0,
	    0.0, 0.2-0.2, 0.0,
	  
	  //5 
	    0.0,0.2-0.2,0.0,
	    0.0,0.1-0.2,0.0,
	    0.1,0.1-0.2,0.0,

	  //6
	    0.0,0.2-0.2,0.0,
	    0.1,0.1-0.2,0.0,
	    0.1,0.2-0.2,0.0,

	  //7
	    0.1,0.2-0.2,0.0,
	    0.1,0.1-0.2,0.0,
	    0.2,0.1-0.2,0.0,

	  //8
	    0.1,0.2-0.2,0.0,
	    0.2,0.1-0.2,0.0,
	    0.2,0.2-0.2,0.0,

	  //9
	    0.2,0.2-0.2,0.0,
	    0.2,0.1-0.2,0.0,
	    0.3,0.1-0.2,0.0,

	  //10
	    0.2,0.2-0.2,0.0,
	    0.3,0.1-0.2,0.0,
	    0.3,0.2-0.2,0.0,

	  // fourth row
		// 1 
		-0.2, 0.2-0.3, 0.0,
		-0.2, 0.1-0.3, 0.0,
		-0.1, 0.1-0.3, 0.0,
	  // 2  
		-0.2, 0.2-0.3, 0.0,
		-0.1, 0.1-0.3, 0.0, 
		-0.1, 0.2-0.3, 0.0,
	  // 3
		-0.1, 0.2-0.3, 0.0,
		-0.1, 0.1-0.3, 0.0,
		0.0, 0.1-0.3, 0.0,
	  // 4
	    -0.1, 0.2-0.3, 0.0,
	    0.0, 0.1-0.3, 0.0,
	    0.0, 0.2-0.3, 0.0,
	  
	  //5 
	    0.0,0.2-0.3,0.0,
	    0.0,0.1-0.3,0.0,
	    0.1,0.1-0.3,0.0,

	  //6
	    0.0,0.2-0.3,0.0,
	    0.1,0.1-0.3,0.0,
	    0.1,0.2-0.3,0.0,

	  //7
	    0.1,0.2-0.3,0.0,
	    0.1,0.1-0.3,0.0,
	    0.2,0.1-0.3,0.0,

	  //8
	    0.1,0.2-0.3,0.0,
	    0.2,0.1-0.3,0.0,
	    0.2,0.2-0.3,0.0,

	  //9
	    0.2,0.2-0.3,0.0,
	    0.2,0.1-0.3,0.0,
	    0.3,0.1-0.3,0.0,

	  //10
	    0.2,0.2-0.3,0.0,
	    0.3,0.1-0.3,0.0,
	    0.3,0.2-0.3,0.0,	

	  // fifth row
		// 1 
		-0.2, 0.2-0.4, 0.0,
		-0.2, 0.1-0.4, 0.0,
		-0.1, 0.1-0.4, 0.0,
	  // 2  
		-0.2, 0.2-0.4, 0.0,
		-0.1, 0.1-0.4, 0.0, 
		-0.1, 0.2-0.4, 0.0,
	  // 3
		-0.1, 0.2-0.4, 0.0,
		-0.1, 0.1-0.4, 0.0,
		0.0, 0.1-0.4, 0.0,
	  // 4
	    -0.1, 0.2-0.4, 0.0,
	    0.0, 0.1-0.4, 0.0,
	    0.0, 0.2-0.4, 0.0,
	  
	  //5 
	    0.0,0.2-0.4,0.0,
	    0.0,0.1-0.4,0.0,
	    0.1,0.1-0.4,0.0,

	  //6
	    0.0,0.2-0.4,0.0,
	    0.1,0.1-0.4,0.0,
	    0.1,0.2-0.4,0.0,

	  //7
	    0.1,0.2-0.4,0.0,
	    0.1,0.1-0.4,0.0,
	    0.2,0.1-0.4,0.0,

	  //8
	    0.1,0.2-0.4,0.0,
	    0.2,0.1-0.4,0.0,
	    0.2,0.2-0.4,0.0,

	  //9
	    0.2,0.2-0.4,0.0,
	    0.2,0.1-0.4,0.0,
	    0.3,0.1-0.4,0.0,

	  //10
	    0.2,0.2-0.4,0.0,
	    0.3,0.1-0.4,0.0,
	    0.3,0.2-0.4,0.0,	

	];
	// Load the data into the vertices
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
	vertexPositionBuffer.itemSize = 3;
	vertexPositionBuffer.numberOfItems = 150;
}

/**
 * Generate the RGB color component of the background
 */
function color_generator(){
    // Calculate the time and decide whether to become purple or blue
    // Blue is 19/41/75; Purple is 153/0/255
    var temp = deLay % 100;
    
    // Move the color from blue to purple 
    if(temp < 45){
        background_r = (19+temp*((153-19)/45))/255;
        background_g = (41+temp*((0-41)/45))/255;
        background_b = (75+temp*((255-75)/45))/255;
    }else{
        // Move the color from purple to blue
        // Use dwn to calculate the real process when transferring the color
        var dwn = temp - 45;
        background_r = (153+dwn*((19-153)/45))/255;
        background_g = (0+dwn*((41-0)/45))/255;
        background_b = (255+dwn*((75-255)/45))/255;
    }
}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.identity(mvMatrix);
    mat4.identity(pMatrix);

    vec3.set(scaleVec, scaleFactorX, scaleFactorY, -1);
    vec3.set(translationVec, translateX, translateY, 0);
    mat4.translate(mvMatrix, mvMatrix, translationVec);
    mat4.scale(mvMatrix, mvMatrix, scaleVec);
    mat4.ortho(pMatrix,-1,1,-1,1,1,-1);
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(rotAngle)); 


    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
        vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Draw the I's upper part (For my own animation)
 */
function draw_upper_i(){
  // For my own vertices: Use my own animation
  loadmyVertices();
  // Create the color buffer   
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

  // Create the colors buffer
  var colors2 = [19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0];
  
  // According to the designated coordinate of the each letter's position, push the color
  for(var i = 2; i <= 50; i++){
      if(i >= 13 && i <= 18){
          // The following is pushing the orange color into I's coordinate
          colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
          colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
          colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
          colors2.push(1.0);
          colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
          colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
          colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
          colors2.push(1.0);
          colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
          colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
          colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
          colors2.push(1.0);
      }else{
          // The following is pushing the blue color into unrelated area
          colors2.push(background_r);
          colors2.push(background_g);
          colors2.push(background_b);
          colors2.push(1.0);
          colors2.push(background_r);
          colors2.push(background_g);
          colors2.push(background_b);
          colors2.push(1.0);
          colors2.push(background_r);
          colors2.push(background_g);
          colors2.push(background_b);
          colors2.push(1.0);
      }
  }

  // Update the first three point's RGB value
  for(var i = 0; i < 12; i+=4){
    colors2[i] = background_r;
    colors2[i+1] = background_g;
    colors2[i+2] = background_b;
    colors2[i+3]=1.0;
    }

  // Get the data into the buffer  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.DYNAMIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 150;  
}

/**
 * Draw the I's lower part (For my own animation)
 */
function draw_lower_i(){
    // Load my own vertices
    loadmyVertices();
    // Create the color buffer
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

    // Initialize the color array
    var colors2 = [19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0];
    for(var i = 2; i <= 50; i++){
        // Plugin lower part of the I into the designated area
        if(i >= 33 && i <= 38){
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
        }else{
            // Plugin the first orange part of I into the preordered area
            if(i >= 13 && i <= 18){
                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);
                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);
                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);
            }else{
                // Plugin the blue background into unrelated area
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
            }
        }
    }
    // Update the first part of the color array
    for(var i = 0; i < 12; i+=4){
        colors2[i] = background_r;
        colors2[i+1] = background_g;
        colors2[i+2] = background_b;
        colors2[i+3]=1.0;
    }

    // Get the array into the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.DYNAMIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = 150;  
}


/**
 * Draw the I's middle part (For my own animation)
 */
function draw_middle_i(){
    // Load my own vertices
    loadmyVertices();
    // Get the color buffer   
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

    // Init the color array
    var colors2 = [19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0];
    
    // Plugin the colors
    for(var i = 2; i <= 50; i++){
        if(i >= 25 && i <= 26){
            // Plugin the orange colors into designated area
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);

            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);

            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
        }else{
            // Plugin the pre-determinated value of orange
            if((i >=33 && i <= 38)||(i >= 13 && i <= 18)){
                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);

                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);

                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);
            }else{
                // Plugin the blue value of the unrelated area
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
            }
        }
    }

    // Revise the first triangle
    for(var i = 0; i < 12; i+=4){
        colors2[i] = background_r;
        colors2[i+1] = background_g;
        colors2[i+2] = background_b;
        colors2[i+3]=1.0;
    }
    // Get the data in array to the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.DYNAMIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = 150; 
}


/**
 * Draw the L's left part (For my own animation)
 */
function draw_leftl(){
        // Load my own vertices
        loadmyVertices();
        // Get the buffer 
        vertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
        
        // Init the color array
        var colors2 = [19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0];
        for(var i = 2; i <= 50; i++){
            if(i == 13 || i == 14 || i == 23 || i == 24){
                // Color the pixel of the designated area to illini orange
                colors2.push( (19+Frametime*((232-19)/45))/255 ); //R
                colors2.push( (41+Frametime*((74-41)/45))/255 ); //G
                colors2.push( (75+Frametime*((39-75)/45))/255 ); //B
                colors2.push(1.0);
                colors2.push( (19+Frametime*((232-19)/45))/255 ); //R
                colors2.push( (41+Frametime*((74-41)/45))/255 ); //G
                colors2.push( (75+Frametime*((39-75)/45))/255 ); //B
                colors2.push(1.0);
                colors2.push( (19+Frametime*((232-19)/45))/255 ); //R
                colors2.push( (41+Frametime*((74-41)/45))/255 ); //G
                colors2.push( (75+Frametime*((39-75)/45))/255 ); //B
                colors2.push(1.0);
            }else{
                    // Color the background into illini blue
                    colors2.push(19/255);
                    colors2.push(41/255);
                    colors2.push(75/255);
                    colors2.push(1.0);

                    colors2.push(19/255);
                    colors2.push(41/255);
                    colors2.push(75/255);
                    colors2.push(1.0);

                    colors2.push(19/255);
                    colors2.push(41/255);
                    colors2.push(75/255);
                    colors2.push(1.0);
            }
        }

        // Revise the first triangle of the canvas
        for(var i = 0; i < 12; i+=4){
            colors2[i] = 19/255;
            colors2[i+1] = 41/255;
            colors2[i+2] = 75/255;
            colors2[i+3]=1.0;
        }

        // Get the data in the array into the buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.DYNAMIC_DRAW);
        vertexColorBuffer.itemSize = 4;
        vertexColorBuffer.numItems = 150;
}

/**
 * Draw the I's lower part (For my own animation)
 */
function draw_downl(){
    // Load my vertices
    loadmyVertices();
    
    // Get the color buffer
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

    // Init the color array
    var colors2 = [19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0];
    for(var i = 2; i <= 50; i++){
        if(i >= 33 && i <= 38){
            // Plugin illini orange into the designated area
            colors2.push( (19+Frametime*((232-19)/45))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/45))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/45))/255 ); //B
            colors2.push(1.0);
            // second
            colors2.push( (19+Frametime*((232-19)/45))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/45))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/45))/255 ); //B
            colors2.push(1.0);
            //third
            colors2.push( (19+Frametime*((232-19)/45))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/45))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/45))/255 ); //B
            colors2.push(1.0);
        }else{
            // Plugin the orange value into the pre-drawn area
            if(i == 13 || i == 14 || i == 23 || i == 24){
                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);

                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);

                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);
            }else{
                // Plugin the blue value into the background (unrelated) area
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
            }
        }
    }

    // Revise the value of the first pixel of the array
    for(var i = 0; i < 12; i+=4){
        colors2[i] = background_r;
        colors2[i+1] = background_g;
        colors2[i+2] = background_b;
        colors2[i+3]=1.0;
    }

    // Get the data in the array into the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.DYNAMIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = 150; 
}

/**
 * Draw the N's left part (For my own animation)
 */
function draw_left_n(){
    // Load my vertices
    loadmyVertices();
    
    // Create the color buffer
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    
    // Init the color array
    var colors2 = [19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0];
    
    // Prepare to plugin the array
    for(var i = 2; i <= 50; i++){
        if(i == 13 || i == 14 || i == 23 || i == 24 || i == 33 || i ==34){
            // Draw the left part of N
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
            // second
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
            //third
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
        }else{
            // Draw the background of N
            colors2.push(background_r);
            colors2.push(background_g);
            colors2.push(background_b);
            colors2.push(1.0);
            colors2.push(background_r);
            colors2.push(background_g);
            colors2.push(background_b);
            colors2.push(1.0);
            colors2.push(background_r);
            colors2.push(background_g);
            colors2.push(background_b);
            colors2.push(1.0);
        }
    }

    // Revise the first pixel's color of the backgroud into a more beautiful value
    for(var i = 0; i < 12; i+=4){
        colors2[i] = background_r;
        colors2[i+1] = background_g;
        colors2[i+2] = background_b;
        colors2[i+3]=1.0;
    }

    // Get the data in the array into the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.DYNAMIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = 150; 
}


/**
 * Draw the N's right part (For my own animation)
 */
function draw_right_n(){
    // Load my vertices
    loadmyVertices();
    
    // Get the color buffer
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    
    // Init the color array
    var colors2 = [19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0];

    // Draw the right part of N
    for(var i = 2; i <= 50; i++){
        if(i == 17 || i == 18 || i == 27 || i == 28 || i == 37 || i ==38){
            // Plugin the orange value into the designated area
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
            // second
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
            //third
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
        }else{
            // Set orange of the pre-drawn value
            if(i == 13 || i == 14 || i == 23 || i == 24 || i == 33 || i == 34){
                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);

                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);

                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);
            }else{
                // Set the background color into the array's background area
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
            }
        }
    }

    // Revise the first pixel's data into a more beautiful color
    for(var i = 0; i < 12; i+=4){
        colors2[i] = background_r;
        colors2[i+1] = background_g;
        colors2[i+2] = background_b;
        colors2[i+3]=1.0;
    }

    // Set the data into the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.DYNAMIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = 150; 
}


/**
 * Draw the N's middle part (For my own animation)
 */
function draw_middle_n(){
    // Load my own vertices
    loadmyVertices();
    
    // Create the vertex buffer
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

    // Init the color array
    var colors2 = [19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0,19/255,41/255,75/255,1.0];
    for(var i = 2; i <= 50; i++){
        if(i == 15 || i ==25 || i == 26 || i == 36){
            // Set the orange value of the middle part of the N into the designated area
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
            // second
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
            //third
            colors2.push( (19+Frametime*((232-19)/30))/255 ); //R
            colors2.push( (41+Frametime*((74-41)/30))/255 ); //G
            colors2.push( (75+Frametime*((39-75)/30))/255 ); //B
            colors2.push(1.0);
        }else{
            // Set the pre-determined data into the array
            if(i == 13 || i == 14 || i == 23 || i == 24 || i == 33 || i == 34 || i == 17 || i == 18 || i == 27 || i == 28 || i == 37 || i ==38 ){
                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);

                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);

                colors2.push(232/255);
                colors2.push(74/255);
                colors2.push(39/255);
                colors2.push(1.0);
            }else{
                // Set the blue value of the array
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
                colors2.push(background_r);
                colors2.push(background_g);
                colors2.push(background_b);
                colors2.push(1.0);
            }
        }
    }

    // Revise the data in first triangle in a more beautiful way
    for(var i = 0; i < 12; i+=4){
        colors2[i] = background_r;
        colors2[i+1] = background_g;
        colors2[i+2] = background_b;
        colors2[i+3]=1.0;
    }   

    // Get the data into the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.DYNAMIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = 150; 
}


/**
 * Clean the canvas (For my own animation)
 */
function draw_clear(){

    // Create the buffer
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

    // Init my clear color array
	var colors2 = [19/255,41/255,75/255,1.0];
	for(var i = 1; i <= 150; i++){
		colors2.push(19/255);
		colors2.push(41/255);
		colors2.push(75/255);
		colors2.push(1.0);
    }

    // Get the clear data into the buffer
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors2), gl.STATIC_DRAW);
	vertexColorBuffer.itemSize = 4;
	vertexColorBuffer.numItems = 151;  
}


/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function animate() {
    var timeNow = new Date().getTime();
    if(lastTime != 0){
		var elapsed = timeNow - lastTime;
    // Incrment of the time
    deLay ++;
    // setupBuffers();
    // Call color_generator to update the background color
    color_generator();
        // If it is mp1.2
		if(is_my == 0 && is_mp1 == 1){
            // Act 1: translate X to lower right and minimize it
	    	if(scaleFactorX > 0.1){
				scaleFactorX -= 0.005;
				scaleFactorY -= 0.005;
				translateX -= 0.005;
				translateY -= 0.005;
      		}else{
            // Act 2: Let it dance like a cosine wave when dancing to right
				if(flg == 0 && translateX < 0.9){
                    // When dancing, split I
					spliti();
					translateX += 0.01;
		  			translateY = 0.6 *  Math.cos(translateX * 7);
					scaleFactorX += 0.005;
					scaleFactorY += 0.005;
				}else{
					flg = 1;
                }
            // Act 3: Let it growing bigger or smaller when dancing to left
		  		if(flg == 1 && translateX > -0.9){
					// When dancing, split I  
					spliti();
					translateX -= 0.01;
					translateY = 0.6 * Math.cos(translateX * 7);
					scaleFactorX -= 0.005;
					scaleFactorY -= 0.005;
				}else{
					flg = 0;
		  		}
            }
            // Update the rotate angle  
			rotAngle += 2;
		}
        // Judging whether it is my own animation
		if(is_my == 1 && is_mp1 == 0){

            // Act 1: draw I's upper part, Time: 30 frames
            if(deLay<30){
                if(deLay == 0){
                    Frametime = 0;
                }else{
                    // Update Frametime to gradually change the color
                    Frametime ++;
                }
                draw_upper_i();
            }
            // Act 2: draw I's lower part, Time: 30 frames 
            if(deLay>=30 && deLay<60){
                if(deLay == 30){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_lower_i();
            }
            // Act 3: draw I's middle part, Time: 30 frames
            if(deLay>=60 && deLay < 90){
                if(deLay == 60){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_middle_i();
            }        
            // Act 4: clear the canvas, Time: 10 frames
            if(deLay>=90 && deLay <100){
                if(deLay == 90){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_clear();
            }
            // Act 5: draw left L, Time: 45 frames
            if(deLay >=100 && deLay <145){
                if(deLay == 100){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_leftl();
            }
            // Act 6: draw lower L, Time: 45 frames
            if(deLay >= 145 && deLay < 190){
                if(deLay == 145){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
               draw_downl(); 
            }
            // Act 7: clear the canvas, Time: 10 frames
            if(deLay>=190 && deLay <200){
                if(deLay == 190){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_clear();
            }
            // Act 8: draw the second L's left part, Time: 45 frames
            if(deLay >=200 && deLay <245){
                if(deLay == 200){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_leftl();
            }
            // Act 9: draw the second L's lower part, Time: 45 frames
            if(deLay >= 245 && deLay < 290){
                if(deLay == 245){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
               draw_downl(); 
            }
            // Act 10: clear the canvas, Time: 10 frames
            if(deLay>=290 && deLay <300){
                if(deLay == 290){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_clear();
            }
            // Act 11: draw the second I's upper part, Time: 30 frames
            if(deLay>= 300 && deLay<330){
                if(deLay == 300){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_upper_i();
            }   
            // Act 12: draw the second I's lower part, Time: 30 frames
            if(deLay>=330 && deLay<360){
                if(deLay == 330){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_lower_i();
            }
            // Act 13: draw the second I's middle part, Time: 30 frames
            if(deLay>=360 && deLay < 390){
                if(deLay == 360){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_middle_i();
            }

            // Act 14: clear the canvas, Time: 10 frames
            if(deLay>=390 && deLay <400){
                if(deLay == 390){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_clear();
            }
            // Act 15: draw the N's left part, Time: 30 frames
            if(deLay>= 400 && deLay<430){
                if(deLay == 400){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_left_n();
            }
            // Act 16: draw the N's right part, Time: 30 frames   
            if(deLay>=430 && deLay<460){
                if(deLay == 430){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_right_n();
            }
            // Act 17: draw the N's middle part, Time: 30 frames
            if(deLay>=460 && deLay < 490){
                if(deLay == 460){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_middle_n();
            }
            
            // Act 18: clear the canvas, Time: 30 frames
            if(deLay>=490 && deLay <500){
                if(deLay == 490){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_clear();
            }
            // Act 19: draw the third I's upper part, Time: 30 frames
            if(deLay>= 500 && deLay<530){
                if(deLay == 500){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_upper_i();
            }
            // Act 20: draw the third I's lower part, Time: 30 frames   
            if(deLay>=530 && deLay<560){
                if(deLay == 530){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_lower_i();
            }
            // Act 21: draw the third I's middle part, Time: 30 frames
            if(deLay>=560 && deLay < 590){
                if(deLay == 560){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_middle_i();
            }
            // Act 22: clear the canvas, Time: 10 frames
            if(deLay>=590 && deLay <600){
                if(deLay == 590){
                    Frametime = 0;
                }else{
                    Frametime ++;
                }
                draw_clear();
            }
            // Act 23: finish the scene, reset the time counter, Time: 0 frames
            if(deLay == 600){
                deLay = -1;
            }   
        }	
	}
	lastTime = timeNow;
}

/** 
 * Startup function called from html code to start program.
 */
function startup() {
    canvas = document.getElementById("myGLCanvas");
    gl = createGLContext(canvas);
	setupShaders();
    setupBuffers();
    gl.clearColor(187/255, 156/255, 179/255, 1.0);
    gl.enable(gl.DEPTH_TEST);
    tick();
}

/**
 * Tick called for every animation frame.
 */
function tick() {
	/**
     * Interface of the user-level button to the internal program
     * To get into the mp1.2
     * @param {string=} "animation"
     */
	document.getElementById("animation").onclick = function () { 
        // Set the initial value
		translateX = 0;
		translateY = 0;
        
        scaleFactorX = 1;
		scaleFactorY = 1;
        
        rotAngle = 0;
		is_mp1 = 1;
        is_my = 0;
        
		setupShaders();
    	setupBuffers();
    }
    /**
     * Interface of the user-level button to the internal program
     * To get into the mp1.2
     * @param {string=} "my_animation"
     */
	document.getElementById("my_animation").onclick = function () { 
        // Set the initial value
		translateX = -0.15;
        translateY = 0;
        
		scaleFactorX = 3;
		scaleFactorY = 3;
        
        rotAngle = 0;
		is_mp1 = 0;
		is_my = 1;
        // Set up shaders
        setupShaders();
        deLay = 0;
    	draw_clear();
	}
    requestAnimFrame(tick);
    animate();
    draw();
}
