import * as THREE from 'three';

// eslint-disable-next-line import/prefer-default-export
export const Settings = {
  // signals
  START_SIGNALS_COUNT: 5,
  START_SIGNALS_DELAY: 1000,
  NEW_SIGNALS_ON_ACTIVATION_COUNT: 8,
  MAX_SIGNALS_COUNT: 10,
  SIGNAL_POINT_ACTIVATION_TIME: 400, // 500
  SIGNAL_POINT_ACTIVATION_START_SCALE: 6,
  SIGNAL_POINT_ACTIVATION_END_SCALE: 2,

  // points
  POINTS_COUNT: 500,
  POINTS_SPREAD: 250,
  POINTS_COLOR: new THREE.Color(0xf1faff), // 0xe59500), // 'rgb(1, 186, 255)'),
  POINTS_ACTIVATED_COLOR: new THREE.Color(0xf1faff), // 0xe59500), // 'rgb(1, 186, 255)'),
  POINTS_NORMAL_SCALE: 1,

  // area for looking points to connect
  NEAR_BORDER: 50, // 150
  FAR_BORDER: 120, // 180

  // camera clipping
  CLIPPING_NEAR: 1,
  CLIPPING_FAR: 10000,
  FOV_CHANGE_TIME: 5000,
  CAMERA_FOV_START: 1,
  CAMERA_FOV_END: 60,

  // links
  LINK_SEGMENT_LENGTH: 2,
  LINK_STEP_TIME_MIN: 15,
  LINK_STEP_TIME_MAX: 65,
  LINK_LINE_WIDTH: 1,
  LINK_START_COLOR: new THREE.Color(0xf1faff), // 0x0097fb), // e59500),
  LINK_END_COLOR: new THREE.Color(0x303030), // 3a280b), // 251b0d), // 02040f),

  // link's segments
  SEGMENT_STATE_COUNT: 80, // equals to length of visible segments
  SEGMENT_MIN_DISTORTION: 0,
  SEGMENT_MAX_DISTORTION: 2,

  // camera
  ORBIT_CONTROLS: false,
  CAMERA_RADIUS: 200,

  // bloom
  BLOOM_STRENGTH: 2.0,
  BLOOM_RADIOUS: 0.0,
  BLOOM_THRESHOLD: 0.2, // 0.85,

  // fog
  FOG_COLOR: 0x02040f, // 02040f,
  FOG_DENSITY: 0.006,

  // scene
  SCENE_BACKGROUND_COLOR: new THREE.Color(0x02040f), // 02040f),
};
