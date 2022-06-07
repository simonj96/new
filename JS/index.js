import * as THREE from 'https://cdn.skypack.dev/three@0.133';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/controls/TrackballControls.js';
import { TWEEN } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/libs/tween.module.min.js';
import Stats from 'https://cdn.skypack.dev/three@0.133/examples/jsm/libs/stats.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/postprocessing/BokehPass.js';
import { BokehShader, BokehDepthShader } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/shaders/BokehShader2.js';


//Scene, camera and rendering:
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
var renderer;
var loadingManager = new THREE.LoadingManager();
const postprocessing = { enabled: true };
const shaderSettings = {
    rings: 3,
    samples: 4
};
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
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
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
var mouseX, mouseY;
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

    dofPostRendering();

    updateCamera();

    stats.update();

    cameraTarget = controls.target;
    controls.update();
    controls2.target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    controls2.update();

    //renderer.render(scene, camera);
    //postprocessing.composer.render(0.1);
    TWEEN.update();
}
let distance = 100;
function dofPostRendering() {
    camera.updateMatrixWorld();
    if (effectController.jsDepthCalculation) {

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);

        const targetDistance = (intersects.length > 0) ? intersects[0].distance : 1000;

        distance += (targetDistance - distance) * 0.03;

        const sdistance = smoothstep(camera.near, camera.far, distance);

        const ldistance = linearize(1 - sdistance);

        postprocessing.bokeh_uniforms['focalDepth'].value = ldistance;

        effectController['focalDepth'] = ldistance;

    }

    if (postprocessing.enabled) {

        renderer.clear();

        // render scene into texture

        renderer.setRenderTarget(postprocessing.rtTextureColor);
        renderer.clear();
        renderer.render(scene, camera);

        // render depth into texture

        scene.overrideMaterial = materialDepth;
        renderer.setRenderTarget(postprocessing.rtTextureDepth);
        renderer.clear();
        renderer.render(scene, camera);
        scene.overrideMaterial = null;

        // render bokeh composite

        renderer.setRenderTarget(null);
        renderer.render(postprocessing.scene, postprocessing.camera);


    } else {

        scene.overrideMaterial = null;

        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(scene, camera);

    }
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

function saturate(x) {

    return Math.max(0, Math.min(1, x));

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

                interactableMeshes.push(child);


                if (child.material.map != null) {

                    var tmp = child.material;
                    child.material = new THREE.MeshPhongMaterial({
                        map: tmp.map,
                        color: new THREE.Color("rgb(100, 125, 5)"),
                        emissive: new THREE.Color("rgb(0, 0, 255)"),
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
    document.body.addEventListener('click', onClick, false);
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

    //scene.add(new THREE.AxesHelper(500));

    //setTimeout(hideLoadingScreen, 500);
    initBokeh();
    //initPostprocessing();
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

    ///OBS!
    renderer.autoClear = false;

}
function onPointerMove(event) {

    if (event.isPrimary === false) return;

    mouse.x = (event.clientX - windowHalfX) / windowHalfX;
    mouse.y = - (event.clientY - windowHalfY) / windowHalfY;

    postprocessing.bokeh_uniforms['focusCoords'].value.set(event.clientX / window.innerWidth, 1 - (event.clientY / window.innerHeight));

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
    scene.add(new THREE.AmbientLight("white", 1));
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

let materialDepth, effectController;

function initBokeh() {
    const depthShader = BokehDepthShader;
    materialDepth = new THREE.ShaderMaterial({
        uniforms: depthShader.uniforms,
        vertexShader: depthShader.vertexShader,
        fragmentShader: depthShader.fragmentShader
    });
    materialDepth.uniforms['mNear'].value = camera.near;
    materialDepth.uniforms['mFar'].value = camera.far;

    renderer.domElement.addEventListener('pointermove', onPointerMove);

    effectController = {

        enabled: true,
        jsDepthCalculation: true,
        shaderFocus: false,

        fstop: 2.2,
        maxblur: 1.0,

        showFocus: false,
        focalDepth: 2.8,
        manualdof: false,
        vignetting: false,
        depthblur: false,

        threshold: 0.5,
        gain: 2.0,
        bias: 0.5,
        fringe: 0.7,

        focalLength: 35,
        noise: true,
        pentagon: false,

        dithering: 0.0001

    };


    postprocessing.scene = new THREE.Scene();

    postprocessing.camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 10000, 10000);
    postprocessing.camera.position.z = 0;


    postprocessing.scene.add(postprocessing.camera);

    postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    postprocessing.rtTextureColor = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

    const bokeh_shader = BokehShader;

    postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone(bokeh_shader.uniforms);

    postprocessing.bokeh_uniforms['tColor'].value = postprocessing.rtTextureColor.texture;
    postprocessing.bokeh_uniforms['tDepth'].value = postprocessing.rtTextureDepth.texture;
    postprocessing.bokeh_uniforms['textureWidth'].value = window.innerWidth;
    postprocessing.bokeh_uniforms['textureHeight'].value = window.innerHeight;

    postprocessing.materialBokeh = new THREE.ShaderMaterial({

        uniforms: postprocessing.bokeh_uniforms,
        vertexShader: bokeh_shader.vertexShader,
        fragmentShader: bokeh_shader.fragmentShader,
        defines: {
            RINGS: shaderSettings.rings,
            SAMPLES: shaderSettings.samples
        }

    });

    postprocessing.quad = new THREE.Mesh(new THREE.PlaneGeometry(window.innerWidth, window.innerHeight), postprocessing.materialBokeh);
    postprocessing.quad.position.z = -950;
    postprocessing.scene.add(postprocessing.quad);

}
function smoothstep(near, far, depth) {

    const x = saturate((depth - near) / (far - near));
    return x * x * (3 - 2 * x);

}

function linearize(depth) {

    const zfar = camera.far;
    const znear = camera.near;
    return - zfar * znear / (depth * (zfar - znear) - zfar);

}
function initPostprocessing() {

    const renderPass = new RenderPass(scene, camera);

    const bokehPass = new BokehPass(scene, camera, {
        focus: 500,
        aperture: 0.1,
        maxblur: 0.01,

        width: window.innerWidth,
        height: window.innerHeight
    });

    const composer = new EffectComposer(renderer);
    //composer.addPass(renderPass);
    //composer.addPass(bokehPass);

    postprocessing.composer = composer;
    postprocessing.bokeh = bokehPass;

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


    var canvasBounds = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - canvasBounds.left) / (canvasBounds.right - canvasBounds.left)) * 2 - 1;
    mouse.y = - ((event.clientY - canvasBounds.top) / (canvasBounds.bottom - canvasBounds.top)) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(interactableMeshes);

    if (intersects.length > 0) {

        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object != undefined) {
                //Clicked on any interactable mesh
                console.log("Clicked on: " + intersects[i].object.name);
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
    postprocessing.rtTextureDepth.setSize(window.innerWidth, window.innerHeight);
    postprocessing.rtTextureColor.setSize(window.innerWidth, window.innerHeight);

    postprocessing.bokeh_uniforms['textureWidth'].value = window.innerWidth;
    postprocessing.bokeh_uniforms['textureHeight'].value = window.innerHeight;
    postprocessing.composer.setSize(window.innerWidth, window.innerHeight);
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

