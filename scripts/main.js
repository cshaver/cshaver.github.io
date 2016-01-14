(function() {
  var canvas = document.getElementById('delaunayHero');
  var body = document.getElementsByTagName('body')[0];
  var header = document.getElementById('header');
  var subhead = document.getElementById('subhead');
  var redoButton = document.getElementById('delaunayRedo');

  var options = {
    colorPalette: [
      ['hsla(318,76%,79%, 1)', 'hsla(313,78%,50%, 1)', 'hsla(255,59%,19%, 1)'],
      ['hsla(166,59%,22%, 1)', 'hsla(39,31%,1%, 1)', 'hsla(208,24%,17%, 1)'],
      ['hsla(247,40%,39%, 1)', 'hsla(235,72%,8%, 1)', 'hsla(276,23%,30%, 1)'],
      ['hsla(346,57%,27%, 1)', 'hsla(4,85%,48%, 1)', 'hsla(198,20%,1%, 1)'],
      ['hsla(273,32%,59%, 1)', 'hsla(332,87%,2%, 1)', 'hsla(192,43%,17%, 1)'],
      ["hsla(218,48%,22%, 1)", "hsla(301,10%,8%, 1)", "hsla(71,73%,71%, 1)"],
      ["hsla(23,92%,2%, 1)", "hsla(341,93%,35%, 1)", "hsla(270,6%,26%, 1)"],
      ["hsla(70,48%,96%, 1)", "hsla(170,79%,70%, 1)", "hsla(157,4%,13%, 1)"],
      ["hsla(213,9%,46%, 1)", "hsla(354,81%,68%, 1)", "hsla(191,29%,62%, 1)"],
      ["hsla(4,57%,21%,1)", "hsla(352,54%,49%,1)", "hsla(195,33%,7%,1)"],
      ["hsla(9,39%,17%, 1)", "hsla(335,53%,12%, 1)", "hsla(334,20%,0%, 1)"],
      // edges = true
      ["hsla(300,61%,6%,1)", "hsla(218,96%,10%,1)", "hsla(244,44%,12%,1)"],
    ],
    onDarkBackground: colorChange,
    onLightBackground: colorChange,
  };

  // TODO: weight these somehow
  var thingsIBe = [
    'Web Developer',
    'Dungeon Master',
    'Crazy Cat Lady',
    'Wannabe Magician',
    'Neat-o Person',
    'Taco Bell Fangirl',
    'Pokémon Master',
    'Rabid Trekkie',
    'Power Metal Warrior',
    'Probably a Wizard',
    'Magical Girl',
    'Aspiring Sailor Scout',
    'Cries at animals that are friends',
    'Mathematical!',
    'What do you call a nosey pepper?',
    'Jalapeño business!',
  ];

  delaunayRedo.addEventListener('click', function() {
    prettyDelaunay.randomize();
    randomSubhead();
  });

  var prettyDelaunay = new PrettyDelaunay(canvas, options);
  prettyDelaunay.randomize();

  // TODO: prevent repeats
  function randomSubhead() {
    // joke opener
    var i;
    var newSubhead;
    if (subhead.innerHTML === thingsIBe[thingsIBe.length - 2]) {
      newSubhead = thingsIBe[thingsIBe.length - 1];
      subhead.innerHTML = newSubhead;
      subhead.dataset.text = newSubhead;
    } else {
      i = Math.floor(Math.random() * (thingsIBe.length));
      newSubhead = thingsIBe[i];
      subhead.innerHTML = newSubhead;
      subhead.dataset.text = newSubhead;


      // DONT SPOIL THE JOKE
      if (i === thingsIBe.length - 1) {
        randomSubhead();
      }
    }
  }

  function colorChange(color) {
    var lightness = hslaGetLightness(color);

    // check for really light, add shadow to text
    color = hslaAdjustLightness(color, lighterColor);
    subhead.style.color = color;

    if (lightness > 70) {
      header.style.color = color;
      header.className = 'with-shadow';
    } else {
      header.style.color = '';
      header.className = '';
    }
  }

  function lighterColor(lightness) {
    return (lightness + 200 - lightness * 2) / 3;
  }

  function hslaGetLightness(color) {
    return parseInt(color.split(',')[2]);
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