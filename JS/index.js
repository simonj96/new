import * as THREE from 'https://cdn.skypack.dev/three@0.133';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/controls/TrackballControls.js';
import { TWEEN } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/libs/tween.module.min.js';
import Stats from 'https://cdn.skypack.dev/three@0.133/examples/jsm/libs/stats.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/loaders/GLTFLoader.js';


//Scene, camera and rendering:
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer;
var loadingManager = new THREE.LoadingManager();

var stats;

//Controls:
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var controls;
var controls2;

//Meshes:
var cube;
var floor;
var monitor;

//Variables:
var clock = new THREE.Clock();
var delta = 0;
var interactableMeshes = [];
var cameraTarget;
var mouseX;
var mouseY;
var theta = 0;
var phi = 0;
var radius = 3;
var beginTime = Date.now();
var filterStrength = 20;
var frameTime = 0, lastLoop = new Date, thisLoop;
var latestFPSarray = [];
var storedFPSCounter = 0;
var currentFPS = 0;
var endPosition = new THREE.Vector3();
var cameraZoomSpeed = 15;
var cameraStartPosition = new THREE.Vector3();

//Booleans
var zoomInEnabled = false;
var enableAnimationLoop = true;
var enableMouseRotation = true;
var zoom = false;
var disableFPSChecker = false;
var enableCameraMovement = false;
//DOM
var statsDOM;
var canvas;

//Animation loop
function animate() {

    requestAnimationFrame(animate);
    if (!enableAnimationLoop) {
        return;
    }
    beginTime = Date.now();

    calculateFPS();
    delta = clock.getDelta();

    radius = minrad + ((window.scrollY) / document.body.offsetHeight) * radScalar;

    calculateCameraRotation();
    if (enableCameraMovement) {
        camera.position.lerp(cameraMoveTarget, 0.05);
    }
    updateCamera();

    stats.update();

    cameraTarget = controls.target;
    controls.update();
    controls2.target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    controls2.update();
    renderer.render(scene, camera);
    TWEEN.update();
}

function evaluatePerformance() {
    var sum = 0;
    for (let index = 0; index < latestFPSarray.length; index++) {
        sum += latestFPSarray[index];
    }
    var avg = sum / latestFPSarray.length;

    if (avg < 25) {
        //Return true, we are lagging
        return true;
    } else {

        return false;
    }
}

function sendPotatoMsg() {
    potdiv.style.right = "0";
    freezeBool = true;
    setTimeout(hidePotatoMsg, 4000);
}

function hidePotatoMsg() {
    potdiv.style.right = "-500%";
    freezeBool = false;
}

function loadModels() {
    const loader = new GLTFLoader(loadingManager);
    loader.load('models/composition.glb', function (gltf) {

        const mesh = gltf.scene;

        const s = 1;
        mesh.scale.set(s, s, s);
        mesh.position.x = 0;
        mesh.position.y = 0;
        mesh.position.z = 4;

        mesh.traverse(function (child) {
            if (child.isMesh) {



                if (child.material.map != null) {

                    var tmp = child.material;
                    child.material = new THREE.MeshLambertMaterial({
                        map: tmp.map,
                        color: new THREE.Color("rgb(100, 125, 5)"),
                    })
                    //child.material.color = );
                    //child.material.color.setHSL(0.095, 1, 0.75);
                    child.material.flatShading = false;
                    child.geometry.computeVertexNormals();

                    if (child.material.map) child.material.map.anisotropy = 8;
                    child.material.needUpdate = true;
                    tmp.dispose();
                }
            }
        });

        //Way to traverse mesh and change stuff


        scene.add(mesh);

    }, undefined, function (error) {

        console.error(error);

    });

}
function init() {

    canvas = document.getElementById('three');

    canvas.width = 32;
    canvas.height = window.innerHeight;

    setRenderSettings();
    setupLoadingManager();
    addMeshes();

    //Camera initial position

    camera.position.y = 3.5;
    camera.position.x = 0;
    camera.position.z = 1.8;

    cameraStartPosition.copy(camera.position);
    cameraMoveTarget.copy(camera.position);

    enableCameraMovement = true;

    stats = new Stats();
    statsDOM = document.body.appendChild(stats.dom);
    addLighting();

    renderer.domElement.addEventListener('click', onClick, false);
    //renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);

    window.addEventListener("resize", () => {
        onWindowResize();
    });

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.minDistance = 0;

    controls.maxAzimuthAngle = Math.PI / 2;
    controls.minAzimuthAngle = -Math.PI / 2;
    controls.minPolarAngle = Math.PI / 5;
    controls.maxPolarAngle = Math.PI / 2;
    controls.rotateSpeed = 0.5;
    //controls.enableRotate = false;
    //Orbitcontrol center

    controls.target.set(0, 2.5, 0);

    controls.mouseButtons = {
        LEFT: '',
        MIDDLE: '',
        RIGHT: ''
    }

    //TrackballControls for smooth scroll zoom.
    controls2 = new TrackballControls(camera, renderer.domElement);
    controls2.noRotate = true;
    controls2.noPan = true;
    controls2.noZoom = true;
    controls2.zoomSpeed = 0.13;
    controls2.dynamicDampingFactor = 0.111; // set dampening factor

    cameraTarget = controls.target;
    controls.update();
    controls2.target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    controls2.update();
    console.log(controls2);
    //scene.add(new THREE.AxesHelper(500));

    //setTimeout(hideLoadingScreen, 500);

    reset();
}

function enableHTML() {

    CSSPlugin.defaultTransformPerspective = 800;

    //Should happen when all is loaded, use loadmanager !
    fadeInBoxes();
}
function fadeInBoxes() {


    gsap.fromTo(".fadeAndSlide", { x: 300 }, {
        x: 0,
        duration: 1,
        stagger: {
            amount: 2
        },
        onComplete: allowScrolling
    });
    gsap.fromTo(".fadeAndSlide", { opacity: 0, }, {
        opacity: 1,
        duration: 1.6,
        stagger: {
            amount: 2
        },


    });

}

function allowScrolling() {
    document.body.style = "overflow: scroll";
}

function setRenderSettings() {
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas })
    //renderer.shadowMap.enabled = true;
    //renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color("rgb(55, 120, 200)"));

    renderer.toneMapping = THREE.ReinhardToneMapping;
    //renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = Math.pow(1.5, 4.0);
    document.body.appendChild(renderer.domElement);

}

function setupLoadingManager() {

    loadingManager.onProgress = function (item, loaded, total) {
        console.log(item, loaded, total);
    };

    loadingManager.onLoad = function () {
        console.log("loaded all resources");
        enableHTML();
    };
}

function addMeshes() {
    loadModels();
}

function addLighting() {
    scene.add(new THREE.AmbientLight("white", 3));
}

var tube

//Idé: Hade kunna ta in två variabler som är Vector3 och sätta dem som de två
//sista punkterna i CatmullRomCurve3 och "endPosition", vilket skulle göra detta
//till en funktion som kan användas för att zooma in till fler positioner.
function zoomIn() {

    //Create CatmullRomCurve3 from camera to CUBE
    const curve = new THREE.CatmullRomCurve3([
        camera.position,
        new THREE.Vector3(cube.position.x, cube.position.y + 1, cube.position.z + 2),
        cube.position,

    ]);

    //points = curve.getPoints(50);
    const geometry = new THREE.TubeBufferGeometry(curve, 20, 1, 6, false);

    const material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff, side: THREE.DoubleSide });

    // Create the final object to add to the scene
    tube = new THREE.Mesh(geometry, material);

    //dont need to add
    scene.add(tube);
    endPosition = new THREE.Vector3(cube.position.x, cube.position.y, cube.position.z + 2);
    zoom = true;
}

function updateCamera() {

    if (!zoom) {
        return;
    }

    const time = cameraZoomSpeed + 1 * delta;
    const looptime = 850;
    const t = (time % looptime) / looptime;
    const t2 = ((time + 0.5) % looptime) / looptime

    const pos = tube.geometry.parameters.path.getPointAt(t);
    const pos2 = tube.geometry.parameters.path.getPointAt(t2);

    camera.position.copy(pos);

    camera.lookAt(pos2);

    if (camera.position.distanceTo(endPosition) <= 0.001) {
        zoom = false;
        console.log("STOPPED");
    }

}

function onClick() {
    if (controls.enabled == false) {
        return;
    }
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(interactableMeshes);

    if (intersects.length > 0) {

        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object != undefined) {
                //Clicked on any interactable mesh
                console.log("CLICKED ON SOMETHING");
                if (zoomInEnabled) {
                    zoomIn();
                }
            }
        }

    }
}

function onDocumentMouseMove(event) {
    event.preventDefault();

    mouseX = (event.clientX - window.innerWidth / 2);
    mouseY = (event.clientY - window.innerHeight / 2);

    if (!enableMouseRotation) {
        return;
    }
    theta = (event.clientX + window.innerWidth / 2) / (window.innerWidth * 2);

    phi = 0;

    calculateCameraRotation();

}
var enableCameraRotation = false;
var cameraMoveTarget = new THREE.Vector3();
var enableFreeMode = false;
function calculateCameraRotation() {

    if (enableCameraRotation) {
        //camera.position.x = 
        cameraMoveTarget.x = radius * Math.sin(theta * Math.PI - Math.PI / 2);
    }
    //camera.position.y = radius * Math.sin(phi * Math.PI / 360);
    cameraMoveTarget.y = camera.position.y;
    //camera.position.z = 
    if (enableFreeMode) {
        cameraMoveTarget.z = radius * Math.cos(theta * Math.PI - Math.PI / 2);
    } else {
        cameraMoveTarget.z = radius;
    }
    //camera.updateMatrix();

}

var radScalar = 10;
var minrad = 1.8;

function scroll(event) {

    return;
    if (event.deltaY < 0) {
        console.log('scrolling up');

        if (radius >= 1.5) {
            radius -= 0.1;
        }
        calculateCameraRotation();
    }
    else if (event.deltaY > 0) {
        console.log('scrolling down');
        if (radius <= 5)
            radius += 0.1;
        calculateCameraRotation();
    }
}

var returnButton = document.getElementById("return-to-top");
window.onscroll = function () { scrollFunction() };
function scrollFunction() {

    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        console.log("not at top");
        enableFreeMode = true;
        enableCameraRotation = true;
        document.getElementById("scroller").style.opacity = 0;
        returnButton.style.opacity = 0;

    } else {
        document.getElementById("scroller").style.opacity = 1;
        returnButton.style.opacity = 0;
        reset();
    }
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        //at bottom
        returnButton.style.display = "block";
        returnButton.style.opacity = 1;

    }
}

function reset() {
    cameraMoveTarget.copy(cameraStartPosition);
    enableFreeMode = false;
    enableCameraRotation = false;
}

document.getElementById("return-to-top").onclick = goToTop;

function goToTop() {
    if (returnButton.style.opacity != 0) {
        console.log("clicked button");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    //composer.setSize(width, height);
    //renderer.render();
}

function calculateFPS() {
    var thisFrameTime = (thisLoop = new Date) - lastLoop;
    frameTime += (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;
}
var freezeBool = false;
setInterval(function () {
    if (disableFPSChecker) {
        return;
    }
    if (frameTime != null && frameTime > 0) {
        currentFPS = 1000 / frameTime;
        latestFPSarray.push(currentFPS);
        if (latestFPSarray.length >= 4) {
            latestFPSarray.shift();
        }
        if (evaluatePerformance() && !freezeBool) {
            sendPotatoMsg();
        }
    }
}, 1000);

function disable3D() {
    enableAnimationLoop = false;
    canvas.style.display = "none";
    disableFPSChecker = true;
    hidePotatoMsg();
}

function enable3D() {
    enableAnimationLoop = true;
    disableFPSChecker = false;
    canvas.style.display = "block";
}

//Potato switch
var pot;
pot = document.getElementById("pot");
pot.addEventListener('change', function () {
    if (this.checked) {
        //Checked
        //Remove 3D, implement Simple View
        disable3D();
    } else {
        //Return 3D environment and resume animation loop.
        enable3D();
    }
});

//Potato div
var potdiv;
potdiv = document.getElementById("potatoDiv");

document.body.addEventListener('mousemove', e => { onDocumentMouseMove(e) });
document.body.addEventListener('wheel', e => { scroll(e) });


init();
animate();

