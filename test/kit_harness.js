// Shared by test/kit.html and test/kit_sheet.html: boots the renderer, shading helpers and the kits without the game.
const World = { lakeY: 0, indoor: 0 };
const H = { hour: 10 };
H.boot = async function (opts) {
  const T = window.__TEST__ || {};
  const canvas = document.getElementById('view');
  await gfxInit(canvas); gfxResize(canvas.clientWidth, canvas.clientHeight);
  await loadNoise(); SH.init();
  await Kit.load(null, opts);
  const scene = H.scene = new THREE.Scene();
  scene.fogNode = TSL.fog(SH.fogColor(), SH.fogAmount());
  const sun = H.sun = new THREE.DirectionalLight(0xffffff, Math.PI); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  const sc = sun.shadow.camera; sc.left = sc.bottom = -22; sc.right = sc.top = 22; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
  scene.add(sun); scene.add(sun.target);
  return scene;
};
// time of day -> ENV -> frame uniforms + sun light. centre: where the shadow box sits.
H.env = function (hour, camPos, centre, indoor) {
  Env.hour = hour; World.indoor = indoor || 0;
  const e = updateEnv(0, indoor || 0); SH.update(e, camPos, 0);
  const c = centre || [0, 0, 0];
  H.sun.color.setRGB(e.keyCol[0], e.keyCol[1], e.keyCol[2]); H.sun.intensity = Math.PI; H.sun.shadow.intensity = e.shadowStrength;
  H.sun.target.position.set(c[0], c[1], c[2]); H.sun.position.set(c[0] + e.keyDir[0] * 90, c[1] + e.keyDir[1] * 90, c[2] + e.keyDir[2] * 90);
  H.sun.target.updateMatrixWorld(); H.exposure.value = e.exposure;
  H.bg.value.setRGB(e.horizon[0] * 0.6 + e.zenith[0] * 0.4, e.horizon[1] * 0.6 + e.zenith[1] * 0.4, e.horizon[2] * 0.6 + e.zenith[2] * 0.4);
  return e;
};
// the old build's final pass: exposure, vignette, Narkowicz ACES, saturation, S-curve, split tone, gamma
H.pipeline = function (scene, camera, samples) {
  const { pass, Fn, vec3, vec4, dot, mix, pow, max, clamp, smoothstep, uniform, screenUV } = TSL;
  H.exposure = H.exposure || uniform(0.7); H.bg = H.bg || uniform(new THREE.Color(0.3, 0.4, 0.5));
  scene.backgroundNode = H.bg;
  const sp = pass(scene, camera, { samples: samples === undefined ? 4 : samples }), src = sp.getTextureNode('output');
  const fin = Fn(() => {
    const c = max(src.rgb, vec3(0)).mul(H.exposure).toVar();
    const q = screenUV.sub(0.5); c.mulAssign(dot(q, q).mul(0.55).oneMinus());
    c.assign(clamp(c.mul(c.mul(2.51).add(0.03)).div(c.mul(c.mul(2.43).add(0.59)).add(0.14)), 0, 1));
    c.assign(mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, 1.14));
    c.assign(mix(c, c.mul(c).mul(c.mul(-2).add(3)), 0.22));
    const l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c.mulAssign(mix(vec3(0.93, 0.99, 1.07), vec3(1.045, 1.0, 0.93), smoothstep(0.06, 0.62, l)));
    return vec4(pow(max(c, vec3(0)), vec3(1 / 2.2)), 1);
  });
  const p = new THREE.RenderPipeline(G.renderer); p.outputNode = fin(); p.outputColorTransform = false;
  return p;
};
H.draw = async function (pipeline) { await gfxCapture(() => pipeline.render()); return G.renderer.info.render; };
