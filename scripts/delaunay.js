var Delaunay;

(function() {
  "use strict";

  const EPSILON = 1.0 / 1048576.0;

  Delaunay = {
    triangulate: function(vertices) {
      var numVertices = vertices.length;
      var triangles = [];
      var numTriangles = triangles.length;

      var complete = [];
      var edges = [];
      var nedge = 0;
      var status = 0;

      var inside;
      var xp, yp, x1, y1, x2, y2, x3, y3, xc, yc, r;
      var xmin, xmax, ymin, ymax, xmid, ymid;
      var dx, dy, dmax;

      /*
        Find the maximum and minimum vertex bounds.
        This is to allow calculation of the bounding triangle
      */
      xmin = vertices[0][0];
      ymin = vertices[0][1];
      xmax = xmin;
      ymax = ymin;
      for (var i = 1; i < numVertices; i++) {
        if (vertices[i][0] < xmin) xmin = vertices[i][0];
        if (vertices[i][0] > xmax) xmax = vertices[i][0];
        if (vertices[i][1] < ymin) ymin = vertices[i][1];
        if (vertices[i][1] > ymax) ymax = vertices[i][1];
      }
      dx = xmax - xmin;
      dy = ymax - ymin;
      dmax = (dx > dy) ? dx : dy;
      xmid = (xmax + xmin) / 2.0;
      ymid = (ymax + ymin) / 2.0;

      /*
        Set up the supertriangle
        This is a triangle which encompasses all the sample points.
        The supertriangle coordinates are added to the end of the
        vertex list. The supertriangle is the first triangle in
        the triangle list.
      */
      vertices.push([(xmid - 20) * dmax, ymid - dmax]);
      vertices.push([xmid, (ymid + 20) * dmax]);
      vertices.push([(xmid + 20) * dmax, ymid - dmax]);

      triangles.push([
        vertices.length - 3,
        vertices.length - 2,
        vertices.length - 1,
      ]);

      complete.push(false);
      numTriangles = 1;

      /*
        Include each point one at a time into the existing mesh
      */
      for (var i = 0; i < numVertices; i++) {

        xp = vertices[i][0];
        yp = vertices[i][1];
        nedge = 0;

        /*
           Set up the edge buffer.
           If the point (xp,yp) lies inside the circumcircle then the
           three edges of that triangle are added to the edge buffer
           and that triangle is removed.
        */
        for (var j = 0; j < numTriangles; j++) {
           if (complete[j]) {
              continue;
           }
          x1 = vertices[triangles[j][0]][0];
          y1 = vertices[triangles[j][0]][1];
          x2 = vertices[triangles[j][1]][0];
          y2 = vertices[triangles[j][1]][1];
          x3 = vertices[triangles[j][2]][0];
          y3 = vertices[triangles[j][2]][1];
          inside = this.circumCircle(xp, yp, x1, y1, x2, y2, x3, y3, xc, yc, r);
          if (xc < xp && ((xp-xc)*(xp-xc)) > r){
            complete[j] = true;
          }
          if (inside) {
            edges.push([
              triangles[j][0],
              triangles[j][1],
            ]);
            edges.push([
              triangles[j][1],
              triangles[j][2],
            ]);
            edges.push([
              triangles[j][2],
              triangles[j][0],
            ]);
            nedge += 3;
            triangles[j] = triangles[numTriangles-1];
            complete[j] = complete[numTriangles-1];
            numTriangles--;
            j--;
          }
        }

        /*
           Tag multiple edges
           Note: if all triangles are specified anticlockwise then all
                 interior edges are opposite pointing in direction.
        */
        for (var j = 0; j < nedge - 1; j++) {
           for (var k = j + 1; k < nedge; k++) {
              if ((edges[j][0] == edges[k][1]) && (edges[j][1] == edges[k][0])) {
                edges[j][0] = -1;
                edges[j][1] = -1;
                edges[k][0] = -1;
                edges[k][1] = -1;
              }
              /* Shouldn't need the following, see note above */
              if ((edges[j][0] == edges[k][0]) && (edges[j][1] == edges[k][1])) {
                edges[j][0] = -1;
                edges[j][1] = -1;
                edges[k][0] = -1;
                edges[k][1] = -1;
              }
           }
        }

        /*
           Form new triangles for the current point
           Skipping over any tagged edges.
           All edges are arranged in clockwise order.
        */
        for (var j = 0; j< nedge; j++) {
          if (edges[j][0] < 0 || edges[j][1] < 0) {
            continue;
          }
          triangles.push([
            edges[j][0],
            edges[j][1],
            i,
          ]);
          complete.push(false);
          numTriangles++;
        }
      }

      /*
        Remove triangles with supertriangle vertices
        These are triangles which have a vertex number greater than numVertices
      */
      for (var i = 0; i < numTriangles; i++) {
        if (triangles[i][0] >= numVertices || triangles[i][1] >= numVertices || triangles[i][2] >= numVertices) {
          triangles[i] = triangles[numTriangles-1];
          numTriangles--;
          i--;
        }
      }

      console.log('triangles', triangles);
      console.log('edges', edges);
      console.log('vertices', vertices);

      return triangles;
    },


    /*
       Return true if a point (xp,yp) is inside the circumcircle made up
       of the points (x1,y1), (x2,y2), (x3,y3)
       The circumcircle centre is returned in (xc,yc) and the radius r
       NOTE: A point on the edge is inside the circumcircle
    */
    circumCircle: function(xp, yp, x1, y1, x2, y2, x3, y3, xc, yc, rsqr) {
      var m1,m2,mx1,mx2,my1,my2;
      var dx,dy,drsqr;
      var fabsy1y2 = Math.abs(y1-y2);
      var fabsy2y3 = Math.abs(y2-y3);

      /* Check for coincident points */
      if (fabsy1y2 < EPSILON && fabsy2y3 < EPSILON)
        return(false);

      if (fabsy1y2 < EPSILON) {
        m2 = - (x3-x2) / (y3-y2);
        mx2 = (x2 + x3) / 2.0;
        my2 = (y2 + y3) / 2.0;
        xc = (x2 + x1) / 2.0;
        yc = m2 * (xc - mx2) + my2;
      }
      else if (fabsy2y3 < EPSILON) {
        m1 = - (x2-x1) / (y2-y1);
        mx1 = (x1 + x2) / 2.0;
        my1 = (y1 + y2) / 2.0;
        xc = (x3 + x2) / 2.0;
        yc = m1 * (xc - mx1) + my1;
      }
      else {
        m1 = - (x2-x1) / (y2-y1);
        m2 = - (x3-x2) / (y3-y2);
        mx1 = (x1 + x2) / 2.0;
        mx2 = (x2 + x3) / 2.0;
        my1 = (y1 + y2) / 2.0;
        my2 = (y2 + y3) / 2.0;
        xc = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2);
        if (fabsy1y2 > fabsy2y3) {
          yc = m1 * (xc - mx1) + my1;
        }
        else {
          yc = m2 * (xc - mx2) + my2;
        }
      }

      dx = x2 - xc;
      dy = y2 - yc;
      rsqr = dx*dx + dy*dy;

      dx = xp - xc;
      dy = yp - yc;
      drsqr = dx*dx + dy*dy;

      // Original
      //return((drsqr <= rsqr) ? true : false);
      // Proposed by Chuck Morris
      return((drsqr - rsqr) <= EPSILON ? true : false);
    },

  };


  if(typeof module !== "undefined") {
    module.exports = Delaunay;
  }
})();
