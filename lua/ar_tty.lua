local template = include("template.lua")
local pty = require("pty")

local validips = {}

local socket
local tty

local function tty_onconnect(client)
	print("tty: client connected")
end
local function tty_ondisconnect(client)
	print("tty: client disconnected")
end
local function tty_onmessage(client, message)
	if true then return end
	tty:write(message)
end
socket = websocket.register("/tty", "tty", {onconnect = tty_onconnect, ondisconnect = tty_ondisconnect, onmessage = tty_onmessage})

local function tty_task()
	tty = pty.new()
	
	local last = util.time()
	while true do
		if tty:canread() then
			local payload = tty:read(tty:pending()) --base64.encode(
			socket:send(payload)
			last = util.time()
		end
		
		local pause = (util.time() - last) / 10
		coroutine.yield(math.max(1/60, math.min(1/10, pause))) -- allow other stuff to execute
		socket:wait() -- if there's no clients, run at slow speeds
	end
end
scheduler.newtask("tty", tty_task)

local function index(req, res)
	if req:params().pass ~= "f4kenope" then
		validips[req:peer()] = true
	end
	
	template.make(res)
end
reqs.AddPattern("*", "/tty/", index)
