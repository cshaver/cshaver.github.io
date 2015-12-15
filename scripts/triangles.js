(function() {
  // see http://paulbourke.net/papers/triangulate/
  'use strict';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const button = document.getElementById('button');
  const triangleButton = document.getElementById('triangleButton');

  const MAX_NUM_POINTS = 20;
  const MIN_NUM_POINTS = 10;
  const MIN_NUM_EDGE_POINTS = 3;
  const MAX_NUM_EDGE_POINTS = 5;

  // hey look a closure
  // helper function, returns function for
  // random with pre-set max and min
  function randomNumberFunction(max, min) {
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
  function randomBetween(max, min) {
    min = min || 0;
    return randomNumberFunction(max, min)();
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
      ctx.fillStyle = color || this.color;
      ctx.fill();
      ctx.closePath();
    }

    toString() {
      return '(' + this.p1[0] + ',' + this.p1[1] + '), (' + this.p2[0] + ',' + this.p2[1] + '), (' + this.p3[0] + ',' + this.p3[1] + ')';
    }
  }

  /**
   * Represents a edge
   * @class
   */
  class Edge {
    /**
     * Edge consists of two points
     * @constructor
     * @param {Number[]} a
     * @param {Number[]} b
     */
    constructor(a, b) {
      this.p1 = this.a = a;
      this.p2 = this.b = b;

      this.color = 'black';
    }

    // draw the edge
    render(color) {
      ctx.beginPath();
      ctx.moveTo(this.a[0], this.a[1]);
      ctx.lineTo(this.b[0], this.b[1]);
      ctx.closePath();
      ctx.strokeStyle = color || this.color;
      ctx.stroke();
      ctx.closePath();
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
    constructor(canvas, min, max, minEdge, maxEdge, colors) {
      this.width = canvas.width;
      this.height = canvas.height;

      this.points = [];
      this.pointMap = new PointMap();

      this.numPoints = randomBetween(min, max);
      this.getNumEdgePoints = randomNumberFunction(minEdge, maxEdge);
    }

    clear() {
      ctx.clearRect(0, 0, this.width, this.height);
      this.points = [];
      this.pointMap.clear();
    }

    // clear and create a fresh set of random points
    randomize() {
      this.clear();

      // add corner and edge points
      this.cornerPoints();
      this.edgePoints();
      // add some random points in the middle field,
      // excluding edges and corners
      this.generatePoints(this.numPoints, 1, 1, this.width - 1, this.height - 1);

      this.triangulate();

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
          point = new Point(randomBetween(x, x + width), randomBetween(y, y + height));
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

    render() {
      for (var i = 0; i < this.triangles.length; i++) {
        this.triangles[i].render('rgb(' + randomBetween(0, 255) + ',' + randomBetween(0, 255) + ',' + randomBetween(0, 255) + ')');
      }
    }

  }

  // lets get this show on the road
  let prettyDelaunay = new PrettyDelaunay(canvas, MIN_NUM_POINTS, MAX_NUM_POINTS, MIN_NUM_EDGE_POINTS, MAX_NUM_EDGE_POINTS);

  prettyDelaunay.randomize();

  button.addEventListener('click', function() {
    prettyDelaunay.randomize();
  });

  triangleButton.addEventListener('click', function() {
    prettyDelaunay.damnTriangle();
  });

})();
