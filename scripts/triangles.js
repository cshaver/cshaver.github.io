(function() {
  // see http://paulbourke.net/papers/triangulate/
  'use strict';

  class Random {
    // hey look a closure
    // helper function, returns function for
    // random with pre-set max and min
    static randomNumberFunction(max, min) {
      min = min || 0;
      if (min > max) {
        var temp = max;
        max = min;
        min = temp;
      }
      return function() {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
    }

    // returns a random number
    // between the max and min
    static randomBetween(max, min) {
      min = min || 0;
      return Random.randomNumberFunction(max, min)();
    }

    static randomInCircle(radius, ox, oy) {
      var angle = Math.random() * Math.PI * 2;
      var rad = Math.sqrt(Math.random()) * radius;
      var x = ox + rad * Math.cos(angle);
      var y = oy + rad * Math.sin(angle);

      return new Point(x, y);
    }

    static randomColor() {
      return 'rgba(' + Random.randomBetween(255) + ',' + Random.randomBetween(255) + ',' + Random.randomBetween(255) + ', 1)';
    }
  }

  /**
   * Represents a triangle
   * @class
   */
  class Triangle {
    /**
     * Triangle consists of three points
     * and (max) three adjacent triangles
     * @constructor
     * @param {Number[]} a
     * @param {Number[]} b
     * @param {Number[]} c
     * @param {Triangle} ta
     * @param {Triangle} tb
     * @param {Triangle} tc
     */
    constructor(a, b, c, ta, tb, tc) {
      this.p1 = this.a = a;
      this.p2 = this.b = b;
      this.p3 = this.c = c;
      this.ta = ta || null;
      this.tb = tb || null;
      this.tc = tc || null;

      this.color = 'black';
    }

    // draw the triangle
    render(color) {
      ctx.beginPath();
      ctx.moveTo(this.a[0], this.a[1]);
      ctx.lineTo(this.b[0], this.b[1]);
      ctx.lineTo(this.c[0], this.c[1]);
      ctx.closePath();
      ctx.strokeStyle = color || this.color;
      // ctx.strokeStyle = 'black';
      ctx.fillStyle = color || this.color;
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }

    randomInside() {
      var r1 = Math.random();
      var r2 = Math.random();
      var x = (1 - Math.sqrt(r1)) * this.p1[0] + (Math.sqrt(r1) * (1 - r2)) * this.p2[0] + (Math.sqrt(r1) * r2) * this.p3[0];
      var y = (1 - Math.sqrt(r1)) * this.p1[1] + (Math.sqrt(r1) * (1 - r2)) * this.p2[1] + (Math.sqrt(r1) * r2) * this.p3[1];
      return new Point(x, y);
    }

    centroid() {
      var x = (this.p1[0] + this.p2[0] + this.p3[0]) / 3;
      var y = (this.p1[1] + this.p2[1] + this.p3[1]) / 3;

      return new Point(x, y);
    }

    // (xMin, xMax, yMin, yMax, 0, this.canvas.width, 0, this.canvas.height);
    rescalePoints(xA, xB, yA, yB, xC, xD, yC, yD) {
      // console.log(xA, xB, yA, yB, xC, xD, yC, yD);
      // scale points from [A, B] to [C, D]

      console.log('old:', this.p1[0], this.a[0]);

      this.p1[0] = this.a[0] = ((this.p1[0] - xA) / (xB - xA)) * xD;
      this.p1[1] = this.a[1] = ((this.p1[1] - yA) / (yB - yA)) * yD;

      this.p2[0] = this.b[0] = ((this.p2[0] - xA) / (xB - xA)) * xD;
      this.p2[1] = this.b[1] = ((this.p2[1] - yA) / (yB - yA)) * yD;

      this.p3[0] = this.c[0] = ((this.p3[0] - xA) / (xB - xA)) * xD;
      this.p3[1] = this.c[1] = ((this.p3[1] - yA) / (yB - yA)) * yD;

      console.log('new: ', this.p1[0], this.p1[0] === this.a[0]);

      // this.p1[0] = this.a[0] = xC + (xD - xC) * ( ( this.p1[0] - xA ) / ( xB - xA ) ); //( 1 - (this.p1[0] - xA) / (xB - xA)) + xD * ( (this.p1[0] - xA) / (xB - xA) );
      // this.p1[1] = this.a[1] = yC + (yD - yC) * ( ( this.p1[1] - yA ) / ( yB - yA ) ); //( 1 - (this.p1[1] - yA) / (yB - yA)) + yD * ( (this.p1[1] - yA) / (yB - yA) );

      // this.p2[0] = this.a[0] = xC + (xD - xC) * ( ( this.p2[0] - xA ) / ( xB - xA ) ); //( 1 - (this.p2[0] - xA) / (xB - xA)) + xD * ( (this.p2[0] - xA) / (xB - xA) );
      // this.p2[1] = this.a[1] = yC + (yD - yC) * ( ( this.p2[1] - yA ) / ( yB - yA ) ); //( 1 - (this.p2[1] - yA) / (yB - yA)) + yD * ( (this.p2[1] - yA) / (yB - yA) );

      // this.p3[0] = this.a[0] = xC + (xD - xC) * ( ( this.p3[0] - xA ) / ( xB - xA ) ); //( 1 - (this.p3[0] - xA) / (xB - xA)) + xD * ( (this.p3[0] - xA) / (xB - xA) );
      // this.p3[1] = this.a[1] = yC + (yD - yC) * ( ( this.p3[1] - yA ) / ( yB - yA ) ); //( 1 - (this.p3[1] - yA) / (yB - yA)) + yD * ( (this.p3[1] - yA) / (yB - yA) );
    }

    xMin() {
      return Math.min(this.p1[0], this.p2[0], this.p3[0]);
    }

    yMin() {
      return Math.min(this.p1[1], this.p2[1], this.p3[1]);
    }

    xMax() {
      return Math.max(this.p1[0], this.p2[0], this.p3[0]);
    }

    yMax() {
      return Math.max(this.p1[1], this.p2[1], this.p3[1]);
    }

    toString() {
      return '(' + this.p1[0] + ',' + this.p1[1] + '), (' + this.p2[0] + ',' + this.p2[1] + '), (' + this.p3[0] + ',' + this.p3[1] + ')';
    }
  }

  /**
   * Represents a point
   * @class
   */
  class Point {
    /**
     * Point consists x and y
     * @constructor
     * @param {Number} x
     * @param {Number} y
     * @param {String} color
     */
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.radius = 1;
      this.color = color || 'black';
    }

    // draw the point
    render(color) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = color || this.color;
      ctx.fill();
      ctx.closePath();
    }

    canvasColorAtPoint() {
      var data = ctx.getImageData(this.x, this.y, 1, 1).data;
      return 'rgba(' + Array.prototype.slice.call(data, 0, 4).join(',') + ')';
    }

    /**
     * converts to string
     * returns something like:
     * "X,Y"
     * @returns {String}
     */
    toString() {
      return this.x + ','
      this.y;
    }

    getCoords() {
      return [this.x, this.y];
    }

    rescale(xA, xB, yA, yB, xC, xD, yC, yD) {
      // scale points from [A, B] to [C, D]

      this.x = ((this.x - xA) / (xB - xA)) * xD;
      this.y = ((this.y - yA) / (yB - yA)) * yD;

    }
  }

  /**
   * Represents a mapping of points
   * in order to keep track of duplicates
   */
  class PointMap {
    constructor() {
      this._map = {};
    }

    // adds point to map
    add(point) {
      this._map[point.toString()] = true;
    }

    // adds x, y coord to map
    addCoord(x, y) {
      this.add(new Point(x, y));
    }

    // removes point from map
    remove(point) {
      this._map[point.toString()] = false;
    }

    // removes x, y coord from map
    removeCoord(point) {
      this.remove(new Point(x, y));
    }

    // clears the map
    clear() {
      this._map = {};
    }

    /**
     * determines if point has been
     * added to map already
     *  @returns {Boolean}
     */
    exists(point) {
      return this._map[point.toString()] ? true : false;
    }
  }

  /**
   * Represents a delauney triangulation of random points
   * https://en.wikipedia.org/wiki/Delaunay_triangulation
   */
  class PrettyDelaunay {
    /**
     * @constructor
     */
    constructor(canvas) {
      this.canvas = canvas;
      this.resizeCanvas();
      this.points = [];
      this.pointMap = new PointMap();
    }

    clear() {
      this.points = [];
      this.pointMap.clear();
    }

    // clear and create a fresh set of random points
    randomize(min, max, minEdge, maxEdge, colors) {
      this.colors = colors;

      this.resizeCanvas();

      this.numPoints = Random.randomBetween(min, max);
      this.getNumEdgePoints = Random.randomNumberFunction(minEdge, maxEdge);

      this.clear();

      // add corner and edge points
      this.cornerPoints();
      this.edgePoints();
      // add some random points in the middle field,
      // excluding edges and corners
      this.generatePoints(this.numPoints, 1, 1, this.width - 1, this.height - 1);

      this.triangulate();

      this.prettify();

      this.render();
    }

    // add points in the corners
    cornerPoints() {
      this.points.push(new Point(0, 0));
      this.points.push(new Point(0, this.height));
      this.points.push(new Point(this.width, 0));
      this.points.push(new Point(this.width, this.height));
    }

    // add points on the edges
    edgePoints() {
      // left edge
      this.generatePoints(this.getNumEdgePoints(), 0, 0, 0, this.height);
      // right edge
      this.generatePoints(this.getNumEdgePoints(), this.width, 0, 0, this.height);
      // bottom edge
      this.generatePoints(this.getNumEdgePoints(), 0, this.height, this.width, 1);
      // top edge
      this.generatePoints(this.getNumEdgePoints(), 0, 0, this.width, 0);
    }

    // randomly generate some points
    generatePoints(numPoints, x, y, width, height) {
      for (var i = 0; i < numPoints; i++) {
        var point;
        var j = 0;
        // generate a new point with random coords
        // re-generate the point if it already exists (max 10 times)
        do {
          j++;
          point = new Point(Random.randomBetween(x, x + width), Random.randomBetween(y, y + height));
        } while (this.pointMap.exists(point) && j < 10);
        if (j < 10) {
          this.points.push(point);
          this.pointMap.add(point);
        }
      }
    }

    triangulate() {
      this.triangles = [];

      var vertices = this.points.map(function(point) {
        return [point.x, point.y];
      });
      var triangulated = Delaunay.triangulate(vertices);

      for (var i = 0; i < triangulated.length; i += 3) {
        var arr = [];
        arr.push(vertices[triangulated[i]]);
        arr.push(vertices[triangulated[i+1]]);
        arr.push(vertices[triangulated[i+2]]);
        this.triangles.push(arr);
      }

      this.triangles = this.triangles.map(function(triangle) {
        return new Triangle(triangle[0], triangle[1], triangle[2]);
      });
    }

    // create points, colors
    prettify() {
      this.points = [];

      for (var i = 0; i < this.triangles.length; i++) {
        this.points.push(this.triangles[i].randomInside());
        // this.points.push(this.triangles[i].centroid());
      }

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      /**
        * create a nice-looking but reasonably random gradient:
        * randomize the first circle
        * the second circle should be inside the first circle,
        * so we generate a point (origin2) inside cirle1
        * then calculate the dist between origin2 and the circumfrence of circle1
        * circle2's radius can be between 0 and this dist
        */

      // helper random functions
      var randomCanvasX = Random.randomNumberFunction(Math.sqrt(canvas.width), canvas.width - Math.sqrt(canvas.width));
      var randomCanvasY = Random.randomNumberFunction(Math.sqrt(canvas.height), canvas.height - Math.sqrt(canvas.height));
      var randomCanvasRadius = Random.randomNumberFunction(Math.max(canvas.height, canvas.width)/2, Math.max(canvas.height, canvas.width));
      // generate circle1 origin and radius
      var x0 = randomCanvasX();
      var y0 = randomCanvasY();
      var r0 = randomCanvasRadius();

      // find a random point inside circle1
      // this is the origin of circle 2
      var pointInCircle = Random.randomInCircle(r0*.09, x0, y0);

      // grab the x/y coords
      var x1 = pointInCircle.x;
      var y1 = pointInCircle.y;

      // find distance between the point and the circumfrience of circle1
      var vX = x1 - x0;
      var vY = y1 - y0;
      var magV = Math.sqrt(vX*vX + vY*vY);
      var aX = x0 + vX / magV * r0;
      var aY = y0 + vY / magV * r0;

      var dist = Math.sqrt((x1 - aX) * (x1 - aX) + (y1 - aY) * (y1 - aY));

      // generate the radius of circle2 based on this distance
      var r1 = Random.randomBetween(1, Math.sqrt(dist));

      this.radgrad = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);

      console.log('circle1', x0, y0, r0);
      console.log('circle2', x1, y1, r1);

      var colorStop = Random.randomBetween(2, 8)/10;
      console.log('colorStop', colorStop);
      this.radgrad.addColorStop(1, this.colors[0]);
      this.radgrad.addColorStop(colorStop, this.colors[1]);
      this.radgrad.addColorStop(0, this.colors[2]);

      this.canvas.parentElement.style.backgroundColor = this.colors[2];

      // ctx.arc(x0, y0, r0, 0, Math.PI*2, true);
      // ctx.strokeStyle = 'white';
      // ctx.stroke();
      // ctx.arc(x1, y1, r1, 0, Math.PI*2, true);
      // ctx.strokeStyle = 'black';
      // ctx.stroke();
    }

    // sorts the points
    sortPoints() {
      // sort points
      this.points.sort(function(a, b) {
        // sort the point
        if (a.x < b.x) {
          return -1;
        }
        else if (a.x > b.x) {
          return 1;
        }
        else if (a.y < b.y) {
          return -1;
        }
        else if (a.y > b.y) {
          return 1;
        }
        else {
          return 0;
        }
      });
    }

    // size the canvas to the size of its parent
    // sort of a hack for a responsive canvas
    resizeCanvas() {
      var parent = this.canvas.parentElement;
      this.canvas.width = this.width = parent.offsetWidth;
      this.canvas.height = this.height = parent.offsetHeight;
    }

    // this function is super broken and messy
    // now that i've tried to fix it four times its impossile to read
    resizePoints() {

      // var previousWidth = this.width;
      // var previousHeight = this.height;

      this.resizeCanvas();

      // console.log(previousWidth, 'to', this.width, previousHeight, 'to', this.height);

      var xMin = Number.MAX_VALUE;
      var xMax = 0;
      var yMin = Number.MAX_VALUE;
      var yMax = 0;

      for (var i = 0; i < this.triangles.length; i++) {
        xMin = Math.min(this.triangles[i].xMin(), xMin);
        xMax = Math.max(this.triangles[i].xMax(),xMax);
        yMin = Math.min(this.triangles[i].yMin(), yMin);
        yMax = Math.max(this.triangles[i].yMax(),yMax);
      }

      console.log(xMin, xMax, yMin, yMax);

      // remap all points and triangles to new width / height
      for (var i = 0; i < this.points.length; i++) {
        this.points[i].rescale(xMin, xMax, yMin, yMax, 0, this.canvas.width, 0, this.canvas.height);
      }

      for (var i = 0; i < this.triangles.length; i++) {
        this.triangles[i].rescalePoints(xMin, xMax, yMin, yMax, 0, this.canvas.width, 0, this.canvas.height);
      }

      this.render();
    }

    render(showTriangles) {
      ctx.fillStyle = this.radgrad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      if (typeof showTriangles === 'undefined') {
        showTriangles = true;
      }

      if (showTriangles) {
        for (var i = 0; i < this.triangles.length; i++) {
          this.triangles[i].render(this.triangles[i].centroid().canvasColorAtPoint());
        }
      }

      // for (var i = 0; i < this.points.length; i++) {
      //   this.points[i].render();
      // }
    }

  }

  // set up variables for canvas, inputs, etc
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const button = document.getElementById('button');
  const toggleTrianglesButton = document.getElementById('toggleTriangles');

  const form = document.getElementById('form');
  const maxInput = document.getElementById('maxPoints');
  const minInput = document.getElementById('minPoints');
  const maxEdgeInput = document.getElementById('maxEdgePoints');
  const minEdgeInput = document.getElementById('minEdgePoints');

  var minPoints, maxPoints, minEdgePoints, maxEdgePoints, colors;

  var showTriangles = true;

  // lets get this show on the road
  let prettyDelaunay = new PrettyDelaunay(canvas);

  // initial generation
  runDelaunay();

  /**
   * util functions
   */

  // get options and re-randomize
  function runDelaunay() {
    getOptions();
    prettyDelaunay.randomize(minPoints, maxPoints, minEdgePoints, maxEdgePoints, colors);
  }

  // get options from input fields
  function getOptions() {
    minPoints = parseInt(minInput.value);
    maxPoints = parseInt(maxInput.value);
    minEdgePoints = parseInt(minEdgeInput.value);
    maxEdgePoints = parseInt(maxEdgeInput.value);

    colors = [];

    if (document.getElementById('colorType1').checked) {
      // generate random colors
      for (var i = 0; i < 3; i++) {
        var color = Random.randomColor();
        colors.push(color);
      }
    }
    else {
      // use the ones in the inputs
      colors.push(document.getElementById('color1').value);
      colors.push(document.getElementById('color2').value);
      colors.push(document.getElementById('color3').value);
    }
  }

 function throttle(type, name, obj) {
    obj = obj || window;
    var running = false;
    var func = function() {
      if (running) { return; }
      running = true;
      requestAnimationFrame(function() {
        obj.dispatchEvent(new CustomEvent(name));
        running = false;
      });
    };
    obj.addEventListener(type, func);
  };

  /* init - you can init any event */
  throttle('resize', 'optimizedResize');

  /**
   * set up events
   */

  // click the button to regen
  button.addEventListener('click', function() {
    runDelaunay();
  });

  // click the button to regen
  toggleTrianglesButton.addEventListener('click', function() {
    showTriangles = !showTriangles;
    prettyDelaunay.render(showTriangles);
  });

  // regen on resize
  window.addEventListener('optimizedResize', function() {
    runDelaunay();
  });

  // dont do anything on form submit
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    return false;
  });

})();

