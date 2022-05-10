import * as THREE from 'https://cdn.skypack.dev/three@0.133';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/controls/TrackballControls.js';
import { TWEEN } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/libs/tween.module.min.js';
import Stats from 'https://cdn.skypack.dev/three@0.133/examples/jsm/libs/stats.module.js';


//Scene, camera and rendering:
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

//Booleans
var zoomInEnabled = false;
var enableAnimationLoop = false;
var enableMouseRotation = true;
var zoom = false;
var disableFPSChecker = false;

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

    cube.rotation.x += 0.01 + 1 * delta;
    cube.rotation.y += 0.01 + 1 * delta;

    updateCamera();

    stats.update();

    cameraTarget = controls.target;
    controls.update();
    controls2.target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    controls2.update();
    renderer.render(scene, camera);
    TWEEN.update();
}
var sentMsg = false;
function evaluatePerformance() {
    var sum = 0;
    for (let index = 0; index < latestFPSarray.length; index++) {
        sum += latestFPSarray[index];
    }
    var avg = sum / latestFPSarray.length;

    if (avg < 150) {
        //Return true, we are lagging
        return true;
    } else {
        return false;
    }
}

function sendPotatoMsg() {
    potdiv.style.right = "0";
}

function hidePotatoMsg() {
    potdiv.style.right = "-500%";
}
function init() {

    canvas = document.getElementById('three');

    canvas.width = 32;
    canvas.height = window.innerHeight;

    setRenderSettings();
    setupLoadingManager();
    addMeshes();

    //Camera initial position
    camera.position.z = 1;
    camera.position.y = 1.3;
    camera.position.x = 0;

    stats = new Stats();
    statsDOM = document.body.appendChild(stats.dom);
    addLighting();

    renderer.domElement.addEventListener('click', onClick, false);
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);

    window.addEventListener("resize", () => {
        onWindowResize();
    });

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.minDistance = 1;
    controls.maxDistance = 5;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.minAzimuthAngle = -Math.PI / 2;
    controls.minPolarAngle = Math.PI / 5;
    controls.maxPolarAngle = Math.PI / 2;
    controls.rotateSpeed = 0.5;
    //controls.enableRotate = false;
    //Orbitcontrol center

    controls.target.set(0, 1, 0);

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
    scene.add(new THREE.AxesHelper(500));

    //setTimeout(hideLoadingScreen, 500);
    doThis();
}

function doThis() {
    console.log("sadsas");
    CSSPlugin.defaultTransformPerspective = 800;
    gsap.to(".intro-box", { duration: 4, rotation: 360, repeat: 2, yoyo: true });
    gsap.fromTo(".intro-box", { opacity: 0 }, { duration: 2, opacity: 1 });
    gsap.fromTo(".intro-box", { scale: 0.7 }, { duration: 2, scale: 1, repeat: 4, yoyo: true });
    //gsap.to(".box", { duration: 2, x: -300, stagger: 1 });
    gsap.fromTo(".box", { opacity: 0 }, { duration: 2, stagger: 1, opacity: 1 });

}

function setRenderSettings() {
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas, alpha: true })
    //renderer.shadowMap.enabled = true;
    //renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.setClearColor(0x000000);

    //renderer.toneMapping = THREE.ReinhardToneMapping;
    //renderer.toneMappingExposure = Math.pow(1.5, 4.0);
    document.body.appendChild(renderer.domElement);

}

function setupLoadingManager() {

    loadingManager.onProgress = function (item, loaded, total) {
        console.log(item, loaded, total);
    };

    loadingManager.onLoad = function () {
        console.log("loaded all resources");

    };
}

function closeIntro() {
    //Disable loading div
    const b = document.getElementById("b");
    b.style.display = "none";

    //Enable main div and start animation loop.
    const a = document.getElementById("a");
    a.style.display = "block";

    enableAnimationLoop = true;

}

function addMeshes() {
    addFloor();
    addTestCube();
}

function addLighting() {
    scene.add(new THREE.AmbientLight("white", 0.3));

    //Basic Sunlight
    const sunLight = new THREE.DirectionalLight(0xfafafafa, 0.1, 100);
    sunLight.position.set(0, 50, 0); //default; light shining from top
    sunLight.castShadow = true; // default false
    scene.add(sunLight)

    //Sunlight shadow settings
    sunLight.shadow.mapSize.width = 72000; // default
    sunLight.shadow.mapSize.height = 72000; // default
    sunLight.shadow.camera.near = 0.1; // default
    sunLight.shadow.camera.far = 100; // default
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    sunLight.shadow.bias = - 0.001;

}

function addFloor() {
    const geometry = new THREE.BoxGeometry(10, 10, 0.01);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    material.color.setHSL(0.095, 1, 0.75);
    floor = new THREE.Mesh(geometry, material);
    floor.receiveShadow = true;

    //Initial floor position
    floor.position.y = -0.01;
    floor.position.x = 0;
    floor.rotation.x = - Math.PI / 2;

    scene.add(floor);
}

function addTestCube() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    cube.receiveShadow = true;
    cube.castShadow = true;
    //Initial cube position
    cube.position.y = 1;

    scene.add(cube);
    interactableMeshes.push(cube);
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

    theta = - mouseX / 7;
    phi = Math.PI / 2;

    camera.position.x = radius * Math.sin(theta * Math.PI / 360)
        * Math.cos(phi * Math.PI / 360);
    //camera.position.y = radius * Math.sin(phi * Math.PI / 360);
    camera.position.z = radius * Math.cos(theta * Math.PI / 360)
        * Math.cos(phi * Math.PI / 360);
    camera.updateMatrix();

}

function updateCameraControlRadius() {
    radius = camera.position.distanceTo(controls.target);
}
function test() {
    console.log("asdfas");
}

function scroll(event) {
    if (event.deltaY < 0) {
        console.log('scrolling up');

    }
    else if (event.deltaY > 0) {
        console.log('scrolling down');

    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    //composer.setSize(width, height);
    //renderer.render();
}

function hideLoadingScreen() {
    document.getElementById("b").style.opacity = 0;
    setTimeout(closeIntro, 500);
}

function calculateFPS() {
    var thisFrameTime = (thisLoop = new Date) - lastLoop;
    frameTime += (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;
}

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
        if (evaluatePerformance()) {
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

