/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Eric Shaffer
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");
        
        for(var k = 0; k < 100; k++){
            this.terrainModeling(this.minX,this.minY,this.maxX,this.maxY,0.005);
        }
        this.Normalize_vector(this.fBuffer.length / 3);
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }


/**
 * Terrain Modeling
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
   terrainModeling(minX,minY,maxX,maxY,delta)
   {
        var num_plus = 0.0;
        var num_minus = 0.0;
       //Your code here
       // First, select a random point
       var random_x = Math.random();
       var random_y = Math.random();
       /* Then, confine this into the canvas (Set the limit) */
       random_x *= (this.maxX - this.minX) 
       random_x += this.minX;
       random_y *= (this.maxY - this.minY) ;
       random_y += this.minY;
       // console.log(random_x,random_y);
       // Second, generate a random vector (1 Unit)
       var theta = 2 * Math.random()* Math.PI;

       /* randomnize the vector */
       var random_nx = Math.sin(theta);
       var random_ny = Math.cos(theta);


       // Third, according to the given normal vector, to decide which part should decrease while increase.
       for(var i = 0; i <= this.div; i++){
           for(var j = 0; j <= this.div; j++){
               /* which point */
                var pos = (i + j * (1 + this.div));
                pos *= 3;
                var target_vec1 = this.vBuffer[pos] - random_x;
                var target_vec2 = this.vBuffer[pos+1] - random_y;   
               // console.log(target_vec1);
                // get each vertex x & y value
               // Judge whether this point is located at the "red" side or "green" side
               // dot product
               if( (target_vec1 * random_nx + target_vec2 * random_ny) > 0){
                   /* if it is on the red side, add the height */
                   this.vBuffer[pos+2] += delta ;
               }else{
                   /* if it is on the dark side, deduct the height */
                   this.vBuffer[pos+2] -= delta;
                }
            }
       }
   }
   /**
    * Normalize the vector of the triangle
    * @param {Object}Trsize the size of traingle array
    */
   Normalize_vector(Trsize){

        for(var i = 0; i < Trsize; i++){


            /* create the traingle's three vector */
            var v1 = vec3.create();
            var v2 = vec3.create();
            var v3 = vec3.create();

            v1 = vec3.fromValues(this.vBuffer[this.fBuffer[i*3]*3],this.vBuffer[this.fBuffer[i*3]*3+1],this.vBuffer[this.fBuffer[i*3] * 3 +2]);
            
            v2 = vec3.fromValues(this.vBuffer[this.fBuffer[i*3 + 1]*3],this.vBuffer[this.fBuffer[i*3 + 1]*3+1],this.vBuffer[this.fBuffer[i*3 + 1] * 3 +2]);
            
            v3 = vec3.fromValues(this.vBuffer[this.fBuffer[i*3 + 2]*3],this.vBuffer[this.fBuffer[i*3 + 2]*3+1],this.vBuffer[this.fBuffer[i*3 + 2] * 3 +2]);

            var a = vec3.create();
            var b = vec3.create();
            /* create two vector a,b to compute a X b */
            /* a is the value of a vector in triangle */
            a[0] = v2[0] - v1[0];
            a[1] = v2[1] - v1[1];
            a[2] = v2[2] - v2[2];

            /* b is the value of a vector in triangle */
            b[0] = v3[0] - v1[0];
            b[1] = v3[1] - v1[1];
            b[2] = v3[2] - v1[2];

            /* create a normal vector */
            var Nor = vec3.create();
            Nor[0] = (a[1] * b[2] - a[2] * b[1]);

            /* Tick it into nBuffer */
            this.nBuffer[this.fBuffer[i*3]*3] += Nor[0];
            this.nBuffer[this.fBuffer[i*3 + 1]*3] += Nor[0];
            this.nBuffer[this.fBuffer[i*3 + 2]*3] += Nor[0];

            /* compute the second deminsion of the normal vector */
            Nor[1] = (a[2] * b[0] - a[0] * b[2]);

            /* Tick it into nBuffer */
            this.nBuffer[this.fBuffer[i*3]*3 + 1] += Nor[1];
            this.nBuffer[this.fBuffer[i*3 + 1]*3 + 1] += Nor[1];
            this.nBuffer[this.fBuffer[i*3 + 2]*3 + 1] += Nor[1];

            /* compute the third deminsion of the normal vector */
            Nor[2] = (a[0] * b[1] - a[1] * b[0]);

            /* Tick it into nBuffer */
            this.nBuffer[this.fBuffer[i*3]*3 + 2] += Nor[2];
            this.nBuffer[this.fBuffer[i*3 + 1]*3 + 2] += Nor[2];
            this.nBuffer[this.fBuffer[i*3 + 2]*3 + 2] += Nor[2];
        }
   }



    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        //Your code here
        this.vBuffer[ 3 * (i * (this.div + 1) + j)] = v[0];
        this.vBuffer[ 3 * (i * (this.div + 1) + j) + 1] = v[1];
        this.vBuffer[ 3 * (i * (this.div + 1) + j) + 2] = v[2];
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        //Your code here
        v[0] = this.vBuffer[ 3 * (i * (this.div + 1) + j)];
        v[1] = this.vBuffer[ 3 * (i * (this.div + 1) + j) + 1];
        v[2] = this.vBuffer[ 3 * (i * (this.div + 1) + j) + 2]; 
    }
    
    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }
/**
 * Fill the vertex and buffer arrays 
 */    
generateTriangles()
{
    //Your code here
    var dx = (this.maxX - this.minX) / this.div;
    var dy = (this.maxY - this.minY) / this.div;
    
    // Push vertex buffer
    for(var i = 0; i <= this.div; i ++)
        for(var j = 0; j <= this.div; j ++){
            this.vBuffer.push(this.minX + dx * j);
            this.vBuffer.push(this.minY + dy * i);
            this.vBuffer.push(0);
        }
    // Set Normal Buffer
    for(var i = 0; i <= this.div; i ++)
        for(var j = 0; j <= this.div; j ++){
            this.nBuffer.push(0);
            this.nBuffer.push(0);
            this.nBuffer.push(0);
        }
    for(var i = 0; i < this.div; i ++)
        for(var j = 0; j < this.div; j ++){
            
            // Revised div
            var rdiv = this.div + 1;
            // Revised vindex
            var vindex = i * rdiv + j;
            

            this.fBuffer.push(vindex);
            this.fBuffer.push(vindex + 1);
            this.fBuffer.push(vindex + rdiv);

            this.fBuffer.push(vindex + 1);
            this.fBuffer.push( vindex + 1 + rdiv );
            this.fBuffer.push( vindex + rdiv );

        }
    this.numVertices = this.vBuffer.length/3;
    this.numFaces = this.fBuffer.length/3;
}

/**
 * Print vertices and triangles to console for debugging
 */
printBuffers()
    {
        
    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", this.vBuffer[i*3], " ", 
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");
                       
          }
    
      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ", 
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");
                       
          }
        
    }

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
generateLines()
{
    var numTris=this.fBuffer.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        this.eBuffer.push(this.fBuffer[fid]);
        this.eBuffer.push(this.fBuffer[fid+1]);
        
        this.eBuffer.push(this.fBuffer[fid+1]);
        this.eBuffer.push(this.fBuffer[fid+2]);
        
        this.eBuffer.push(this.fBuffer[fid+2]);
        this.eBuffer.push(this.fBuffer[fid]);
    }
    
}
    
}
