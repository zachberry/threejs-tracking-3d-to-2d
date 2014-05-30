$(function() {
	// Some defaults/hardcoded values:
	var DEFAULT_VIEW_ANGLE = 45;
	var DEFAULT_CAMERA_X = 0;
	var DEFAULT_CAMERA_Y = 0;
	var DEFAULT_CAMERA_Z = 200;
	var PERSPECTIVE_NEAR = 0.1;
	var PERSPECTIVE_FAR = 10000;
	var DEFAULT_ORTHO_LEFT = -128;
	var DEFAULT_ORTHO_RIGHT = 128;
	var DEFAULT_ORTHO_TOP = 128;
	var DEFAULT_ORTHO_BOTTOM = -128;
	var ORTHO_NEAR = -512;
	var ORTHO_FAR = 512;

	var WIDTH = $('#viewport').width();
	var HEIGHT = $('#viewport').height();

	// state
	var rotate = true;
	var activeCamera;

	// three.js objects:
	var renderer;
	var scene;
	var vector;
	var perspectiveCamera;
	var orthoCamera;
	var projector;
	var container;
	var cube;
	var sphere;
	var pointLight;

	// elements
	var $trackingOverlay = $('#tracking-overlay');

	// create three.js elements
	projector = new THREE.Projector();
	renderer = new THREE.WebGLRenderer();
	scene = new THREE.Scene();
	vector = new THREE.Vector3();
	perspectiveCamera = new THREE.PerspectiveCamera(DEFAULT_VIEW_ANGLE, WIDTH / HEIGHT, PERSPECTIVE_NEAR, PERSPECTIVE_FAR);
	perspectiveCamera.position.set(DEFAULT_CAMERA_X, DEFAULT_CAMERA_Y, DEFAULT_CAMERA_Z);
	orthoCamera = new THREE.OrthographicCamera(DEFAULT_ORTHO_LEFT, DEFAULT_ORTHO_RIGHT, DEFAULT_ORTHO_TOP, DEFAULT_ORTHO_BOTTOM, ORTHO_NEAR, ORTHO_FAR);
	pointLight = new THREE.PointLight(0xFFFFFF);
	pointLight.position.set(10, 50, 150);
	container = new THREE.Object3D();
	cube = new THREE.Mesh(
		new THREE.BoxGeometry(50, 50, 50),
		new THREE.MeshLambertMaterial({wireframe: false, color: 0x00CC00})
	);
	cube.position.set(0, 0, 0);
	sphere = new THREE.Mesh(
		new THREE.SphereGeometry(4, 32, 32),
		new THREE.MeshLambertMaterial({wireframe:false, color: 0xCCCC00})
	);
	sphere.position.set(0, 64, 0);
	container.add(cube);
	container.add(sphere);
	scene.add(container);
	scene.add(pointLight);
	scene.add(perspectiveCamera);
	scene.add(orthoCamera);
	setActiveCamera(); // defaults to the perspective camera

	// init controls
	setupControls();
	updateInputValues();
	toggleControls();

	// setup viewport
	viewport = document.getElementById('viewport');
	renderer.setSize(WIDTH, HEIGHT);
	viewport.appendChild(renderer.domElement);

	// start the animation loop
	requestAnimationFrame(update);

	function update()
	{
		if(rotate)
		{
			// hardcoded rotation for this demo:
			container.rotation.z += 0.01;
			container.rotation.x += 0.001;
			container.rotation.y += 0.025;
		}

		renderer.render(scene, activeCamera);
		positionTrackingOverlay();

		requestAnimationFrame(update);
	}

	function positionTrackingOverlay()
	{
		var visibleWidth, visibleHeight, p, v, percX, percY, left, top;

		if(activeCamera === orthoCamera)
		{
			// orthographic:

			visibleWidth = orthoCamera.right - orthoCamera.left;
			visibleHeight = orthoCamera.top - orthoCamera.bottom;

			// this will give us position relative to the world
			p = vector.setFromMatrixPosition(sphere.matrixWorld).clone();

			// determine where in the visible area the sphere is,
			// with percX=0 meaning the left edge and 1 meaning the right
			// and percY=0 meaning top and 1 meaning bottom
			percX = (p.x - orthoCamera.left) / visibleWidth;
			percY = 1 - ((p.y - orthoCamera.bottom) / visibleHeight);
		}
		else
		{
			// perspective:

			// this will give us position relative to the world
			p = vector.setFromMatrixPosition(sphere.matrixWorld).clone();

			// projectVector will translate position to 2d
			v = projector.projectVector(p, perspectiveCamera);

			// translate our vector so that percX=0 represents
			// the left edge, percX=1 is the right edge,
			// percY=0 is the top edge, and percY=1 is the bottom edge.
			percX = (v.x + 1) / 2;
			percY = (-v.y + 1) / 2;
		}

		// scale these values to our viewport size
		left = percX * WIDTH;
		top = percY * HEIGHT;

		// position the overlay so that it's center is on top of
		// the sphere we're tracking
		$trackingOverlay
			.css('left', (left - $trackingOverlay.width() / 2) + 'px')
			.css('top', (top - $trackingOverlay.height() / 2) + 'px');
	}

	// Initialize the jQueryUI elements and their events
	function setupControls()
	{
		$('#view-angle').slider({
			value: DEFAULT_VIEW_ANGLE,
			min: 0,
			max: 360,
			slide: function (event, ui) {
				perspectiveCamera.fov = ui.value;
				perspectiveCamera.updateProjectionMatrix();
				updateInputValues();
			}
		});
		$('#camera-x').slider({
			value: 0,
			min: -200,
			max: 200,
			slide: function (event, ui) {
				perspectiveCamera.position.x =  ui.value;
				updateInputValues();
			}
		});
		$('#camera-y').slider({
			value: 0,
			min: -200,
			max: 200,
			slide: function (event, ui) {
				perspectiveCamera.position.y =  ui.value;
				updateInputValues();
			}
		});
		$('#camera-z').slider({
			value: 200,
			min: 0,
			max: 2000,
			slide: function (event, ui) {
				perspectiveCamera.position.z =  ui.value;
				updateInputValues();
			}
		});
		$('#ortho-left').slider({
			value: -128,
			min: -500,
			max: 500,
			slide: function (event, ui) {
				orthoCamera.left = ui.value;
				orthoCamera.updateProjectionMatrix();
				updateInputValues();
			}
		});
		$('#ortho-right').slider({
			value: 128,
			min: -500,
			max: 500,
			slide: function (event, ui) {
				orthoCamera.right = ui.value;
				orthoCamera.updateProjectionMatrix();
				updateInputValues();
			}
		});
		$('#ortho-top').slider({
			value: 128,
			min: -500,
			max: 500,
			slide: function (event, ui) {
				orthoCamera.top = ui.value;
				orthoCamera.updateProjectionMatrix();
				updateInputValues();
			}
		});
		$('#ortho-bottom').slider({
			value: -128,
			min: -500,
			max: 500,
			slide: function (event, ui) {
				orthoCamera.bottom = ui.value;
				orthoCamera.updateProjectionMatrix();
				updateInputValues();
			}
		});
		$('#rotate').click(function(event) {
			rotate = $(this).attr('checked') == 'checked';
		});
		$('input[type="radio"]').click(function(event) {
			setActiveCamera();
			toggleControls();
		});
	}

	// Write out the three.js values that the sliders control to the
	// input fields
	function updateInputValues()
	{
		$('#view-angle-input').val(perspectiveCamera.fov);
		$('#camera-x-input').val(perspectiveCamera.position.x);
		$('#camera-y-input').val(perspectiveCamera.position.y);
		$('#camera-z-input').val(perspectiveCamera.position.z);
		$('#ortho-left-input').val(orthoCamera.left);
		$('#ortho-right-input').val(orthoCamera.right);
		$('#ortho-top-input').val(orthoCamera.top);
		$('#ortho-bottom-input').val(orthoCamera.bottom);
	}

	// Set the active camera to the selected radio button
	function setActiveCamera()
	{
		if($('input[type="radio"]:checked').attr('id') === 'perspective')
		{
			activeCamera = perspectiveCamera;
		}
		else
		{
			activeCamera = orthoCamera;
		}
	}

	// show either the perspective or orthographic jQueryUI controls
	function toggleControls()
	{
		if(activeCamera === perspectiveCamera)
		{
			$('#perspective-controls').show();
			$('#ortho-controls').hide();
		}
		else
		{
			$('#perspective-controls').hide();
			$('#ortho-controls').show();
		}
	}
});
