const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

router.get('/user', authController.getUserDetails);
router.post('/verify', authController.verifyToken);
router.post('/re-verify-mail', authController.resendToken);
router.post('/forgot', authController.forgotPassword);
router.post('/resend-forgot', authController.resendResetToken);
router.post('/reset-password', authController.resetPassword);
router.put('/setUserOnline/:UserId', authController.setUserOnline);
router.put('/setUserOffline/:UserId', authController.setUserOffline);
router.put('/users/:UserId/block', authController.Block);


module.exports = router;