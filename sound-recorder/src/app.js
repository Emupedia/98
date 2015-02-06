
var previous_time;
var tid = -1;
var recording = false;
var playing = false;

var file = new AudioFile;

var update = function(position_from_slider){
	document.title = file.name + " - Sound Recorder";
	if(position_from_slider != null){
		file.position = position_from_slider;
		
		file.audio.seek(file.position);
		if(playing){
			file.audio.play();
		}
	}else{
		if(playing){
			var delta_time = audio_context.currentTime - previous_time;
			previous_time = audio_context.currentTime;
			file.position += delta_time;
		}
		if(recording || playing){
			if(file.position >= file.availLength){
				file.position = file.availLength;
				stop();
			}
		}
		if(recording){
			file.length = Math.max(file.length, file.position);
		}
		if(file.length && !playing && !recording){
			$play.enable();
		}else{
			$play.disable();
		}
		$slider.slider("option", "max", file.availLength);
		$slider.slider("value", file.position);
	}
	
	$length.display(file.availLength);
	$position.display(file.position);
	$wave_display.display();
	
	if(file.length && file.position > 0){
		$seek_to_start.enable();
	}else{
		$seek_to_start.disable();
	}
	if(file.length && file.position + SLIDER_DUMBNESS < file.length){ // why doesn't the slider slide all the way to the max?
		$seek_to_end.enable();
	}else{
		$seek_to_end.disable();
	}
};

var record = function(){
	clearInterval(tid);
	
	$record.disable();
	$stop.enable();
	
	file.availLength = Math.max(file.length, file.position + 23.77);
	file.updateBuffer();
	
	previous_time = audio_context.currentTime;
	tid = setInterval(update, 50);
	recording = true;
};

var stop = function(){
	clearInterval(tid);
	
	file.audio.pause();
	
	recording = false;
	playing = false;
	
	$stop.disable();
	if(input){ $record.enable(); }
	
	file.availLength = file.length;
	update();
};

var play = function(){
	clearInterval(tid);
	if(file.position >= file.length){
		file.position = 0;
	}
	file.audio.seek(file.position);
	file.audio.play();
	
	$play.disable();
	$stop.enable();
	
	playing = true;
	previous_time = audio_context.currentTime;
	tid = setInterval(update, 50);
	update();
};

var seek = function(t){
	file.position = t;
	file.audio.seek(file.position);
	if(playing){ file.audio.play(); }
	update();
};
var seek_to_start = function(){
	seek(0);
};
var seek_to_end = function(){
	seek(file.length);
};


var are_you_sure = function(fn){
	fn(); // probably, right?
	// @TODO: dialouge box
};
var reset = function(){
	recording = false;
	playing = false;
	file = new AudioFile;
	update();
};
var file_new = function(){
	are_you_sure(reset);
};
var file_open = function(){
	$("<input type='file' accept='audio/*'>").click().change(function(e){
		var file_to_open = this.files[0];
		are_you_sure(function(){
			reset();
			file.name = file_to_open.name;
			file.originalType = file_to_open.type;
			
			var fileReader = new FileReader;
			fileReader.onload = function(){
				var arrayBuffer = this.result;
				audio_context.decodeAudioData(arrayBuffer, function(buffer){
					
					file.buffer = buffer;
					file.audio.initNewBuffer(buffer);
					file.length = file.availLength = buffer.length / buffer.sampleRate;
					update();
					
				}, function(){
					__log("Failed to read audio from file");
				});
			};
			fileReader.readAsArrayBuffer(file_to_open);
			
		});
	});
};
var file_save_as = function(){
	if(file.length > 0){
		file.download();
	}
};
var file_save = file_save_as;

var input;

$(function(){
	
	var gotStream = function(stream){
		input = audio_context.createMediaStreamSource(stream);
		__log("Media stream created.");
		
		input.connect($wave_display.analyser);
		input.connect(file.recorder);
		
		$record.enable();
	};
	var gotError = function(err){
		__log("No live audio input: " + err);
	};
	navigator.getUserMedia({audio: true}, gotStream, gotError);
	
	update();
	
});
