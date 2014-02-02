local template = include("template.lua")
local pty = require("pty")

local socket
local tty

local function tty_onconnect(client)
	print("tty: client connected")
end
local function tty_ondisconnect(client)
	print("tty: client disconnected")
end
local function tty_onmessage(client, message)
	print("tty: msg: " .. message)
	tty:write(message)
end

socket = websocket.register("/tty", "tty", {onconnect = tty_onconnect, ondisconnect = tty_ondisconnect, onmessage = tty_onmessage})

local function tty_task()
	tty = pty.new()
	while true do
		if tty:canread() then
			local payload = tty:read(tty:pending()) --base64.encode(
			socket:send(payload)
		end
		coroutine.yield() -- allow other stuff to execute
	end
end
scheduler.newtask("tty", tty_task)

local function index(req, res)
	template.make(res)
end
reqs.AddPattern("*", "/tty/", index)
