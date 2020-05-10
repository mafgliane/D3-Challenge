var svgWidth = 960;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 100,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

//set the radius of circles
var radius = 10;

// Create an SVG wrapper, 
// append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height",svgHeight)

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "poverty";
var chosenYAxis = "healthcare";

// function used for updating x-scale var upon click on x-axis label
function xScale(theData, chosenXAxis){
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(theData, d=>d[chosenXAxis]) * 0.8, 
      d3.max(theData, d=>d[chosenXAxis]) * 1.2])
    .range([0, width]);
  return xLinearScale;
}

// function used for updating y-scale var upon click on y-axis label
function yScale(theData, chosenYAxis){
  var yLinearScale = d3.scaleLinear()
    .domain([d3.min(theData, d=>d[chosenYAxis]) * 0.8,
      d3.max(theData, d=>d[chosenYAxis]) * 1.2])
    .range([height, 0]);
  return yLinearScale;
}

// function to transition to new x-axis
function renderXAxis(newXScale, xAxis){
  var bottomAxis = d3.axisBottom(newXScale);
  xAxis.transition()
    .duration(1000)
    .call(bottomAxis)
    return xAxis;
}

// function to transition to new y-axis
function renderYAxis(newYScale, yAxis){
  var leftAxis = d3.axisLeft(newYScale);
  yAxis.transition()
    .duration(1000)
    .call(leftAxis)
  return yAxis;
}

// function used for updating circles group with a transition to new circles
function renderCircles(clicked_axis, newScale, chosenAxis) {
  if(clicked_axis === "x-axis"){
    d3.selectAll("circle").each(function(){
      d3.select(this)
        .transition()
        .attr("cx",function(d){
          return newScale(d[chosenAxis]);
        })
        .duration(1000);
    })
  }else{
    d3.selectAll("circle").each(function(){
      d3.select(this)
        .transition()
        .attr("cy",function(d){
          return newScale(d[chosenAxis]);
        })
        .duration(1000);
    })
  }
}

// function used for updating state abbreviations with a transition to new circles
function renderTexts(clicked_axis, newScale, chosenAxis) {
  if(clicked_axis === "x-axis"){
    d3.selectAll(".stateText").each(function(){
      d3.select(this)
        .transition()
        .attr("dx",function(d){
          return newScale(d[chosenAxis]);
        })
        .duration(1000);
    })
  }else{
    d3.selectAll(".stateText").each(function(){
      d3.select(this)
        .transition()
        .attr("dy",function(d){
          return newScale(d[chosenAxis]) + radius/2.5;
        })
        .duration(1000);
    })
  }
}

// function to highlight selected label on the x or y axis
function hiLiteLabel(axis, clicked){
  d3.selectAll(".aText")
    .filter("." + axis)
    .filter(".active")
    .classed("inactive", true)
  
  clicked.classed("inactive", false).classed("active", true);
}

// Retrieve data from the CSV file and execute everything below
d3.csv("assets/data/data.csv").then(function(theData, err){
  if(err) throw err;

  theData.forEach(function(data){
    //demographic data for x axis
    data.poverty = +data.poverty;
    data.age = +data.age;
    data.income = +data.income;
    //health risk data for y axis
    data.healthcare = +data.healthcare;
    data.smokes = +data.smokes;
    data.obesity = +data.obesity;
  });

  //Assign initial x and y linear scales
  var xLinearScale = xScale(theData, chosenXAxis);
  var yLinearScale = yScale(theData, chosenYAxis);

  // Assign initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup.append("g")
      .classed("x-axis",true)
      .attr("transform", `translate(0, ${height})`)
      .call(bottomAxis);

  // append y axis
  var yAxis = chartGroup.append("g")
      .classed("y-axis", true)
      .call(leftAxis);
  
  // update tooltip
  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([-10,0])
    .html(function(d){
      if(chosenXAxis === "poverty"){
        var UoM = "%";
      } else if (chosenXAxis === "income"){
        var UoM = " USD"
      } else UoM=" yrs"
      return(`${d.state}<br>${chosenXAxis}: ${d[chosenXAxis]}${UoM} <br>${chosenYAxis}: ${d[chosenYAxis]}%`);
    });
  
  svg.call(toolTip);

  // append initial circles
  var circlesGroup = chartGroup.selectAll("circle")
  .data(theData)
  .enter()
  
  circlesGroup
  .append("circle")
  .attr("class",function(d){
    return "stateCircle " + d.abbr;
  })
  .attr("cx", d => xLinearScale(d[chosenXAxis]))
  .attr("cy", d => yLinearScale(d[chosenYAxis]))
  .attr("r", radius)

  // Add the state abbreviations in the circles
  circlesGroup
    .append("text")
    .attr("dx", d => xLinearScale(d.poverty))
    .attr("dy", function(d){
      return yLinearScale(d.healthcare) + radius/2.5;
    })
    .attr("font-size", radius)
    .classed("stateText", true)
    .text(function(d, i){
       return d.abbr;
    })

    // add mouse events
    .on("mouseover", function(d) {
      toolTip.show(d);
      d3.select("." + d.abbr).style("fill", "#1244e9");
    })
    .on("mouseout", function(d) {
      toolTip.hide(d);
      d3.select("." + d.abbr).style("fill", "#89bdd3");
    });

  // Assign a group for 3 x-axis labels
  var xlabelsGroup = chartGroup.append("g")
    .attr("transform",`translate(${width/2}, ${height + 20})`);

  // for x-axis
  xlabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty")
    .attr("class", "aText active x-axis")
    .text("In Poverty(%)");

  xlabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age")
    .attr("class", "aText inactive x-axis")
    .text("Age (Median)");

  xlabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 60)
    .attr("value", "income")
    .attr("class", "aText inactive x-axis")
    .text("Household Income(Median)");
  
  // for y-axis
  var ylabelsGroup = chartGroup.append("g")
    .attr("transform",`translate(-40, ${height/2})`);

  ylabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0)
    .attr("x", 0)
    .attr("value","healthcare")
    .attr("class","aText active y-axis")
    .text("Lacks Healthcare(%)");
  
  ylabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -20)
    .attr("x", 0)
    .attr("value", "smokes")
    .attr("class", "aText inactive y-axis")
    .text("Smokes(%)");
  
  ylabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", 0)
    .attr("value", "obesity")
    .attr("class", "aText inactive y-axis")
    .text("Obese(%)");

  // x-axis label event listener
  xlabelsGroup.selectAll("text")
    .on("click", function(){
      var value = d3.select(this).attr("value");
      var self = d3.select(this);

      if(value !== chosenXAxis){
        chosenXAxis = value;
        xLinearScale = xScale(theData, chosenXAxis);
        xAxis = renderXAxis(xLinearScale, xAxis);
        renderCircles("x-axis", xLinearScale, chosenXAxis);
        renderTexts("x-axis", xLinearScale, chosenXAxis);
        hiLiteLabel("x-axis", self);
      }
    });

  // y-axis label event listener
  ylabelsGroup.selectAll("text")
    .on("click", function(){
      var value = d3.select(this).attr("value");
      var self = d3.select(this);

      if(value !== chosenYAxis){
        chosenYAxis = value;
        yLinearScale = yScale(theData, chosenYAxis);
        yAxis = renderYAxis(yLinearScale, yAxis);
        renderCircles("y-axis", yLinearScale, chosenYAxis);
        renderTexts("y-axis", yLinearScale, chosenYAxis);
        hiLiteLabel("y-axis", self);
      }
    });

}).catch(function(error){
  console.log(error);
});