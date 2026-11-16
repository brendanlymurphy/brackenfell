// Everything the game uses from Three.js, bundled into one classic script that defines globals.
import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { CSMShadowNode } from 'three/addons/csm/CSMShadowNode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';       // the kit, tree and character GLBs store their geometry with EXT_meshopt_compression (tools/assets_pack.mjs)
window.THREE = THREE; window.TSL = TSL;
window.T3X = { GLTFLoader, SkeletonUtils, CSMShadowNode, bloom, ao, MeshoptDecoder, gltf: () => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder) };
