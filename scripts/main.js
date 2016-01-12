(function() {
  var canvas = document.getElementById('delaunayHero');
  var body = document.getElementsByTagName('body')[0];
  var header = document.getElementById('header');
  var subhead = document.getElementById('subhead');

  var options = {
    colorPalette: [
      ['hsla(333,57%,52%, 1)', 'hsla(94,15%,12%, 1)', 'hsla(326,59%,99%, 1)'],
      ['hsla(347,33%,0%, 1)', 'hsla(162,49%,42%, 1)', 'hsla(104,67%,81%, 1)'],
      ['hsla(318,76%,79%, 1)', 'hsla(313,78%,50%, 1)', 'hsla(255,59%,19%, 1)'],
      ['hsla(340,45%,54%, 1)', 'hsla(291,46%,18%, 1)', 'hsla(344,18%,83%, 1)'],
      ['hsla(298,0%,79%, 1)', 'hsla(313,23%,36%, 1)', 'hsla(338,65%,42%, 1)'],
      ['hsla(227,71%,90%, 1)', 'hsla(34,39%,45%, 1)', 'hsla(291,92%,25%, 1)'],
      ['hsla(166,59%,22%, 1)', 'hsla(39,31%,1%, 1)', 'hsla(208,24%,17%, 1)'],
      ['hsla(247,40%,39%, 1)', 'hsla(235,72%,8%, 1)', 'hsla(276,23%,30%, 1)'],
      ['hsla(84,5%,19%, 1)', 'hsla(168,84%,92%, 1)', 'hsla(172,31%,15%, 1)'],
      ['hsla(346,57%,27%, 1)', 'hsla(4,85%,48%, 1)', 'hsla(198,20%,1%, 1)'],
      ['hsla(273,32%,59%, 1)', 'hsla(332,87%,2%, 1)', 'hsla(192,43%,17%, 1)'],
      ['hsla(148,2%,68%, 1)', 'hsla(160,16%,42%, 1)', 'hsla(78,35%,4%, 1)'],
      ['hsla(7,55%,27%, 1)', 'hsla(203,44%,3%, 1)', 'hsla(332,11%,91%, 1)'],
    ],
    onDarkBackground: function(color) {
      color = hslaAdjustLightness(color, lighterColor);
      header.dataset.color = color;
      subhead.style.color = color;
      console.log(color);
      body.className = 'light';
    },
    onLightBackground: function(color) {
      color = hslaAdjustLightness(color, lighterColor);
      header.dataset.color = color;
      subhead.style.color = color;
      console.log(color);
      body.className = 'dark';
    },
  };

  var prettyDelaunay = new PrettyDelaunay(canvas, options);
  prettyDelaunay.randomize();

  function lighterColor(lightness) {
    return (lightness + 200 - lightness * 2) / 3;
  }

  function hslaAdjustLightness(color, lightness) {
    color = color.split(',');

    if (typeof lightness !== 'function') {
      color[2] = lightness;
    } else {
      color[2] = lightness(parseInt(color[2]));
    }

    color[2] += '%';
    return color.join(',');
  }
})();