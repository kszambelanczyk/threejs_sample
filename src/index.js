// import _ from 'lodash';
// import * as THREE from 'three';
// import Stats from '../node_modules/three/examples/jsm/libs/stats.module';

import App from './app';

(function start() {
  window.addEventListener('load', () => {
    const space = document.getElementById('threejs-place');

    const buttonStep = document.getElementById('next-step-button');

    const app = new App(space);
    app.createScene();

    buttonStep.addEventListener('click', () => {
      app.testClick();
    });

  });
}());
