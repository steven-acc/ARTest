var scene, camera, renderer, clock, deltaTime, totalTime;

var arToolkitSource, arToolkitContext;

var markerRoots = [];

var labelA, labelB, labelC, labelD;

var muscleBSize, muscleBPos;
var muscleA1Size, muscleA1Pos;
var muscleA2Size, muscleA2Pos;

var muscleCSize, muscleCPos;
var muscleDSize, muscleDPos, muscleDLength;

var btnChange, btnRevert;

var gui

var angle1, angle2;

initialize();
animate();

// Ref: https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html
function dumpObject(obj, lines = [], isLast = true, prefix = '') {
	const localPrefix = isLast ? '└─' : '├─';
	lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
	const newPrefix = prefix + (isLast ? '  ' : '│ ');
	const lastNdx = obj.children.length - 1;
	obj.children.forEach((child, ndx) => {
		const isLast = ndx === lastNdx;
		dumpObject(child, lines, isLast, newPrefix);
	});
	return lines;
}

function initialize()
{
	scene = new THREE.Scene();

	let ambientLight = new THREE.AmbientLight( 0xcccccc, 1.2 );
	scene.add( ambientLight );

	let light = new THREE.DirectionalLight(0xcccccc, 0.5);
	light.position.set(0.5, 0, 0.866);
	scene.add(light);

	light = new THREE.HemisphereLight();
	light.position.set(0, 200, 0);
	scene.add(light);
				
	camera = new THREE.Camera();
	camera.position.multiplyScalar(2); 

	scene.add(camera);

	renderer = new THREE.WebGLRenderer({
		antialias : true,
		alpha: true
	});
	
	// renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	// renderer.setSize( 640, 480 );

	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.outputEncoding = THREE.sRGBEncoding;
	// renderer.physicallyCorrectLights = true;

	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
	document.body.appendChild( renderer.domElement );

	clock = new THREE.Clock();
	deltaTime = 0;
	totalTime = 0;
	
	////////////////////////////////////////////////////////////
	// setup arToolkitSource
	////////////////////////////////////////////////////////////

	arToolkitSource = new THREEx.ArToolkitSource({
		sourceType : 'webcam',
	});

	function onResize()
	{
		arToolkitSource.onResize()	
		arToolkitSource.copySizeTo(renderer.domElement)	
		if ( arToolkitContext.arController !== null )
		{
			arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)	
		}	
	}

	arToolkitSource.init(function onReady(){
		onResize()
	});
	
	// handle resize event
	window.addEventListener('resize', function(){
		onResize()
	});
	
	////////////////////////////////////////////////////////////
	// setup arToolkitContext
	////////////////////////////////////////////////////////////	

	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: 'data/camera_para.dat',
		detectionMode: 'mono'
	});
	
	// copy projection matrix to camera when initialization complete
	arToolkitContext.init( function onCompleted(){
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	});

	////////////////////////////////////////////////////////////
	// setup markerRoots
	////////////////////////////////////////////////////////////

	let patternArray = ["letterA", "letterB", "letterC"];

	patternArray.forEach( (pattern, index) => {
		// build markerControls
		markerRoots[index] = new THREE.Group();
		scene.add(markerRoots[index]);
		let markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoots[index], {
			type: 'pattern', patternUrl: `data/${pattern}.patt`,
		});
	})

	var modelLoader = new THREE.GLTFLoader();
	let modelPaths = [
		'models/glTF/UpperLeg/UpperLeg.gltf',
		'models/glTF/LowerLeg/LowerLeg.gltf',
		'models/glTF/Foot/Foot.gltf',
	];

	

	modelLoader.load( modelPaths[0], function ( gltf ) {
		
		let rootScene = gltf.scene;
		markerRoots[0].add(rootScene);

		rootScene.rotation.x = -Math.PI / 2
		rootScene.position.y = 0.25

		rootScene.rotation.y = 1.2;

		rootScene.scale.set(5.1,5.1,5.1);
		rootScene.position.z = 11.5

		//  Small Size
		// rootScene.scale.set(1,1,1);
		// rootScene.position.z = 2

		let muscleB = rootScene.getObjectByName("muscle_01");
		// muscleB.position.z = 0.124; // Adjust Muscle B position
		
		let muscleA1 = rootScene.getObjectByName("muscle_02");
		let muscleA2 = rootScene.getObjectByName("muscle_03");

		muscleA1.position.z = 0.003; // Adjust Muscle A1 position
		muscleA2.position.z = 0.003; // Adjust Muscle A2 position

		muscleBSize = muscleB.scale.z;
		muscleBLength = muscleB.scale.x;
		
		muscleA1Pos = muscleA1.position.z;
		muscleA2Pos = muscleA2.position.z;

		muscleA1Size = muscleA1.scale.z;
		muscleA1Length = muscleA1.scale.x;

		muscleA2Size = muscleA2.scale.z;
		muscleA2Length = muscleA2.scale.y;

		let labelGeometry = new THREE.PlaneBufferGeometry(2, 0.4);
		let loader = new THREE.TextureLoader();
		let texture = loader.load( 'images/relax_left.png', render );
		let material_labelA = new THREE.MeshBasicMaterial( { map: texture } );
		
		labelA = new THREE.Mesh( labelGeometry, material_labelA );
		labelA.rotation.x = -Math.PI/2;

		labelA.position.x = muscleA1.position.x - 1.5; // more -ve  --> to the left
		labelA.position.y = muscleA1.position.y ;
		labelA.position.z = muscleA1.position.z -1.2;
		markerRoots[0].add( labelA );

		let material_labelB = new THREE.MeshBasicMaterial( { map: loader.load( 'images/contract_right.png', render ) } );
		labelB = new THREE.Mesh( labelGeometry, material_labelB );
		labelB.rotation.x = -Math.PI/2;

		labelB.position.x = muscleB.position.x + 2;
		labelB.position.y = muscleB.position.y - 2;
		labelB.position.z = muscleB.position.z;
		markerRoots[0].add( labelB );

		// gui = new dat.GUI();

        // let folder_root = gui.addFolder("Upper Leg");
		// let folder_muscleA = gui.addFolder("Muscle A");
		// let folder_muscleA1 = gui.addFolder("Muscle 02");
		// let folder_muscleA2 = gui.addFolder("Muscle 03");

		// folder_root.add(rootScene.rotation, "x", -10, 10);
		// folder_root.add(rootScene.rotation, "y", -10, 10);
		// folder_root.add(rootScene.rotation, "z", -10, 10);
		// folder_root.__controllers[0].name("rotation.x")
		// folder_root.__controllers[1].name("rotation.y")
		// folder_root.__controllers[2].name("rotation.z")

		// folder_root.add(rootScene.position, "x", -10, 10);
		// folder_root.add(rootScene.position, "y", -10, 10);
		// folder_root.add(rootScene.position, "z", -10, 10);
		// folder_root.__controllers[3].name("position.x")
		// folder_root.__controllers[4].name("position.y")
		// folder_root.__controllers[5].name("position.z")

        // folder_muscleA.add(muscleA.scale, "x", 0, 0.02);
        // folder_muscleA.add(muscleA.scale, "y", 0.002, 0.005); // Muscle length
        // folder_muscleA.add(muscleA.scale, "z", 0, 0.01); // Mulcle contraction
        // folder_muscleA.__controllers[0].name("scale.x")
        // folder_muscleA.__controllers[1].name("scale.y")
		// folder_muscleA.__controllers[2].name("scale.z")
		// folder_muscleA.add(muscleA.position, "x", -1, 1);
		// folder_muscleA.add(muscleA.position, "y", -5, 5);
		// folder_muscleA.add(muscleA.position, "z", 0, 0.3); // Mulcle position
		// folder_muscleA.__controllers[3].name("position.x")
		// folder_muscleA.__controllers[4].name("position.y")
		// folder_muscleA.__controllers[5].name("position.z")
		
		// folder_muscleA1.add(muscleA1.scale, "x", 0, 0.02);
		
		// folder_muscleA1.add(muscleA1.scale, "y", -0.004, 0.004);
		// folder_muscleA1.add(muscleA1.scale, "z", -0.004, 0.004);
		// folder_muscleA1.__controllers[0].name("scale.x")
		// folder_muscleA1.__controllers[1].name("scale.y")
		// folder_muscleA1.__controllers[2].name("scale.z")
		// folder_muscleA1.add(muscleA1.position, "x", 0.002, 0.005);
		// folder_muscleA1.add(muscleA1.position, "y", 0.002, 0.005);
		// folder_muscleA1.add(muscleA1.position, "z", -0.00256, 0.03);
		// folder_muscleA1.__controllers[3].name("position.x")
		// folder_muscleA1.__controllers[4].name("position.y")
		// folder_muscleA1.__controllers[5].name("position.z")

		// console.log(muscleA1.scale.x)
		// folder_muscleA2.add(muscleA2.scale, "x", -0.004, 0.004);
		// folder_muscleA2.add(muscleA2.scale, "y", -0.004, 0.004);
		// folder_muscleA2.add(muscleA2.scale, "z", 0.002, 0.005);
		// folder_muscleA2.__controllers[0].name("scale.x")
		// folder_muscleA2.__controllers[1].name("scale.y")
		// folder_muscleA2.__controllers[2].name("scale.z")
		// folder_muscleA2.add(muscleA2.position, "x", -1, 1);
		// folder_muscleA2.add(muscleA2.position, "y", -1, 1);
		// folder_muscleA2.add(muscleA2.position, "z", -1, 1);
		// folder_muscleA2.__controllers[3].name("position.x")
		// folder_muscleA2.__controllers[4].name("position.y")
		// folder_muscleA2.__controllers[5].name("position.z")

		// console.log(dumpObject(rootScene).join('\n'));

	}, (xhr) => {

	}, (error) =>{
		console.log(error)
	} );

	modelLoader.load(modelPaths[1], function (gltf) {

		let lowerLeg = gltf.scene;
		markerRoots[1].add(lowerLeg);

		lowerLeg.rotation.x = -Math.PI / 2;
		lowerLeg.position.x += 0.5
		lowerLeg.position.y = 0

		lowerLeg.rotation.y = 1.6;

		lowerLeg.scale.set(5.44,5.44,5.44);
		lowerLeg.position.z = 5.5;

		// Small Size
		// lowerLeg.scale.set(1,1,1);
		// lowerLeg.position.z = 0.9;

		let muscleC = lowerLeg.getObjectByName("muscle_05");
		muscleC.position.z = 0.002; //Avoid overlapping

		let muscleD = lowerLeg.getObjectByName("muscle_04");

		muscleCSize = muscleC.scale.z;
		muscleCLength = muscleC.scale.y;
		muscleCPos = muscleC.position.z;

		muscleDSize = muscleD.scale.z;
		muscleDLength = muscleD.scale.y;
		muscleDPos = muscleD.scale.x;


		let labelGeometry = new THREE.PlaneBufferGeometry(2, 0.4);
		let loader = new THREE.TextureLoader();
		let texture = loader.load( 'images/relax_left.png', render );
		let material_labelC = new THREE.MeshBasicMaterial( { map: texture } );
		isBended = false
		
		labelC = new THREE.Mesh( labelGeometry, material_labelC );
		labelC.rotation.x = -Math.PI/2;

		labelC.position.x = muscleC.position.x - 2; //-ve --> to the left
		labelC.position.y = muscleC.position.y; // z
		labelC.position.z = muscleC.position.z + 1.2;
		markerRoots[1].add( labelC );

		let material_labelD = new THREE.MeshBasicMaterial( { map: loader.load( 'images/contract_right.png', render ) } );
		labelD = new THREE.Mesh( labelGeometry, material_labelD );
		labelD.rotation.x = -Math.PI/2;

		labelD.position.x = muscleD.position.x + 2.2;
		labelD.position.y = muscleD.position.y; // z
		labelD.position.z = muscleD.position.z;
		markerRoots[1].add( labelD );

		// gui = new dat.GUI();

		// let folder_root = gui.addFolder("Lower Leg");
		// let folder_muscleC = gui.addFolder("Muscle C");
		// let folder_muscleD = gui.addFolder("Muscle D");

		// folder_root.add(lowerLeg.position, "x", -1, 2);
		// folder_root.add(lowerLeg.position, "y", -10, 10);
		// folder_root.add(lowerLeg.position, "z", -10, 10);
		// folder_root.__controllers[0].name("position.x")
		// folder_root.__controllers[1].name("position.y")
		// folder_root.__controllers[2].name("position.z")

		// folder_muscleD.add(muscleD.scale, "x", -1, 1);
		// folder_muscleD.add(muscleD.scale, "y", -1, 1);
		// folder_muscleD.add(muscleD.scale, "z", -0.002, 0.005);
		// folder_muscleD.__controllers[0].name("scale.x")
		// folder_muscleD.__controllers[1].name("scale.y")
		// folder_muscleD.__controllers[2].name("scale.z")
		// folder_muscleD.add(muscleD.position, "x", -1, 1);
		// folder_muscleD.add(muscleD.position, "y", -1, 1);
		// folder_muscleD.add(muscleD.position, "z", -1, 1);
		// folder_muscleD.__controllers[3].name("position.x")
		// folder_muscleD.__controllers[4].name("position.y")
		// folder_muscleD.__controllers[5].name("position.z")

		// folder_muscleC.add(muscleC.scale, "x", 0.0027, 0.01);
		// folder_muscleC.add(muscleC.scale, "y", -0.002, 0.005); // Muscle length
		// folder_muscleC.add(muscleC.scale, "z", -0.002, 0.005); // Mulcle contraction
		// folder_muscleC.__controllers[0].name("scale.x")
		// folder_muscleC.__controllers[1].name("scale.y")
		// folder_muscleC.__controllers[2].name("scale.z")
		// folder_muscleC.add(muscleC.position, "x", -1, 1);
		// folder_muscleC.add(muscleC.position, "y", -1, 1);
		// folder_muscleC.add(muscleC.position, "z", -1, 1); // Mulcle position
		// folder_muscleC.__controllers[3].name("position.x")
		// folder_muscleC.__controllers[4].name("position.y")
		// folder_muscleC.__controllers[5].name("position.z")

	}, (xhr) => {

	}, (error) => {
		console.log(error)
	});

	modelLoader.load(modelPaths[2], function (gltf) {

		let foot_scene = gltf.scene;
		markerRoots[2].add(foot_scene);

		foot_scene.rotation.x = -Math.PI / 2;
		foot_scene.rotation.y = 2;

		foot_scene.scale.set(5.95,5.95,5.95);
		foot_scene.position.z = 0.5

		// Small Size
		// foot_scene.scale.set(1, 1, 1)
		// foot_scene.position.z = 0

	}, (xhr) => {

	}, (error) => {
		console.log(error)
	});

}

var isBended = false;

function find_angle(A, B, C) {
	var AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
	var BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
	var AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
	return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB)) * 180 / Math.PI;
}

function update()
{
	// update artoolkit on every frame
	if ( arToolkitSource.ready !== false )
		arToolkitContext.update( arToolkitSource.domElement );
	

	let muscleB, muscleA1, muscleA2, muscleC, muscleD;

	muscleB = markerRoots[0].getObjectByName("muscle_01") || null;
	muscleA1 = markerRoots[0].getObjectByName("muscle_02") || null;
	muscleA2 = markerRoots[0].getObjectByName("muscle_03") || null;

	muscleC = markerRoots[1].getObjectByName("muscle_05") || null;
	muscleD = markerRoots[1].getObjectByName("muscle_04") || null;

	


	/************* initial model metrics *************/ 
	if (muscleB){
		muscleB.scale.z = muscleBSize; // 0.0026999
		// muscleB.position.z = muscleBPos; //0.124
		muscleB.scale.y = muscleBLength;  //0.0026999

	}

	if (muscleA1 && muscleA2){
		
		muscleA1.position.z = muscleA1Pos;
		muscleA1.scale.z = muscleA1Size;
		muscleA1.scale.x = muscleA1Length;

		muscleA2.position.z = muscleA2Pos;
		muscleA2.scale.z = muscleA2Size;
		muscleA2.scale.x = muscleA2Length;

	}

	if (muscleC && muscleD) {
		muscleC.scale.z = muscleCSize;
		muscleC.position.z = muscleCPos;
		muscleC.scale.y = muscleCLength;

		muscleD.scale.z = muscleDSize;
		muscleD.scale.y = muscleDLength;

	}
	/****************************************************/ 

	if( markerRoots[0].visible && markerRoots[1].visible){

		var upperLegVector = new THREE.Vector3();
		var lowerLegVector = new THREE.Vector3();

		let con = document.querySelector("#console");
		let coords = document.querySelector("#coords");

		markerRoots[0].getWorldPosition(upperLegVector);      
		markerRoots[1].getWorldPosition(lowerLegVector);

		angle1 = Math.atan2(lowerLegVector.y - upperLegVector.y, lowerLegVector.x - upperLegVector.x)
		angle1 = angle1 * 180 / Math.PI  ;

		if (angle1 > 0 ){
			angle1 -= 90
		}
		if (angle1 < 0 && angle1 > -90){
			angle1 += 90
		}
		if (angle1 < -90){
			angle1 = Math.abs(angle1) - 90
		}

		

		//Change label
		let imgA = labelA.material.map.image.src.split('/').pop().replace(/\.\w+$/, '')
		let imgB = labelB.material.map.image.src.split('/').pop().replace(/\.\w+$/, '')
		let imgC = labelC.material.map.image.src.split('/').pop().replace(/\.\w+$/, '')
		let imgD = labelD.material.map.image.src.split('/').pop().replace(/\.\w+$/, '')

		
		if (angle1 > 20){
			if (imgA !== 'contract_left'){
				
				labelA.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/contract_left.png', render) });

			}
			if (imgB !== 'relax_right')
				labelB.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/relax_right.png', render) });			
		}else{
			if (imgA !== 'relax_left')
				labelA.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/relax_left.png', render) });
			if (imgB !== 'contract_right')
				labelB.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/contract_right.png', render) });
		}

		let direction = new THREE.Vector3();
		markerRoots[1].getWorldDirection(direction);
		let calAngle = Math.asin(direction.y.toFixed(3)) * 180 / Math.PI + 90
		// con.innerHTML = `${calAngle.toFixed(1)}`

		//Change labels orientation
		if (!markerRoots[2].visible){
			if (calAngle >= 30 ){
			
				if (imgC !== "relax_up" ){
					labelC.rotation.z = Math.PI / 2;
					labelC.position.x = muscleC.position.x - 1.2;
					labelC.position.y = muscleC.position.y;
					labelC.position.z = muscleC.position.z + 1.4;

					labelC.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/relax_up.png', render) });
					// isBended = false
				}

				if (imgD !== "contract_down" ){
					labelD.rotation.z = Math.PI / 2;
					labelD.position.x = muscleD.position.x + 1.5;
					labelD.position.y = muscleD.position.y + -1.2;
					labelD.position.z = muscleD.position.z;
					labelD.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/contract_down.png', render) });


					// isBended = true
				}

				
			}
			else {

				
				
				if (imgC !== "relax_left" ) {
					labelC.position.x = muscleC.position.x - 2; //-ve --> to the left
					labelC.position.y = muscleC.position.y; // z
					labelC.position.z = muscleC.position.z + 1.2;
					labelC.rotation.z = Math.PI * 2;
					labelC.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/relax_left.png', render) });
				}
				
				if (imgD !== "contract_right" ) {
					labelD.position.x = muscleD.position.x + 2.2;
					labelD.position.y = muscleD.position.y; // z
					labelD.position.z = muscleD.position.z;
					labelD.rotation.z = Math.PI * 2;
					labelD.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/contract_right.png', render) });
				}

				
			}
		}
		

		// coords.innerHTML = `Lower Leg x: ${lowerLegVector.x.toFixed(2)}  Upper Leg x:${upperLegVector.x.toFixed(2)}`
		// let angle1 = 0.0;
		// let dx = lowerLegVector.x - upperLegVector.x;

		


		/********************** Muscle A contracts. ************************/

		// It becomes thicker  
		muscleA1.scale.z += 0.00004 * angle1;
		muscleA2.scale.z += 0.00004 * angle1;

		muscleA1.position.z += 0.0009 * angle1;
		muscleA2.position.z += 0.0009 * angle1;

		// It becomes shorter
		muscleA1.scale.x -= 0.00004 * angle1;
		muscleA2.scale.x -= 0.00004 * angle1;

		/*****************************************************************/

		/********************** Muscle B relaxes. **********************/
		
		// It becomes thinner  
		muscleB.scale.z -= 0.00002 * angle1;
		// muscleB.position.z -= 0.0004 * angle1; // Avoid model overlapping
		
		// It becomes longer
		muscleB.scale.y += 0.000004 * angle1;

		/*****************************************************************/

		labelA.position.x = muscleA1.position.x - 1.5 - angle1 * 0.01
	}

	if (markerRoots[1].visible && markerRoots[2].visible) {

		
		var lowerLegVector = new THREE.Vector3();
		var footVector = new THREE.Vector3();

		let con = document.querySelector("#console");
		let coords = document.querySelector("#coords");

		markerRoots[1].getWorldPosition(lowerLegVector);
		markerRoots[2].getWorldPosition(footVector);

		let direction = new THREE.Vector3();
		markerRoots[1].getWorldDirection(direction);
		let calAngle = Math.asin(direction.y.toFixed(3)) * 180 / Math.PI + 90

		let heel = new THREE.Vector3();
		heel = lowerLegVector.clone();
		

		let lowerLegModelLength = 3.6

		heel.x += direction.x  * lowerLegModelLength;
		heel.y += direction.y * lowerLegModelLength;

		angle2 = find_angle(lowerLegVector, heel, footVector);

		angle2 -= 90;

		// con.innerHTML = `${angle2.toFixed(1)}`;
		// con.innerHTML = `x:${lowerLegVector.x.toFixed(1)} y:${lowerLegVector.y.toFixed(1)} `;
		// con.innerHTML += `<br/>x:${heel.x.toFixed(1)} y:${heel.y.toFixed(1)} `;
		// con.innerHTML += `<br/>x:${footVector.x.toFixed(1)} y:${footVector.y.toFixed(1)} `;

		if (angle2 >= 0){

			/********************** Muscle C contracts. **********************/

			// It becomes thicker  
			muscleC.scale.z += 0.000018 * angle2;
			muscleC.position.z += 0.0008 * angle2; //Adjust position

			// It becomes shorter
			muscleC.scale.y -= 0.000002 * angle2;

			/*****************************************************************/

			/********************** Muscle D relaxes. ************************/

			// It becomes thinner  
			muscleD.scale.z -= 0.000008 * angle2;

			// It becomes longer
			muscleD.scale.y += 0.000005 * angle2;

			/*****************************************************************/

			// Change Labels
			let imgC = labelC.material.map.image.src.split('/').pop().replace(/\.\w+$/, '')
			let imgD = labelD.material.map.image.src.split('/').pop().replace(/\.\w+$/, '')

			if (angle2 >= 20){
				if (calAngle >=30){
					if (imgC !== 'contract_up'){
						labelC.rotation.z = Math.PI / 2;
						labelC.position.x = muscleC.position.x - 1.2;
						labelC.position.y = muscleC.position.y;
						labelC.position.z = muscleC.position.z + 1.4;
						labelC.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/contract_up.png', render) });
					}
					if (imgD !== 'relax_down'){
						labelD.rotation.z = Math.PI / 2;
						labelD.position.x = muscleD.position.x + 1.5;
						labelD.position.y = muscleD.position.y + -1.2;
						labelD.position.z = muscleD.position.z;
						labelD.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/relax_down.png', render) });
					}
				}
				else{
					if (imgC !== 'contract_left'){
						labelC.position.x = muscleC.position.x - 2; //-ve --> to the left
						labelC.position.y = muscleC.position.y; // z
						labelC.position.z = muscleC.position.z + 1.2;
						labelC.rotation.z = Math.PI * 2;
						labelC.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/contract_left.png', render) });
					}
					if (imgD !== 'relax_right'){
						labelD.position.x = muscleD.position.x + 2.2;
						labelD.position.y = muscleD.position.y; // z
						labelD.position.z = muscleD.position.z;
						labelD.rotation.z = Math.PI * 2;
						labelD.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/relax_right.png', render) });
					}
				}
			}
			else{
				if (calAngle >= 30) {
					if (imgC !== 'relax_up'){
						labelC.rotation.z = Math.PI / 2;
						labelC.position.x = muscleC.position.x - 1.2;
						labelC.position.y = muscleC.position.y;
						labelC.position.z = muscleC.position.z + 1.4;
						
						labelC.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/relax_up.png', render) });
					}
					if (imgD !== 'contract_down'){
						labelD.rotation.z = Math.PI / 2;
						labelD.position.x = muscleD.position.x + 1.5;
						labelD.position.y = muscleD.position.y + -1.2;
						labelD.position.z = muscleD.position.z;
						labelD.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/contract_down.png', render) });
					}
				}
				else{
					if (imgC !== 'relax_left'){
						labelC.position.x = muscleC.position.x - 2; //-ve --> to the left
						labelC.position.y = muscleC.position.y; // z
						labelC.position.z = muscleC.position.z + 1.2;
						labelC.rotation.z = Math.PI * 2;
						labelC.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/relax_left.png', render) });
					}
					if (imgD !== 'contract_right'){
						labelD.position.x = muscleD.position.x + 2.2;
						labelD.position.y = muscleD.position.y; // z
						labelD.position.z = muscleD.position.z;
						labelD.rotation.z = Math.PI * 2;
						labelD.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('images/contract_right.png', render) });
					}

				}
			}
		}
		else{

			/********************** Muscle C relaxes. **********************/

			// It becomes thinner  
			muscleC.scale.z += 0.00004 * angle2;
			muscleC.position.z += 0.0022 * angle2; //Adjust position

			// It becomes longer
			muscleC.scale.y += 0.000004 * angle2;

			/*****************************************************************/

			/********************** Muscle D contracts. ************************/

			// It becomes thicker  
			muscleD.scale.z -= 0.000028 * angle2;

			// It becomes shorter
			muscleD.scale.y += 0.000005 * angle2;

			/*****************************************************************/
		}

		

	}
	
	
}


function render()
{
	renderer.render( scene, camera );
}


function animate()
{
	
	requestAnimationFrame(animate);
	deltaTime = clock.getDelta();
	
	totalTime += deltaTime;

	

	update();
	render();
}