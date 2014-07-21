//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates color key
//-------------------------------------------------------------------

d3plus.ui.timeline = function(vars) {

  var years = vars.data.time

  if (!vars.internal_error && !vars.small && years && years.length > 1 && vars.timeline.value) {

    if ( vars.dev.value ) d3plus.console.time("drawing timeline")

    if ((vars.time.value == vars.x.value && vars.x.scale.value == "continuous") || (vars.time.value == vars.y.value && vars.y.scale.value == "continuous")) {
      var min_required = 2
    }
    else {
      var min_required = 1
    }

    if (vars.time.solo.value.length) {
      var init = d3.extent(vars.time.solo.value)
    }
    else {
      var init = d3.extent(years)
    }

    var min = years[0],
        max = years[years.length-1],
        start = init[0],
        end = init[1],
        year_ticks = [],
        steps = []

    years.forEach(function(y,i){
      if (i != 0) steps.push(y-years[i-1])
    })
    var step = d3.min(steps),
        total = step*years.length
    years = []
    for (var i = min; i <= max; i += step) {
      years.push(i)
      year_ticks.push(d3.time.year(new Date(parseInt(i), 0, 1)))
    }
    year_ticks.push(d3.time.year(new Date(parseInt(max+step), 0, 1)))

    var brushend = function() {

      if (d3.event.sourceEvent !== null) {

        var extent0 = brush.extent(),
            min_val = d3plus.util.closest(year_ticks,d3.time.year.round(extent0[0])),
            max_val = d3plus.util.closest(year_ticks,d3.time.year.round(extent0[1]))

        if (min_val == max_val) {
          min_val = d3plus.util.closest(year_ticks,d3.time.year.floor(extent0[0]))
        }

        var min_index = year_ticks.indexOf(min_val),
            max_index = year_ticks.indexOf(max_val)

        if (max_index-min_index >= min_required) {
          var extent = [min_val,max_val]
        }
        else if (min_index+min_required <= years.length) {
          var extent = [min_val,year_ticks[min_index+min_required]]
        }
        else {

          var extent = [min_val]
          for (var i = 1; i <= min_required; i++) {
            if (min_index+i <= years.length) {
              extent.push(year_ticks[min_index+i])
            }
            else {
              extent.unshift(year_ticks[min_index-((min_index+i)-(years.length))])
            }
          }
          extent = [extent[0],extent[extent.length-1]]
        }

        d3.select(this).transition()
          .call(brush.extent(extent))
          // .call(brush.event)
          .each("end",function(d){

            var new_years = d3.range(extent[0].getFullYear(),extent[1].getFullYear())

            new_years = new_years.filter(function(d){
              return years.indexOf(d) >= 0
            })

            vars.self.time({"solo": new_years}).draw()

          })

      }
      else {
        return;
      }

    }

    var background = vars.g.timeline.selectAll("rect.d3plus_timeline_background")
      .data(["background"])

    background.enter().append("rect")
      .attr("class","d3plus_timeline_background")
      .attr("opacity",0)
      .attr("fill",vars.timeline.background)

    var ticks = vars.g.timeline.selectAll("g#ticks")
      .data(["ticks"])

    ticks.enter().append("g")
      .attr("id","ticks")
      .attr("transform","translate("+vars.width.value/2+","+vars.ui.padding+")")

    var brush_group = vars.g.timeline.selectAll("g#brush")
      .data(["brush"])

    brush_group.enter().append("g")
      .attr("id","brush")

    var labels = vars.g.timeline.selectAll("g#labels")
      .data(["labels"])

    labels.enter().append("g")
      .attr("id","labels")

    var text = labels.selectAll("text")
      .data(years,function(d,i){
        return i
      })

    text.enter().append("text")
      .attr("y",0)
      .attr("dy",0)
      .attr("x",function(d){
        if (vars.timeline.align == "middle") {
          return vars.width.value/2
        }
        else if (vars.timeline.align == "end") {
          return vars.width.value
        }
        else {
          return 0
        }
      })
      .attr("y",function(d){
        var diff = diff = parseFloat(d3.select(this).style("font-size"),10)/5
        var y = vars.ui.padding+vars.timeline.height/2+this.getBBox().height/2 - diff
        return y
      })

    var year_width = 0,
        year_height = 0

    text
      .order()
      .attr("font-weight",vars.timeline.tick.weight)
      .attr("font-family",vars.timeline.tick.family.value)
      .attr("font-size",vars.timeline.tick.size)
      .attr("text-anchor",vars.timeline.tick.align)
      .attr("opacity",0)
      .text(function(d){
        return d
      })
      .each(function(d){
        var w = this.getBBox().width,
            h = this.getBBox().height
        if (w > year_width) year_width = w
        if (h > year_height) year_height = h
      })

    var label_width = year_width+vars.ui.padding*2,
        timeline_width = label_width*years.length,
        available_width = vars.width.value-vars.ui.padding*2,
        step = 1

    if (timeline_width > available_width) {
      timeline_width = available_width
      step = Math.ceil(label_width/(timeline_width/years.length))
      label_width = timeline_width/years.length
      for (step; step < years.length-1; step++) {
        if ((years.length-1)%step == 0) {
          break;
        }
      }
    }

    if (vars.timeline.align == "start") {
      var start_x = vars.ui.padding
    }
    else if (vars.timeline.align == "end") {
      var start_x = vars.width.value - vars.ui.padding - timeline_width
    }
    else {
      var start_x = vars.width.value/2 - timeline_width/2
    }

    text
      .text(function(d,i){
        return i%step == 0 ? d : ""
      })
      .attr("opacity",1)
      .attr("fill",function(d){

        if (d >= init[0] && d <= init[1]) {
          var color1 = vars.timeline.background,
              color2 = vars.timeline.brush.color,
              opacity = vars.timeline.brush.opacity
              mixed = d3plus.color.mix(color2,color1,opacity)

          return d3plus.color.text(mixed)
        }
        return d3plus.color.text(vars.timeline.background)
      })
      .attr("x",function(d,i){
        return start_x + (label_width*i) + label_width/2
      })
      .attr("y",function(d){
        var diff = diff = parseFloat(d3.select(this).style("font-size"),10)/5
        var y = vars.ui.padding+vars.timeline.height/2-1+this.getBBox().height/2 - diff
        if (step > 1) {
          y += year_height+vars.ui.padding
        }
        return y
      })

    text.exit().transition().duration(vars.draw.timing)
      .attr("opacity",0)
      .remove()

    background.transition().duration(vars.draw.timing)
      .attr("opacity",1)
      .attr("width",timeline_width)
      .attr("height",vars.timeline.height-2)
      .attr("x",start_x)
      .attr("y",vars.ui.padding)
      .attr("fill",vars.timeline.background)

    var x = d3.time.scale()
      .domain(d3.extent(year_ticks))
      .rangeRound([0,timeline_width])

    var brush = d3.svg.brush()
      .x(x)
      .extent([year_ticks[years.indexOf(start)], year_ticks[years.indexOf(end)+1]])
      .on("brushend", brushend)

    ticks
      .attr("transform","translate("+start_x+","+vars.ui.padding+")")
      .transition().duration(vars.draw.timing)
      .call(d3.svg.axis()
        .scale(x)
        .orient("top")
        .ticks(function(){
          return year_ticks
        })
        .tickFormat("")
        .tickSize(-(vars.timeline.height-2))
        .tickPadding(0))
        .selectAll("path").attr("fill","none")

    ticks.selectAll("line")
      .attr("stroke",vars.timeline.tick.color)
      .attr("shape-rendering",vars.shape.rendering.value)

    brush_group
      .attr("transform","translate("+start_x+","+vars.ui.padding+")")
      .attr("opacity",1)
      .call(brush)

    text.attr("pointer-events","none")

    brush_group.selectAll("rect.background, rect.extent")
      .attr("height",vars.timeline.height-2)

    brush_group.selectAll("rect.background")
      .attr("fill","none")
      .attr("stroke-width",1)
      .attr("stroke",vars.timeline.tick.color)
      .style("visibility","visible")
      .attr("shape-rendering",vars.shape.rendering.value)

    brush_group.selectAll("rect.extent")
      .attr("stroke-width",1)
      .attr("fill",vars.timeline.brush.color)
      .attr("fill-opacity",vars.timeline.brush.opacity)
      .attr("stroke",vars.timeline.tick.color)
      .attr("shape-rendering",vars.shape.rendering.value)

    if (vars.timeline.handles.value) {

      brush_group.selectAll("g.resize")
        .select("rect")
        .attr("fill",vars.timeline.handles.color)
        .attr("stroke",vars.timeline.handles.stroke)
        .attr("stroke-width",1)
        .attr("x",-vars.timeline.handles.size/2)
        .attr("width",vars.timeline.handles.size)
        .attr("height",vars.timeline.height-2)
        .style("visibility","visible")
        .attr("shape-rendering",vars.shape.rendering.value)
        .attr("opacity",vars.timeline.handles.opacity)

    }
    else {

      brush_group.selectAll("g.resize")
        .remove()

    }

    if (vars.timeline.handles.opacity) {

      brush_group.selectAll("g.resize")
        .on(d3plus.evt.over,function(){
          d3.select(this).select("rect")
            .transition().duration(vars.timing.mouseevents)
            .attr("fill",vars.timeline.handles.hover)
        })
        .on(d3plus.evt.out,function(){
          d3.select(this).select("rect")
            .transition().duration(vars.timing.mouseevents)
            .attr("fill",vars.timeline.handles.color)
        })

    }

    if ( vars.margin.bottom === 0 ) {
      vars.margin.bottom += vars.ui.padding
    }

    var timelineBox = vars.g.timeline.node().getBBox()

    vars.margin.bottom += timelineBox.height+timelineBox.y

    vars.g.timeline.transition().duration(vars.draw.timing)
      .attr("transform","translate(0,"+(vars.height.value-vars.margin.bottom-vars.ui.padding/2)+")")

    vars.margin.bottom += vars.ui.padding

    if ( vars.dev.value ) d3plus.console.time("drawing timeline")

  }
  else {

    vars.g.timeline.transition().duration(vars.draw.timing)
      .attr("transform","translate(0,"+vars.height.value+")")

  }

}
