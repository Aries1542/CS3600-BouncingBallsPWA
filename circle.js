import { collideParticles } from "./collisions.js";

class Circle{
    constructor(xlow, xhigh, ylow, yhigh){ // make the circles inside these World Coordinates
        this.xlow = xlow;
        this.xhigh = xhigh;
        this.ylow = ylow;
        this.yhigh = yhigh;
        this.color = [Math.random(), Math.random(), Math.random(), 1]
        this.size = 1 - Math.random()*.5; // half edge between 1.0 and 2.0
        const minx = xlow+this.size;
        const maxx = xhigh-this.size;
        this.x = minx + Math.random()*(maxx-minx);
        const miny = ylow+this.size;
        const maxy = yhigh-this.size;
        this.y = miny + Math.random()*(maxy-miny);
        this.degrees = 0;
        this.dx = Math.random()*2+2; // 2 to 4
        if (Math.random()>.5)
            this.dx = -this.dx;
        this.dy = Math.random()*2+2;
        if (Math.random()>.5)
            this.dy = - this.dy;
    }
    update1(DT){
        //gravity
        this.dx += 6 * gravity[0] * DT
        this.dy += 6 * gravity[1] * DT
        //air friction
        this.dy *= .999
        this.dx *= .999
    }
    update2(DT, circleList, me){

        if(this.x+this.dx*DT +this.size > this.xhigh){
            this.dx = -Math.abs(this.dx)*.99;
        }
        if(this.x+this.dx*DT -this.size < this.xlow){
            this.dx = Math.abs(this.dx)*.99;
        }
        if(this.y+this.dy*DT +this.size > this.yhigh){
            this.dy = -Math.abs(this.dy)*.99;
        }
        if(this.y+this.dy*DT -this.size < this.ylow){
            this.dy = Math.abs(this.dy)*.99;
        }

        //ball ball collisions
        for (let j=me+1; j<circleList.length; j++)
            {
                const myR = this.size;
                const myX = this.x;
                const myY = this.y;
                const myDX = this.dx;
                const myDY = this.dy;
                const myNextX = myX + myDX*DT;
                const myNextY = myY + myDY*DT;
    
                const otherR = circleList[j].size;
                const otherX = circleList[j].x;
                const otherY = circleList[j].y;
                const otherDX = circleList[j].dx;
                const otherDY = circleList[j].dy;
                const otherNextX = otherX + otherDX*DT;
                const otherNextY = otherY + otherDY*DT;
    
                let centerDistanceSquared = (otherNextX-myNextX)**2+(otherNextY-myNextY)**2
                if (centerDistanceSquared < (otherR + myR)**2) {
                    collideParticles(this, circleList[j], DT, .99)
                }
            }

            
    }
    update3(DT){
        this.x += this.dx*DT;
        this.y += this.dy*DT;
        
    }
    draw(gl, shaderProgram){
        drawCircle(gl, shaderProgram, this.color, this.degrees, this.x, this.y, this.size);
    }
}

function drawCircle(gl, shaderProgram, color, degrees, x, y, size){
    //
	// Create buffer
	//
	function CreateCircleVertices(sides) {
		const positions = [];
		positions.push(0);
		positions.push(0);
		for (let i = 0; i < sides + 1; i++) {
		  const radians = i / sides * 2 * Math.PI;
		  const x = Math.cos(radians);
		  const y = Math.sin(radians);
		  positions.push(x);
		  positions.push(y);
		}
		return positions;
	}

	const sides = 64;
	const circleVertices = CreateCircleVertices(sides);

	const vertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);

	//
	// Set Vertex Attributes
	//
	const positionAttribLocation = gl.getAttribLocation(shaderProgram, 'vertPosition');
	gl.vertexAttribPointer(
		positionAttribLocation, // Attribute location
		2, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		2 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(positionAttribLocation);

	//
	// Set Uniform uColor
	//
	const colorUniformLocation = gl.getUniformLocation(shaderProgram, "uColor");
	gl.uniform4fv(colorUniformLocation, color);

	//
	// Set Uniform uModelViewMatrix
	//
    const modelViewMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, 0]);
    mat4.scale(modelViewMatrix, modelViewMatrix, [size, size, 1]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, (degrees* Math.PI / 180), [0, 0, 1]);
    gl.uniformMatrix4fv( modelViewMatrixUniformLocation, false, modelViewMatrix);	  	

    //
    // Starts the Shader Program, which draws the current object to the screen.
    //
    gl.drawArrays(gl.TRIANGLE_FAN, 0, sides+2);
}

export { Circle, drawCircle };