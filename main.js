import { Circle } from "./circle.js";
import {initShaderProgram} from "./shader.js";


main();
async function main() {
	console.log('This is working');
	let gravityStrength = 7;

	const controlPanel = document.getElementById('controlField');
	const gravityStrengthInput = document.getElementById('gravityStrength');
	const changeGravityStrengthButton = document.getElementById('changeGravityStrength');

	changeGravityStrengthButton.addEventListener('click', () => {
		if (!isNaN(parseFloat(gravityStrengthInput.value))) {
			gravityStrength = parseFloat(gravityStrengthInput.value);
			controlPanel.style.display = 'none';
		}
	});

	const numCirclesInput = document.getElementById('numCircles');
	const changenumCirclesButton = document.getElementById('changeNumCircles');

	changenumCirclesButton.addEventListener('click', () => {
		if (!isNaN(parseFloat(numCirclesInput.value))) {
			createCircles(circleList, parseFloat(numCirclesInput.value));
			controlPanel.style.display = 'none';
		}
	});

	const addForceButton = document.getElementById('addForce');

	addForceButton.addEventListener('click', () => {
		addForce(circleList);
		controlPanel.style.display = 'none';
	});

	const addForce = (circleList) => {
		for (let i = 0; i < circleList.length; i++) {
			circleList[i].dx += Math.random()*4+8 * (Math.random() > 0.5 ? 1 : -1);
			circleList[i].dy += Math.random()*4+8 * (Math.random() > 0.5 ? 1 : -1);
		}
	};

	const controlButton = document.createElement('button');
	controlButton.innerText = 'Mess with gravity!';
	controlButton.style.color = 'black';
	controlButton.style.fontSize = '32pt';
	controlButton.style.borderWidth = '5px';
	controlButton.style.borderRadius = '10px';
	controlButton.style.backgroundColor = 'rgba(100, 150, 250, 1)';

	controlButton.style.position = 'absolute';
	controlButton.style.top = '10px';
	controlButton.style.left = '10px';
	document.body.appendChild(controlButton);

	controlButton.addEventListener('click', () => {
		if (controlPanel.style.display === 'none') {
			controlPanel.style.display = 'flex';
		} else {
			controlPanel.style.display = 'none';
		}
	});

	let gravity = [0, 0]
	if (DeviceOrientationEvent && 
		typeof DeviceOrientationEvent.requestPermission === 'function') {
		// iOS 13+

		const button = document.createElement('button');
		button.innerText = 'Please grant device orientation permission to enable gravity!';
		button.style.color = 'black';
		button.style.fontSize = '32pt';
		button.style.borderWidth = '5px';
		button.style.borderRadius = '10px';
		button.style.backgroundColor = 'rgba(200, 100, 100, 0.7)';

		button.style.width = '50%';
		button.style.height = '20%';
		button.style.position = 'absolute';
		button.style.top = '40%';
		button.style.left = '25%';
			
		document.body.appendChild(button);

		button.addEventListener('click', () => {
			DeviceOrientationEvent.requestPermission()
				.then(response => {
					if (response === 'granted') {
						window.addEventListener('deviceorientation', handleOrientation, true);
						button.remove();
					} else {
						alert('Orientation permission denied')
					}
				})
				.catch(console.error);
		});
	} else {
		window.addEventListener('deviceorientation', handleOrientation, true);
	}

	function handleOrientation(event) {
		let x = event.beta;
		let y = event.gamma;

		if (x == null || y == null) {
			gravity[0] = 0;
			gravity[1] = 1;
			return;
		} 
		if (x > 90) {
			x = 90;
		}
		if (x < -90) {
			x = -90;
		}

		gravity[0] = y/90;
		gravity[1] = x/90;
	}

	//
	// Init gl
	// 
	const canvas = document.getElementById('glcanvas');
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;
	const gl = canvas.getContext('webgl');

	if (!gl) {
		alert('Your browser does not support WebGL');
	}

	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//
	// Create shaderProgram
	// 
	const vertexShaderText = await (await fetch("simple.vs")).text();
    const fragmentShaderText = await (await fetch("simple.fs")).text();
	let shaderProgram = initShaderProgram(gl, vertexShaderText, fragmentShaderText);
	gl.useProgram(shaderProgram);


	//
	// Set Uniform uProjectionMatrix
	//	
	const projectionMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	const aspect = canvas.clientWidth / canvas.clientHeight;
	const projectionMatrix = mat4.create();
	const yhigh = 10;
	const ylow = -yhigh;
	const xlow = ylow * aspect;
	const xhigh = yhigh * aspect;
	mat4.ortho(projectionMatrix, xlow, xhigh, ylow, yhigh, -1, 1);
	gl.uniformMatrix4fv(
		projectionMatrixUniformLocation,
		false,
		projectionMatrix
	);

	//
	// Create the objects in the scene:
	//
	const NUM_CIRCLES = 25;
	const circleList = []
	let attempts = 0
	const circlesIntersect = (circle1, circle2) => {
		let centerDistanceSquared = (circle1.x-circle2.x)**2+(circle1.y-circle2.y)**2
		return centerDistanceSquared <= (circle1.size + circle2.size)**2
	}
	const createCircles = (circleList, numCircles) => {
		circleList.length = 0;
		while (circleList.length < numCircles && attempts < 5000) {
			attempts += 1
			let r = new Circle(xlow, xhigh, ylow, yhigh);
			let rIntersects = false;
			for (let i = 0; i < circleList.length; i++) if (circlesIntersect(r, circleList[i])) {
				rIntersects = true;
				console.log("skipping possible circle")
				break;
			}
			if (rIntersects) continue;
			
			circleList.push(r);
			console.log("circle created:", r)
		}
		console.log(circleList.length, "circles created out of desired", numCircles )
	}
	createCircles(circleList, NUM_CIRCLES);

	//
	// Main render loop
	//
	let previousTime = 0;
	function redraw(currentTime) {
		currentTime*= .001; // milliseconds to seconds
		let DT = currentTime - previousTime;
		previousTime = currentTime;
		if(DT > .1){
			DT = .1;
		}
	
		// Clear the canvas before we start drawing on it.
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// Update the scene
		for (let i = 0; i < circleList.length; i++) {
			circleList[i].update1(DT, gravity, gravityStrength);
		}
		for (let j = 0; j < circleList.length; j++) {
			for (let i = 0; i < circleList.length; i++) {
				circleList[i].update2(DT, circleList, i);
				//ball ball
				//ball wall
			}
		}
		for (let i = 0; i < circleList.length; i++) {
			circleList[i].update3(DT);
		}

		//Possibly add one more ball wall loop here

		// Draw the scene
		for (let i = 0; i < circleList.length; i++) {
			circleList[i].draw(gl, shaderProgram);
		}
		
		requestAnimationFrame(redraw);
	  }	
	  requestAnimationFrame(redraw);
};

