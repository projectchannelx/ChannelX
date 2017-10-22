var express = require('express');
var router = express.Router();
var controller = require('./controller');

router.get('/', controller.index);
router.get('/login', controller.login);
router.get('/sign', controller.sign);

module.exports = router;
