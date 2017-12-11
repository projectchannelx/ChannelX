'use strict';

// Chat application dependencies
var express 	= require('express');
var app  		= express();
var path 		= require('path');
var bodyParser 	= require('body-parser');
var flash 		= require('connect-flash');
var nodemailer  = require('nodemailer');
var http 		= require('http');

// Chat application components
var routes 		= require('./app/routes');
var session 	= require('./app/session');
var passport    = require('./app/auth');
var ioServer 	= require('./app/socket')(app);
var logger 		= require('./app/logger');

var Period  = require('./app/models/period');
var Room    = require('./app/models/room');
var Message = require('./app/models/message');
var User 	= require('./app/models/user');

var periodControl = function() {
	Period.find(function(err, periods) {
		periods.forEach(function(per) {
			var perDate = per.endDate.toISOString();
			console.log(perDate);
			var now = new Date().toISOString();
			console.log(now);
			if(now.localeCompare(perDate) == 1) {
				Room.findByIdAndUpdate(per.ChannelID, {'isActive': false}, function(err, message){
					if(err) throw err;
					console.log("kanal kapandi, herkese mail yollaniyor..");
					var roomId = per.ChannelID;
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

										Period.remove({'ChannelID': roomId}, function(err, info){
											if(err) throw err;
											console.log("period silindi");
										});
									}
								});
							});
						});
					});
				});
			}
		});
	});
}
setInterval(periodControl, 300000);

// Set the port number
var port = process.env.PORT || 3000;

// View engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/', routes);

// Middleware to catch 404 errors
app.use(function(req, res, next) {
  res.status(404).sendFile(process.cwd() + '/app/views/404.htm');
});

ioServer.listen(port);

module.exports = app;
if (!module.parent) {
	//app.listen(4000);
  	http.createServer(app).listen(process.env.PORT, function(){
    console.log("Server listening on port " + app.get('port'));
  });
}