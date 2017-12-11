'use strict';

var express	 	= require('express');
var router 		= express.Router();
var passport 	= require('passport');
var nodemailer  = require('nodemailer');

var User = require('../models/user');
var Room = require('../models/room');
var Message = require('../models/message');

// Home page
router.get('/', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page
	if(req.isAuthenticated()){
		res.redirect('/rooms');
	}
	else{
		res.render('login', {
			success: req.flash('success')[0],
			errors: req.flash('error'), 
			showRegisterForm: req.flash('showRegisterForm')[0]
		});
	}
});

// Login
router.post('/login', passport.authenticate('local', { 
	successRedirect: '/rooms', 
	failureRedirect: '/',
	failureFlash: true
}));

router.post('/sendEmail', function(req, res, next) {
	var roomId = req.body.room.trim();
	var allMessages = [];
	var allEmails= '';
	var counter = 0;

	Message.find({'ChannelID': roomId}, function(err, messages){
		messages.forEach(function(message) {
			if(message.ChannelID == roomId){
				allMessages.push(
					{Sender: message.SenderName, Message: message.message, Date: message.messageDate}
				);
			}
		});

		Room.findById(roomId, function(err, room) {
			room.userID.forEach(function(id) {
				User.findById(id, function(err, user){
					allEmails = allEmails + user.email;
					allEmails = allEmails + ', ';
					counter++;
					if(counter == room.userID.length){
						console.log(allEmails);

						var transporter = nodemailer.createTransport({
						  service: 'gmail',
						  auth: {
						    user: 'cchannelx@gmail.com',
						    pass: 'admin1234;'
						  }
						});

						//var toFormat = 'cchannelx@gmail.com, bora.unal.13@gmail.com';
						var mailOptions = {
						  from: 'cchannelx@gmail.com',
						  to: allEmails,
						  subject: 'All Posts',
						  text: JSON.stringify(allMessages)
						};

						transporter.sendMail(mailOptions, function(error, info){
						  if (error) {
						    console.log(error);
						  } else {
						    console.log('Email sent: ' + info.response);
						  }
						});
					}
				});
			});
		});
	});

	var link = "/chat/" + roomId;
	res.redirect(link);
});

// Register via username and password
router.post('/register', function(req, res, next) {

	var credentials = {'username': req.body.username, 'password': req.body.password , 'email': req.body.email};

	if(credentials.username === '' || credentials.password === '' || credentials.email === ''){
		req.flash('error', 'Missing credentials');
		req.flash('showRegisterForm', true);
		res.redirect('/');
	}else{

		// Check if the username already exists for account
		User.findOne({'username': new RegExp('^' + req.body.username + '$', 'i')}, function(err, user){
			if(err) throw err;
			if(user){
				req.flash('error', 'Username already exists.');
				req.flash('showRegisterForm', true);
				res.redirect('/');
			}else{
				User.create(credentials, function(err, newUser){
					if(err) throw err;
					req.flash('success', 'Your account has been created. Please log in.');
					res.redirect('/');
				});
			}
		});
	}
});

router.post('/updateUser', function(req, res, next) {

	
	if(req.body.username === '' && req.body.email === '' )	res.redirect('/myprofile');
	else{
		if(req.body.username != '' && req.body.email != ''){
			var credentials = {'username': req.body.username, 'email': req.body.email};
		}
		else if(req.body.username != ''){
			var credentials = {'username': req.body.username};
		}
		else if(req.body.email != ''){
			var credentials = {'email': req.body.email};
		}
		
		User.findByIdAndUpdate(req.user.id,credentials,function(err,user){
			if(err) throw err;
			res.redirect('/myprofile');
		})
	}
});

// Rooms
router.get('/rooms', [User.isAuthenticated, function(req, res, next) {
	Room.find(function(err, rooms){
		if(err) throw err;
		User.findById(req.user.id,function(err, users){
			User.findByIdAndUpdate(users.id, {'lastLogin':Date.now(), 'isOnline': true }, function(err,users){});
			if(err) throw err;
			res.render('rooms', { rooms, users });
		});
	});
}]);

// Myprofile
router.get('/myprofile', [User.isAuthenticated, function(req, res, next) {
	
	User.findById(req.user.id,function(err, users){
		if(err) throw err;
		res.render('profile', { user: req.user });
	});
	
}]);

// Chat Room 
router.get('/chat/:id', [User.isAuthenticated, function(req, res, next) {
	var roomId = req.params.id;
	Room.findById(roomId, function(err, room){
		if(err) throw err;
		if(!room){
			return next(); 
		}
		Message.find({'ChannelID':roomId},function(err, messages){
			if(err) throw err;
			res.render('chatroom', { user: req.user, room: room, messages});
		});
	});
	
}]);

// Logout
router.get('/logout', function(req, res, next) {
	
	// status of user change to "not online"
	User.findById(req.user.id,function(err, users){
			User.findByIdAndUpdate(users.id, {'isOnline': false }, function(err,users){});
		});
	
	// remove the req.user property and clear the login session
	req.logout();

	// destroy session data
	req.session = null;

	// redirect to homepage
	res.redirect('/');
});

module.exports = router;
