// Limit the dynamically imported namespace to the primitives used by the Atlas.
// Importing the full namespace prevents Rollup from pruning unrelated exports.
export {
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Material,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
