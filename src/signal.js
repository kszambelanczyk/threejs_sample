import * as THREE from 'three';
import remove from 'lodash/remove';
import { Settings } from './settings';
import { Link, links } from './link';

const signals = [];
let activateSignalsCount = 0;

class Signal {
  constructor(startIndex, endIndex, pointsGeometry, pointsData, scene) {
    // this.points = points;
    this.startIndex = startIndex;
    this.endIndex = endIndex;
    this.pointsGeometry = pointsGeometry;
    this.pointsData = pointsData;
    this.scene = scene;

    signals.push(this);
    activateSignalsCount += 1;
    // console.log(`Creating Signal, count: ${signals.length}`);

    this.createLink();
  }

  createLink() {
    const positions = this.pointsGeometry.geometry.attributes.position.array;
    const v1 = new THREE.Vector3(positions[this.startIndex * 3],
      positions[this.startIndex * 3 + 1],
      positions[this.startIndex * 3 + 2]);
    const v2 = new THREE.Vector3(positions[this.endIndex * 3],
      positions[this.endIndex * 3 + 1],
      positions[this.endIndex * 3 + 2]);

    this.link = new Link(v1, v2, this.scene, this);
  }

  linkArrived() {
    activateSignalsCount -= 1;
    // if to many signals exist do not activate point
    // and create new signals
    if (activateSignalsCount > Settings.MAX_SIGNALS_COUNT) {
      return;
    }

    this.pointActivationTime = Date.now();
    this.pointActivated = true;
    this.setPointColor(Settings.POINTS_ACTIVATED_COLOR);
  }

  throwNewSignals() {
    // creating new signals from that point
    for (let i = 0; i < Settings.NEW_SIGNALS_ON_ACTIVATION_COUNT; i += 1) {
      Signal.generateSignal(this.pointsGeometry, this.pointsData, this.scene, this.endIndex);
    }
  }

  linkDestroyed() {
    // removing signal if not pointActivated
    if (!this.pointActivated) {
      this.removeSignalFromList();
    }
  }

  removeSignalFromList() {
    remove(signals, (s) => {
      if (s === this) {
        return true;
      }
      return false;
    });
    // console.log(`Removing Signal, count: ${signals.length}`);
  }

  animateSignalPoint() {
    // animating activated signal's point
    const delta = Date.now() - this.pointActivationTime;
    const step = delta / Settings.SIGNAL_POINT_ACTIVATION_TIME;
    // if step is bigger than 1
    // then finish activation state and throw new signals
    // and remove this signal from list
    if (step > 1) {
      this.pointActivated = false;
      this.setPointScale(Settings.POINTS_NORMAL_SCALE);
      this.setPointColor(Settings.POINTS_COLOR);
      this.throwNewSignals();
      this.removeSignalFromList();
      return;
    }

    const deltaScale = Settings.SIGNAL_POINT_ACTIVATION_START_SCALE - Settings.SIGNAL_POINT_ACTIVATION_END_SCALE;
    const scale = Settings.SIGNAL_POINT_ACTIVATION_END_SCALE + deltaScale - step * deltaScale;
    this.setPointScale(scale);
  }

  setPointScale(scale) {
    const scales = this.pointsGeometry.geometry.attributes.scale.array;

    scales[this.endIndex] = scale;
    this.pointsGeometry.geometry.attributes.scale.needsUpdate = true;
  }

  setPointColor(color) {
    const colors = this.pointsGeometry.geometry.attributes.ca.array;
    colors[this.endIndex * 3] = color.r;
    colors[this.endIndex * 3 + 1] = color.r;
    colors[this.endIndex * 3 + 2] = color.r;
    this.pointsGeometry.geometry.attributes.ca.needsUpdate = true;
  }

  static generateSignal(pointsGeometry, pointsData, scene, startIndex) {
    if (startIndex === undefined || startIndex === null) {
      // random starting point
      // eslint-disable-next-line no-param-reassign
      startIndex = THREE.Math.randInt(0, Settings.POINTS_COUNT - 1);
    }
    const i = THREE.Math.randInt(0, pointsData[startIndex].neighbours.length - 1);
    const endIndex = pointsData[startIndex].neighbours[i];
    return new Signal(startIndex, endIndex, pointsGeometry, pointsData, scene);
  }

  static ProcessSignals() {
    signals.forEach((s) => {
      // if signal activated animate point
      if (s.pointActivated) {
        s.animateSignalPoint();
      }
    });
  }

}

export default Signal;
