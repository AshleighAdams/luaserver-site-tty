
$( document ).ready(function()
{
	var ws = new WebSocket("ws://localhost:8080/tty", "tty")
	
	var term = new Terminal({
		cols: 80,
		rows: 24
	})
	
	term.open(document.getElementById("tty"))

	term.on('data', function(data) {
		ws.send(data)
	})

	term.on('title', function(title) {
		document.title = title;
		document.getElementById("title").innerHTML = title
	})
	
	ws.onopen = function()
	{
		term.write('\x1b[32mgained connection\x1b[m\r\n')
	}
	ws.onmessage = function(event)
	{
		term.write(event.data)
	}
	ws.onclose = function(event)
	{
		term.write('\x1b[31mlost connection\x1b[m\r\n');
	}
})

