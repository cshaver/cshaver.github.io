(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Delaunay;

(function() {
  "use strict";

  var EPSILON = 1.0 / 1048576.0;

  function supertriangle(vertices) {
    var xmin = Number.POSITIVE_INFINITY,
        ymin = Number.POSITIVE_INFINITY,
        xmax = Number.NEGATIVE_INFINITY,
        ymax = Number.NEGATIVE_INFINITY,
        i, dx, dy, dmax, xmid, ymid;

    for(i = vertices.length; i--; ) {
      if(vertices[i][0] < xmin) xmin = vertices[i][0];
      if(vertices[i][0] > xmax) xmax = vertices[i][0];
      if(vertices[i][1] < ymin) ymin = vertices[i][1];
      if(vertices[i][1] > ymax) ymax = vertices[i][1];
    }

    dx = xmax - xmin;
    dy = ymax - ymin;
    dmax = Math.max(dx, dy);
    xmid = xmin + dx * 0.5;
    ymid = ymin + dy * 0.5;

    return [
      [xmid - 20 * dmax, ymid -      dmax],
      [xmid            , ymid + 20 * dmax],
      [xmid + 20 * dmax, ymid -      dmax]
    ];
  }

  function circumcircle(vertices, i, j, k) {
    var x1 = vertices[i][0],
        y1 = vertices[i][1],
        x2 = vertices[j][0],
        y2 = vertices[j][1],
        x3 = vertices[k][0],
        y3 = vertices[k][1],
        fabsy1y2 = Math.abs(y1 - y2),
        fabsy2y3 = Math.abs(y2 - y3),
        xc, yc, m1, m2, mx1, mx2, my1, my2, dx, dy;

    /* Check for coincident points */
    if(fabsy1y2 < EPSILON && fabsy2y3 < EPSILON)
      throw new Error("Eek! Coincident points!");

    if(fabsy1y2 < EPSILON) {
      m2  = -((x3 - x2) / (y3 - y2));
      mx2 = (x2 + x3) / 2.0;
      my2 = (y2 + y3) / 2.0;
      xc  = (x2 + x1) / 2.0;
      yc  = m2 * (xc - mx2) + my2;
    }

    else if(fabsy2y3 < EPSILON) {
      m1  = -((x2 - x1) / (y2 - y1));
      mx1 = (x1 + x2) / 2.0;
      my1 = (y1 + y2) / 2.0;
      xc  = (x3 + x2) / 2.0;
      yc  = m1 * (xc - mx1) + my1;
    }

    else {
      m1  = -((x2 - x1) / (y2 - y1));
      m2  = -((x3 - x2) / (y3 - y2));
      mx1 = (x1 + x2) / 2.0;
      mx2 = (x2 + x3) / 2.0;
      my1 = (y1 + y2) / 2.0;
      my2 = (y2 + y3) / 2.0;
      xc  = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2);
      yc  = (fabsy1y2 > fabsy2y3) ?
        m1 * (xc - mx1) + my1 :
        m2 * (xc - mx2) + my2;
    }

    dx = x2 - xc;
    dy = y2 - yc;
    return {i: i, j: j, k: k, x: xc, y: yc, r: dx * dx + dy * dy};
  }

  function dedup(edges) {
    var i, j, a, b, m, n;

    for(j = edges.length; j; ) {
      b = edges[--j];
      a = edges[--j];

      for(i = j; i; ) {
        n = edges[--i];
        m = edges[--i];

        if((a === m && b === n) || (a === n && b === m)) {
          edges.splice(j, 2);
          edges.splice(i, 2);
          break;
        }
      }
    }
  }

  Delaunay = {
    triangulate: function(vertices, key) {
      var n = vertices.length,
          i, j, indices, st, open, closed, edges, dx, dy, a, b, c;

      /* Bail if there aren't enough vertices to form any triangles. */
      if(n < 3)
        return [];

      /* Slice out the actual vertices from the passed objects. (Duplicate the
       * array even if we don't, though, since we need to make a supertriangle
       * later on!) */
      vertices = vertices.slice(0);

      if(key)
        for(i = n; i--; )
          vertices[i] = vertices[i][key];

      /* Make an array of indices into the vertex array, sorted by the
       * vertices' x-position. */
      indices = new Array(n);

      for(i = n; i--; )
        indices[i] = i;

      indices.sort(function(i, j) {
        return vertices[j][0] - vertices[i][0];
      });

      /* Next, find the vertices of the supertriangle (which contains all other
       * triangles), and append them onto the end of a (copy of) the vertex
       * array. */
      st = supertriangle(vertices);
      vertices.push(st[0], st[1], st[2]);
      
      /* Initialize the open list (containing the supertriangle and nothing
       * else) and the closed list (which is empty since we havn't processed
       * any triangles yet). */
      open   = [circumcircle(vertices, n + 0, n + 1, n + 2)];
      closed = [];
      edges  = [];

      /* Incrementally add each vertex to the mesh. */
      for(i = indices.length; i--; edges.length = 0) {
        c = indices[i];

        /* For each open triangle, check to see if the current point is
         * inside it's circumcircle. If it is, remove the triangle and add
         * it's edges to an edge list. */
        for(j = open.length; j--; ) {
          /* If this point is to the right of this triangle's circumcircle,
           * then this triangle should never get checked again. Remove it
           * from the open list, add it to the closed list, and skip. */
          dx = vertices[c][0] - open[j].x;
          if(dx > 0.0 && dx * dx > open[j].r) {
            closed.push(open[j]);
            open.splice(j, 1);
            continue;
          }

          /* If we're outside the circumcircle, skip this triangle. */
          dy = vertices[c][1] - open[j].y;
          if(dx * dx + dy * dy - open[j].r > EPSILON)
            continue;

          /* Remove the triangle and add it's edges to the edge list. */
          edges.push(
            open[j].i, open[j].j,
            open[j].j, open[j].k,
            open[j].k, open[j].i
          );
          open.splice(j, 1);
        }

        /* Remove any doubled edges. */
        dedup(edges);

        /* Add a new triangle for each edge. */
        for(j = edges.length; j; ) {
          b = edges[--j];
          a = edges[--j];
          open.push(circumcircle(vertices, a, b, c));
        }
      }

      /* Copy any remaining open triangles to the closed list, and then
       * remove any triangles that share a vertex with the supertriangle,
       * building a list of triplets that represent triangles. */
      for(i = open.length; i--; )
        closed.push(open[i]);
      open.length = 0;

      for(i = closed.length; i--; )
        if(closed[i].i < n && closed[i].j < n && closed[i].k < n)
          open.push(closed[i].i, closed[i].j, closed[i].k);

      /* Yay, we're done! */
      return open;
    },
    contains: function(tri, p) {
      /* Bounding box test first, for quick rejections. */
      if((p[0] < tri[0][0] && p[0] < tri[1][0] && p[0] < tri[2][0]) ||
         (p[0] > tri[0][0] && p[0] > tri[1][0] && p[0] > tri[2][0]) ||
         (p[1] < tri[0][1] && p[1] < tri[1][1] && p[1] < tri[2][1]) ||
         (p[1] > tri[0][1] && p[1] > tri[1][1] && p[1] > tri[2][1]))
        return null;

      var a = tri[1][0] - tri[0][0],
          b = tri[2][0] - tri[0][0],
          c = tri[1][1] - tri[0][1],
          d = tri[2][1] - tri[0][1],
          i = a * d - b * c;

      /* Degenerate tri. */
      if(i === 0.0)
        return null;

      var u = (d * (p[0] - tri[0][0]) - b * (p[1] - tri[0][1])) / i,
          v = (a * (p[1] - tri[0][1]) - c * (p[0] - tri[0][0])) / i;

      /* If we're outside the tri, fail. */
      if(u < 0.0 || v < 0.0 || (u + v) > 1.0)
        return null;

      return [u, v];
    }
  };

  if(typeof module !== "undefined")
    module.exports = Delaunay;
})();

},{}],2:[function(require,module,exports){
var Delaunay = require('delaunay-fast');
var Color = require('./PrettyDelaunay/color');
var Random = require('./PrettyDelaunay/random');
var Triangle = require('./PrettyDelaunay/triangle');
var Point = require('./PrettyDelaunay/point');
var PointMap = require('./PrettyDelaunay/pointMap');

require('./PrettyDelaunay/polyfills')();

/**
* Represents a delauney triangulation of random points
* https://en.wikipedia.org/wiki/Delaunay_triangulation
*/
class PrettyDelaunay {
/**
 * @constructor
 */
constructor(canvas, options) {
  // merge given options with defaults
  let defaults = PrettyDelaunay.defaults();
  this.options = Object.assign({}, PrettyDelaunay.defaults(), (options || {}));
  this.options.gradient = Object.assign({}, defaults.gradient, options.gradient || {});

  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');

  this.resizeCanvas();
  this.points = [];
  this.colors = this.options.colors;
  this.pointMap = new PointMap();

  this.mousePosition = false;

  if (this.options.hover) {
    this.createHoverShadowCanvas();

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.options.animate) {
        var rect = canvas.getBoundingClientRect();
        this.mousePosition = new Point(e.clientX - rect.left, e.clientY - rect.top);
        this.hover();
      }
    }, false);

    this.canvas.addEventListener('mouseout', () => {
      if (!this.options.animate) {
        this.mousePosition = false;
        this.hover();
      }
    }, false);
  }

  // throttled window resize
  this.resizing = false;
  window.addEventListener('resize', ()=> {
    if (this.resizing) {
      return;
    }
    this.resizing = true;
    requestAnimationFrame(()=> {
      this.rescale();
      this.resizing = false;
    });
  });

  this.randomize();
}

static defaults() {
  return {
    // shows triangles - false will show the gradient behind
    showTriangles: true,
    // show the points that make the triangulation
    showPoints: false,
    // show the circles that define the gradient locations, sizes
    showCircles: false,
    // show triangle centroids
    showCentroids: false,
    // show triangle edges
    showEdges: true,
    // highlight hovered triangles
    hover: true,
    // multiplier for the number of points generated based on canvas size
    multiplier: 0.5,
    // whether to animate the gradients behind the triangles
    animate: false,
    // number of frames per gradient color cycle
    loopFrames: 250,

    // colors to use in the gradient
    colors: ['hsla(0, 0%, 100%, 1)', 'hsla(0, 0%, 50%, 1)', 'hsla(0, 0%, 0%, 1)'],

    // randomly choose from color palette on randomize if not supplied colors
    colorPalette: false,

    // use image as background instead of gradient
    imageAsBackground: false,

    // image to use as background
    imageURL: '',

    // how to resize the points
    resizeMode: 'scalePoints',
    // 'newPoints' - generates a new set of points for the new size
    // 'scalePoints' - linearly scales existing points and re-triangulates

    // events triggered when the center of the background
    // is greater or less than 50 lightness in hsla
    // intended to adjust some text that is on top
    // color is the color of the center of the canvas
    onDarkBackground: function() { return; },
    onLightBackground: function() { return; },

  	gradient: {
  		minX: (width, height) => Math.ceil(Math.sqrt(width)),
  		maxX: (width, height) => Math.ceil(width - Math.sqrt(width)),
  		minY: (width, height) => Math.ceil(Math.sqrt(height)),
  		maxY: (width, height) => Math.ceil(height - Math.sqrt(height)),
  		minRadius: (width, height, numGradients) => Math.ceil(Math.max(height, width) / Math.max(Math.sqrt(numGradients), 2)),
  		maxRadius: (width, height, numGradients) => Math.ceil(Math.max(height, width) / Math.max(Math.log(numGradients), 1)),
      connected: true
  	},

    minGradients: 1,
    maxGradients: 2,

    // triggered when hovered over triangle
    onTriangleHover: function(triangle, ctx, options) {
      var fill = options.hoverColor(triangle.color);
      var stroke = fill;
      triangle.render(ctx, options.showEdges ? fill : false, options.showEdges ? false : stroke);
    },

    // returns hsla color for triangle edge
    // as a function of the triangle fill color
    edgeColor: function(color) {
      color = Color.hslaAdjustLightness(color, function(lightness) {
        return (lightness + 200 - lightness * 2) / 3;
      });
      color = Color.hslaAdjustAlpha(color, 0.25);
      return color;
    },

    // returns hsla color for triangle point
    // as a function of the triangle fill color
    pointColor: function(color) {
      color = Color.hslaAdjustLightness(color, function(lightness) {
        return (lightness + 200 - lightness * 2) / 3;
      });
      color = Color.hslaAdjustAlpha(color, 1);
      return color;
    },

    // returns hsla color for triangle centroid
    // as a function of the triangle fill color
    centroidColor: function(color) {
      color = Color.hslaAdjustLightness(color, function(lightness) {
        return (lightness + 200 - lightness * 2) / 3;
      });
      color = Color.hslaAdjustAlpha(color, 0.25);
      return color;
    },

    // returns hsla color for triangle hover fill
    // as a function of the triangle fill color
    hoverColor: function(color) {
      color = Color.hslaAdjustLightness(color, function(lightness) {
        return 100 - lightness;
      });
      color = Color.hslaAdjustAlpha(color, 0.5);
      return color;
    },
  };
}

clear() {
  this.points = [];
  this.triangles = [];
  this.pointMap.clear();
  this.center = new Point(0, 0);
}

// clear and create a fresh set of random points
// all args are optional
randomize(min, max, minEdge, maxEdge, minGradients, maxGradients, multiplier, colors, imageURL) {
  // colors param is optional
  this.colors = colors ?
                  colors :
                  this.options.colorPalette ?
                    this.options.colorPalette[Random.randomBetween(0, this.options.colorPalette.length - 1)] :
                    this.colors;

  this.options.imageURL = imageURL ? imageURL : this.options.imageURL;
  this.options.imageAsBackground = !!this.options.imageURL;

  this.options.minGradients = minGradients || this.options.minGradients;
  this.options.maxGradients = maxGradients || this.options.maxGradients;

  this.resizeCanvas();

  this.generateNewPoints(min, max, minEdge, maxEdge, multiplier);

  this.triangulate();

  if (!this.options.imageAsBackground) {
    this.generateGradients();

    // prep for animation
    this.nextGradients = this.radialGradients.slice(0);
    this.generateGradients();
    this.currentGradients = this.radialGradients.slice(0);
  }

  this.render();

  if (this.options.animate && !this.looping) {
    this.initRenderLoop();
  }
}

initRenderLoop() {
  if (this.options.imageAsBackground) {
    return;
  }

  this.looping = true;
  this.frameSteps = this.options.loopFrames;
  this.frame = this.frame ? this.frame : this.frameSteps;
  this.renderLoop();
}

renderLoop() {
  this.frame++;

  // current => next, next => new
  if (this.frame > this.frameSteps) {
    var nextGradients = this.nextGradients ? this.nextGradients : this.radialGradients;
    this.generateGradients();
    this.nextGradients = this.radialGradients;
    this.radialGradients = nextGradients.slice(0);
    this.currentGradients = nextGradients.slice(0);

    this.frame = 0;
  } else {
    // fancy steps
    // {x0, y0, r0, x1, y1, r1, colorStop}
    for (var i = 0; i < Math.max(this.radialGradients.length, this.nextGradients.length); i++) {
      var currentGradient = this.currentGradients[i];
      var nextGradient = this.nextGradients[i];

      if (typeof currentGradient === 'undefined') {
        var newGradient = {
          x0: nextGradient.x0,
          y0: nextGradient.y0,
          r0: 0,
          x1: nextGradient.x1,
          y1: nextGradient.y1,
          r1: 0,
          colorStop: nextGradient.colorStop,
        };
        currentGradient = newGradient;
        this.currentGradients.push(newGradient);
        this.radialGradients.push(newGradient);
      }

      if (typeof nextGradient === 'undefined') {
        nextGradient = {
          x0: currentGradient.x0,
          y0: currentGradient.y0,
          r0: 0,
          x1: currentGradient.x1,
          y1: currentGradient.y1,
          r1: 0,
          colorStop: currentGradient.colorStop,
        };
      }

      var updatedGradient = {};

      // scale the difference between current and next gradient based on step in frames
      var scale = this.frame / this.frameSteps;

      updatedGradient.x0 = Math.round(linearScale(currentGradient.x0, nextGradient.x0, scale));
      updatedGradient.y0 = Math.round(linearScale(currentGradient.y0, nextGradient.y0, scale));
      updatedGradient.r0 = Math.round(linearScale(currentGradient.r0, nextGradient.r0, scale));
      updatedGradient.x1 = Math.round(linearScale(currentGradient.x1, nextGradient.x0, scale));
      updatedGradient.y1 = Math.round(linearScale(currentGradient.y1, nextGradient.y0, scale));
      updatedGradient.r1 = Math.round(linearScale(currentGradient.r1, nextGradient.r1, scale));
      updatedGradient.colorStop = linearScale(currentGradient.colorStop, nextGradient.colorStop, scale);

      this.radialGradients[i] = updatedGradient;
    }
  }

  this.resetPointColors();
  this.render();

  if (this.options.animate) {
    requestAnimationFrame(() => {
      this.renderLoop();
    });
  } else {
    this.looping = false;
  }
}

// creates a hidden canvas for hover detection
createHoverShadowCanvas() {
  this.hoverShadowCanvas = document.createElement('canvas');
  this.shadowCtx = this.hoverShadowCanvas.getContext('2d');

  this.hoverShadowCanvas.style.display = 'none';
}

generateNewPoints(min, max, minEdge, maxEdge, multiplier) {
  // defaults to generic number of points based on canvas dimensions
  // this generally looks pretty nice
  var area = this.canvas.width * this.canvas.height;
  var perimeter = (this.canvas.width + this.canvas.height) * 2;

  multiplier = multiplier || this.options.multiplier;

  min = min > 0 ? Math.ceil(min) : Math.max(Math.ceil((area / 1250) * multiplier), 50);
  max = max > 0 ? Math.ceil(max) : Math.max(Math.ceil((area / 500) * multiplier), 50);

  minEdge = minEdge > 0 ? Math.ceil(minEdge) : Math.max(Math.ceil((perimeter / 125) * multiplier), 5);
  maxEdge = maxEdge > 0 ? Math.ceil(maxEdge) : Math.max(Math.ceil((perimeter / 50) * multiplier), 5);

  this.numPoints = Random.randomBetween(min, max);
  this.getNumEdgePoints = Random.randomNumberFunction(minEdge, maxEdge);

  this.clear();

  // add corner and edge points
  this.generateCornerPoints();
  this.generateEdgePoints();

  // add some random points in the middle field,
  // excluding edges and corners
  this.generateRandomPoints(this.numPoints, 1, 1, this.width - 1, this.height - 1);
}

// add points in the corners
generateCornerPoints() {
  this.points.push(new Point(0, 0));
  this.points.push(new Point(0, this.height));
  this.points.push(new Point(this.width, 0));
  this.points.push(new Point(this.width, this.height));
}

// add points on the edges
generateEdgePoints() {
  // left edge
  this.generateRandomPoints(this.getNumEdgePoints(), 0, 0, 0, this.height);
  // right edge
  this.generateRandomPoints(this.getNumEdgePoints(), this.width, 0, 0, this.height);
  // bottom edge
  this.generateRandomPoints(this.getNumEdgePoints(), 0, this.height, this.width, 0);
  // top edge
  this.generateRandomPoints(this.getNumEdgePoints(), 0, 0, this.width, 0);
}

// randomly generate some points,
// save the point closest to center
generateRandomPoints(numPoints, x, y, width, height) {
  var center = new Point(Math.round(this.canvas.width / 2), Math.round(this.canvas.height / 2));
  for (var i = 0; i < numPoints; i++) {
    // generate a new point with random coords
    // re-generate the point if it already exists in pointmap (max 10 times)
    var point;
    var j = 0;
    do {
      j++;
      point = new Point(Random.randomBetween(x, x + width), Random.randomBetween(y, y + height));
    } while (this.pointMap.exists(point) && j < 10);

    if (j < 10) {
      this.points.push(point);
      this.pointMap.add(point);
    }

    if (center.getDistanceTo(point) < center.getDistanceTo(this.center)) {
      this.center = point;
    } else {
      this.center.isCenter = false;
    }
  }

  this.center.isCenter = true;
}

// use the Delaunay algorithm to make
// triangles out of our random points
triangulate() {
  this.triangles = [];

  // map point objects to length-2 arrays
  var vertices = this.points.map(function(point) {
    return point.getCoords();
  });

  // vertices is now an array such as:
  // [ [p1x, p1y], [p2x, p2y], [p3x, p3y], ... ]

  // do the algorithm
  var triangulated = Delaunay.triangulate(vertices);

  // returns 1 dimensional array arranged in triples such as:
  // [ t1a, t1b, t1c, t2a, t2b, t2c,.... ]
  // where t1a, etc are indeces in the vertices array
  // turn that into array of triangle points
  for (var i = 0; i < triangulated.length; i += 3) {
    var arr = [];
    arr.push(vertices[triangulated[i]]);
    arr.push(vertices[triangulated[i + 1]]);
    arr.push(vertices[triangulated[i + 2]]);
    this.triangles.push(arr);
  }

  // map to array of Triangle objects
  this.triangles = this.triangles.map(function(triangle) {
    return new Triangle(new Point(triangle[0]),
                        new Point(triangle[1]),
                        new Point(triangle[2]));
  });
}

resetPointColors() {
  // reset cached colors of centroids and points
  var i;
  for (i = 0; i < this.triangles.length; i++) {
    this.triangles[i].resetPointColors();
  }

  for (i = 0; i < this.points.length; i++) {
    this.points[i].resetColor();
  }
}

// create random radial gradient circles for rendering later
generateGradients(minGradients, maxGradients) {
  this.radialGradients = [];

  minGradients = minGradients || this.options.minGradients;
  maxGradients = maxGradients || this.options.maxGradients;

  this.numGradients = Random.randomBetween(minGradients, maxGradients);

  for (var i = 0; i < this.numGradients; i++) {
    this.generateRadialGradient();
  }
}

generateRadialGradient() {
  /**
    * create a nice-looking but somewhat random gradient:
    * randomize the first circle
    * the second circle should be inside the first circle,
    * so we generate a point (origin2) inside cirle1
    * then calculate the dist between origin2 and the circumfrence of circle1
    * circle2's radius can be between 0 and this dist
    */

  var minX = this.options.gradient.minX(this.canvas.width, this.canvas.height);
  var maxX = this.options.gradient.maxX(this.canvas.width, this.canvas.height);

  var minY = this.options.gradient.minY(this.canvas.width, this.canvas.height);
  var maxY = this.options.gradient.maxY(this.canvas.width, this.canvas.height);

  var minRadius = this.options.gradient.minRadius(this.canvas.width, this.canvas.height, this.numGradients);
  var maxRadius = this.options.gradient.maxRadius(this.canvas.width, this.canvas.height, this.numGradients);

  // helper random functions
  var randomCanvasX = Random.randomNumberFunction(minX, maxX);
  var randomCanvasY = Random.randomNumberFunction(minY, maxY);
  var randomCanvasRadius = Random.randomNumberFunction(minRadius, maxRadius);

  // generate circle1 origin and radius
  var x0;
  var y0;
  var r0 = randomCanvasRadius();

  // origin of the next circle should be contained
  // within the area of its predecessor
  if (this.options.gradient.connected && this.radialGradients.length > 0) {
    var lastGradient = this.radialGradients[this.radialGradients.length - 1];
    var pointInLastCircle = Random.randomInCircle(lastGradient.r0, lastGradient.x0, lastGradient.y0);

    x0 = pointInLastCircle.x;
    y0 = pointInLastCircle.y;
  } else {
    // first circle, just pick at random
    x0 = randomCanvasX();
    y0 = randomCanvasY();
  }

  // find a random point inside circle1
  // this is the origin of circle 2
  var pointInCircle = Random.randomInCircle(r0 * 0.09, x0, y0);

  // grab the x/y coords
  var x1 = pointInCircle.x;
  var y1 = pointInCircle.y;

  // find distance between the point and the circumfrience of circle1
  // the radius of the second circle will be a function of this distance
  var vX = x1 - x0;
  var vY = y1 - y0;
  var magV = Math.sqrt(vX * vX + vY * vY);
  var aX = x0 + vX / magV * r0;
  var aY = y0 + vY / magV * r0;

  var dist = Math.sqrt((x1 - aX) * (x1 - aX) + (y1 - aY) * (y1 - aY));

  // generate the radius of circle2 based on this distance
  var r1 = Random.randomBetween(1, Math.sqrt(dist));

  // random but nice looking color stop
  var colorStop = Random.randomBetween(2, 8) / 10;

  this.radialGradients.push({x0, y0, r0, x1, y1, r1, colorStop});
}

// sorts the points
sortPoints() {
  // sort points
  this.points.sort(function(a, b) {
    // sort the point
    if (a.x < b.x) {
      return -1;
    } else if (a.x > b.x) {
      return 1;
    } else if (a.y < b.y) {
      return -1;
    } else if (a.y > b.y) {
      return 1;
    } else {
      return 0;
    }
  });
}

// size the canvas to the size of its parent
// makes the canvas 'responsive'
resizeCanvas() {
  var parent = this.canvas.parentElement;
  this.canvas.width = this.width = parent.offsetWidth;
  this.canvas.height = this.height = parent.offsetHeight;

  if (this.hoverShadowCanvas) {
    this.hoverShadowCanvas.width = this.width = parent.offsetWidth;
    this.hoverShadowCanvas.height = this.height = parent.offsetHeight;
  }
}

// moves points/triangles based on new size of canvas
rescale() {
  // grab old max/min from current canvas size
  var xMin = 0;
  var xMax = this.canvas.width;
  var yMin = 0;
  var yMax = this.canvas.height;

  this.resizeCanvas();

  if (this.options.resizeMode === 'scalePoints') {
    // scale all points to new max dimensions
    for (var i = 0; i < this.points.length; i++) {
      this.points[i].rescale(xMin, xMax, yMin, yMax, 0, this.canvas.width, 0, this.canvas.height);
    }
  } else {
    this.generateNewPoints();
  }

  this.triangulate();

  // rescale position of radial gradient circles
  this.rescaleGradients(this.radialGradients, xMin, xMax, yMin, yMax);
  this.rescaleGradients(this.currentGradients, xMin, xMax, yMin, yMax);
  this.rescaleGradients(this.nextGradients, xMin, xMax, yMin, yMax);

  this.render();
}

rescaleGradients(array, xMin, xMax, yMin, yMax) {
  for (var i = 0; i < array.length; i++) {
    var circle0 = new Point(array[i].x0, array[i].y0);
    var circle1 = new Point(array[i].x1, array[i].y1);

    circle0.rescale(xMin, xMax, yMin, yMax, 0, this.canvas.width, 0, this.canvas.height);
    circle1.rescale(xMin, xMax, yMin, yMax, 0, this.canvas.width, 0, this.canvas.height);

    array[i].x0 = circle0.x;
    array[i].y0 = circle0.y;
    array[i].x1 = circle1.x;
    array[i].y1 = circle1.y;
  }
}

hover() {
  if (this.mousePosition) {
    var rgb = this.mousePosition.canvasColorAtPoint(this.shadowImageData, 'rgb');
    var hex = Color.rgbToHex(rgb);
    var dec = parseInt(hex, 16);

    // is probably triangle with that index, but
    // edges can be fuzzy so double check
    if (dec >= 0 && dec < this.triangles.length && this.triangles[dec].pointInTriangle(this.mousePosition)) {
      // clear the last triangle
      this.resetTriangle();

      if (this.lastTriangle !== dec) {
        // render the hovered triangle
        this.options.onTriangleHover(this.triangles[dec], this.ctx, this.options);
      }

      this.lastTriangle = dec;
    }
  } else {
    this.resetTriangle();
  }
}

resetTriangle() {
  // redraw the last triangle that was hovered over
  if (this.lastTriangle && this.lastTriangle >= 0 && this.lastTriangle < this.triangles.length) {
    var lastTriangle = this.triangles[this.lastTriangle];

    // find the bounding points of the last triangle
    // expand a bit for edges
    var minX = lastTriangle.minX() - 1;
    var minY = lastTriangle.minY() - 1;
    var maxX = lastTriangle.maxX() + 1;
    var maxY = lastTriangle.maxY() + 1;

    // reset that portion of the canvas to its original render
    this.ctx.putImageData(this.renderedImageData, 0, 0, minX, minY, maxX - minX, maxY - minY);

    this.lastTriangle = false;
  }
}

render() {
  this.renderBackground(this.renderForeground.bind(this));
}

renderBackground(callback) {
  // render the base to get triangle colors
  if (this.options.imageAsBackground) {
    this.renderImageBackground(callback);
  } else {
    this.renderGradient();
    callback();
  }
}

renderForeground() {
  // get entire canvas image data of in a big typed array
  // this way we dont have to pick for each point individually
  // it's like 50x faster this way
  this.gradientImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

  // renders triangles, edges, and shadow canvas for hover detection
  this.renderTriangles(this.options.showTriangles, this.options.showEdges);

  this.renderExtras();

  this.renderedImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

  // throw events for light / dark text
  var centerColor = this.center.canvasColorAtPoint();

  if (parseInt(centerColor.split(',')[2]) < 50) {
    if (this.options.onDarkBackground) {
      this.options.onDarkBackground(centerColor);
    }
  } else {
    if (this.options.onLightBackground) {
      this.options.onLightBackground(centerColor);
    }
  }
}

renderExtras() {
  if (this.options.showPoints) {
    this.renderPoints();
  }

  if (this.options.showCircles && !this.options.imageAsBackground) {
    this.renderGradientCircles();
  }

  if (this.options.showCentroids) {
    this.renderCentroids();
  }
}

renderNewColors(colors) {
  this.colors = colors || this.colors;
  // triangle centroids need new colors
  this.resetPointColors();
  this.render();
}

renderNewGradient(minGradients, maxGradients) {
  this.generateGradients(minGradients, maxGradients);

  // prep for animation
  this.nextGradients = this.radialGradients.slice(0);
  this.generateGradients();
  this.currentGradients = this.radialGradients.slice(0);

  this.resetPointColors();
  this.render();
}

renderNewTriangles(min, max, minEdge, maxEdge, multiplier) {
  this.generateNewPoints(min, max, minEdge, maxEdge, multiplier);
  this.triangulate();
  this.render();
}

renderGradient() {
  for (var i = 0; i < this.radialGradients.length; i++) {
    // create the radial gradient based on
    // the generated circles' radii and origins
    var radialGradient = this.ctx.createRadialGradient(
      this.radialGradients[i].x0,
      this.radialGradients[i].y0,
      this.radialGradients[i].r0,
      this.radialGradients[i].x1,
      this.radialGradients[i].y1,
      this.radialGradients[i].r1
    );

    var outerColor = this.colors[2];

    // must be transparent version of middle color
    // this works for rgba and hsla
    if (i > 0) {
      outerColor = this.colors[1].split(',');
      outerColor[3] = '0)';
      outerColor = outerColor.join(',');
    }

    radialGradient.addColorStop(1, this.colors[0]);
    radialGradient.addColorStop(this.radialGradients[i].colorStop, this.colors[1]);
    radialGradient.addColorStop(0, outerColor);

    this.canvas.parentElement.style.backgroundColor = this.colors[2];

    this.ctx.fillStyle = radialGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

renderImageBackground(callback) {
  this.loadImageBackground((function() {
    // scale image to fit width/height of canvas
    let heightMultiplier = this.canvas.height / this.image.height;
    let widthMultiplier = this.canvas.width / this.image.width;

    let multiplier = Math.max(heightMultiplier, widthMultiplier);

    this.ctx.drawImage(this.image, 0, 0, this.image.width * multiplier, this.image.height * multiplier);

    callback();
  }).bind(this));
}

loadImageBackground(callback) {
  if (this.image && this.image.src === this.options.imageURL) {
    callback();
  } else {
    this.image = new Image();
    this.image.crossOrigin = 'Anonymous';
    this.image.src = this.options.imageURL;

    this.image.onload = callback;
  }
}

renderTriangles(triangles, edges) {
  // save this for later
  this.center.canvasColorAtPoint(this.gradientImageData);

  for (var i = 0; i < this.triangles.length; i++) {
    // the color is determined by grabbing the color of the canvas
    // (where we drew the gradient) at the center of the triangle

    this.triangles[i].color = this.triangles[i].colorAtCentroid(this.gradientImageData);

    if (triangles && edges) {
      this.triangles[i].stroke = this.options.edgeColor(this.triangles[i].colorAtCentroid(this.gradientImageData));
      this.triangles[i].render(this.ctx);
    } else if (triangles) {
      // triangles only
      this.triangles[i].stroke = this.triangles[i].color;
      this.triangles[i].render(this.ctx);
    } else if (edges) {
      // edges only
      this.triangles[i].stroke = this.options.edgeColor(this.triangles[i].colorAtCentroid(this.gradientImageData));
      this.triangles[i].render(this.ctx, false);
    }

    if (this.hoverShadowCanvas) {
      var color = '#' + ('000000' + i.toString(16)).slice(-6);
      this.triangles[i].render(this.shadowCtx, color, false);
    }
  }

  if (this.hoverShadowCanvas) {
    this.shadowImageData = this.shadowCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
}

// renders the points of the triangles
renderPoints() {
  for (var i = 0; i < this.points.length; i++) {
    var color = this.options.pointColor(this.points[i].canvasColorAtPoint(this.gradientImageData));
    this.points[i].render(this.ctx, color);
  }
}

// draws the circles that define the gradients
renderGradientCircles() {
  for (var i = 0; i < this.radialGradients.length; i++) {
    this.ctx.beginPath();
    this.ctx.arc(this.radialGradients[i].x0,
            this.radialGradients[i].y0,
            this.radialGradients[i].r0,
            0, Math.PI * 2, true);
    var center1 = new Point(this.radialGradients[i].x0, this.radialGradients[i].y0);
    this.ctx.strokeStyle = center1.canvasColorAtPoint(this.gradientImageData);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(this.radialGradients[i].x1,
            this.radialGradients[i].y1,
            this.radialGradients[i].r1,
            0, Math.PI * 2, true);
    var center2 = new Point(this.radialGradients[i].x1, this.radialGradients[i].y1);
    this.ctx.strokeStyle = center2.canvasColorAtPoint(this.gradientImageData);
    this.ctx.stroke();
  }
}

// render triangle centroids
renderCentroids() {
  for (var i = 0; i < this.triangles.length; i++) {
    var color = this.options.centroidColor(this.triangles[i].colorAtCentroid(this.gradientImageData));
    this.triangles[i].centroid().render(this.ctx, color);
  }
}

toggleTriangles() {
  this.options.showTriangles = !this.options.showTriangles;
  this.render();
}

togglePoints() {
  this.options.showPoints = !this.options.showPoints;
  this.render();
}

toggleCircles() {
  this.options.showCircles = !this.options.showCircles;
  this.render();
}

toggleCentroids() {
  this.options.showCentroids = !this.options.showCentroids;
  this.render();
}

toggleEdges() {
  this.options.showEdges = !this.options.showEdges;
  this.render();
}

toggleAnimation() {
  this.options.animate = !this.options.animate;
  if (this.options.animate) {
    this.initRenderLoop();
  }
}

getColors() {
  return this.colors;
}
}

function linearScale(x0, x1, scale) {
return x0 + (scale * (x1 - x0));
}

module.exports = PrettyDelaunay;

},{"./PrettyDelaunay/color":3,"./PrettyDelaunay/point":4,"./PrettyDelaunay/pointMap":5,"./PrettyDelaunay/polyfills":6,"./PrettyDelaunay/random":7,"./PrettyDelaunay/triangle":8,"delaunay-fast":1}],3:[function(require,module,exports){
var Color;

(function() {
  'use strict';
  // color helper functions
  Color = {

    hexToRgba: function(hex) {
      hex = hex.replace('#', '');
      var r = parseInt(hex.substring(0, 2), 16);
      var g = parseInt(hex.substring(2, 4), 16);
      var b = parseInt(hex.substring(4, 6), 16);

      return 'rgba(' + r + ',' + g + ',' + b + ',1)';
    },

    hexToRgbaArray: function(hex) {
      hex = hex.replace('#', '');
      var r = parseInt(hex.substring(0, 2), 16);
      var g = parseInt(hex.substring(2, 4), 16);
      var b = parseInt(hex.substring(4, 6), 16);

      return [r, g, b];
    },

    /**
     * Converts an RGB color value to HSL. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes r, g, and b are contained in the set [0, 255] and
     * returns h, s, and l in the set [0, 1].
     *
     * @param   Number  r       The red color value
     * @param   Number  g       The green color value
     * @param   Number  b       The blue color value
     * @return  Array           The HSL representation
     */
    rgbToHsla: function(rgb) {
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      var max = Math.max(r, g, b);
      var min = Math.min(r, g, b);
      var h;
      var s;
      var l = (max + min) / 2;

      if (max === min) {
        h = s = 0; // achromatic
      } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return 'hsla(' + Math.round(h * 360) + ',' + Math.round(s * 100) + '%,' + Math.round(l * 100) + '%,1)';
    },

    hslaAdjustAlpha: function(color, alpha) {
      color = color.split(',');

      if (typeof alpha !== 'function') {
        color[3] = alpha;
      } else {
        color[3] = alpha(parseInt(color[3]));
      }

      color[3] += ')';
      return color.join(',');
    },

    hslaAdjustLightness: function(color, lightness) {
      color = color.split(',');

      if (typeof lightness !== 'function') {
        color[2] = lightness;
      } else {
        color[2] = lightness(parseInt(color[2]));
      }

      color[2] += '%';
      return color.join(',');
    },

    rgbToHex: function(rgb) {
      if (typeof rgb === 'string') {
        rgb = rgb.replace('rgb(', '').replace(')', '').split(',');
      }
      rgb = rgb.map(function(x) {
        x = parseInt(x).toString(16);
        return (x.length === 1) ? '0' + x : x;
      });
      return rgb.join('');
    },
  };

  if (typeof module !== 'undefined') {
    module.exports = Color;
  }

})();

},{}],4:[function(require,module,exports){
var Point;

(function() {
  'use strict';

  var Color = Color || require('./color');

  /**
   * Represents a point
   * @class
   */
  class _Point {
    /**
     * Point consists x and y
     * @constructor
     * @param {Number} x
     * @param {Number} y
     * or:
     * @param {Number[]} x
     * where x is length-2 array
     */
    constructor(x, y) {
      if (Array.isArray(x)) {
        y = x[1];
        x = x[0];
      }
      this.x = x;
      this.y = y;
      this.radius = 1;
      this.color = 'black';
    }

    // draw the point
    render(ctx, color) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = color || this.color;
      ctx.fill();
      ctx.closePath();
    }

    // converts to string
    // returns something like:
    // "(X,Y)"
    // used in the pointmap to detect unique points
    toString() {
      return '(' + this.x + ',' + this.y + ')';
    }

    // grab the color of the canvas at the point
    // requires imagedata from canvas so we dont grab
    // each point individually, which is really expensive
    canvasColorAtPoint(imageData, colorSpace) {
      colorSpace = colorSpace || 'hsla';
      // only find the canvas color if we dont already know it
      if (!this._canvasColor) {
        // imageData array is flat, goes by rows then cols, four values per pixel
        var idx = (Math.floor(this.y) * imageData.width * 4) + (Math.floor(this.x) * 4);

        if (colorSpace === 'hsla') {
          this._canvasColor = Color.rgbToHsla(Array.prototype.slice.call(imageData.data, idx, idx + 4));
        } else {
          this._canvasColor = 'rgb(' + Array.prototype.slice.call(imageData.data, idx, idx + 3).join() + ')';
        }
      } else {
        return this._canvasColor;
      }
      return this._canvasColor;
    }

    getCoords() {
      return [this.x, this.y];
    }

    // distance to another point
    getDistanceTo(point) {
      // √(x2−x1)2+(y2−y1)2
      return Math.sqrt(Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2));
    }

    // scale points from [A, B] to [C, D]
    // xA => old x min, xB => old x max
    // yA => old y min, yB => old y max
    // xC => new x min, xD => new x max
    // yC => new y min, yD => new y max
    rescale(xA, xB, yA, yB, xC, xD, yC, yD) {
      // NewValue = (((OldValue - OldMin) * NewRange) / OldRange) + NewMin

      var xOldRange = xB - xA;
      var yOldRange = yB - yA;

      var xNewRange = xD - xC;
      var yNewRange = yD - yC;

      this.x = (((this.x - xA) * xNewRange) / xOldRange) + xC;
      this.y = (((this.y - yA) * yNewRange) / yOldRange) + yC;
    }

    resetColor() {
      this._canvasColor = undefined;
    }
  }

  if (typeof module !== 'undefined') {
    module.exports = _Point;
  }

  Point = _Point;
})();

},{"./color":3}],5:[function(require,module,exports){
var PointMap;

(function() {
  'use strict';

  var Point = Point || require('./point');

  /**
   * Represents a point
   * @class
   */
  class _PointMap {
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
    removeCoord(x, y) {
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

  if (typeof module !== 'undefined') {
    module.exports = _PointMap;
  }

  PointMap = _PointMap;
})();

},{"./point":4}],6:[function(require,module,exports){
(function() {
  'use strict';

  function polyfills() {
    // polyfill for Object.assign
    if (typeof Object.assign !== 'function') {
      Object.assign = function(target) {
        if (target === undefined || target === null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
          var source = arguments[index];
          if (source !== undefined && source !== null) {
            for (var nextKey in source) {
              if (source.hasOwnProperty(nextKey)) {
                output[nextKey] = source[nextKey];
              }
            }
          }
        }
        return output;
      };
    }
  }

  module.exports = polyfills;

})();

},{}],7:[function(require,module,exports){
var Random;

(function() {
  'use strict';
  // Random helper functions// random helper functions

  var Point = Point || require('./point');

  Random = {
    // hey look a closure
    // returns function for random numbers with pre-set max and min
    randomNumberFunction: function(max, min) {
      min = min || 0;
      if (min > max) {
        var temp = max;
        max = min;
        min = temp;
      }
      return function() {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };
    },

    // returns a random number
    // between the max and min
    randomBetween: function(max, min) {
      min = min || 0;
      return Random.randomNumberFunction(max, min)();
    },

    randomInCircle: function(radius, ox, oy) {
      var angle = Math.random() * Math.PI * 2;
      var rad = Math.sqrt(Math.random()) * radius;
      var x = ox + rad * Math.cos(angle);
      var y = oy + rad * Math.sin(angle);

      return new Point(x, y);
    },

    randomRgba: function() {
      return 'rgba(' + Random.randomBetween(255) + ',' +
                       Random.randomBetween(255) + ',' +
                       Random.randomBetween(255) + ', 1)';
    },

    randomHsla: function() {
      return 'hsla(' + Random.randomBetween(360) + ',' +
                       Random.randomBetween(100) + '%,' +
                       Random.randomBetween(100) + '%, 1)';
    },
  };

  if (typeof module !== 'undefined') {
    module.exports = Random;
  }

})();

},{"./point":4}],8:[function(require,module,exports){
var Triangle;

(function() {
  'use strict';

  var Point = Point || require('./point');

  /**
   * Represents a triangle
   * @class
   */
  class _Triangle {
    /**
     * Triangle consists of three Points
     * @constructor
     * @param {Object} a
     * @param {Object} b
     * @param {Object} c
     */
    constructor(a, b, c) {
      this.p1 = this.a = a;
      this.p2 = this.b = b;
      this.p3 = this.c = c;

      this.color = 'black';
      this.stroke = 'black';
    }

    // draw the triangle with differing edge colors optional
    render(ctx, color, stroke) {
      ctx.beginPath();
      ctx.moveTo(this.a.x, this.a.y);
      ctx.lineTo(this.b.x, this.b.y);
      ctx.lineTo(this.c.x, this.c.y);
      ctx.closePath();
      ctx.strokeStyle = stroke || this.stroke || this.color;
      ctx.fillStyle = color || this.color;
      if (color !== false && stroke !== false) {
        // draw the stroke using the fill color first
        // so that the points of adjacent triangles
        // dont overlap a bunch and look "starry"
        var tempStroke = ctx.strokeStyle;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.stroke();
        ctx.strokeStyle = tempStroke;
      }
      if (color !== false) {
        ctx.fill();
      }
      if (stroke !== false) {
        ctx.stroke();
      }
      ctx.closePath();
    }

    // random point inside triangle
    randomInside() {
      var r1 = Math.random();
      var r2 = Math.random();
      var x = (1 - Math.sqrt(r1)) *
              this.p1.x + (Math.sqrt(r1) *
              (1 - r2)) *
              this.p2.x + (Math.sqrt(r1) * r2) *
              this.p3.x;
      var y = (1 - Math.sqrt(r1)) *
              this.p1.y + (Math.sqrt(r1) *
              (1 - r2)) *
              this.p2.y + (Math.sqrt(r1) * r2) *
              this.p3.y;
      return new Point(x, y);
    }

    colorAtCentroid(imageData) {
      return this.centroid().canvasColorAtPoint(imageData);
    }

    resetPointColors() {
      this.centroid().resetColor();
      this.p1.resetColor();
      this.p2.resetColor();
      this.p3.resetColor();
    }

    centroid() {
      // only calc the centroid if we dont already know it
      if (this._centroid) {
        return this._centroid;
      } else {
        var x = Math.round((this.p1.x + this.p2.x + this.p3.x) / 3);
        var y = Math.round((this.p1.y + this.p2.y + this.p3.y) / 3);
        this._centroid = new Point(x, y);

        return this._centroid;
      }
    }

    // http://stackoverflow.com/questions/13300904/determine-whether-point-lies-inside-triangle
    pointInTriangle(point) {
      var alpha = ((this.p2.y - this.p3.y) * (point.x - this.p3.x) + (this.p3.x - this.p2.x) * (point.y - this.p3.y)) /
                ((this.p2.y - this.p3.y) * (this.p1.x - this.p3.x) + (this.p3.x - this.p2.x) * (this.p1.y - this.p3.y));
      var beta = ((this.p3.y - this.p1.y) * (point.x - this.p3.x) + (this.p1.x - this.p3.x) * (point.y - this.p3.y)) /
               ((this.p2.y - this.p3.y) * (this.p1.x - this.p3.x) + (this.p3.x - this.p2.x) * (this.p1.y - this.p3.y));
      var gamma = 1.0 - alpha - beta;

      return (alpha > 0 && beta > 0 && gamma > 0);
    }

    // scale points from [A, B] to [C, D]
    // xA => old x min, xB => old x max
    // yA => old y min, yB => old y max
    // xC => new x min, xD => new x max
    // yC => new y min, yD => new y max
    rescalePoints(xA, xB, yA, yB, xC, xD, yC, yD) {
      this.p1.rescale(xA, xB, yA, yB, xC, xD, yC, yD);
      this.p2.rescale(xA, xB, yA, yB, xC, xD, yC, yD);
      this.p3.rescale(xA, xB, yA, yB, xC, xD, yC, yD);
      // recalculate the centroid
      this.centroid();
    }

    maxX() {
      return Math.max(this.p1.x, this.p2.x, this.p3.x);
    }

    maxY() {
      return Math.max(this.p1.y, this.p2.y, this.p3.y);
    }

    minX() {
      return Math.min(this.p1.x, this.p2.x, this.p3.x);
    }

    minY() {
      return Math.min(this.p1.y, this.p2.y, this.p3.y);
    }

    getPoints() {
      return [this.p1, this.p2, this.p3];
    }
  }

  if (typeof module !== 'undefined') {
    module.exports = _Triangle;
  }

  Triangle = _Triangle;
})();

},{"./point":4}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.initWeightedSubheadIndeces = initWeightedSubheadIndeces;
exports.randomSubhead = randomSubhead;
var body = document.getElementsByTagName('body')[0];

var weightedSubheadIndeces = [];
var currentSubhead = {};
var currentSubheadIndex = void 0;

// add index to array "weight" number of times
// so an item with weight `2` will be added twice
function initWeightedSubheadIndeces() {
	for (var i = 0; i < subheads.length; i++) {
		for (var j = 0; j < subheads[i].weight; j++) {
			weightedSubheadIndeces.push(i);
		}
	}
}

// swap the hero subhead with something (weighted, sequence optional)
// random from the list of subheads
function randomSubhead() {
	if (!weightedSubheadIndeces.length) {
		initWeightedSubheadIndeces();
	}

	var i = void 0;
	var newSubhead = void 0;

	// if current has a next, use next
	// this is for jokes
	if (currentSubhead.next) {
		newSubhead = currentSubhead.next;
	} else {
		// choose an index from the weighted array
		// weighted array contains indeces from subhead data array
		do {
			i = Math.floor(Math.random() * weightedSubheadIndeces.length);
		} while (weightedSubheadIndeces[i] === currentSubheadIndex);

		// actual index from weighted array
		currentSubheadIndex = weightedSubheadIndeces[i];

		// save current subhead data so we can look at "next" later
		newSubhead = subheads[currentSubheadIndex];
	}

	if (!newSubhead.title && currentSubhead.title !== defaultTitle) {
		newSubhead.title = defaultTitle;
	}

	return currentSubhead = newSubhead;
}

var colorPalette = exports.colorPalette = [['hsla(330, 100%, 56%, 1)', 'hsla(320, 56%, 67%, 1)', 'hsla(255, 100%, 100%, 1)'], ['hsla(252, 85%, 66%, 1)', 'hsla(258, 77%, 80%, 1)', 'hsla(255, 100%, 100%, 1)'], ['hsla(177, 84%, 43%, 1)', 'hsla(171, 70%, 69%, 1)', 'hsla(255, 100%, 100%, 1)'], ['hsla(246, 70%, 47%, 1)', 'hsla(230, 55%, 64%, 1)', 'hsla(255, 100%, 100%, 1)']];

var prettyDelaunayOptions = exports.prettyDelaunayOptions = {
	// colors for triangulation to choose from
	// start with just pink
	colorPalette: [colorPalette[0]],
	showEdges: false,
	animate: true,
	gradient: {
		minY: function minY(width, height) {
			return -0.5 * height;
		},
		maxY: function maxY(width, height) {
			return 0;
		},
		minX: function minX(width, height) {
			return -0.2 * width;
		},
		maxX: function maxX(width, height) {
			return 1.2 * width;
		},
		minRadius: function minRadius(width, height, numGradients) {
			return height * 0.8;
		},
		maxRadius: function maxRadius(width, height, numGradients) {
			return height;
		},
		connected: false
	},
	minGradients: 4,
	maxGradients: 8,
	loopFrames: 200
};

var defaultTitle = exports.defaultTitle = 'Cristina Shaver.';

// list of weighted subheads
var subheads = exports.subheads = [{
	text: 'Web Developer.',
	weight: 10
}, {
	title: 'Critical Miss.',
	text: 'Hell on quads.',
	weight: 10
}, {
	text: 'Dungeon Master.',
	weight: 10
}, {
	text: 'Crazy Cat Lady.',
	weight: 10
}, {
	text: 'Taco Bell Junkie.',
	weight: 10
}, {
	text: 'Pokémon Master.',
	weight: 10
}, {
	text: 'Probably a Wizard?',
	weight: 10
}, {
	text: 'Magical Girl.',
	weight: 10
}, {
	text: 'What do you call a nosey pepper?',
	weight: 4,
	next: {
		text: 'Jalapeño business!'
	}
}];

},{}],10:[function(require,module,exports){
'use strict';

var _constants = require('./constants');

var constants = _interopRequireWildcard(_constants);

var _prettyDelaunay = require('./utilities/pretty-delaunay');

var prettyDelaunay = _interopRequireWildcard(_prettyDelaunay);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var header = document.getElementById('header');

var title = document.getElementById('title');
var subhead = document.getElementById('subhead');

header.addEventListener('click', function (e) {
	prettyDelaunay.generatePrettyDelaunay();

	var randomSubhead = constants.randomSubhead();
	subhead.innerHTML = randomSubhead.text;

	if (randomSubhead.title) {
		title.innerHTML = randomSubhead.title;
	}
});

},{"./constants":9,"./utilities/pretty-delaunay":11}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.generatePrettyDelaunay = generatePrettyDelaunay;

var _constants = require('../constants');

var constants = _interopRequireWildcard(_constants);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var canvas = document.getElementById('delaunayHero');
var PrettyDelaunay = require('pretty-delaunay');

// init delaunay plugin and get one triangulation
var delaunay = new PrettyDelaunay(canvas, constants.prettyDelaunayOptions);

generatePrettyDelaunay(true);

delaunay.options.colorPalette = constants.colorPalette;

function generatePrettyDelaunay(firstTime) {
	// generate a random multiplier between max and min
	var max = 0.8;
	var min = 0.2;
	var multiplier = Math.random() * (max - min) + min;

	delaunay.options.multiplier = multiplier;

	if (!firstTime) {
		// randomize is run on init, so we dont need to do it again
		delaunay.randomize();
	}
}

},{"../constants":9,"pretty-delaunay":2}]},{},[10]);
