(function(root){
  var Drone = root.Drone = (root.Drone || {});





})(this);





try{
  var context = new (window.AudioContext || window.webkitAudioContext)(),
  _x,
  _y;
}
catch(err){
  alert('sorry! so so sorry!');
  alert('really just, gosh, wow, very sorry!');
}






var svg = d3.select("body").append("svg:svg");
function addCircle(x, y, z) {
  svg.append("svg:circle")
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", function(){
      var r = 1e-6 + (y / 20);
      if (r < 1) {
        r = 1;
      }
      return r;
    })
    .style("stroke", ['red', 'yellow', 'green'][Math.floor(Math.random()*3)])
    .style("stroke-width", "10px")
    .style("fill", "none")
    .style("stroke-opacity", 1 - (1 - ( (500 - z) / 1000) ) )
    .transition()
    .duration(1000)
    .ease(Math.sqrt)
    .attr("r", function(){
      if (y < 1) {
        return 1;
      }
      return y;
    })
    .style("stroke-opacity", 1e-6)
    .remove();
}//is this really what d3 is like? NO THANK U








var synths = {};
var gainVal = 0.1;
var counter = 0;
var qval = 25;

var filterFloor = 200;
var filterCeil = 780;
var oscFloor = 50;
var oscCeil = 800;

function updateUI() {
  $("#output").text('1a:' + filterFloor + '|1b:' + filterCeil + '|||2a:' + oscFloor + '|2b:' + oscCeil);
}
key('up', function(){
  filterFloor += 25;
  updateUi();
});

key('down', function(){
  filterFloor -= 25;
  updateUi();
});

key('left', function(){

});

key('right', function(){

});

function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
}

function setupSynth(){
  var nodes={};
  nodes.source = context.createOscillator();
  nodes.source.type = 1;
  nodes.source.frequency.value = [100, 150, 200, 250, 50][Math.floor(Math.random() * 5)];

  nodes.filter = context.createBiquadFilter();
  nodes.filter.Q.value = qval;
  nodes.filter.frequency.value = 400;
  nodes.filter.type = "lowshelf";//0; //0 is a low pass filter

  nodes.distortion = context.createWaveShaper();
  nodes.analyser = context.createAnalyser();
  nodes.distortion.curve = makeDistortionCurve(100);

  nodes.panning = context.createPanner();
  nodes.panning.setPosition(0, 0, 0);

  nodes.lowFilter = context.createBiquadFilter();
  nodes.lowFilter.Q.value = qval;
  nodes.lowFilter.type = 0;
  nodes.lowFilter.frequency.value = 300;

  nodes.volume = context.createGainNode();
  nodes.volume.gain.value = 0;

  nodes.source.connect(nodes.filter);
  nodes.filter.connect(nodes.analyser);
  nodes.analyser.connect(nodes.distortion);
  nodes.distortion.connect(nodes.lowFilter);
  nodes.lowFilter.connect(nodes.volume);
  nodes.volume.connect(nodes.panning);
  nodes.panning.connect(context.destination);

  return nodes;
}


function setReverbImpulseResponse(url, convolver, callback) {
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  request.onload = function () {
    convolver.buffer = context.createBuffer(request.response, false);
    callback();
  };
  request.send();
}

function updateNote(syn, filter, osc, z, variance, coord){
  syn.filter.frequency.value = filter + (variance * Math.random());
  syn.lowFilter.frequency.value = osc + (variance * Math.random());
  // console.log(coord)
  syn.panning.setPosition(pannifyCoord(coord.x), pannifyCoord(coord.y), pannifyCoord(coord.z));

  // syn.distortion.curve = makeDistortionCurve(z);
}






function mapRange(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function pannifyCoord(coord) {
  if (coord <= 0){
    coord = coord * -1;
  }
  if (coord > 1000){
    coord = 1000;
  }

  return mapRange(coord, 0, 1000, -3, 3);
}


function getCoord(pointer) {
  return {
    x: window.innerWidth / 2 + 3 * pointer.tipPosition[0],
    y: window.innerHeight - 150 - pointer.tipPosition[1],
    z: 180 + pointer.tipPosition[2],
    id: pointer.id
  };
}







// SO should.include.keys(" ");
// make a theremin object that gets passed a frame.


$(document).ready(function() {
  Leap.loop(function(frame) {

    if (Math.random() < 0.33){

          // can't remember how to avoid zombie objects
      // is this even a zombie object case?
    // if (frame.pointables.length <= 0) {

    //   for (var synth in synths) {
    //     delete synths.synth;
    //   }
    //   synths.length = 0;
    //   synths = {};
    // }


// silence all the synths
    for (var s in synths){
      synths[s].volume.gain.value = 0;
    }



    var onsynth = [];
    for (var i = 0; i < frame.pointables.length; i++) {
      var coord = getCoord(frame.pointables[i]);
//       if(i == 0){
//         console.log(coord)
// console.log(pannifyCoord(coord.x), pannifyCoord(coord.y), pannifyCoord(coord.z))
// }
      //adding d3 circle
      addCircle(coord.x, coord.y, coord.z);
      //set up synth if it doesnt exist
      if (coord.id in synths) {

      } else {
        var n = setupSynth();
        n.source.noteOn(0);
        synths[coord.id] = n;
      }

      //update synth

      var syn = synths[coord.id];
      var filterFreq = mapRange(coord.y, window.screen.availHeight, 0, filterFloor, filterCeil);
      var oscFreq = mapRange(coord.x, window.screen.availWidth, 0, oscFloor, oscCeil);
      updateNote(syn, filterFreq, oscFreq, coord.z, 100, coord);//ugh whatever make it ugly then refactor

      onsynth.push(coord.id);
    }



    //only play ones that are on
    for (var os in onsynth){
      synths[onsynth[os]].volume.gain.value = gainVal;
    }
}
  });
});

