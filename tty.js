window.requestAnimFrame = (function(callback) {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
	function(callback) {
		window.setTimeout(callback, 1000 / 60);
	};
})();

$( document ).ready(function()
{
	con = new WebSocket("ws://localhost:8080/tty", "tty")
	con.onopen = function()
	{
		OnData("connected\n")
	}
	con.onmessage = function(event)
	{
		//term.echo(event.data)
		OnData(event.data)
	}
	con.onclose = function(event)
	{
		OnData("lost connection.\n")
		//term.echo("lost connection")
	}
	
	
	var canvas = document.getElementById("tty")
	var w = canvas.offsetWidth, h = canvas.offsetHeight
	canvas.setAttribute("width",  w)
	canvas.setAttribute("height", h)
	
	var rows = 24
	var cols = 80
	var cellwidth  = w / cols
	var cellheight = h / rows
	
	var context = canvas.getContext("2d")
	context.font = "12pt monospace"
	context.fillStyle = "#fff"
	
	var buffer = new Array()
	
	function EmptyChar()
	{
		return {
			char: ' ',
			fg: 7,
			bg: 0
		}
	}
	
	for(var y = 0; y < rows; y++)
	{
		var arr = buffer[y] = new Array()
		for(var x = 0; x < cols; x++)
			arr[x] = EmptyChar();
	}
	
	var cursor = {
		x: 0,
		y: 0,
		fg: 15,
		bg: 0,
		last_activity_time: new Date(),
		blink_speed: 1.25,
		blink_distribution: 0.5 // ratio to on:off
	}
	
	var colours = {
		0:  "#000000",
		1:  "#cc0000",
		2:  "#4e9a06",
		3:  "#c4a000",
		4:  "#3465a4",
		5:  "#75507b",
		6:  "#06989a",
		7:  "#d3d7cf",
		8:  "#555753",
		9:  "#ef2929",
		10: "#8ae234",
		11: "#fce94f",
		12: "#729fcf",
		13: "#ad7fa8",
		14: "#34e2e2",
		15: "#eeeeec",
	}
	
	function OnData(data)
	{
		for (var i = 0, len = data.length; i < len; i++)
		{
			var char = data[i];
			var obj = buffer[cursor.y][cursor.x]
			
			
			if(char == '\r')
				cursor.x = 0
			else if(char == '\n')
			{
				cursor.x = 0;
				cursor.y++
			}
			else if(char == '\b')
				cursor.x--
			else
			{
				obj.char = char
				obj.fg = cursor.fg
				obj.bg = cursor.bg
				cursor.x++
			}
			
			if(cursor.x >= cols)
			{
				cursor.x = 0;
				cursor.y++;
			}
			
			if(cursor.y >= rows)
			{
				for(var y = 0; y < rows - 1; y++)
					buffer[y] = buffer[y + 1]
				
				var arr = new Array(cols)
				for(var n = 0; n < cols; n++)
					arr[n] = EmptyChar()
					
				buffer[rows - 1] = arr
				cursor.y = rows - 1
			}
		}
	}
	      
	function DrawTTY()
	{
		context.clear()
		var now = new Date()
		
		for(var y = 0; y < rows; y++)
		{
			var arr = buffer[y]
			for(var x = 0; x < cols; x++)
			{
				var obj = arr[x]
				var cx = cellwidth * (x), cy = cellheight * (y)
				var fx = cellwidth * (x) - 1, fy = cellheight * (y + 0.75) - 1
			
				var fg = colours[obj.fg]
				var bg = colours[obj.bg]
			
				if(cursor.x == x && cursor.y == y && ((now.getTime() - cursor.last_activity_time.getTime()) / 1000) % cursor.blink_speed < (cursor.blink_speed * cursor.blink_distribution))
				{
					fg = colours[obj.bg]
					bg = colours[obj.fg]
				}
			
				context.fillStyle = bg
				context.fillRect(cx, cy, cellwidth, cellheight)
			
				context.fillStyle = fg
				context.fillText(obj.char, fx, fy)
			}
		}
		
		requestAnimFrame(DrawTTY)
		//setTimeout(DrawTTY, 1000 / 10)
	}
	DrawTTY()
	
	document.onkeydown = KeyDown
	document.onkeypress = KeyPress
	var ascii = ""
	
	function KeyPress(e)
	{
		var code = e.which || e.keyCode;
		ascii = String.fromCharCode(code)
			
		cursor.last_activity = new Date()
	}
	
	function KeyDown(evt) // so it's executed slower than keypress
	{
		var e = evt
		setTimeout(function()
		{
			var code = e.which || e.keyCode;
			var shift = e.shiftKey
			var ctrl = e.ctrlKey
			var seq = KeyToSequence(code, ctrl, shift)
		
			if(seq != undefined && seq != "")
				con.send(seq)
			else if(seq != "")
				con.send(ascii)
			
			cursor.last_activity = new Date()
		}, 1)
	}
	
	// http://www.lagmonster.org/docs/DOS7/v-ansi-keys.html
	var SequenceDictionary = {
		16: {normal: "", shift: ""}, // SHIFT
		17: {normal: "", ctrl: ""}, // CTRL
		8: {normal: 8, shift: 8, ctrl: 127}, // BKSP
		9: {normal: "\t", shift: "\x1b[Z"}, // TAB
		
		37: {normal: "\x1b[D"}, // ARROW KEYS
		38: {normal: "\x1b[A"},
		39: {normal: "\x1b[C"},
		40: {normal: "\x1b[B"},
		
		46: {normal: "\x1b[3~"}, // DEL
		45: {normal: "\x1b[2~"}, // INS
		36: {normal: "\x1b0H"}, // HOME
		35: {normal: "\x1b0F"}, // END
		33: {normal: "\x1b[5~"}, // PGUP
		34: {normal: "\x1b[6~"}, // PGDOWN
		
		112: {normal: "\x1b0P"}, // FUNCTION KEYS
		113: {normal: "\x1b0Q"}, // FUNCTION KEYS
		114: {normal: "\x1b0R"}, // FUNCTION KEYS
		115: {normal: "\x1b0S"}, // FUNCTION KEYS
		116: {normal: "\x1b0[15~"}, // FUNCTION KEYS
		117: {normal: "\x1b0[17~"}, // FUNCTION KEYS
		118: {normal: "\x1b0[18~"}, // FUNCTION KEYS
		119: {normal: "\x1b0[19~"}, // FUNCTION KEYS
		120: {normal: "\x1b0[20~"}, // FUNCTION KEYS
		121: {normal: "\x1b0[21~"}, // FUNCTION KEYS
		122: {normal: "\x1b0[23~"}, // FUNCTION KEYS
		123: {normal: "\x1b0[24~"}, // FUNCTION KEYS
		
		67: {ctrl: "^C"}, // ^C
	}
	
	function KeyToSequence(code, ctrl, shift)
	{
		var seq = (SequenceDictionary[code] || {})[shift ? "shift" : (ctrl ? "ctrl" : "normal")]
		if(seq != undefined)
		{
			if(typeof seq == "number")
				return String.fromCharCode(seq)
			else
				return seq;
		}
		
		console.log(code)
	}
})

CanvasRenderingContext2D.prototype.clear = 
  CanvasRenderingContext2D.prototype.clear || function (preserveTransform) {
    if (preserveTransform) {
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (preserveTransform) {
      this.restore();
    }           
};
