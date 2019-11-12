import * as THREE from 'three';
import { Easing, Tween, autoPlay } from 'es6-tween'
import Stats from '../node_modules/three/examples/jsm/libs/stats.module';

import { EffectComposer } from '../node_modules/three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from '../node_modules/three/examples/jsm/postprocessing/RenderPass';
// import { BloomPass } from '../node_modules/three/examples/jsm/postprocessing/BloomPass';
// import { BokehPass } from '../node_modules/three/examples/jsm/postprocessing/BokehPass';
import { UnrealBloomPass } from '../node_modules/three/examples/jsm/postprocessing/UnrealBloomPass';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls';
// import { LineMaterial } from '../node_modules/three/examples/jsm/lines/LineMaterial';
// import { LineGeometry } from '../node_modules/three/examples/jsm/lines/LineGeometry';
// import { Line2 } from '../node_modules/three/examples/jsm/lines/Line2';

import { Settings } from './settings';
import { links } from './link';
import Signal from './signal';

export default class App {
  constructor(nodeElement) {
    // threejs points
    this.points = null;
    // additional data for points
    this.pointsData = null;

    this.nodeElement = nodeElement;

    this.theta = 0;
  }

  createScene() {
    this.mouseX = 0;
    this.mouseY = 0;

    this.sceneHalfX = this.nodeElement.clientWidth / 2;
    this.sceneHalfY = this.nodeElement.clientHeight / 2;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(Settings.FOG_COLOR, Settings.FOG_DENSITY); // THREE.Fog(0x000000, 200, 600);
    this.scene.background = Settings.SCENE_BACKGROUND_COLOR;
    // this.scene.fog = new THREE.FogExp2(0x000000, 0.01);
    // this.scene.background = new THREE.Color(0x050505);
    this.camera = new THREE.PerspectiveCamera(Settings.CAMERA_FOV_START, // 75
      this.nodeElement.clientWidth / this.nodeElement.clientHeight,
      Settings.CLIPPING_NEAR, Settings.CLIPPING_FAR);

    this.camera.position.z = 400;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.nodeElement.clientWidth, this.nodeElement.clientHeight);
    // this.renderer.setClearColor(Settings.SCENE_BACKGROUND_COLOR);
    this.nodeElement.appendChild(this.renderer.domElement);

    this.stats = new Stats();
    this.nodeElement.appendChild(this.stats.dom);

    if (Settings.ORBIT_CONTROLS) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.update();
    } else {
      this.nodeElement.addEventListener('mousemove', (event) => { this.onBackgroundMouseMove(event); }, false);
    }

    this.generatePoints();

    this.generatePointsData();
    // calculating distances for each point to other connectable points
    this.calculateDistances();

    this.renderScene = new RenderPass(this.scene, this.camera);

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.nodeElement.clientWidth,
      this.nodeElement.clientHeight), Settings.BLOOM_STRENGTH, Settings.BLOOM_RADIOUS, Settings.BLOOM_THRESHOLD);

    // this.bokehPass = new BokehPass(this.scene, this.camera, {
    //   focus: 250,
    //   aperture: 0.00005,
    //   maxblur: 1.0,
    //   width: this.nodeElement.clientWidth,
    //   height: this.nodeElement.clientHeight,
    // });

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderScene);
    this.composer.addPass(this.bloomPass);
    // this.composer.addPass(this.bokehPass);

    // this.startTime = Date.now();

    autoPlay(true);
    // set up tween for camera fov
    this.tween = new Tween({ x: Settings.CAMERA_FOV_START })
      .to({ x: Settings.CAMERA_FOV_END }, Settings.FOV_CHANGE_TIME)
      .easing(Easing.Quadratic.Out)
      .on('update', ({ x }) => {
        this.camera.fov = x;
        this.camera.updateProjectionMatrix();
      })
      .start();


    this.animate();

    this.generateFirstSignals();

    // this.drawLine();
    // this.generateTestLink();
  }

  generatePointsData() {
    this.pointsData = [];
    for (let i = 0; i < Settings.POINTS_COUNT; i += 1) {
      this.pointsData.push({
        neighbours: [],
      });
    }
  }

  calculateDistances() {
    let j = 0;
    const a = this.points.geometry.attributes.position.array;
    for (let i = 0; i < Settings.POINTS_COUNT * 3; i += 3) {
      const v = new THREE.Vector3(a[i], a[i + 1], a[i + 2]);
      // searching for points in distance range
      for (let k = 0; k < Settings.POINTS_COUNT * 3; k += 3) {
        const v2 = new THREE.Vector3(a[k], a[k + 1], a[k + 2]);
        const d = v.distanceTo(v2);
        if (d > Settings.NEAR_BORDER && d < Settings.FAR_BORDER) {
          // pushing to array of point neighbours
          this.pointsData[j].neighbours.push(k / 3);
        }
      }

      j += 1;
    }
    // console.log(this.pointsData);
  }

  generatePoints() {
    // generate random point position
    const positions = new Float32Array(Settings.POINTS_COUNT * 3);
    const scale = new Float32Array(Settings.POINTS_COUNT);
    const colors = new Float32Array(Settings.POINTS_COUNT * 3);

    let j = 0;
    for (let i = 0; i < Settings.POINTS_COUNT * 3; i += 3) {
      positions[i] = THREE.Math.randFloatSpread(Settings.POINTS_SPREAD); // x
      positions[i + 1] = THREE.Math.randFloatSpread(Settings.POINTS_SPREAD); // y
      positions[i + 2] = THREE.Math.randFloatSpread(Settings.POINTS_SPREAD); // z

      scale[j] = Settings.POINTS_NORMAL_SCALE;
      Settings.POINTS_COLOR.toArray(colors, j * 3);
      j += 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scale, 1));
    geometry.setAttribute('ca', new THREE.BufferAttribute(colors, 3));

    const sprite = new THREE.TextureLoader().load('textures/disc2.png');
    sprite.wrapS = THREE.RepeatWrapping;
    sprite.wrapT = THREE.RepeatWrapping;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        pointTexture: { value: sprite },
      },
      vertexShader: document.getElementById('vertexshader').textContent,
      fragmentShader: document.getElementById('fragmentshader').textContent,
      transparent: true,
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  // eslint-disable-next-line class-methods-use-this
  processAllLinks() {
    if (links === undefined || links === null) {
      return;
    }
    // cycle through links
    links.forEach((l) => {
      l.processLink();
    });
  }

  animate() {
    requestAnimationFrame(() => { this.animate(); });

    if (!Settings.ORBIT_CONTROLS) {
      this.theta += 0.05;
      this.camera.position.x = Settings.CAMERA_RADIUS * Math.sin(THREE.Math.degToRad(this.theta));
      this.camera.position.y = Settings.CAMERA_RADIUS * Math.sin(0);
      this.camera.position.z = Settings.CAMERA_RADIUS * Math.cos(THREE.Math.degToRad(this.theta));

      this.camera.position.y += (this.mouseY - this.camera.position.y) * 0.02;
      this.camera.position.z += (-this.mouseX - this.camera.position.z) * 0.02;

      this.camera.lookAt(this.scene.position);
      this.camera.updateMatrixWorld();
    }

    this.processAllLinks();
    Signal.ProcessSignals();

    this.stats.update();

    this.composer.render();
  }

  sceneResize() {
    this.sceneHalfX = this.nodeElement.clientWidth / 2;
    this.sceneHalfY = this.nodeElement.clientHeight / 2;

    const width = this.nodeElement.clientWidth;
    const height = this.nodeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  generateFirstSignals(count) {
    if (count===undefined) {
      count = Settings.START_SIGNALS_COUNT;
    }
    Signal.generateSignal(this.points, this.pointsData, this.scene);
    setTimeout(() => {
      count -= 1;
      if (count > 0) {
        this.generateFirstSignals(count);
      }
    }, Settings.START_SIGNALS_DELAY);
  }

  onBackgroundMouseMove(event) {
    this.mouseX = (event.clientX - this.sceneHalfX);
    this.mouseY = (event.clientY - this.sceneHalfY);
  }
}
