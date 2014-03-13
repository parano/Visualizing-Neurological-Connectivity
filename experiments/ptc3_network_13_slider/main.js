(function(){
  var margin = {top: 40, right: 40, bottom: 40, left: 40},
      width = 600,
      height = 600;

  var svg = d3.select("#graph")
                .append("svg")
                .attr("width", width)
                .attr("height", height);
                //.attr("class", 'graph-svg')

  var node = svg.selectAll(".node");
  var packet = svg.selectAll(".packet");

  var nodedata, groupnode, flowdata = [];
  var x_range, y_range, x_scale, y_scale, c_scale;

  var current_time_step = 0;
  var controller_brusher;

  var flow_id;
  // Start animtaion
  function start(){
    flow_id = ptc3_flow();
  }
  window.start = start;

  var init_scales = function() {

    _.each(nodedata, function(d){ 
      d.category = d.label.slice(0, d.label.indexOf("_"));
    });

    categories = _.uniq(_.map(nodedata, function(x){ return x.category; }));

    _.each(nodedata, function(d){
      d.r = _.filter(nodedata, function(x){ return x.category == d.category;}).length;
    });

    c_scale = d3.scale.category20().domain(categories);

    circle_layout();

    x_range = [d3.min(nodedata, function(d){ return d.x; }),
                   d3.max(nodedata, function(d){ return d.x; })];

    y_range = [d3.min(nodedata, function(d){ return d.y; }),
                   d3.max(nodedata, function(d){ return d.y; })];

    x_scale = d3.scale.linear()
                    .domain(x_range)
                    .range([0 + margin.left, width - margin.left])
                    .nice();

    y_scale = d3.scale.linear()
                    .domain(y_range)
                    .range([0 + margin.top, height - margin.bottom])
                    .nice();

    _.each(nodedata, function(d) {
      d.cx = x_scale(d.x);
      d.cy = y_scale(d.y);
    });

  };

  var circle_layout = function() {
    //nodedata = _.sortBy(nodedata, function(node){ return node.category });
    var index = 0,
        interval = Math.PI * 2 / categories.length;

    var coords = {};
    _.each(categories, function(c) {
      var x = Math.sin(interval * index);
      var y = Math.cos(interval * index++);
      coords[c] = [x, y];
    })
    
    nodedata =_.map(nodedata, function(node){
      node.x = coords[node.category][0];
      node.y = coords[node.category][1];
      return node;
    });
  };

  // draw the initial nodes
  var ptc3_network = function() {
    node = node.data(nodedata)
        .enter()
        .append("circle")
          .attr({
            "class": function(d){ return "node " + d.category; },
            "fill": function(d){ return c_scale(d.category); },
            "r": function(d){ return (d.r * 3) + 4; },
            "cx": function(d){ return d.cx; },
            "cy": function(d){ return d.cy; }
          })
        .call(add_tooltip); 
  };

  var graph_contoller = function(){
    var controller_height = 40;
    var controller_width = 900;
    var x = d3.scale.identity().domain([0, controller_width]);
    var defaultExtent = [0,6];
    
    var svg = d3.select("#controller")
                .append("svg")
                .attr("width", controller_width)
                .attr("height", controller_height);

    var controller_scale = d3.scale.linear()
                            .domain([0, 600])
                            .range([0, controller_width])
                            .nice();

    var brushed = function() {
      if (flow_id !== undefined) clearInterval(flow_id);
    };

    var brushended = function() {
      console.log("c brushended");

      var extent = brush.extent();
      var start = Math.floor(extent[0])
      var target_extent = [start, start + 6];
      current_time_step = start;

      d3.select(this).transition()
        .call(brush.extent(target_extent));
    };

    var brush = d3.svg.brush()
                  .x(controller_scale)
                  .extent(defaultExtent)
                  .on("brush", brushed)
                  .on("brushend", brushended);

       svg.append("rect")
        .attr({
          width: controller_width,
          height: controller_height,
          class: 'controller-background'
        });

    var gBrush = svg.append("g")
                    .attr("class", "brush")
                    .call(brush)
                    .call(brush.event);
                    gBrush

    gBrush.selectAll("rect")
      .attr("height", controller_height)

    return brush;
  };

  /* 
   * Cut a line by ratio
   * 
   * start     cut            end
   *  o--------o---------------o
   *
   * ratio = dist(start, cut) / dist(start, end)
   * return [cut.x, cut.y]
   * */
  var slice_line = function(ratio, starting_point, ending_point) {
    if(ratio < 0 || ratio > 1) return;
    var delta = ending_point - starting_point;
    return starting_point + (ratio * delta);
  }

  var animation_duration = 3000;
  var time_divisions = 5;

  var update_time_step = function(cur) {
    current_time_step = cur;
    d3.select("#controller g")
      .transition()
      .call(controller_brusher.extent([cur, cur+6]))
  }

  var ptc3_flow = function(){
    console.log("redraw");
    var cur = current_time_step;
    var ll  = flowdata.length;

    function flow(){
      if(cur >= ll){ cur = 0; current_time_step = 0;}
      console.log("cur: " + cur);
      selected = _.filter(flowdata[cur % ll], function(d){ return nodedata[d.source].selected == true });
      
      var cutting_ratio = 1.0 / time_divisions; // 0.2
      var draw_tail_duration = animation_duration / time_divisions; // 500
      var flow_duration = animation_duration - draw_tail_duration; // 2000

      packet.data(selected)
            .enter()
            .append("line")
            .style("stroke", function(d){ return c_scale(nodedata[d.source].category); })
            .attr({
              x1: function(d){ return nodedata[d.source].cx; },
              y1: function(d){ return nodedata[d.source].cy; }
            })
            .attr({
              x2: function(d){ return nodedata[d.source].cx; },
              y2: function(d){ return nodedata[d.source].cy; }
            })
            .style("opacity", 0)
          .transition()
            .ease('linear')
            .duration(draw_tail_duration)
            .attr({
              x1: function(d){ return nodedata[d.source].cx; },
              y1: function(d){ return nodedata[d.source].cy; }
            })
            .attr({
              x2: function(d){ 
                return slice_line(cutting_ratio, nodedata[d.source].cx, nodedata[d.target].cx);
              },
              y2: function(d){ 
                return slice_line(cutting_ratio, nodedata[d.source].cy, nodedata[d.target].cy);
              }
            })
            .style("opacity", 0.1)
          .transition()
            .ease('linear')
            .duration(flow_duration)
            .attr({
              x1: function(d){ 
                return slice_line(1 - cutting_ratio, nodedata[d.source].cx, nodedata[d.target].cx);
              },
              y1: function(d){ 
                return slice_line(1 - cutting_ratio, nodedata[d.source].cy, nodedata[d.target].cy);
              }
            })
            .attr({
              x2: function(d){ return nodedata[d.target].cx; },
              y2: function(d){ return nodedata[d.target].cy; }
            })
            .style("opacity", 0.6)
          .transition()
            .ease('linear')
            .duration(draw_tail_duration)
            .attr({
              x1: function(d){ return nodedata[d.target].cx; },
              y1: function(d){ return nodedata[d.target].cy; }
            })
            .attr({
              x2: function(d){ return nodedata[d.target].cx; },
              y2: function(d){ return nodedata[d.target].cy; }
            })
            .style("opacity", 0.1)
            .remove();

      packet.data(selected)
            .enter()
            .append("circle")
            .attr("class", '.packet')
            .attr("fill", function(d){ return c_scale(nodedata[d.source].category); })
            .style("opacity", 0)
            .attr("r", 1)
            .attr("cx", function(d){ return nodedata[d.source].cx; })
            .attr("cy", function(d){ return nodedata[d.source].cy; })
          .transition()
            .ease('linear')
            .duration(animation_duration)
            .style("opacity", 0.9)
            .attr("r", 4)
            .attr("cx", function(d){ return nodedata[d.target].cx; })
            .attr("cy", function(d){ return nodedata[d.target].cy; })
          .transition()
            .duration(300)
            .attr("r", 0)
            .style('opacity', 0.1)
            .remove();

      cur++;
      update_time_step(cur);
    }
    return setInterval(flow, 500);
  }

  var start_brushing = function(){
    var defaultExtent = [[7, 132], [216, 450]],
        x = d3.scale.identity().domain([0, width]),
        y = d3.scale.identity().domain([0, height]);

    var brushed = function() {
      if (flow_id !== undefined) clearInterval(flow_id);
      var extent = brush.extent();
      console.log(extent);
      node.each(function(d) {
        d.selected = (extent[0][0] <= d.cx) && (d.cx < extent[1][0])
                    && (extent[0][1] <= d.cy) && (d.cy < extent[1][1]);
      });
      node.classed("selected", function(d){ return d.selected;})
    };


    var brushended = function() {
      console.log("brushended");
    };

    var brush = d3.svg.brush()
                  .x(x)
                  .y(y)
                  .extent(defaultExtent)
                  .on("brush", brushed)
                  .on("brushend", brushended);
   
    svg.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.event);
    
    ptc3_network();
    brushed();
    brushended();
  };

  
  d3.csv("../../data/PTC3_V.csv", function(data) {
    nodedata = data.map(function(d) {
      return {
        label: d.label,
        x: +d.xcoord,
        y: +d.ycoord,
        z: +d.zcoord,
        area: d.area,
        plot: d.plot,
        time_data: new Array() // index = t, [in_degree, out_degree]
      };
    });
    init_scales();
 
    var array_in_out_size_of_nodes = function(nodes){
      var x = [];
      _.each(nodes, function(d){
        x.push([0,0]);
      });
      return x;
    };

    // load the time data
    d3.csv("../../data/F_PTC3_words_LD_E.csv", function(data) {
      var previous_timeslot;
      var in_out_degree_at_timeslot = 1;

      _.each(data, function(d) {
        if(d.t == previous_timeslot) {
          flowdata[flowdata.length-1].push({"source": +d.src -1, "target": +d.snk - 1})
          in_out_degree_at_timeslot[+d.src-1][1]+= 1;
          in_out_degree_at_timeslot[+d.snk-1][0]+= 1;

        } else {
          if (in_out_degree_at_timeslot!= 1){
            // load the in_out_degree into nodedata
            for( var i = 0; i<nodedata.length; i++){
              nodedata[i]["time_data"].push(in_out_degree_at_timeslot[i]);
            };
          };
          in_out_degree_at_timeslot = array_in_out_size_of_nodes(nodedata);
          previous_timeslot = d.t;
          flowdata.push([{"source": +d.src - 1, "target": +d.snk -1}]);
          in_out_degree_at_timeslot[+d.src-1][1]+= 1;
          in_out_degree_at_timeslot[+d.snk-1][0]+= 1;
        }
      });

      //console.log(flowdata);
      start_brushing();
      controller_brusher = graph_contoller();
    });

  });
})();

