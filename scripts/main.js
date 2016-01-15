(function() {
  // set up DOM elements
  var canvas = document.getElementById('delaunayHero');
  var body = document.getElementsByTagName('body')[0];
  var header = document.getElementById('header');
  var subhead = document.getElementById('subhead');
  var redoButton = document.getElementById('delaunayRedo');

  var options = {
    // colors for triangulation to choose from
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

  // list of weighted subheads
  var thingsIBe = [
    {
      text:'Web Developer',
      weight: 10,
    },
    {
      text:'Dungeon Master',
      weight: 10,
    },
    {
      text:'Crazy Cat Lady',
      weight: 10,
    },
    {
      text:'Wannabe Magician',
      weight: 10,
    },
    {
      text:'Neat-o Person',
      weight: 10,
    },
    {
      text:'Taco Bell Fangirl',
      weight: 10,
    },
    {
      text:'Pokémon Master',
      weight: 10,
    },
    {
      text:'Rabid Trekkie',
      weight: 10,
    },
    {
      text:'Power Metal Warrior',
      weight: 10,
    },
    {
      text:'Probably a Wizard',
      weight: 10,
    },
    {
      text:'Magical Girl',
      weight: 10,
    },
    {
      text:'Aspiring Sailor Scout',
      weight: 10,
    },
    {
      text:'Cries at animals that are friends',
      weight: 4,
    },
    {
      text:'Mathematical!',
      weight: 10,
    },
    {
      text:'What do you call a nosey pepper?',
      weight: 4,
      next: {
        text:'Jalapeño business!',
      }
    },
  ];

  var weightedThings = [];
  var thingsIndex = 0;
  var currentThing = {};

  initWeightedThings();

  // on redo button make a new triangulation and get a new subhead
  delaunayRedo.addEventListener('click', function() {
    prettyDelaunay.randomize();
    randomSubhead();
  });

  // init delaunay plugin and get one triangulation
  var prettyDelaunay = new PrettyDelaunay(canvas, options);
  prettyDelaunay.randomize();

  /**
   * Helper Functions
  **/

  // add index to array "weight" number of times
  // so an item with weight two will be added twice
  function initWeightedThings() {
    for (var i = 0; i < thingsIBe.length; i++) {
      for (var j = 0; j < thingsIBe[i].weight; j++) {
        weightedThings.push(i);
      }
    }
  }

  function randomSubhead() {
    var newSubhead;
    var i;

    // if current has a next, use next
    // this is for jokes
    if (currentThing.next) {
      newSubhead = currentThing.next.text;
      currentThing = currentThing.next;

      subhead.innerHTML = newSubhead;
      subhead.dataset.text = newSubhead;
    } else {
      // choose an index from the weighted array
      // weighted array contains indeces from subhead data array
      do {
        i = Math.floor(Math.random() * (weightedThings.length));
      } while (weightedThings[i] === thingsIndex);

      // actual index from weighted array
      thingsIndex = weightedThings[i];

      // save current subhead data so we can look at "next" later
      currentThing = thingsIBe[thingsIndex];

      // get the actual text
      newSubhead = thingsIBe[thingsIndex].text;

      subhead.innerHTML = newSubhead;
      subhead.dataset.text = newSubhead;
    }
  }

  function colorChange(color) {
    var lightness = hslaGetLightness(color);

    // get a more contrasted version of the color
    color = hslaAdjustLightness(color, lighterColor);

    // always change the subhead text to match new color
    subhead.style.color = color;

    // for really light colors, add a shadow to the title
    // so that its a little more readable
    if (lightness > 70) {
      header.style.color = color;
      header.className = 'with-shadow';
    } else {
      header.style.color = '';
      header.className = '';
    }
  }

  // not necessarily "lighter", more like
  // a lightness on the other side of the spectrum
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