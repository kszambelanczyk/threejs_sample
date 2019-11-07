import * as THREE from 'three';

// eslint-disable-next-line import/prefer-default-export
export const Settings = {
  // signals
  START_SIGNALS_COUNT: 2,
  START_SIGNALS_DELAY: 300,
  NEW_SIGNALS_ON_ACTIVATION_COUNT: 5,
  MAX_SIGNALS_COUNT: 40,
  SIGNAL_POINT_ACTIVATION_TIME: 300,
  SIGNAL_POINT_ACTIVATION_START_SCALE: 30,
  SIGNAL_POINT_ACTIVATION_END_SCALE: 10,

  // points
  POINTS_COUNT: 1000,
  POINTS_SPREAD: 500,
  POINTS_COLOR: new THREE.Color().setRGB(0.5, 0.5, 0.5),
  POINTS_ACTIVATED_COLOR: new THREE.Color().setRGB(1.0, 1.0, 0.0),
  POINTS_NORMAL_SCALE: 1,
  POINTS_ACTIVATED_SCALE: 10,

  // area for looking points to connect
  NEAR_BORDER: 100,
  FAR_BORDER: 300,

  // camera clipping
  CLIPPING_NEAR: 1,
  CLIPPING_FAR: 10000,

  // links
  LINK_SEGMENT_LENGTH: 3,
  LINK_STEP_TIME: 50,
  LINK_LINE_WIDTH: 2,

  // link's segments
  SEGMENT_STATE_COUNT: 50, // equals to length of visible segments
  SEGMENT_MIN_DISTORTION: 0,
  SEGMENT_MAX_DISTORTION: 3,

  // camera
  ORBIT_CONTROLS: false,
  CAMERA_RADIUS: 200,

  // bloom
  BLOOM_STRENGTH: 1.5,
  BLOOM_RADIOUS: 0.4,
  BLOOM_THRESHOLD: 0.85,

};
