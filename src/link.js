import * as THREE from 'three';
import remove from 'lodash/remove';
import { Settings } from './settings';

export const links = [];

export class Link {
  constructor(v1, v2, scene, signal) {
    this.start = v1.clone();
    this.end = v2.clone();
    this.vec = v2.clone().sub(v1);
    this.scene = scene;
    this.signal = signal;

    this.length = this.start.distanceTo(this.end);
    this.points = [];

    this.stateColors = [];

    const v = this.end.clone().sub(this.start).normalize().multiplyScalar(Settings.LINK_SEGMENT_LENGTH);

    this.points.push(this.start);
    let cl = Settings.LINK_SEGMENT_LENGTH;
    let lastPoint = this.start;
    while (cl < this.length) {
      lastPoint = lastPoint.clone().add(v);
      // add distortion
      lastPoint.add(this.calculateRandomPerpendicularV());
      this.points.push(lastPoint);
      cl += Settings.LINK_SEGMENT_LENGTH;
    }
    this.points.push(this.end);

    this.linkSegmentsCount = Math.ceil(this.length / Settings.LINK_SEGMENT_LENGTH);
    this.segments = [];
    const positions = [];
    // create segments and their states
    // every segment is not drawn for now
    for (let i = 0; i < this.linkSegmentsCount; i += 1) {
      const segment = {
        index: i,
        state: 0,
        active: false,
        line: null,
        // length: this.points[i].distanceTo(this.points[i + 1]),
        startV: this.points[i],
        endV: this.points[i + 1],
        v: this.points[i + 1].clone().sub(this.points[i]),
      };
      this.segments.push(segment);
      // pushing positions of vertices for geometry
      positions.push(this.points[i].x, this.points[i].y, this.points[i].z);
    }
    // pushing last point
    positions.push(this.points[this.linkSegmentsCount].x, this.points[this.linkSegmentsCount].y, this.points[this.linkSegmentsCount].z);

    this.drawTime = 0;

    // setting up colors for each state
    const step = 1 / Settings.SEGMENT_STATE_COUNT;
    let c = 1.0;
    for (let i = 0; i < Settings.SEGMENT_STATE_COUNT; i += 1) {
      this.stateColors.push({
        beginColor: c,
        endColor: c - step,
      });
      c -= step;
    }

    const colors = [];
    // setting up colors for buffer attribute
    for (let i = 0; i < (this.linkSegmentsCount + 1); i += 1) {
      const color = new THREE.Color();
      color.setRGB(0.0, 0.0, 0.0);
      colors.push(color.r);
      colors.push(color.g);
      colors.push(color.b);
    }

    this.geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(positions);
    // console.log(vertices);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.LineBasicMaterial({
      // color: 0xffffff,
      linewidth: Settings.LINK_LINE_WIDTH,
      vertexColors: THREE.VertexColors,
    });

    this.line = new THREE.Line(this.geometry, material);
    // do not draw anything for start
    this.geometry.setDrawRange(0, 0);

    this.scene.add(this.line);

    links.push(this);
    console.log(`Links count: ${links.length}`);
  }

  calculateRandomPerpendicularV() {
    const norm = this.vec.clone().normalize();
    // const norm = new THREE.Vector3(1, 0, 0);
    const e = new THREE.Euler(Math.PI / 2, Math.PI / 2, Math.PI / 2);
    const tangent = norm.clone();
    tangent.cross(norm.clone().applyEuler(e));
    const bitangent = norm.clone();
    bitangent.cross(tangent);
    const a = THREE.Math.randFloat(-Math.PI, Math.PI);

    const result = tangent.clone();
    result.multiplyScalar(Math.sin(a));
    result.add(bitangent.clone().multiplyScalar(Math.cos(a))).normalize();
    const len = THREE.Math.randFloat(Settings.SEGMENT_MIN_DISTORTION, Settings.SEGMENT_MAX_DISTORTION);
    return result.multiplyScalar(len);
  }

  processLink() {
    // if nothing to draw then return
    if (this.segments.length === 0) {
      return;
    }

    const t = Date.now();
    // if it is time to draw
    if (t < this.drawTime) {
      return;
    }
    this.drawTime = t + Settings.LINK_STEP_TIME;
    // cycle through segments and change states
    for (let i = 0; i < this.segments.length; i += 1) {
      // if first segment is inactive than activate it and do nothing more
      if (i === 0 && !this.segments[i].active && this.segments[i].state === 0) {
        this.segments[i].active = true;
        break;
      } else {
        // add state to all active segments
        if (this.segments[i].active) {
          this.segments[i].state += 1;
        }
        // deactivate segments with state too large
        if (this.segments[i].state >= Settings.SEGMENT_STATE_COUNT) {
          this.segments[i].active = false;
        }

        // if this segment has state 1 then activate next segment
        if (this.segments[i].state === 1 && (i + 1) < this.segments.length) {
          this.segments[i + 1].active = true;
          // do not process further
          break;
        }
      }
    }
    // filter out segments which cycled through all states
    this.segments = this.segments.filter((e) => e.state < Settings.SEGMENT_STATE_COUNT);

    // if segments are zero count then destroy link
    if (this.segments.length === 0) {
      this.destoryLink();
      return;
    }

    // if last segment has been activated and has state 1 then
    // point becomes activated
    if (this.segments[this.segments.length - 1].active && this.segments[this.segments.length - 1].state === 1) {
      // sending information to signal object
      this.signal.linkArrived();
    }


    // finding begining and ending index of verticles
    let beginV = -1;
    let endV = 0;
    this.segments.forEach((s) => {
      // console.log(`segment: ${s.index}, state: ${s.state}`);
      if (!s.active) { return; }
      if (beginV === -1) {
        beginV = s.index;
      }
      endV = s.index + 1;
    });
    // console.log(`begin: ${beginV}, count: ${endV - beginV + 1}`);
    // console.log(this.segments);

    // + 1 becouse count is number of vertices, 2 per segment
    this.geometry.setDrawRange(beginV, endV - beginV + 1);

    // setting up colors
    const colors = this.geometry.attributes.color.array;

    this.segments.forEach((s) => {
      if (!s.active) {
        return;
      }
      const c = this.stateColors[s.state];
      colors[s.index * 3] = c.endColor;
      colors[(s.index * 3) + 1] = c.endColor;
      colors[(s.index * 3) + 2] = c.endColor;

      colors[(s.index * 3) + 3] = c.beginColor;
      colors[(s.index * 3) + 4] = c.beginColor;
      colors[(s.index * 3) + 5] = c.beginColor;
    });

    // console.log(colors);

    this.geometry.attributes.color.needsUpdate = true;
  }

  destoryLink() {
    // clearing link data
    this.segments = [];
    this.scene.remove(this.line);
    // inform signal about link destroy
    this.signal.linkDestroyed();

    remove(links, (l) => {
      if (l === this) {
        return true;
      }
      return false;
    });
  }

  // // all link for app
  // static links() {
  //   debugger;
  //   if (links === undefined) {
  //     this.links = [];
  //   }
  //   return this.links;
  // }
}
