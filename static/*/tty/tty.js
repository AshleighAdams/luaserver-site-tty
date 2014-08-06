
$( document ).ready(function()
{
	var sheet = document.createElement('style')
	document.body.appendChild(sheet);

	var ws
	
	var term = new Terminal({
		cols: 80,
		rows: 24
	})
	
	term.open(document.getElementById("tty"))

	term.on('data', function(data) {
		try
		{
			ws.send(data)
		}
		catch(err)
		{
		}
	})

	term.on('title', function(title) {
		document.title = title;
		document.getElementById("title").innerHTML = title
	})
	
	function Connect()
	{
		ws = new WebSocket("ws://" + location.host + "/tty", "tty")
		ws.onopen = function()
		{
			sheet.innerHTML = "div.title{color: #fff;} div.title::after{content: '';} div.title::before{content: '';}"
			//term.write('\x1b[32mgained connection\x1b[m\r\n')
		}
		ws.onmessage = function(event)
		{
			term.write(event.data)
		}
		ws.onclose = function(event)
		{
			sheet.innerHTML = "div.title{color: #777;} div.title::after{color: #a55; content: ' connection';} div.title::before{color: #a55; content: 'lost ';}"
			setTimeout(Connect, 1000)
			//term.write('\x1b[31mlost connection\x1b[m\r\n');
		}
	}
	Connect()
})

