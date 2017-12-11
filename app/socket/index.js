'use strict';

var config 	= require('../config');
var redis 	= require('redis').createClient;
var adapter = require('socket.io-redis');
var randomString = require('random-string');

var Room = require('../models/room');
var Message = require('../models/message');
var User = require('../models/user');
var Period = require('../models/period');
/**
 * Encapsulates all code for emitting and listening to socket events
 *
 */
var ioEvents = function(io) {

	// Rooms namespace
	io.of('/rooms').on('connection', function(socket) {

		// Create a new room
		socket.on('createRoom', function(title,ownerID, start, end, isRepeat, days, en, isActive) {
			Room.findOne({'title': new RegExp('^' + title + '$', 'i')}, function(err, room){
				if(err) throw err;
				if(room){
					socket.emit('updateRoomsList', { error: 'Room title already exists.' });
				} else {
					var verificationCode = randomString();
					Room.create({ 
						title: title,
						ownerID: ownerID,
						verificationCode: verificationCode,
						isActive: isActive
					}, function(err, newRoom){
						if(err) throw err;
						socket.emit('updateRoomsList', newRoom);
						socket.broadcast.emit('updateRoomsList', newRoom);
						var credentials = {'ChannelID': newRoom.id, 'startTime': start, 'endTime': end, 'isRepeat': isRepeat, 'days': days, 'endDate': en};
						Period.create(credentials);
					});
				}
			});
		});
	});

	// Chatroom namespace
	io.of('/chatroom').on('connection', function(socket) {

		// Join a chatroom
		socket.on('join', function(roomId, userid) {
			Room.findById(roomId, function(err, room){
				if(err) throw err;
				if(!room){
					// Assuming that you already checked in router that chatroom exists
					// Then, if a room doesn't exist here, return an error to inform the client-side.
					socket.emit('updateUsersList', { error: 'Room doesnt exist.' });
				} else {
					// Check if user exists in the session
					if(socket.request.session.passport == null){
						return;
					}
					var offlineList = [];
					var onlineList = [];
					room.userID.forEach(function(user_id){
						User.findOne({'_id': user_id}, function(err, user){
							if(user.isOnline){
								if(onlineList.find(online => (online["username"] === user.username))){
									console.log("exist");
								}
								else{
									onlineList.push(user);								
								}
							}
							else{
								if(offlineList.find(offline => (offline["username"] === user.username))){
									console.log("exist");
								}
								else{
									offlineList.push(user);								
								}
							}
						});
					});
					Room.addUser(room, socket, function(err, newRoom){

						// Join the room channel
						socket.join(newRoom.id);

						Room.getUsers(newRoom, socket, function(err, users, cuntUserInRoom){
							if(err) throw err;
							
							// Return list of all user connected to the room to the current user
							socket.emit('updateUsersList', onlineList, true, offlineList);

							// Return the current user to other connecting sockets in the room 
							// ONLY if the user wasn't connected already to the current room
							if(cuntUserInRoom === 1){
								socket.broadcast.to(newRoom.id).emit('updateUsersList', users[users.length - 1]);
							}
						});
					});
				}
				var userList = room.userID;
				var checkId = false;
				userList.forEach(function(ui) {
					if(ui == userid){
						checkId = true;
					}
				});
				if(!checkId){
					userList.push(userid);
				}
				Room.findByIdAndUpdate(roomId, { 
						userID: userList
					}, function(){
				});
			});
		});

		// When a socket exits
		socket.on('disconnect', function() {

			// Check if user exists in the session
			if(socket.request.session.passport == null){
				return;
			}

			// Find the room to which the socket is connected to, 
			// and remove the current user + socket from this room
			Room.removeUser(socket, function(err, room, userId, cuntUserInRoom){
				if(err) throw err;

				// Leave the room channel
				socket.leave(room.id);

				// Return the user id ONLY if the user was connected to the current room using one socket
				// The user id will be then used to remove the user from users list on chatroom page
				if(cuntUserInRoom === 1){
					socket.broadcast.to(room.id).emit('removeUser', userId);
				}
			});
		});

		// When a new message arrives
		socket.on('newMessage', function(roomId, message) {

			// No need to emit 'addMessage' to the current socket
			// As the new message will be added manually in 'main.js' file
			// socket.emit('addMessage', message);
			Message.create({'ChannelID': roomId, 'SenderName': message.username, 'message': message.content, "messageDate": Date.now()}, function(err,newMessage){
				if(err) throw err;
				});
            
			socket.broadcast.to(roomId).emit('addMessage', message);
		});

	});
}

/**
 * Initialize Socket.io
 * Uses Redis as Adapter for Socket.io
 *
 */
var init = function(app){

	var server 	= require('http').Server(app);
	var io 		= require('socket.io')(server);

	// Force Socket.io to ONLY use "websockets"; No Long Polling.
	io.set('transports', ['websocket']);

	// Using Redis
	let port = config.redis.port;
	let host = config.redis.host;
	let password = config.redis.password;
	let pubClient = redis(port, host, { auth_pass: password });
	let subClient = redis(port, host, { auth_pass: password, return_buffers: true, });
	io.adapter(adapter({ pubClient, subClient }));

	// Allow sockets to access session data
	io.use((socket, next) => {
		require('../session')(socket.request, {}, next);
	});

	// Define all Events
	ioEvents(io);

	// The server object will be then used to list to a port number
	return server;
}

module.exports = init;