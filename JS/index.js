import * as THREE from 'https://cdn.skypack.dev/three@0.133';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/controls/TrackballControls.js';
import Stats from 'https://cdn.skypack.dev/three@0.133/examples/jsm/libs/stats.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/postprocessing/EffectComposer.js';
import { SSAOPass } from 'https://cdn.skypack.dev/three@0.133/examples/jsm/postprocessing/SSAOPass.js';
import { gsap } from "https://cdn.skypack.dev/gsap";
import { ScrollTrigger } from "https://cdn.skypack.dev/gsap/ScrollTrigger.js";

gsap.registerPlugin(ScrollTrigger);

//Scene, camera and rendering:
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
//new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
//new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
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
var rndClearColor = false;
var turnOnDisplay = false;
var turnOffDisplay = false;
var changeColors = false;
var displayState = false; //on/off
//DOM
var statsDOM;
var canvas;

var minCameraYPos = 3.5;
var cameraTargetY = 3.5;
var cameraScalar = 1.4;

var color;
var color2 = new THREE.Color("rgb(55, 120, 200)");
var rndColor;

var composer;
var outlinePass;
var effectFXAA;
var minIntensity = 0.1;
var lerpTime = 1;
var hemiLerpColor;
var displayLerpColor;
var white = new THREE.Color("rgb(185, 185, 185)");
var black = new THREE.Color("rgb(0, 4, 7)");
var orionColor = new THREE.Color("rgb(10, 10, 5)");
var orionEmissiveColor = new THREE.Color("rgb(30, 30, 230)");
//Animation loop
function animate() {

    requestAnimationFrame(animate);
    if (!enableAnimationLoop) {
        return;
    }
    return;
    beginTime = Date.now();

    //calculateFPS();
    delta = clock.getDelta();

    if (enableCameraMovement) {
        camera.position.lerp(cameraMoveTarget, 0.05 * 1 + delta);
    }

    torusKnot.rotation.x += 0.01 + 1 * delta;
    torusKnot.rotation.y += 0.01 + 1 * delta;


    calculateCameraRotation();

    lerpHemisphereColor();
    //lerpDisplay();
    lerpTorusKnot();

    stats.update();
    //TWEEN.update();
    cameraTarget = controls.target;
    controls.update();
    controls2.target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
    controls2.update();
    renderer.render(scene, camera);
    //composer.render();

}

function addPoster() {

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
var hoveringKnot = false;
var torusColor = new THREE.Color("rgb(120, 120, 120)");
function lerpTorusKnot() {
    if (hoveringKnot) {
        //holding, change color
        torusKnot.material.color.lerp(white, 0.05 * 1 + delta);
    } else {
        //not holding, reset color
        torusKnot.material.color.lerp(torusColor, 0.05 * 1 + delta);
    }
}

function lerpDisplay() {

    if (displayState) {
        display.material[4].color.lerp(white, 0.05 * 1 + delta);

    } else {

        //display.material.emissive.lerp(black, 0.05 * 1 + delta);
        display.material[4].color.lerp(displayOffColor, 0.05 * 1 + delta);
    }
}

function lerpHemisphereColor() {
    if (hemiLerpColor != null) {
        hemisphereTopColor.lerp(hemiLerpColor, 0.1 * 1 + delta); //rndColor, 0.1 * 1 + delta
        hemiUniforms.topColor.value.lerp(hemiLerpColor, 0.1 * 1 + delta); //rndColor, 0.1 * 1 + delta
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
    loader.load('models/composition3.glb', function (gltf) {

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
                    const map = tmp.map;
                    map.encoding = THREE.sRGBEncoding;
                    child.material = new THREE.MeshLambertMaterial({
                        map: map,
                        //color: new THREE.Color("rgb(100, 125, 5)"),
                        emissive: new THREE.Color("rgb(0, 0, 0)"),
                    })
                    //child.material.color = );
                    //child.material.color.setHSL(0.095, 1, 0.75);
                    child.material.flatShading = false;
                    child.geometry.computeVertexNormals();

                    if (child.material.map) child.material.map.anisotropy = 16;
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



    camera.position.y = 3.5; //3.5
    camera.position.x = 0; //0
    camera.position.z = 1.8;//1,8

    cameraStartPosition.copy(camera.position);
    cameraMoveTarget.copy(camera.position);

    enableCameraMovement = true;

    stats = new Stats();
    statsDOM = document.body.appendChild(stats.dom);
    addEnvironmentals();

    renderer.domElement.addEventListener('click', onClick, false);

    document.getElementById("a").addEventListener('click', onClick, false);

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

    reset();

    composer = new EffectComposer(renderer);

    const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
    ssaoPass.kernelRadius = 32;
    ssaoPass.minDistance = 0.001;
    ssaoPass.maxDistance = 0.3;
    //composer.addPass(ssaoPass);




    const geometry = new THREE.IcosahedronGeometry(0.2);
    const material = new THREE.MeshLambertMaterial({ color: torusColor, emissive: 0x000000 });

    torusKnot = new THREE.Mesh(geometry, material);
    torusKnot.position.x = 1.75;
    torusKnot.position.y = 2.8;
    torusKnot.position.z = 1.31;
    torusKnot.name = "knot";
    interactableMeshes.push(torusKnot);
    scene.add(torusKnot);


    //addOrionsBelt();
}
var torusKnot;

function enableHTML() {

    hideLoader();
}
function hideLoader() {
    gsap.fromTo(".lds-ring", { opacity: 1, }, {
        opacity: 0,
        duration: 1,
        onComplete: fadeInHTML
    });
}
function htmlAnimationSlideUp(object) {
    setDisplayTypeHtmlObject(object, "block");

    //weird formatting fix
    gsap.fromTo("." + object, { y: 300 }, {
        y: 0,
        duration: 1,
    });

}

function setDisplayTypeHtmlObject(object, displayType, id) {
    const search = object.substring(1);
    let currentDisplayType;

    if (!id) {
        currentDisplayType = window.getComputedStyle(getElementByClassName(search)).display;
    } else {
        currentDisplayType = window.getComputedStyle(getElementById(search)).display;
    }
    return gsap.fromTo(object, { display: currentDisplayType }, {
        display: displayType,
    });

}

function getElementByClassName(object) {

    const temp = document.getElementsByClassName(object);
    return temp[0];
}
function getElementById(object) {
    const temp = document.getElementById(object);
    return temp;
}
function htmlAnimationSlideDown(object) {

    //weird formatting fix
    gsap.fromTo("." + object, { y: 0 }, {
        y: 100,
        duration: 5,
        onComplete: setDisplayTypeHtmlObject,
        onCompleteParams: [("." + object), "none"],
    });
}
var slideTimeline;
function htmlAnimationSlideOut() {
    slideTimeline = gsap.timeline().pause();

    slideTimeline.add(gsap.fromTo(".slideLeft", { x: 0 }, {
        x: -300,
        duration: 0.5,
        stagger: {
            each: 0.1,
            from: "edges",
            grid: "auto",
        },
    }));

    slideTimeline.add(setDisplayTypeHtmlObject(".container", "flex"), ">");

    slideTimeline.add(setDisplayTypeHtmlObject(".projectNavigator", "flex"), ">");

    slideTimeline.add(slide("previous", 100), "0.8");

    slideTimeline.add(slide("next", 100), "0.8");

    slideTimeline.add(slide("readingTitle", 100), "3");


    slideTimeline.add(slide("btns_return", 50), ">-=1");


    slideTimeline.add(slide("mainText", "100vh"), "0.5");


}
function slide(object, amount) {
    return gsap.fromTo("." + object, { y: amount }, {
        y: 0,
        duration: 0.8,
        delay: 1,
        ease: "power2.easeInOut",
        onComplete: setDisplayTypeHtmlObject,
        onCompleteParams: [("." + object), "block"],
    });
}
function htmlAnimationSlideIn() {
    if (slideTimeline != null) {
        console.log("REVERSING");
        slideTimeline.reverse(0);

    }
}

//if true -> fadeIn else fadeOut
function setOpacityHtmlObject(object, opacity, duration) {
    gsap.fromTo("." + object, { opacity: window.getComputedStyle(getElementByClassName(object)).opacity }, {
        opacity: opacity,
        duration: duration,
    });
}
function clearProject() {
    while (projectContentDiv.firstChild) {
        projectContentDiv.removeChild(projectContentDiv.lastChild);
    }
}
var projectContentDiv = getElementByClassName("par");
var titleDiv = getElementByClassName("title");

function addTextSegment(string) {
    const text = document.createElement("p");
    text.classList.add("mainText");
    text.innerHTML = string;
    projectContentDiv.appendChild(text);

}
function addTitle(string) {
    const text = document.createElement("h1");
    text.classList.add("readingTitle");
    text.innerHTML = string;
    titleDiv.appendChild(text);

}
function addPicture(src) {
    const img = document.createElement("IMG");
    img.classList.add("container_img");
    img.src = src;
    projectContentDiv.appendChild(img);
}

function openProject() {
    openOverlay();
    addTitle("HEEEELLO WORLD");
    addTextSegment("Hello");
    addPicture("https://images.unsplash.com/photo-1517911041065-4960862d38f0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1952&q=80");
    console.log("PLAYING")
    slideTimeline.play();
}

function openOverlay() {

    htmlAnimationSlideOut();
    setDisplayTypeHtmlObject(".overlay", "block").play();
    setOpacityHtmlObject("overlay", 1, 1);


}
function closeProject() {
    htmlAnimationSlideIn()
    //htmlAnimationSlideDown("previous");
}
//boolean = true = open, else close.
function setProjectStatus(boolean) {
    if (boolean) {

        htmlAnimationSlideUp("previous");


        gsap.fromTo(".container", { display: "none" }, {
            display: "flex",
            delay: 1
        });

        gsap.fromTo("#a", { display: "flex" }, {
            display: "none",
        });
        gsap.fromTo(".projectNavigator", { display: "none" }, {
            display: "flex",
        });
    } else {
        htmlAnimationSlideDown(".previous");
        gsap.fromTo(".container", { display: "flex" }, {

            display: "none",
            duration: 1,
            onComplete: () => {
                gsap.fromTo(".overlay", { display: "block" }, {
                    display: "none",

                    duration: 1,
                    onComplete: () => {
                        gsap.fromTo(".container", {}, {

                        });
                    }
                })
            },

        });
        gsap.fromTo("#a", { display: "none" }, {
            display: "flex",
        });
        gsap.fromTo(".projectNavigator", { display: "flex" }, {
            display: "none",
        });
    }

    //Disable 3D
}


document.getElementById("return").addEventListener("click", function (event) {
    closeProject();

}, false);


/*gsap.fromTo(".scrollTriggerSlideIn", {
    scrollTrigger: {
        trigger: ".projectsContainer"
    },
    
    scrub:true,

});*/

gsap.fromTo(".scrollTriggerSlideIn", { width: 0 }, {
    scrollTrigger: {
        trigger: ".projectsContainer"
    },
    width: 30,
    ease: "power4.easeIn",
    duration: 1,
    scrub: true,

});


function fadeInHTML() {

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
    gsap.fromTo(".Footer", { opacity: 0, }, {
        opacity: 1,
        duration: 1.6,
        stagger: {
            amount: 2
        },
    });
    gsap.set(".Menu", {
        display: "block",
        onComplete: function () {
            console.log("bring in menu");
        }
    });

    gsap.fromTo(".Menu", { opacity: 0, }, {
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
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.appendChild(renderer.domElement);

}

function setupLoadingManager() {

    loadingManager.onProgress = function (item, loaded, total) {
        //console.log(item, loaded, total);
    };

    loadingManager.onLoad = function () {
        console.log("loaded all resources");
        enableHTML();
    };
}

function addMeshes() {
    loadModels();
    addDisplay();

}
var hemisphereTopColor = new THREE.Color("rgb(55, 120, 200)");
var hemiLight;
var hemiUniforms;
function addEnvironmentals() {

    scene.fog = new THREE.Fog(scene.background, 1, 6000);

    hemiLight = new THREE.HemisphereLight(0xfafafa, hemisphereTopColor, 0.1);
    //hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);


    const vertexShader = document.getElementById('vertexShader').textContent;
    const fragmentShader = document.getElementById('fragmentShader').textContent;
    hemiUniforms = {
        'topColor': { value: hemisphereTopColor },
        'bottomColor': { value: new THREE.Color(0xfafafa) },
        'offset': { value: 60 },
        'exponent': { value: 0.6 }
    };

    hemiUniforms['topColor'].value.copy(hemiLight.color);

    scene.fog.color.copy(hemiUniforms['bottomColor'].value);

    const skyGeo = new THREE.SphereGeometry(100, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: hemiUniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    //scene.add(sky);

}

var tube

//Id??: Hade kunna ta in tv?? variabler som ??r Vector3 och s??tta dem som de tv??
//sista punkterna i CatmullRomCurve3 och "endPosition", vilket skulle g??ra detta
//till en funktion som kan anv??ndas f??r att zooma in till fler positioner.
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
    var canvasBounds = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - canvasBounds.left) / (canvasBounds.right - canvasBounds.left)) * 2 - 1;
    mouse.y = - ((event.clientY - canvasBounds.top) / (canvasBounds.bottom - canvasBounds.top)) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(interactableMeshes);

    if (intersects.length > 0) {


        if (intersects[0].object != undefined) {
            //Clicked on any interactable mesh

            if (intersects[0].object.name == "Cube022" || intersects[0].object.name == "knot") {

            }


            if (zoomInEnabled) {
                zoomIn();
            }
        }


    } else {
        console.log("clicked on the sky");
        hemiLerpColor = new THREE.Color(0xffffff);
        hemiLerpColor.setHex(Math.random() * 0xffffff);
    }
}

function onDocumentMouseMove(event) {
    event.preventDefault();

    var canvasBounds = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - canvasBounds.left) / (canvasBounds.right - canvasBounds.left)) * 2 - 1;
    mouse.y = - ((event.clientY - canvasBounds.top) / (canvasBounds.bottom - canvasBounds.top)) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(interactableMeshes);
    if (intersects.length > 0) {
        if (intersects[0].object.name == "knot") {
            hoveringKnot = true;
        } else {
            hoveringKnot = false;
        }
    } else {
        hoveringKnot = false;
    }



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

    radius = minrad + ((window.scrollY) / document.body.offsetHeight) * radScalar;
    cameraTargetY = minCameraYPos + ((window.scrollY) / document.body.offsetHeight) * cameraScalar;
    hemiLight.intensity = minIntensity + ((window.scrollY) / document.body.offsetHeight / 2);

    if (enableCameraRotation) {
        //camera.position.x = 
        cameraMoveTarget.x = radius * Math.sin(theta * Math.PI - Math.PI / 2);
    }
    //camera.position.y = radius * Math.sin(phi * Math.PI / 360);
    cameraMoveTarget.y = cameraTargetY;
    //camera.position.z = 
    if (enableFreeMode) {
        cameraMoveTarget.z = radius * Math.cos(theta * Math.PI - Math.PI / 2);
    } else {
        cameraMoveTarget.z = radius;
    }
    //camera.updateMatrix();
    updateCamera();
}

var radScalar = 10;
var minrad = 1.8;
var enableReset = false;
var tempColor = new THREE.Color("rgb(0, 0, 0)");
var returnButton = document.getElementById("return-to-top");
window.onscroll = function () { scrollFunction() };
function scrollFunction() {

    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        console.log("not at top");

        enableReset = true;
        document.getElementById("scroller").style.opacity = 0;
        returnButton.style.opacity = 0;

    } else {
        document.getElementById("scroller").style.opacity = 1;
        returnButton.style.opacity = 0;

        displayState = false;

        if (enableReset) {

            reset();
            enableReset = false;
        }
    }
    if (document.body.scrollTop > window.innerHeight - window.scrollY || document.documentElement.scrollTop > window.innerHeight - window.scrollY) {
        displayState = true;
        enableFreeMode = true;
        enableCameraRotation = true;
    }
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        //at bottom
        returnButton.style.display = "block";
        returnButton.style.opacity = 1;

    }
}
var display;
var displayOffColor = new THREE.Color("rgb(1, 2, 4)");
var projectElements = [];
function addDisplay() {

    const geometry = new THREE.BoxGeometry(1.28, 0.78, 0.01);

    const textureLoader = new THREE.TextureLoader(loadingManager);
    const displayTexture = textureLoader.load('icons/Display.png');

    displayTexture.anisotropy = 0;
    displayTexture.magFilter = THREE.NearestFilter;
    displayTexture.minFilter = THREE.NearestFilter;

    const material = [new THREE.MeshBasicMaterial({
        color: 'grey'
    }),
    new THREE.MeshBasicMaterial({
        color: 'grey'
    }),
    new THREE.MeshBasicMaterial({
        color: 'grey'
    }),
    new THREE.MeshBasicMaterial({
        color: 'grey'
    }),
    new THREE.MeshBasicMaterial({
        color: displayOffColor,

    }),
    new THREE.MeshBasicMaterial({
        color: 'grey'
    })];

    setFrontFaceDisplay(displayTexture);

    display = new THREE.Mesh(geometry, material);
    display.position.y = 3.17;
    display.position.z = 1.51;

    scene.add(display);


    hookupProjects();
}

var tile;
function setFrontFaceDisplay(texture) {

    const tileGeometry = new THREE.BoxGeometry(1.28, 0.78, 0.01)
    tile = new THREE.Mesh(tileGeometry,
        [
            new THREE.MeshBasicMaterial({ map: texture, alphaTest: 1 }), // +x
            new THREE.MeshBasicMaterial({ map: texture, alphaTest: 1 }), // -x
            new THREE.MeshBasicMaterial({ map: texture, alphaTest: 1 }), // +y
            new THREE.MeshBasicMaterial({ map: texture, alphaTest: 1 }), // -y
            new THREE.MeshBasicMaterial({ map: texture, transparent: true }), // +z
            new THREE.MeshBasicMaterial({ map: texture, alphaTest: 1 })// -z
        ]);

    scene.add(tile);
    tile.position.y = 3.17;
    tile.position.z = 1.51;
}

function hookupProjects() {
    //Hardcoded for now.
    projectElements = document.getElementsByClassName("project");
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const paper = textureLoader.load('icons/paper.png');
    const blank = textureLoader.load('icons/blank.png');
    paper.anisotropy = renderer.capabilities.getMaxAnisotropy();
    //Project 1
    console.log(projectElements[0]);
    projectElements[0].addEventListener("mouseenter", function (event) {

        console.log("Hovering project 1.");
        setFrontFaceDisplay(paper);
    }, false);
    projectElements[0].addEventListener("mouseleave", function (event) {

        console.log("Leaving project 1.");
        scene.remove(tile);
    }, false);
    projectElements[0].addEventListener("click", function (event) {

        openProject();
    }, false);
    //Project 2.
    projectElements[1].addEventListener("mouseenter", function (event) {

        console.log("Hovering project 2.");

    }, false);
    projectElements[1].addEventListener("mouseleave", function (event) {

        console.log("Leaving project 2.");

    }, false);
}

function reset() {
    console.log("Calling reset function...");

    cameraMoveTarget.copy(cameraStartPosition);
    //window.scrollTo({ top: 0, behavior: 'smooth' });
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
    composer.setSize(window.innerWidth, window.innerHeight);
    //composer.setSize(width, height);
    //renderer.render();

    //effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
}

function calculateFPS() {
    var thisFrameTime = (thisLoop = new Date) - lastLoop;
    frameTime += (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;
}
var freezeBool = true;
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
}

function enable3D() {
    enableAnimationLoop = true;
    canvas.style.display = "block";
}
function addTestCube() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);

    //Initial cube position
    cube.position.y = 1;
    cube.position.x = 5;

    scene.add(cube);

}

//Potato switch
var pot;
pot = document.getElementById("pot");
console.log(pot);
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
pot.onclick = function () {
    console.log("clicked");
};

document.body.addEventListener('pointermove', e => { onDocumentMouseMove(e) });
//document.body.style.touchAction = 'none';

init();
animate();

