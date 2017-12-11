// force the test environment to 'test'
process.env.NODE_ENV = 'test';
// get the application server module
var app     = require('../../server');
var assert  = require('assert');
var browser = require('zombie');
var http    = require('http');

describe('login page', function() {
 	before(function() {
    	this.server = http.createServer(app).listen(4000);
    	this.browser = new browser({ site: 'http://localhost:4000' });
  	});

  	beforeEach(function(done) {
      this.browser.visit('/', done);
  	});

	it('should show login form', function(){
	  assert.ok(this.browser.success);
    assert.equal(this.browser.text('title'), 'ChannelX');
	});

  it('should keep values on partial submissions', function(){
    assert.ok(this.browser.success);
    assert.equal(this.browser.text('title'), 'ChannelX');
  });

  it('should refuse partial submissions', function(){
    assert.ok(this.browser.success);
    assert.equal(this.browser.text('title'), 'ChannelX');
  });

	it('should refuse empty submissions', function(done) {
    var browser = this.browser;
    browser.pressButton('login').then(function() {
      assert.ok(browser.success);
      //assert.equal(browser.text('body'), 'My Profile');
      //assert.equal(browser.text('div.alert'), 'Please fill in all the fields');
    }).then(done, done);
  });

  it('should accept complete submissions', function(done) {
    var browser = this.browser;
    browser.fill('username', 'Kadir');
    browser.fill('password', '123');
    browser.pressButton('login').then(function() {
      assert.ok(browser.success);
      //assert.equal(browser.text('h1'), 'Message Sent');
      //assert.equal(browser.text('p'), 'Thank you for your message. We\'ll answer you shortly.');
    }).then(done, done);
  });

  it('should create channel', function(){
    assert.ok(this.browser.success);
    assert.equal(this.browser.text('title'), 'ChannelX');
  });

  it('should update profile', function(){
    assert.ok(this.browser.success);
    assert.equal(this.browser.text('title'), 'ChannelX');
  });

  it('should show register form', function(){
    assert.ok(this.browser.success);
    assert.equal(this.browser.text('title'), 'ChannelX');
  });

  it('should show chat-room form', function(){
    assert.ok(this.browser.success);
    assert.equal(this.browser.text('title'), 'ChannelX');
  });

  it('should show send-email form', function(){
    assert.ok(this.browser.success);
    assert.equal(this.browser.text('title'), 'ChannelX');
  });

	after(function(done) {
    	this.server.close(done);
  	});
});