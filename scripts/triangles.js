(function() {
  // see http://paulbourke.net/papers/triangulate/
  'use strict';

  // random helper functions
  class Random {
    // hey look a closure
    // returns function for random numbers with pre-set max and min
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

    static randomRgba() {
      return 'rgba(' + Random.randomBetween(255) + ',' + Random.randomBetween(255) + ',' + Random.randomBetween(255) + ', 1)';
    }

    static randomHsla() {
      return 'hsla(' + Random.randomBetween(360) + ',' + Random.randomBetween(100) + '%,' + Random.randomBetween(100) + '%, 1)';
    }
  }

  /**
   * Represents a triangle
   * @class
   */
  class Triangle {
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
      var x = (1 - Math.sqrt(r1)) * this.p1.x + (Math.sqrt(r1) * (1 - r2)) * this.p2.x + (Math.sqrt(r1) * r2) * this.p3.x;
      var y = (1 - Math.sqrt(r1)) * this.p1.y + (Math.sqrt(r1) * (1 - r2)) * this.p2.y + (Math.sqrt(r1) * r2) * this.p3.y;
      return new Point(x, y);
    }

    colorAtCentroid(imageData) {
      return this.centroid().canvasColorAtPoint(imageData);
    }

    centroid() {
      // only calc the centroid if we dont already know it
      if (this._centroid) {
        return this._centroid;
      }
      else {
        var x = Math.round((this.p1.x + this.p2.x + this.p3.x) / 3);
        var y = Math.round((this.p1.y + this.p2.y + this.p3.y) / 3);
        this._centroid = new Point(x, y);

        return this._centroid;
      }
    }

    // http://stackoverflow.com/questions/13300904/determine-whether-point-lies-inside-triangle
    pointInTriangle(point) {
      var alpha = ((this.p2.y - this.p3.y)*(point.x - this.p3.x) + (this.p3.x - this.p2.x)*(point.y - this.p3.y)) /
                  ((this.p2.y - this.p3.y)*(this.p1.x - this.p3.x) + (this.p3.x - this.p2.x)*(this.p1.y - this.p3.y));
      var beta = ((this.p3.y - this.p1.y)*(point.x - this.p3.x) + (this.p1.x - this.p3.x)*(point.y - this.p3.y)) /
                 ((this.p2.y - this.p3.y)*(this.p1.x - this.p3.x) + (this.p3.x - this.p2.x)*(this.p1.y - this.p3.y));
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

    getPoints() {
      return [this.p1, this.p2, this.p3];
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
     * accepts either:
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
      return '(' + this.x + ',' + this.y + ')' ;
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
          this._canvasColor = rgbToHsla(Array.prototype.slice.call(imageData.data, idx, idx + 4));
        }
        else {
          this._canvasColor = 'rgb(' + Array.prototype.slice.call(imageData.data, idx, idx + 3).join() + ')';
        }
      }
      else {
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
    constructor(canvas, options) {
      // merge given options with defaults
      this.options = Object.assign({}, this.defaults(), (options || {}));

      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.resizeCanvas();
      this.points = [];
      this.colors = ['white', 'white', 'white']
      this.pointMap = new PointMap();

      this.mousePosition = false;

      if (this.options.hover) {
        this.createShadowCanvas();

        this.canvas.addEventListener('mousemove', (e) => {
          var rect = canvas.getBoundingClientRect();
          this.mousePosition = new Point(e.clientX - rect.left, e.clientY - rect.top);
          this.hover();
        }, false);

        this.canvas.addEventListener('mouseout', (e) => {
          this.mousePosition = false;
          this.hover();
        }, false);
      }
    }

    defaults() {
      return {
        showTriangles: true,
        showPoints: false,
        showCircles: false,
        showCentroids: false,
        showEdges: true,
        hover: true,

        resizeMode: 'scalePoints',
        // 'newPoints' - generates a new set of points for the new size
        // 'scalePoints' - linearly scales existing points and re-triangulates

        onDarkBackground: function(color) { return; },
        onLightBackground: function(color) { return; },

        // returns hsla color for triangle edge
        // as a function of the triangle fill color
        edgeColor: function(color) {
          color = color.split(',');
          var lightness = parseInt(color[2]);
          lightness = (lightness + 200 - lightness*2) / 3;
          color[2] = lightness + '%';
          color[3] = 0.25;
          return color.join(',');
        },

        // returns hsla color for triangle hover fill
        // as a function of the triangle fill color
        hoverColor: function(color) {
          color = color.split(',');
          var lightness = parseInt(color[2]);
          lightness = 100 - lightness;
          color[2] = lightness + '%';
          // alpha
          color[3] = 0.5;
          return color.join(',');
        },
      }
    }

    clear() {
      this.points = [];
      this.triangles = [];
      this.pointMap.clear();
      this.center = new Point(0, 0);
    }

    // clear and create a fresh set of random points
    randomize(min, max, minEdge, maxEdge, minGradients, maxGradients, colors) {
      // colors param is optional
      this.colors = colors || this.colors;

      this.resizeCanvas();

      this.generateNewPoints(min, max, minEdge, maxEdge);

      this.triangulate();

      this.generateGradients(minGradients, maxGradients);

      this.render();
    }

    // creates a hidden canvas for hover detection
    createShadowCanvas() {
      this.shadowCanvas = document.createElement('canvas');
      this.canvas.parentElement.appendChild(this.shadowCanvas);
      this.shadowCtx = this.shadowCanvas.getContext('2d');

      // this.canvas.style.display = 'none';
    }

    generateNewPoints(min, max, minEdge, maxEdge) {
      // defaults to generic number of points based on canvas dimensions
      // this generally looks pretty nice
      var area = this.canvas.width * this.canvas.height;
      var perimeter = (this.canvas.width + this.canvas.height) * 2;

      min = min > 0 ? Math.ceil(min) : Math.max(Math.ceil(area / 2500), 100);
      max = max > 0 ? Math.ceil(max) : Math.max(Math.ceil(area / 1000), 100);

      minEdge = minEdge > 0 ? Math.ceil(minEdge) : Math.max(Math.ceil(perimeter / 250), 10);
      maxEdge = maxEdge > 0 ? Math.ceil(maxEdge) : Math.max(Math.ceil(perimeter / 100), 10);

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
      var center = new Point(Math.round(canvas.width/2), Math.round(canvas.height/2));
      for (var i = 0; i < numPoints; i++) {
        var point;
        var j = 0;
        // generate a new point with random coords
        // re-generate the point if it already exists in pointmap (max 10 times)
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
        }
        else {
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
        arr.push(vertices[triangulated[i+1]]);
        arr.push(vertices[triangulated[i+2]]);
        this.triangles.push(arr);
      }

      // map to array of Triangle objects
      this.triangles = this.triangles.map(function(triangle) {
        return new Triangle(new Point(triangle[0]),
                            new Point(triangle[1]),
                            new Point(triangle[2]));
      });
    }

    // create random radial gradient circles for rendering later
    generateGradients(minGradients, maxGradients) {
      this.radialGradients = [];

      minGradients = minGradients > 0 ? minGradients : 1;
      maxGradients = maxGradients > 0 ? maxGradients : 2;

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

      var minX = Math.ceil(Math.sqrt(canvas.width));
      var maxX = Math.ceil(canvas.width - Math.sqrt(canvas.width));

      var minY = Math.ceil(Math.sqrt(canvas.height));
      var maxY = Math.ceil(canvas.height - Math.sqrt(canvas.height));

      var minRadius = Math.ceil(Math.max(canvas.height, canvas.width)/ Math.max(Math.sqrt(this.numGradients), 2));
      var maxRadius = Math.ceil(Math.max(canvas.height, canvas.width) / Math.max(Math.log(this.numGradients), 1));

      // helper random functions
      var randomCanvasX = Random.randomNumberFunction(minX, maxX);
      var randomCanvasY = Random.randomNumberFunction(minY, maxY);
      var randomCanvasRadius = Random.randomNumberFunction(minRadius, maxRadius);

      // generate circle1 origin and radius
      var x0, y0;
      var r0 = randomCanvasRadius();

      // origin of the next circle should be contained
      // within the area of its predecessor
      if (this.radialGradients.length > 0) {
        var lastGradient = this.radialGradients[this.radialGradients.length - 1]
        var pointInLastCircle = Random.randomInCircle(lastGradient.r0, lastGradient.x0, lastGradient.y0);

        // origin must be within the bounds of the canvas
        while (pointInLastCircle.x < 0 ||
               pointInLastCircle.y < 0 ||
               pointInLastCircle.x > this.canvas.width ||
               pointInLastCircle.y > this.canvas.height) {
          pointInLastCircle = Random.randomInCircle(lastGradient.r0, lastGradient.x0, lastGradient.y0);
        }
        x0 = pointInLastCircle.x;
        y0 = pointInLastCircle.y;
      }
      else {
        // first circle, just pick at random
        x0 = randomCanvasX();
        y0 = randomCanvasY();
      }

      // find a random point inside circle1
      // this is the origin of circle 2
      var pointInCircle = Random.randomInCircle(r0*0.09, x0, y0);

      // grab the x/y coords
      var x1 = pointInCircle.x;
      var y1 = pointInCircle.y;

      // find distance between the point and the circumfrience of circle1
      // the radius of the second circle will be a function of this distance
      var vX = x1 - x0;
      var vY = y1 - y0;
      var magV = Math.sqrt(vX*vX + vY*vY);
      var aX = x0 + vX / magV * r0;
      var aY = y0 + vY / magV * r0;

      var dist = Math.sqrt((x1 - aX) * (x1 - aX) + (y1 - aY) * (y1 - aY));

      // generate the radius of circle2 based on this distance
      var r1 = Random.randomBetween(1, Math.sqrt(dist));

      // random but nice looking color stop
      var colorStop = Random.randomBetween(2, 8)/10;

      this.radialGradients.push({ x0, y0, r0, x1, y1, r1, colorStop });
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
    // makes the canvas 'responsive'
    resizeCanvas() {
      var parent = this.canvas.parentElement;
      this.canvas.width = this.width = parent.offsetWidth;
      this.canvas.height = this.height = parent.offsetHeight;

      if (this.shadowCanvas) {
        this.shadowCanvas.width = this.width = parent.offsetWidth;
        this.shadowCanvas.height = this.height = parent.offsetHeight;
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
      }
      else {
        this.generateNewPoints();
      }

      this.triangulate();

      // rescale position of radial gradient circles
      for (var i = 0; i < this.radialGradients.length; i++) {
        var circle0 = new Point(this.radialGradients[i].x0, this.radialGradients[i].y0);
        var circle1 = new Point(this.radialGradients[i].x1, this.radialGradients[i].y1);

        circle0.rescale(xMin, xMax, yMin, yMax, 0, this.canvas.width, 0, this.canvas.height);
        circle1.rescale(xMin, xMax, yMin, yMax, 0, this.canvas.width, 0, this.canvas.height);

        this.radialGradients[i].x0 = circle0.x;
        this.radialGradients[i].y0 = circle0.y;
        this.radialGradients[i].x1 = circle1.x;
        this.radialGradients[i].y1 = circle1.y;
      }

      this.render();
    }

    hover() {
      if (this.mousePosition) {
        var rgb = this.mousePosition.canvasColorAtPoint(this.shadowImageData, 'rgb').replace('rgb(', '').replace(')', '').split(',');
        var hex = rgbToHex(rgb);
        var dec = parseInt(hex, 16);

        // is probably triangle with that index, but
        // edges can be fuzzy so double check
        if (dec >= 0 && dec < this.triangles.length && this.triangles[dec].pointInTriangle(this.mousePosition)) {

          if (this.lastTriangle !== dec){
            // render the hovered triangle
            var fill = this.options.hoverColor(this.triangles[dec].color);
            this.triangles[dec].render(this.ctx, fill, false);

            // clear the last triangle
            this.clearHoveredTriangle();
          }

          this.lastTriangle = dec;
        }
      }
      else {
        this.clearHoveredTriangle();
      }
    }

    clearHoveredTriangle() {
      // redraw the last triangle that was hovered over
      if (this.lastTriangle) {
        var lastTriangle = this.triangles[this.lastTriangle];
        // draw over the triangle with the fill as stroke
        // since the stroke can have opacity so the color won't be off
        lastTriangle.render(this.ctx, lastTriangle.color, lastTriangle.color);
        lastTriangle.render(this.ctx, lastTriangle.color, lastTriangle.stroke);
      }
    }

    render() {
      // empty the canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.renderGradient();

      // renders triangles, edges, and shadow canvas for hover detection
      this.renderTriangles(this.options.showTriangles, this.options.showEdges);

      if (this.options.showPoints) {
        this.renderPoints();
      }

      if (this.options.showCircles) {
        this.renderGradientCircles();
      }

      if (this.options.showCentroids) {
        this.renderCentroids();
      }

      // throw events for light / dark text
      var centerColor = this.center.canvasColorAtPoint();

      if (parseInt(centerColor.split(',')[2]) < 50) {
        this.options.onDarkBackground(centerColor);
      }
      else {
        this.options.onLightBackground(centerColor);
      }
    }

    renderNewColors(colors) {
      this.colors = colors || this.colors;
      // triangle centroids need new colors
      this.triangulate();
      this.render();
    }

    renderNewGradient(minGradients, maxGradients) {
      this.generateGradients(minGradients, maxGradients);
      this.render();
    }

    renderNewTriangles(min, max, minEdge, maxEdge) {
      this.generateNewPoints(min, max, minEdge, maxEdge);
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

    renderTriangles(triangles, edges) {
      // get entire canvas image data now in a big typed array
      // this way we dont have to pick for each point individually
      // its like 50x faster this way
      var imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

      // save this for later
      this.center.canvasColorAtPoint(imageData);

      for (var i = 0; i < this.triangles.length; i++) {
        // the color is determined by grabbing the color of the canvas
        // (where we drew the gradient) at the center of the triangle

        this.triangles[i].color = this.triangles[i].colorAtCentroid(imageData);

        if (triangles && edges) {
          this.triangles[i].stroke = this.options.edgeColor(this.triangles[i].colorAtCentroid(imageData));
          this.triangles[i].render(this.ctx);
        }
        else if (triangles) {
          // triangles only
          this.triangles[i].stroke = this.triangles[i].color;
          this.triangles[i].render(this.ctx);
        }
        else if (edges) {
          // edges only
          this.triangles[i].stroke = this.options.edgeColor(this.triangles[i].colorAtCentroid(imageData));
          this.triangles[i].render(this.ctx, false);
        }

        if (this.shadowCanvas) {
          var color = '#' + ('000000' + i.toString(16)).slice(-6);
          this.triangles[i].render(this.shadowCtx, color);
        }
      }

      if (this.shadowCanvas) {
        this.shadowImageData = this.shadowCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    // renders the points of the triangles
    renderPoints() {
      for (var i = 0; i < this.points.length; i++) {
        this.points[i].render(this.ctx);
      }
    }

    // draws the circles that define the gradients
    renderGradientCircles() {
      this.ctx.strokeStyle = 'black';

      for (var i = 0; i < this.radialGradients.length; i++) {
        this.ctx.beginPath();
        this.ctx.arc(this.radialGradients[i].x0,
                this.radialGradients[i].y0,
                this.radialGradients[i].r0,
                0, Math.PI*2, true);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(this.radialGradients[i].x1,
                this.radialGradients[i].y1,
                this.radialGradients[i].r1,
                0, Math.PI*2, true);
        this.ctx.stroke();
      }
    }

    // render triangle centroids
    renderCentroids() {
      for (var i = 0; i < this.triangles.length; i++) {
        this.triangles[i].centroid().render(this.ctx);
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

  }

  // set up variables for canvas, inputs, etc
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const button = document.getElementById('button');

  const generateColorsButton = document.getElementById('generateColors');
  const generateGradientButton = document.getElementById('generateGradient');
  const generateTrianglesButton = document.getElementById('generateTriangles');

  const toggleTrianglesButton = document.getElementById('toggleTriangles');
  const togglePointsButton = document.getElementById('togglePoints');
  const toggleCirclesButton = document.getElementById('toggleCircles');
  const toggleCentroidsButton = document.getElementById('toggleCentroids');
  const toggleEdgesButton = document.getElementById('toggleEdges');

  const form = document.getElementById('form');
  const maxInput = document.getElementById('maxPoints');
  const minInput = document.getElementById('minPoints');
  const maxEdgeInput = document.getElementById('maxEdgePoints');
  const minEdgeInput = document.getElementById('minEdgePoints');
  const maxGradientInput = document.getElementById('maxGradients');
  const minGradientInput = document.getElementById('minGradients');

  var minPoints, maxPoints, minEdgePoints, maxEdgePoints, minGradients, maxGradients, colors;

  // lets get this show on the road
  let prettyDelaunay = new PrettyDelaunay(canvas, {
    onDarkBackground: function() {
      form.style.color = 'white';
    },
    onLightBackground: function() {
      form.style.color = 'black';
    },
  });

  // initial generation
  runDelaunay();

  /**
   * util functions
   */

  // get options and re-randomize
  function runDelaunay() {
    getOptions();
    prettyDelaunay.randomize(minPoints, maxPoints, minEdgePoints, maxEdgePoints, minGradients, maxGradients, colors);
  }

  function getColors() {
    var colors = [];

    if (document.getElementById('colorType1').checked) {
      // generate random colors
      for (var i = 0; i < 3; i++) {
        var color = Random.randomHsla();
        colors.push(color);
      }
    }
    else {
      // use the ones in the inputs
      colors.push(rgbToHsla(hexToRgbaArray(document.getElementById('color1').value)));
      colors.push(rgbToHsla(hexToRgbaArray(document.getElementById('color2').value)));
      colors.push(rgbToHsla(hexToRgbaArray(document.getElementById('color3').value)));
    }

    return colors;
  }

  // get options from input fields
  function getOptions() {
    minPoints = parseInt(minInput.value);
    maxPoints = parseInt(maxInput.value);
    minEdgePoints = parseInt(minEdgeInput.value);
    maxEdgePoints = parseInt(maxEdgeInput.value);
    minGradients = parseInt(minGradientInput.value);
    maxGradients = parseInt(maxGradientInput.value);
    colors = getColors();
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

  // click the button to regen colors only
  generateColorsButton.addEventListener('click', function() {
    var newColors = getColors();
    prettyDelaunay.renderNewColors(newColors);
  });

  // click the button to regen colors only
  generateGradientButton.addEventListener('click', function() {
    getOptions();
    prettyDelaunay.renderNewGradient(minGradients, maxGradients);
  });

  // click the button to regen colors only
  generateTrianglesButton.addEventListener('click', function() {
    getOptions();
    prettyDelaunay.renderNewTriangles(minPoints, maxPoints, minEdgePoints, maxEdgePoints);
  });

  // turn Triangles off/on
  toggleTrianglesButton.addEventListener('click', function() {
    prettyDelaunay.toggleTriangles();
  });

  // turn Points off/on
  togglePointsButton.addEventListener('click', function() {
    prettyDelaunay.togglePoints();
  });

  // turn Circles off/on
  toggleCirclesButton.addEventListener('click', function() {
    prettyDelaunay.toggleCircles();
  });

  // turn Centroids off/on
  toggleCentroidsButton.addEventListener('click', function() {
    prettyDelaunay.toggleCentroids();
  });

  // turn Edges off/on
  toggleEdgesButton.addEventListener('click', function() {
    prettyDelaunay.toggleEdges();
  });

  // resize event
  window.addEventListener('optimizedResize', function() {
    prettyDelaunay.rescale();
  });

  // dont do anything on form submit
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    return false;
  });

  function hexToRgba(hex) {
    hex = hex.replace('#','');
    var r = parseInt(hex.substring(0,2), 16);
    var g = parseInt(hex.substring(2,4), 16);
    var b = parseInt(hex.substring(4,6), 16);

    return 'rgba(' + r + ',' + g + ',' + b + ',1)';
  }

  function hexToRgbaArray(hex) {
    hex = hex.replace('#','');
    var r = parseInt(hex.substring(0,2), 16);
    var g = parseInt(hex.substring(2,4), 16);
    var b = parseInt(hex.substring(4,6), 16);

    return [r, g, b];
  }

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
  function rgbToHsla(rgb){
    var r = rgb[0]/255, g = rgb[1]/255, b = rgb[2]/255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max === min){
        h = s = 0; // achromatic
    }
    else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return 'hsla(' + Math.round(h*360) + ',' + Math.round(s*100) + '%,' + Math.round(l*100) + '%,1)';
  }

  function rgbToHex(rgb) {
    rgb = rgb.map(function(x) {
      x = parseInt(x).toString(16);
      return (x.length === 1) ? '0' + x : x;
    });
    return rgb.join('');
  }

})();
