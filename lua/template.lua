
local template = tags.html
{
	tags.head
	{
		tags.title { "Terminal" },
		tags.link { type = "text/css", href = "/tty/style.css", rel = "stylesheet" },
		tags.script { src = "//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js" },
		tags.script { src = "/tty/tty.js" },
		tags.script { src = "/tty/term.js" }
	},
	tags.body
	{
		tags.div { class = "wrapper" }
		{
			tags.div { class = "title", id = "title" } { "Terminal" },
			tags.div { class = "tty", id = "tty" }
		}
	}
}

return {
	make = function(res)
		template.to_response(res)
	end
}
