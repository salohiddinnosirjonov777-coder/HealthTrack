/* HealthTrack — ambient WebGL background.
   A slowly rotating DNA double-helix + a glowing ECG heartbeat line
   drifting behind the glass UI. Medical-monitor palette: navy + phosphor green/cyan. */
(function () {
  if (typeof THREE === "undefined") return;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var canvas = document.getElementById("bg3d-canvas");
  if (!canvas) return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var isMobile = window.innerWidth < 700;
  var camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 1, 2500);
  camera.position.set(0, 10, isMobile ? 560 : 480);

  var ambient = new THREE.AmbientLight(0x0c2440, 1.7);
  scene.add(ambient);
  var keyGreen = new THREE.PointLight(0x2dffb0, 1.6, 1600);
  keyGreen.position.set(220, 160, 260);
  scene.add(keyGreen);
  var keyCyan = new THREE.PointLight(0x22e8ff, 1.1, 1600);
  keyCyan.position.set(-260, -120, 220);
  scene.add(keyCyan);

  var COLOR_GREEN = 0x2dffb0;
  var COLOR_CYAN = 0x22e8ff;
  var COLOR_WHITE = 0xeafcff;

  var root = new THREE.Group();
  scene.add(root);

  /* ---------------- DNA double helix ---------------- */
  var dna = new THREE.Group();
  dna.position.set(isMobile ? 0 : 190, 10, -60);
  dna.rotation.z = 0.18;
  root.add(dna);

  var rungCount = isMobile ? 16 : 24;
  var helixRadius = 46;
  var helixHeight = 460;
  var angleStep = Math.PI / 4.2;
  var strandAPts = [];
  var strandBPts = [];

  var nucleotideGeoBig = new THREE.SphereGeometry(4.2, 10, 10);
  var nucleotideGeoSmall = new THREE.SphereGeometry(3.2, 8, 8);
  var matGreen = new THREE.MeshStandardMaterial({ color: COLOR_GREEN, emissive: COLOR_GREEN, emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.3 });
  var matCyan = new THREE.MeshStandardMaterial({ color: COLOR_CYAN, emissive: COLOR_CYAN, emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.3 });
  var matRung = new THREE.MeshStandardMaterial({ color: 0x3a6ea8, emissive: 0x1c3f66, emissiveIntensity: 0.5, transparent: true, opacity: 0.55, metalness: 0.1, roughness: 0.6 });

  for (var i = 0; i < rungCount; i++) {
    var y = i * (helixHeight / rungCount) - helixHeight / 2;
    var angle = i * angleStep;
    var ax = Math.cos(angle) * helixRadius;
    var az = Math.sin(angle) * helixRadius;
    var bx = Math.cos(angle + Math.PI) * helixRadius;
    var bz = Math.sin(angle + Math.PI) * helixRadius;

    var pa = new THREE.Vector3(ax, y, az);
    var pb = new THREE.Vector3(bx, y, bz);
    strandAPts.push(pa);
    strandBPts.push(pb);

    var sphereA = new THREE.Mesh(nucleotideGeoBig, matGreen);
    sphereA.position.copy(pa);
    dna.add(sphereA);

    var sphereB = new THREE.Mesh(nucleotideGeoSmall, matCyan);
    sphereB.position.copy(pb);
    dna.add(sphereB);

    /* rung connecting the two strands */
    var rungLen = pa.distanceTo(pb);
    var rungGeo = new THREE.CylinderGeometry(0.9, 0.9, rungLen, 6);
    var rung = new THREE.Mesh(rungGeo, matRung);
    rung.position.copy(pa).lerp(pb, 0.5);
    rung.lookAt(pb);
    rung.rotateX(Math.PI / 2);
    dna.add(rung);
  }

  /* backbone tubes tracing each strand */
  function buildBackbone(points, color) {
    var curve = new THREE.CatmullRomCurve3(points);
    var tubeGeo = new THREE.TubeGeometry(curve, points.length * 4, 1.6, 6, false);
    var tubeMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.7, transparent: true, opacity: 0.85, metalness: 0.2, roughness: 0.35 });
    return new THREE.Mesh(tubeGeo, tubeMat);
  }
  dna.add(buildBackbone(strandAPts, COLOR_GREEN));
  dna.add(buildBackbone(strandBPts, COLOR_CYAN));

  /* ---------------- ECG heartbeat pulse line ---------------- */
  var ecgGroup = new THREE.Group();
  ecgGroup.position.set(isMobile ? 0 : -80, isMobile ? 120 : -70, -20);
  root.add(ecgGroup);

  function buildEcgPoints() {
    var cycle = [
      [0, 0], [8, 0], [10, 1.5], [12, 0], [16, 0],
      [18, 4], [20, -14], [22, 16], [24, -3], [26, 0],
      [30, 0], [34, 6], [38, 0], [46, 0]
    ];
    var pts = [];
    var xOffset = 0;
    var repeats = isMobile ? 3 : 5;
    var scaleX = isMobile ? 10 : 13;
    var scaleY = 4.2;
    for (var r = 0; r < repeats; r++) {
      for (var c = 0; c < cycle.length; c++) {
        var px = (cycle[c][0] + xOffset) * scaleX;
        var py = cycle[c][1] * scaleY;
        pts.push(new THREE.Vector3(px - (repeats * 46 * scaleX) / 2, py, Math.sin(px * 0.01) * 8));
      }
      xOffset += 46;
    }
    return pts;
  }

  var ecgPoints = buildEcgPoints();
  var ecgCurve = new THREE.CatmullRomCurve3(ecgPoints);
  var ecgTubeGeo = new THREE.TubeGeometry(ecgCurve, ecgPoints.length * 3, 1.1, 6, false);
  var ecgMat = new THREE.MeshStandardMaterial({ color: COLOR_GREEN, emissive: COLOR_GREEN, emissiveIntensity: 1.1, transparent: true, opacity: 0.4, metalness: 0.1, roughness: 0.4 });
  var ecgTube = new THREE.Mesh(ecgTubeGeo, ecgMat);
  ecgGroup.add(ecgTube);

  var pulseGeo = new THREE.SphereGeometry(4.5, 12, 12);
  var pulseMat = new THREE.MeshStandardMaterial({ color: COLOR_WHITE, emissive: COLOR_GREEN, emissiveIntensity: 2.2, metalness: 0, roughness: 0.2 });
  var pulseDot = new THREE.Mesh(pulseGeo, pulseMat);
  ecgGroup.add(pulseDot);
  var pulseLight = new THREE.PointLight(COLOR_GREEN, 1.8, 140);
  pulseDot.add(pulseLight);

  /* ---------------- ambient floating cell specks for depth ---------------- */
  var speckCount = isMobile ? 10 : 18;
  var specks = [];
  var speckPalette = [COLOR_GREEN, COLOR_CYAN, 0x6ec8ff];
  for (var s = 0; s < speckCount; s++) {
    var r = THREE.MathUtils.randFloat(2.5, 6);
    var geo = new THREE.IcosahedronGeometry(r, 0);
    var color = speckPalette[Math.floor(Math.random() * speckPalette.length)];
    var mat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.6, transparent: true, opacity: 0.7, wireframe: Math.random() < 0.4 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      THREE.MathUtils.randFloatSpread(760),
      THREE.MathUtils.randFloatSpread(420),
      THREE.MathUtils.randFloatSpread(300) - 120
    );
    mesh.userData.speed = THREE.MathUtils.randFloat(0.15, 0.5);
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    mesh.userData.baseY = mesh.position.y;
    root.add(mesh);
    specks.push(mesh);
  }

  /* ---------------- interaction + resize ---------------- */
  var mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
  window.addEventListener("mousemove", function (e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  var clock = new THREE.Clock();
  var ecgPeriod = 6.5;

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    dna.rotation.y = t * 0.22;

    for (var i = 0; i < specks.length; i++) {
      var o = specks[i];
      o.position.y = o.userData.baseY + Math.sin(t * o.userData.speed + o.userData.floatOffset) * 14;
      o.rotation.x += 0.004;
      o.rotation.y += 0.006;
    }

    var tt = (t % ecgPeriod) / ecgPeriod;
    var pt = ecgCurve.getPointAt(tt);
    pulseDot.position.copy(pt);
    var pulseScale = 1 + Math.max(0, 0.6 - Math.abs(0.5 - tt) * 3) * 1.8;
    pulseDot.scale.setScalar(pulseScale);

    targetRotY += (mouseX * 0.18 - targetRotY) * 0.02;
    targetRotX += (mouseY * 0.1 - targetRotX) * 0.02;
    root.rotation.y = targetRotY;
    root.rotation.x = targetRotX;

    renderer.render(scene, camera);
  }

  if (!reduceMotion) {
    animate();
  } else {
    dna.rotation.y = 0.4;
    renderer.render(scene, camera);
  }
})();
