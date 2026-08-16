/* HealthTrack — subtle mouse-tracked 3D tilt for glass cards. */
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduceMotion || !canHover) return;

  var targets = document.querySelectorAll(".card, .hero, .emergency-hero");

  targets.forEach(function (el) {
    var rect = null;
    var maxTilt = el.classList.contains("card") ? 3.5 : 2;

    el.addEventListener("mouseenter", function () {
      rect = el.getBoundingClientRect();
      el.style.transition = "transform 0.05s linear";
    });

    el.addEventListener("mousemove", function (e) {
      if (!rect) rect = el.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      var rotY = (px - 0.5) * (maxTilt * 2);
      var rotX = (0.5 - py) * (maxTilt * 2);
      el.style.transform = "perspective(1000px) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg) translateZ(0)";
    });

    el.addEventListener("mouseleave", function () {
      el.style.transition = "transform 0.35s ease";
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
      rect = null;
    });
  });
})();
