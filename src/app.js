import * as THREE from 'three';
import Stats from '../node_modules/three/examples/jsm/libs/stats.module';

import { EffectComposer } from '../node_modules/three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from '../node_modules/three/examples/jsm/postprocessing/RenderPass';
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
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.005); // THREE.Fog(0x000000, 200, 600);
    // this.scene.fog = new THREE.FogExp2(0x000000, 0.01);
    // this.scene.background = new THREE.Color(0x050505);
    this.camera = new THREE.PerspectiveCamera(75,
      this.nodeElement.clientWidth / this.nodeElement.clientHeight,
      Settings.CLIPPING_NEAR, Settings.CLIPPING_FAR);

    this.camera.position.z = 400;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.nodeElement.clientWidth, this.nodeElement.clientHeight);
    this.nodeElement.appendChild(this.renderer.domElement);

    this.stats = new Stats();
    this.nodeElement.appendChild(this.stats.dom);

    if (Settings.ORBIT_CONTROLS) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.update();
    }

    this.generatePoints();

    this.generatePointsData();
    // calculating distances for each point to other connectable points
    this.calculateDistances();

    this.renderScene = new RenderPass(this.scene, this.camera);

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.nodeElement.clientWidth,
      this.nodeElement.clientHeight), Settings.BLOOM_STRENGTH, Settings.BLOOM_RADIOUS, Settings.BLOOM_THRESHOLD);
    this.bloomPass.threshold = 0;
    this.bloomPass.strength = 1.5;
    this.bloomPass.radius = 0;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderScene);
    this.composer.addPass(this.bloomPass);

    this.animate();

    this.generateFristSignals();
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

    // const color1 = new THREE.Color();
    // const color2 = new THREE.Color();

    // color1.setRGB(0.9, 0.9, 0.9);
    // color2.setRGB(0.0, 0.9, 0.1);
    let j = 0;
    for (let i = 0; i < Settings.POINTS_COUNT * 3; i += 3) {
      positions[i] = THREE.Math.randFloatSpread(Settings.POINTS_SPREAD); // x
      positions[i + 1] = THREE.Math.randFloatSpread(Settings.POINTS_SPREAD); // y
      positions[i + 2] = THREE.Math.randFloatSpread(Settings.POINTS_SPREAD); // z
      // if ((j % 100) === 0) {
      //   scale[j] = 10;
      //   color2.toArray(colors, j * 3);
      // } else {
      // }
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

  // drawLine() {
  //   // for now choosing two points only
  //   const { attributes } = this.points.geometry;

  //   let index = App.getRandomInt(0, Settings.POINTS_COUNT) * 3;
  //   const point1 = [
  //     attributes.position.array[index],
  //     attributes.position.array[index + 1],
  //     attributes.position.array[index + 2],
  //   ];

  //   this.target = point1;
  //   index = App.getRandomInt(0, Settings.POINTS_COUNT) * 3;
  //   const point2 = [
  //     attributes.position.array[index],
  //     attributes.position.array[index + 1],
  //     attributes.position.array[index + 2],
  //   ];

  //   // const positions = [...point1, ...point2];
  //   // console.log(positions);


  //   // // version 1 ------------------------
  //   const color = new THREE.Color();
  //   color.setHSL(1.0, 1.0, 1.0);
  //   let colors = [color.r, color.g, color.b];
  //   color.setHSL(0.01, 0.01, 0.01);
  //   colors = [...colors, color.r, color.g, color.b];

  //   const geometry = new THREE.BufferGeometry();
  //   const vertices = new Float32Array([...point1, ...point2]);
  //   geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  //   geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  //   const material = new THREE.LineBasicMaterial({
  //     color: 0xffffff,
  //     linewidth: 5,
  //     vertexColors: THREE.VertexColors,
  //   });


  //   const line = new THREE.Line(geometry, material);
  //   this.scene.add(line);
  // }

  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  // generateTestLink() {
  //   // for now choosing two points only
  //   const { attributes } = this.points.geometry;

  //   let index = App.getRandomInt(0, Settings.POINTS_COUNT) * 3;
  //   const v1 = new THREE.Vector3(attributes.position.array[index],
  //     attributes.position.array[index + 1],
  //     attributes.position.array[index + 2]);

  //   index = App.getRandomInt(0, Settings.POINTS_COUNT) * 3;
  //   const v2 = new THREE.Vector3(attributes.position.array[index],
  //     attributes.position.array[index + 1],
  //     attributes.position.array[index + 2]);

  //   // eslint-disable-next-line no-new
  //   new Link(v1, v2, this.scene);

  //   this.placeCamera(v1);
  // }

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
      this.camera.position.y = Settings.CAMERA_RADIUS * Math.sin(THREE.Math.degToRad(this.theta));
      this.camera.position.z = Settings.CAMERA_RADIUS * Math.cos(THREE.Math.degToRad(this.theta));
      this.camera.lookAt(this.scene.position);
      this.camera.updateMatrixWorld();
    }

    this.processAllLinks();
    Signal.ProcessSignals();

    this.stats.update();

    this.composer.render();
  }

  testClick() {
    // this.processAllLinks();
    Signal.generateSignal(this.points, this.pointsData, this.scene);
    // this.signals.push(s);
  }

  // placeCamera(v) {
  //   return;
  //   const pos = v.clone();
  //   pos.z -= 200;
  //   this.camera.position.set(pos.x, pos.y, pos.z);

  //   this.controls.target.set(v.x, v.y, v.z);
  //   this.controls.update();
  // }

  sceneResize() {
    const width = this.nodeElement.clientWidth;
    const height = this.nodeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  generateFristSignals() {
    let count = Settings.START_SIGNALS_COUNT;
    setTimeout(Settings.START_SIGNALS_DELAY, () => {
      if (count > 0) {
        Signal.generateSignal(this.points, this.pointsData, this.scene);
      }
      count -= 1;
    });
  }
}
