'use strict';

var app = {

  rooms: function(){

    var socket = io('/rooms', { transports: ['websocket'] });

    // When socket connects, get a list of chatrooms
    socket.on('connect', function () {

      // Update rooms list upon emitting updateRoomsList event
      socket.on('updateRoomsList', function(room) {

        // Display an error message upon a user error(i.e. creating a room with an existing title)
        $('.room-create p.message').remove();
        if(room.error != null){
          $('.room-create').append(`<p class="message error">${room.error}</p>`);
        }else{
          app.helpers.updateRoomsList(room);
        }
      });

      // Whenever the user hits the create button, emit createRoom event.
      $('.room-create button').on('click', function(e) {
        var inputEle = $("input[name='title']");
        var roomTitle = inputEle.val().trim();
        var owner = $("input[name='ownerID']");
        var ownerID = owner.val().trim();

        var startTime = $("input[name='startTime']");
        var start = startTime.val().trim();
        var endTime = $("input[name='endTime']");
        var end = endTime.val().trim();
        var isR = $("input[name='isRepeat']");
        var isRepeat;
        var day = $("select[name='days']");
        var days = day.val();
        var endDate = $("input[name='endDate']");
        var en = endDate.val().trim();
        var isActive = true;
        if(isR.val().trim() == "1"){
          isRepeat = true;
        }
        if(isR.val().trim() == "0"){
          isRepeat = false;
        }

        if(roomTitle !== '') {
          socket.emit('createRoom', roomTitle,ownerID, start, end, isRepeat, days, en, isActive);
          inputEle.val('');
        }
      });

    });
  },

  chat: function(roomId, username, userID, userid){
    
    var socket = io('/chatroom', { transports: ['websocket'] });

      // When socket connects, join the current chatroom
      socket.on('connect', function () {

        socket.emit('join', roomId, userid);

        // Update users list upon emitting updateUsersList event
        socket.on('updateUsersList', function(users, clear, offlines) {

          $('.container p.message').remove();
          if(users.error != null){
            $('.container').html(`<p class="message error">${users.error}</p>`);
          }else{
            app.helpers.updateUsersList(users, clear, offlines);
          }
        });

        // Whenever the user hits the save button, emit newMessage event.
        $(".chat-message button").on('click', function(e) {

          var textareaEle = $("textarea[name='message']");
          var messageContent = textareaEle.val().trim();
          if(messageContent !== '') {
            var message = { 
              content: messageContent, 
              username: username,
              date: Date.now()
            };

            socket.emit('newMessage', roomId, message);
            textareaEle.val('');
            app.helpers.addMessage(message);
          }
        });

        // Whenever a user leaves the current room, remove the user from users list
        socket.on('removeUser', function(userId) {
          $('li#user-' + userId).remove();
          app.helpers.updateNumOfUsers();
        });

        // Append a new message 
        socket.on('addMessage', function(message) {
          app.helpers.addMessage(message);
        });
      });
  },

  helpers: {

    encodeHTML: function (str){
      return $('<div />').text(str).html();
    },

    // Update rooms list
    updateRoomsList: function(room){
      room.title = this.encodeHTML(room.title);
      var html = `<a href="/chat/${room._id}"><li class="room-item">${room.title}</li></a>`;

      if(html === ''){ return; }

      if($(".room-list ul li").length > 0){
        $('.room-list ul').prepend(html);
      }else{
        $('.room-list ul').html('').html(html);
      }
      
      this.updateNumOfRooms();
    },

    // Update users list
    updateUsersList: function(users, clear, offlines){
        if(users.constructor !== Array){
          users = [users];
        }

        var html = '';
        for(var user of users) {
          user.username = this.encodeHTML(user.username);
          html += `<li class="clearfix" id="user-${user._id}">
                     <img src="${user.picture}" alt="${user.username}" />
                     <div class="about">
                        <div class="name">${user.username}</div>
                        <div class="status"><i class="fa fa-circle online"></i> online</div>
                     </div></li>`;
        }
        for(var user of offlines) {
          user.username = this.encodeHTML(user.username);
          html += `<li class="clearfix" id="user-${user._id}">
                     <img src="${user.picture}" alt="${user.username}" />
                     <div class="about">
                        <div class="name">${user.username}</div>
                        <div class="status"><i class="fa fa-circle offline"></i> offline</div>
                     </div></li>`;
        }

        if(html === ''){ return; }

        if(clear != null && clear == true){
          $('.users-list ul').html('').html(html);
        }else{
          $('.users-list ul').prepend(html);
        }

        this.updateNumOfUsers();
    },

    // Adding a new message to chat history
    addMessage: function(message){
      message.date      = (new Date(message.date)).toLocaleString();
      message.username  = this.encodeHTML(message.username);
      message.content   = this.encodeHTML(message.content);

      var html = `<li>
        <div class="message-data">
          <span class="message-data-name">${message.username}</span>
          <span class="message-data-time">${message.date}</span>
        </div>
        <div class="message my-message" dir="auto">${message.content}</div>
      </li>`;
      $(html).hide().appendTo('.chat-history ul').slideDown(200);

      // Keep scroll bar down
      $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
    },

    // Update number of rooms
    // This method MUST be called after adding a new room
    updateNumOfRooms: function(){
      var num = $('.room-list ul li').length;
      $('.room-num-rooms').text(num +  " Room(s)");
    },

    // Update number of online users in the current room
    // This method MUST be called after adding, or removing list element(s)
    updateNumOfUsers: function(){
      var num = $('.users-list ul li').length;
      $('.chat-num-users').text(num +  " User(s)");
    }
  }
};
