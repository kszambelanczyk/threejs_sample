import * as THREE from 'three';
import Stats from '../node_modules/three/examples/jsm/libs/stats.module';

import { EffectComposer } from '../node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '../node_modules/three/examples/jsm/postprocessing/ShaderPass.js';

export default class App {
  constructor(nodeElement) {
    // settings
    this.clippingNear = 1;
    this.clippingFar = 10000;

    this.pointsCount = 1000;
    this.points = null;
    this.pointsSpread = 500;


    this.nodeElement = nodeElement;
  }

  createScene() {
    this.scene = new THREE.Scene();
    // this.scene.fog = new THREE.FogExp2(0x000000, 0.01);
    // this.scene.background = new THREE.Color(0x050505);
    this.camera = new THREE.PerspectiveCamera(75,
      this.nodeElement.clientWidth / this.nodeElement.clientHeight,
      this.clippingNear, this.clippingFar);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.nodeElement.clientWidth, this.nodeElement.clientHeight);
    this.nodeElement.appendChild(this.renderer.domElement);

    this.stats = new Stats();
    this.nodeElement.appendChild(this.stats.dom);

    this.placeCamera();
    // this.createTestGeometry();
    this.generatePoints();

    this.animate();
  }

  placeCamera() {
    this.camera.position.z = 400;
  }

  createTestGeometry() {
    // test geometry
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);
  }

  animate() {
    requestAnimationFrame(() => { this.animate(); });

    // this.cube.rotation.x += 0.01;
    // this.cube.rotation.y += 0.01;

    const time = Date.now() * 0.0005;
    this.points.rotation.x = time * 0.25;
    this.points.rotation.y = time * 0.5;

    this.stats.update();

    this.renderer.render(this.scene, this.camera);
  }

  generatePoints() {
    // generate random point position
    const positions = new Float32Array(this.pointsCount * 3);
    const scale = new Float32Array(this.pointsCount);
    const colors = new Float32Array(this.pointsCount * 3);

    let j = 0;
    let color = new THREE.Color();
    // color.setHSL(0.6, 0.75, 0.25);
    color.setRGB(0.9, 0.1, 0.1);
    for (let i = 0; i < this.pointsCount * 3; i += 3) {
      positions[i] = THREE.Math.randFloatSpread(this.pointsSpread); // x
      positions[i + 1] = THREE.Math.randFloatSpread(this.pointsSpread); // y
      positions[i + 2] = THREE.Math.randFloatSpread(this.pointsSpread); // z
      scale[j] = 10;
      color.toArray(colors, j * 3);
      j += 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scale, 1));
    geometry.setAttribute('ca', new THREE.BufferAttribute(colors, 3));

    // geometry.computeBoundingSphere();

    const sprite = new THREE.TextureLoader().load('textures/disc2.png');
    sprite.wrapS = THREE.RepeatWrapping;
    sprite.wrapT = THREE.RepeatWrapping;

    // const material = new THREE.PointsMaterial({
    //   size: 15,
    //   sizeAttenuation: true,
    //   map: sprite,
    //   // color: 0xffffff,
    //   alphaTest: 0.5,
    //   transparent: true,
    // });
    // material.color.setHSL(1.0, 0.3, 0.7);

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

}
