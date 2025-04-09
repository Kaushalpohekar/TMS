const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const {authenticateUser} = require('../token/jwtUtils');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/register-dashboard', authController.registerUser);
router.get('/user', authController.getUserDetails);
router.post('/verify', authController.verifyToken);
router.post('/re-verify-mail', authController.resendToken);
router.post('/forgot', authController.forgotPassword);
router.post('/resend-forgot', authController.resendResetToken);
router.post('/reset-password', authController.resetPassword);
router.put('/setUserOnline/:UserId',authenticateUser, authController.setUserOnline);
router.put('/setUserOffline/:UserId',authenticateUser, authController.setUserOffline);
router.put('/users/:UserId/block', authenticateUser,authController.Block);


module.exports = router;

