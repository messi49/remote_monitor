// Remote UI
var UPLOAD_INTERVAL = 100;
var MAX_STEERING_ANGLE = 600;
var MAX_ACCEL_STROKE = 1000;
var MAX_BRAKE_STROKE = 3000;

var remote_cmd = {
  "vehicle_id": 0,
  "emergency": 0,
  "steering": 0,
  "accel": 0,
  "brake": 0,
  "gear": 0,
  "mode": 0,
  "blinker": 0,
}

var vehicle_info = {}

window.onload = function() {
  setSteeringAngle(0);
  setSpeed(0);
  setRPM(0);
  setGear("-");

  // var count = 0;
  // var send_cmd = function(){
  //
  //   // signalingChannel.send(JSON.stringify({ "remote_cmd": remote_cmd }));
  //   // console.log(JSON.stringify({ "remote_cmd": remote_cmd }));
  //   setSteeringAngle(count);
  //   setSpeed(count);
	// 	setRPM(1000*count);
  //   setGear("D");
  //   setAccelStroke(count, 100);
  //   setBrakeStroke(count, 100);
  //   setSteeringPosition(count, 100);
  //   count++;
  // }
  // setInterval(send_cmd, UPLOAD_INTERVAL);
}

function set_vehicle_info(msg) {
  vehicle_info = convert_vehcile_info_csv_to_dict(msg);

  setSteeringAngle(parseFloat(vehicle_info["angle"]), MAX_STEERING_ANGLE);
  setSteeringPosition(parseFloat(vehicle_info["angle"]), MAX_STEERING_ANGLE);
  setSpeed(parseFloat(vehicle_info["speed"]));
  setRPM(parseFloat(vehicle_info["rpm"]));
  setGear(vehicle_info["driveshift"]);
  setAccelStroke(parseFloat(vehicle_info["drivepedal"]), MAX_ACCEL_STROKE);
  setBrakeStroke(parseFloat(vehicle_info["brakepedal"]), MAX_BRAKE_STROKE);
}

function select_gear(obj) {
  var idx = obj.selectedIndex;
  var value = obj.options[idx].value;
  var text  = obj.options[idx].text;

  console.log('value = ' + value + ', ' + 'text = ' + text);
  remote_cmd["gear"] = value;
}

function select_emergency_button(obj) {
  remote_cmd["emergency"] = remote_cmd["emergency"] == 0 ? 1 : 0;
  console.log('select_emergency_button => ' + remote_cmd["emergency"]);
}

function select_mode_button(obj) {
  remote_cmd["mode"] = remote_cmd["mode"] == 0 ? 1 : 0;
  console.log('select_mode_button => ' + remote_cmd["mode"]);
}

// Rotate Image
function rotateImage(image_src, mime_type, angle) {
  var img = new Image();
  img.src = image_src;

  var min_size = 0;
  if (img.height <= img.width) {
    min_size = img.width;
  }
  else {
    min_size = img.height;
  }

  var newCanvas = document.createElement('canvas');
  newCanvas.width  = min_size;
  newCanvas.height = min_size;
  var newCtx = newCanvas.getContext('2d') ;
  newCtx.save();
  newCtx.translate(img.width / 2, img.height / 2) ;
  newCtx.rotate(angle);
  newCtx.drawImage ( img, -img.width / 2, -img.height / 2) ;
  // Image Base64
  return newCanvas.toDataURL(mime_type);
}

// Set Steering Angle
function setSteeringAngle(angle, max_angle) {
  var target_angle = 0;
  if (max_angle != null) {
    if (max_angle < angle) {
      angle = max_angle;
    }
    else if (angle < -max_angle) {
      angle = -max_angle;
    }
  }
  target_angle = angle * Math.PI / 180 % 360;

  document.getElementById('vehicle_steering').src = rotateImage("/img/steering.png", "image/png", target_angle);
}

// Set Speed
function setSpeed(speed) {
  var target_speed = 0;
  if (speed < 0) {
    target_speed = 0;
  }
  else if (220 < speed) {
    target_speed = 220;
  }
  else {
    target_speed = speed;
  }
  speedMeter.setValue(target_speed);
  document.getElementById("text_speed").innerHTML = "Speed: " + target_speed + " km/h";
}

// Set RPM
function setRPM(rpm) {
  var target_rpm = 0;
  if (rpm < 0) {
    target_rpm = 0;
  }
  else if (8000 < rpm) {
    target_rpm = 8000;
  }
  else {
    target_rpm = rpm;
  }
  rpmMeter.setValue(target_rpm);
}

// Set Gear
function setGear(gear) {
  gearMeter.innerHTML = gear;
}

// Set Accel Stroke
function setAccelStroke(value, max_value) {
  var accel_bar = document.getElementById('accel_bar');
  var target_value = 0;
  if (max_value != null) {
    target_value = 100 * value / max_value;
  }
  else {
    target_value = value;
  }
  accel_bar.value = target_value;
}

// Set Brake Stroke
function setBrakeStroke(value, max_value) {
  var brake_bar = document.getElementById('brake_bar');
  var target_value = 0;
  if (max_value != null) {
    target_value = 100 * value / max_value;
  }
  else {
    target_value = value;
  }
  brake_bar.value = target_value;
}

// Set Steering position
function setSteeringPosition(angle, max_angle) {
  var fill = document.querySelector('.fill');
  var target_angle_ratio = 50;
  if (angle == 0) {
    target_angle_ratio = 50;
  }
  else if (0 < angle) {
    if (max_angle < angle) {
      target_angle_ratio = 100;
    }
    else {
      target_angle_ratio = 50 + 50 * (angle / max_angle);
    }
  }
  else if (angle < 0) {
    if (angle < -max_angle) {
      target_angle_ratio = 0;
    }
    else {
      target_angle_ratio = 50 - 50 * (angle / max_angle);
    }
  }
  fill.style.width = target_angle_ratio + '%';
}

// METER
var rpmMeter;
var speedMeter;
var gearMeter

var Meter = function Meter($elm, config) {

	// DOM
	var $needle = undefined,
	    $value = undefined;

	// Others

	var steps = (config.valueMax - config.valueMin) / config.valueStep,
	    angleStep = (config.angleMax - config.angleMin) / steps;

	var margin = 10; // in %
	var angle = 0; // in degrees

	var value2angle = function value2angle(value) {
		var angle = value / (config.valueMax - config.valueMin) * (config.angleMax - config.angleMin) + config.angleMin;

		return angle;
	};

	this.setValue = function (v) {
		$needle.style.transform = "translate3d(-50%, 0, 0) rotate(" + Math.round(value2angle(v)) + "deg)";
		$value.innerHTML = config.needleFormat(v);
	};

	var switchLabel = function switchLabel(e) {
		e.target.closest(".meter").classList.toggle('meter--big-label');
	};

	var makeElement = function makeElement(parent, className, innerHtml, style) {

		var e = document.createElement('div');
		e.className = className;

		if (innerHtml) {
			e.innerHTML = innerHtml;
		}

		if (style) {
			for (var prop in style) {
				e.style[prop] = style[prop];
			}
		}

		parent.appendChild(e);

		return e;
	};

	// Label unit
	makeElement($elm, "label label-unit", config.valueUnit);

	for (var n = 0; n < steps + 1; n++) {
		var value = config.valueMin + n * config.valueStep;
		angle = config.angleMin + n * angleStep;

		// Graduation numbers

		// Red zone
		var redzoneClass = "";
		if (value > config.valueRed) {
			redzoneClass = " redzone";
		}

		makeElement($elm, "grad grad--" + n + redzoneClass, config.labelFormat(value), {
			left: 50 - (50 - margin) * Math.sin(angle * (Math.PI / 180)) + "%",
			top: 50 + (50 - margin) * Math.cos(angle * (Math.PI / 180)) + "%"
		});

		// Tick
		makeElement($elm, "grad-tick grad-tick--" + n + redzoneClass, "", {
			left: 50 - 50 * Math.sin(angle * (Math.PI / 180)) + "%",
			top: 50 + 50 * Math.cos(angle * (Math.PI / 180)) + "%",
			transform: "translate3d(-50%, 0, 0) rotate(" + (angle + 180) + "deg)"
		});

		// Half ticks
		angle += angleStep / 2;

		if (angle < config.angleMax) {
			makeElement($elm, "grad-tick grad-tick--half grad-tick--" + n + redzoneClass, "", {
				left: 50 - 50 * Math.sin(angle * (Math.PI / 180)) + "%",
				top: 50 + 50 * Math.cos(angle * (Math.PI / 180)) + "%",
				transform: "translate3d(-50%, 0, 0) rotate(" + (angle + 180) + "deg)"
			});
		}

		// Quarter ticks
		angle += angleStep / 4;

		if (angle < config.angleMax) {
			makeElement($elm, "grad-tick grad-tick--quarter grad-tick--" + n + redzoneClass, "", {
				left: 50 - 50 * Math.sin(angle * (Math.PI / 180)) + "%",
				top: 50 + 50 * Math.cos(angle * (Math.PI / 180)) + "%",
				transform: "translate3d(-50%, 0, 0) rotate(" + (angle + 180) + "deg)"
			});
		}

		angle -= angleStep / 2;

		if (angle < config.angleMax) {
			makeElement($elm, "grad-tick grad-tick--quarter grad-tick--" + n + redzoneClass, "", {
				left: 50 - 50 * Math.sin(angle * (Math.PI / 180)) + "%",
				top: 50 + 50 * Math.cos(angle * (Math.PI / 180)) + "%",
				transform: "translate3d(-50%, 0, 0) rotate(" + (angle + 180) + "deg)"
			});
		}
	}

	// NEEDLE
	angle = value2angle(config.value);

	$needle = makeElement($elm, "needle", "", {
		transform: "translate3d(-50%, 0, 0) rotate(" + angle + "deg)"
	});

	var $axle = makeElement($elm, "needle-axle").addEventListener("click", switchLabel);
	makeElement($elm, "label label-value", "<div>" + config.labelFormat(config.value) + "</div>" + "<span>" + config.labelUnit + "</span>").addEventListener("click", switchLabel);

	$value = $elm.querySelector(".label-value div");
};

// DOM LOADED FIESTA

document.addEventListener("DOMContentLoaded", function () {

	rpmMeter = new Meter(document.querySelector(".meter--rpm"), {
		value: 6.3,
		valueMin: 0,
		valueMax: 8000,
		valueStep: 1000,
		valueUnit: "<div>RPM</div><span>x1000</span>",
		angleMin: 30,
		angleMax: 330,
		labelUnit: "RPM",
		labelFormat: function labelFormat(v) {
			return Math.round(v / 1000);
		},
		needleFormat: function needleFormat(v) {
			return Math.round(v / 100) * 100;
		},
		valueRed: 6500
	});

	speedMeter = new Meter(document.querySelector(".meter--speed"), {
		value: 0,
		valueMin: 0,
		valueMax: 220,
		valueStep: 20,
		valueUnit: "<span>Speed</span><div>Km/h</div>",
		angleMin: 30,
		angleMax: 330,
		labelUnit: "Km/h",
		labelFormat: function labelFormat(v) {
			return Math.round(v);
		},
		needleFormat: function needleFormat(v) {
			return Math.round(v);
		}
	});

	gearMeter = document.querySelector('.meter--gear div');
});
