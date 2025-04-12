const bcrypt = require('bcrypt');
const db = require('../config/db');
const jwtUtils = require('../token/jwtUtils');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;;
const ejs = require('ejs');
require('dotenv').config();

function generateUserId() {
  const userIdLength = 10;
  let userId = '';

  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  for (let i = 0; i < userIdLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    userId += characters.charAt(randomIndex);
  }

  return userId;
}



function register_dashboard(req, res) {
  const {
    companyName,
    companyEmail,
    contact,
    location,
    firstName,
    lastName,
    personalEmail,
    designation,
    password,
    
  } = req.body;

  
  const userId = uuidv4();

  // 1. Check if user already exists
  const checkUserQuery = 'SELECT * FROM tms_users WHERE PersonalEmail = ?';
  db.query(checkUserQuery, [personalEmail], (err, userResult) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (userResult.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Check if company already exists
    const checkCompanyQuery = 'SELECT * FROM tms_companies WHERE CompanyEmail = ?';
    db.query(checkCompanyQuery, [companyEmail], (err, companyResult) => {
      if (err) {
        console.error('Error checking company:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      let companyId;

      if (companyResult.length > 0) {
        // Company exists, get the existing CompanyId
        companyId = companyResult[0].CompanyId;
        insertUser(companyId);
      } else {
        // Company doesn't exist, generate new UUID and insert it
        companyId = uuidv4();
        const insertCompanyQuery = 'INSERT INTO tms_companies (CompanyId, CompanyName, CompanyEmail, ContactNo, Location) VALUES (?, ?, ?, ?, ?)';
        db.query(
          insertCompanyQuery,
          [companyId, companyName, companyEmail, contact, location],
          (err, result) => {
            if (err) {
              console.error('Error inserting company:', err);
              return res.status(500).json({ message: 'Internal server error' });
            }
            insertUser(companyId);
          }
        );
      }

      // Function to insert user once we have CompanyId
      function insertUser(companyId) {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ message: 'Internal server error' });
          }

          const verificationToken = jwtUtils.generateToken({ personalEmail });

          const insertUserQuery = `
            INSERT INTO tms_users (
              UserId, Username, FirstName, LastName, CompanyId, UserType,
              PersonalEmail, Password, Designation, VerificationToken, Verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(
            insertUserQuery,
            [
              userId,
              personalEmail,
              firstName,
              lastName,
              companyId,
              'Admin',
              personalEmail,
              hashedPassword,
              designation,
              verificationToken,
              false
            ],
            (err, result) => {
              if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ message: 'Internal server error' });
              }

              try {
                sendTokenEmail(personalEmail, verificationToken, firstName, lastName);
                res.json({ message: 'Registration successful. Check your email for verification.' });
              } catch (emailErr) {
                console.error('Error sending email:', emailErr);
                res.status(500).json({ message: 'Error sending verification email' });
              }
            }
          );
        });
      }
    });
  });
}



function sendTokenEmail(email, token, firstName, lastName) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'kpohekar19@gmail.com',
      pass: 'woptjevenzhqmrpp',
    },
  });

  // Generate a UUID for the email
  const emailId = uuidv4();

  // Log the start of the email sending process
  //logExecution('sendTokenEmail', emailId, 'INFO', 'Email sending process started');

  // Read the email template file
  const templatePath = path.join(__dirname, '../mail-body/email-template.ejs');
  fs.readFile(templatePath, 'utf8', (err, templateData) => {
    if (err) {
      console.error('Error reading email template:', err);
      // Log the error
      //logExecution('sendTokenEmail', emailId, 'ERROR', 'Error reading email template');
      return;
    }

    // Compile the email template with EJS
    const compiledTemplate = ejs.compile(templateData);

    // Render the template with the token and recipient's name
    const html = compiledTemplate({ token, firstName, lastName });

    const mailOptions = {
      from: 'your-email@example.com', // Replace with the sender's email address
      to: email,
      subject: 'Registration Token',
      html: html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        // Log the error
        //logExecution('sendTokenEmail', emailId, 'ERROR', 'Error sending email');
      } else {
        console.log('Email sent:', info.response);
        // Log the email sent success
        //logExecution('sendTokenEmail', emailId, 'SUCCESS', 'Email sent successfully');
      }
    });
  });
}



function sendTokenDashboardEmail(email, token) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'kpohekar19@gmail.com',
      pass: 'woptjevenzhqmrpp',
    },
  });

  // Generate a UUID for the email
  const emailId = uuidv4();

  // Log the start of the email sending process
  //logExecution('sendTokenDashboardEmail', emailId, 'INFO', 'Email sending process started');

  // Read the email template file
  const templatePath = path.join(__dirname, '../mail-body/email-template.ejs');
  fs.readFile(templatePath, 'utf8', (err, templateData) => {
    if (err) {
      console.error('Error reading email template:', err);
      // Log the error
      //logExecution('sendTokenDashboardEmail', emailId, 'ERROR', 'Error reading email template');
      return;
    }

    // Compile the email template with EJS
    const compiledTemplate = ejs.compile(templateData);

    // Render the template with the token
    const html = compiledTemplate({ token });

    const mailOptions = {
      from: 'your-email@example.com',
      to: email,
      subject: 'Registration Token',
      html: html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        // Log the error
        //logExecution('sendTokenDashboardEmail', emailId, 'ERROR', 'Error sending email');
      } else {
        console.log('Email sent:', info.response);
        // Log the email sent success
        //logExecution('sendTokenDashboardEmail', emailId, 'SUCCESS', 'Email sent successfully');
      }
    });
  });
}



function sendResetTokenEmail(personalEmail, resetToken) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'kpohekar19@gmail.com',
      pass: 'woptjevenzhqmrpp',
    },
  });

  // Generate a UUID for the email
  const emailId = uuidv4();

  // Log the start of the email sending process
  //logExecution('sendResetTokenEmail', emailId, 'INFO', 'Reset token email sending process started');

  // Read the email template file
  const templatePath = path.join(__dirname, '../mail-body/email-template-forgot-password.ejs');
  fs.readFile(templatePath, 'utf8', (err, templateData) => {
    if (err) {
      console.error('Error reading email template:', err);
      // Log the error
      //logExecution('sendResetTokenEmail', emailId, 'ERROR', 'Error reading email template');
      return;
    }

    // Compile the email template with EJS
    const compiledTemplate = ejs.compile(templateData);

    // Render the template with the resetToken
    const html = compiledTemplate({ resetToken });

    const mailOptions = {
      from: 'kpohekar19@gmail.com',
      to: personalEmail,
      subject: 'Reset Password Link',
      html: html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        // Log the error
        //logExecution('sendResetTokenEmail', emailId, 'ERROR', 'Error sending email');
      } else {
        console.log('Email sent:', info.response);
        // Log the email sent success
        //logExecution('sendResetTokenEmail', emailId, 'SUCCESS', 'Reset token email sent successfully');
      }
    });
  });
}


function verifyToken(req, res) {
  const { token } = req.body;

  // Generate a UUID for the token verification process
  const verificationId = uuidv4();

  // Log the start of the token verification process
  // logExecution('verifyToken', verificationId, 'INFO', 'Token verification process started');

  // Check if the token matches the one stored in the database
  const tokenCheckQuery = 'SELECT * FROM tms_users WHERE VerificationToken = ?';
  db.query(tokenCheckQuery, [token], (error, tokenCheckResult) => {
    if (error) {
      console.error('Error during token verification:', error);
      // Log the error
      // logExecution('verifyToken', verificationId, 'ERROR', 'Error during token verification');
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (tokenCheckResult.length === 0) {
        console.log('Token verification failed');
        // Log the error
        // logExecution('verifyToken', verificationId, 'ERROR', 'Token verification failed');
        return res.status(400).json({ message: 'Token verification failed' });
      }

      // Token matches, update the user's status as verified
      const updateQuery = 'UPDATE tms_users SET Verified = ? WHERE VerificationToken = ?';
      db.query(updateQuery, [true, token], (error, updateResult) => {
        if (error) {
          console.error('Error updating user verification status:', error);
          // Log the error
          // logExecution('verifyToken', verificationId, 'ERROR', 'Error updating user verification status');
          return res.status(500).json({ message: 'Internal server error' });
        }

        console.log('Token verification successful');
        // Log the token verification success
        // logExecution('verifyToken', verificationId, 'SUCCESS', 'Token verification successful');
        res.json({ message: 'Token verification successful. You can now log in.' });
      });
    } catch (error) {
      console.error('Error during token verification:', error);
      // Log the error
      // logExecution('verifyToken', verificationId, 'ERROR', 'Error during token verification');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

function resendToken(req, res) {
  const { personalEmail } = req.body;

  // Generate a UUID for the resend token process
  const resendId = uuidv4();

  // Log the start of the resend token process
  // logExecution('resendToken', resendId, 'INFO', 'Resend token process started');

  // Check if the user is available
  const checkUserQuery = 'SELECT * FROM tms_users WHERE PersonalEmail = ?';
  db.query(checkUserQuery, [personalEmail], (error, userResult) => {
    if (error) {
      console.error('Error checking user availability:', error);
      // Log the error
      // logExecution('resendToken', resendId, 'ERROR', 'Error checking user availability');
      return res.status(500).json({ message: 'Internal server error' });
    }

    // If no user found, send an error response
    if (userResult.length === 0) {
      // Log the user not found error
      // logExecution('resendToken', resendId, 'ERROR', 'User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is already verified, send a bad request error response
    if (userResult[0].Verified === '1') {
      // Log the user already verified error
      // logExecution('resendToken', resendId, 'ERROR', 'User already verified');
      return res.status(400).json({ message: 'User already verified' });
    } else {
      // Generate a new verification token
      const verificationToken = jwtUtils.generateToken({ personalEmail: personalEmail });

      // Update the user's verification token in the database
      const updateQuery = 'UPDATE tms_users SET VerificationToken = ? WHERE PersonalEmail = ?';
      db.query(updateQuery, [verificationToken, personalEmail], (error, updateResult) => {
        if (error) {
          console.error('Error updating verification token:', error);
          // Log the error
          // logExecution('resendToken', resendId, 'ERROR', 'Error updating verification token');
          return res.status(500).json({ message: 'Internal server error' });
        }

        try {
          // Send the new verification token to the user's email
          sendTokenEmail(personalEmail, verificationToken);

          console.log('Verification token resent');
          // Log the resend success
          // logExecution('resendToken', resendId, 'SUCCESS', 'Verification token resent');
          res.json({ message: 'Verification token resent. Check your email for the new token.' });
        } catch (error) {
          console.error('Error sending verification token:', error);
          // Log the error
          // logExecution('resendToken', resendId, 'ERROR', 'Error sending verification token');
          res.status(500).json({ message: 'Internal server error' });
        }
      });
    }
  });
}



async function getUserDetails(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwtUtils.verifyToken(token);

    if (!decodedToken || !decodedToken.UserId) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const userDetailsId = uuidv4(); // for logging, if needed

    const { UserId, CompanyId } = decodedToken;

    const userDetailsQuery = `
      SELECT UserId, Username, FirstName, LastName, UserType,
             PersonalEmail, Designation, Verified, is_online, block
      FROM tms_users 
      WHERE UserId = ?`;

    const companyDetailsQuery = `
      SELECT CompanyName, CompanyEmail, ContactNo, Location
      FROM tms_companies 
      WHERE CompanyId = ?`;

    const [userDetail] = await db.promise().query(userDetailsQuery, [UserId]);

    if (userDetail.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let userData = userDetail[0];

    if (CompanyId) {
      const [companyDetail] = await db.promise().query(companyDetailsQuery, [CompanyId]);
      if (companyDetail.length > 0) {
        userData = { ...userData, ...companyDetail[0] };
      }
    }

    res.status(200).json(userData);

  } catch (err) {
    console.error('Error in getUserDetails:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function forgotPassword(req, res) {
  const { personalEmail } = req.body;

  // Generate a UUID for the forgot password process
  const forgotPasswordId = uuidv4();

  // Log the start of the forgot password process
  // logExecution('forgotPassword', forgotPasswordId, 'INFO', 'Forgot password process started');

  // Check if the email exists in the database
  const query = 'SELECT * FROM tms_users WHERE PersonalEmail = ?';
  db.query(query, [personalEmail], (error, rows) => {
    try {
      if (error) {
        throw new Error('Error during forgot password');
      }

      if (rows.length === 0) {
        // Log the user not found error
        // logExecution('forgotPassword', forgotPasswordId, 'ERROR', 'User not found');
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate a reset token
      const resetToken = jwtUtils.generateToken({ personalEmail: personalEmail });

      // Save the reset token in the database
      const userId = rows[0].UserId;
      const insertQuery = 'INSERT INTO tms_reset_tokens (UserId, token) VALUES (?, ?)';
      db.query(insertQuery, [userId, resetToken], (error, insertResult) => {
        try {
          if (error) {
            throw new Error('Error saving reset token');
          }

          // Send the reset token to the user's email
          sendResetTokenEmail(personalEmail, resetToken);

          // Log the reset token sent
          // logExecution('forgotPassword', forgotPasswordId, 'SUCCESS', 'Reset token sent to email');
          res.json({ message: 'Reset token sent to your email' });
        } catch (error) {
          console.error(error);
          // Log the error
          // logExecution('forgotPassword', forgotPasswordId, 'ERROR', 'Error sending reset token');
          res.status(500).json({ message: 'Internal server error' });
        }
      });
    } catch (error) {
      console.error(error);
      // Log the error
      // logExecution('forgotPassword', forgotPasswordId, 'ERROR', 'Error during forgot password');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function resendResetToken(req, res) {
  const { personalEmail } = req.body;

  // Generate a UUID for the resend reset token process
  const resendResetTokenId = uuidv4();

  // Log the start of the resend reset token process
  // logExecution('resendResetToken', resendResetTokenId, 'INFO', 'Resend reset token process started');

  // Check if the user is available
  const checkUserQuery = 'SELECT * FROM tms_users WHERE PersonalEmail = ?';
  db.query(checkUserQuery, [personalEmail], (error, userResult) => {
    if (error) {
      console.error('Error checking user availability:', error);
      // Log the error
      // logExecution('resendResetToken', resendResetTokenId, 'ERROR', 'Error checking user availability');
      return res.status(500).json({ message: 'Internal server error' });
    }

    // If no user found, send an error response
    if (userResult.length === 0) {
      // Log the user not found error
      // logExecution('resendResetToken', resendResetTokenId, 'ERROR', 'User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a new verification token
    const userId = userResult[0].UserId;
    const verificationToken = jwtUtils.generateToken({ personalEmail: personalEmail });

    // Update the user's verification token in the database
    const updateQuery = 'UPDATE tms_reset_tokens SET token = ? WHERE UserId = ?';
    db.query(updateQuery, [verificationToken, userId], (error, updateResult) => {
      if (error) {
        console.error('Error updating Resend link:', error);
        // Log the error
        // logExecution('resendResetToken', resendResetTokenId, 'ERROR', 'Error updating Resend link');
        return res.status(500).json({ message: 'Internal server error' });
      }

      try {
        // Send the new verification token to the user's email
        sendResetTokenEmail(personalEmail, verificationToken);

        console.log('Resend link resent');
        // Log the resend success
        // logExecution('resendResetToken', resendResetTokenId, 'SUCCESS', 'Resend reset token resent');
        res.json({ message: 'Resend link resent. Check your email for the new token.' });
      } catch (error) {
        console.error('Error sending verification token:', error);
        // Log the error
        // logExecution('resendResetToken', resendResetTokenId, 'ERROR', 'Error sending verification token');
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  });
}

function resetPassword(req, res) {
  const { token, password } = req.body;

  // Generate a UUID for the reset password process
  // const resetPasswordId = uuidv4();

  // Log the start of the reset password process
  // logExecution('resetPassword', resetPasswordId, 'INFO', 'Reset password process started');

  // Check if the email and reset token match in the database
  const query = 'SELECT * FROM tms_reset_tokens WHERE token = ?';
  db.query(query, [token], (error, rows) => {
    try {
      if (error) {
        throw new Error('Error during reset password');
      }

      if (rows.length === 0) {
        // Log the invalid token error
        // logExecution('resetPassword', resetPasswordId, 'ERROR', 'Invalid token');
        return res.status(401).json({ message: 'Invalid token' });
      }

      const userId = rows[0].UserId;

      // Hash the new password
      bcrypt.hash(password, 10, (error, hashedPassword) => {
        try {
          if (error) {
            throw new Error('Error during password hashing');
          }

          // Update the password in the database
          const updateQuery = 'UPDATE tms_users SET Password = ? WHERE UserId = ?';
          db.query(updateQuery, [hashedPassword, userId], (error, updateResult) => {
            try {
              if (error) {
                throw new Error('Error updating password');
              }

              // Delete the reset token from the reset_tokens table
              const deleteQuery = 'DELETE FROM tms_reset_tokens WHERE token = ?';
              db.query(deleteQuery, [token], (error, deleteResult) => {
                if (error) {
                  console.error('Error deleting reset token:', error);
                }

                // Log the password reset success
                // logExecution('resetPassword', resetPasswordId, 'SUCCESS', 'Password reset successful');
                res.json({ message: 'Password reset successful' });
              });
            } catch (error) {
              console.error(error);
              // Log the error
              // logExecution('resetPassword', resetPasswordId, 'ERROR', 'Error updating password');
              res.status(500).json({ message: 'Internal server error' });
            }
          });
        } catch (error) {
          console.error(error);
          // Log the error
          // logExecution('resetPassword', resetPasswordId, 'ERROR', 'Error during password hashing');
          res.status(500).json({ message: 'Internal server error' });
        }
      });
    } catch (error) {
      console.error(error);
      // Log the error
      // logExecution('resetPassword', resetPasswordId, 'ERROR', 'Error during reset password');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function setUserOnline(req, res) {
  console.log(req.user);
  const UserId = req.user.UserId;

  console.log(UserId);
  // Generate a UUID for the set user online process
  const setUserOnlineId = uuidv4();

  // Log the start of the set user online process
  // logExecution('setUserOnline', setUserOnlineId, 'INFO', 'Set user online process started');

  const userCheckQuery = 'SELECT * FROM tms_users WHERE UserID = ?';

  db.query(userCheckQuery, [UserId], (error, userCheckResult) => {
    try {
      if (error) {
        throw new Error('Error during device check');
      }

      if (userCheckResult.length === 0) {
        // Log the user not found error
        // logExecution('setUserOnline', setUserOnlineId, 'ERROR', 'User not found');
        return res.status(400).json({ message: 'User not found!' });
      }

      const onlineQuery = 'UPDATE tms_users SET is_online = ? WHERE UserID = ?';

      db.query(onlineQuery, ['1', UserId], (error, users) => {
        try {
          if (error) {
            throw new Error('Error updating user online status');
          }

          // Log the status update success
          // logExecution('setUserOnline', setUserOnlineId, 'SUCCESS', 'User online status updated successfully');
          res.json({ message: 'Status Updated Successfully' });
        } catch (error) {
          console.error(error);
          // Log the error
          // logExecution('setUserOnline', setUserOnlineId, 'ERROR', 'Error updating user online status');
          res.status(500).json({ message: 'Internal server error' });
        }
      });
    } catch (error) {
      console.error(error);
      // Log the error
      // logExecution('setUserOnline', setUserOnlineId, 'ERROR', 'Error during device check');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function setUserOffline(req, res) {
  const UserId = req.user.UserId;

  // Generate a UUID for the set user offline process
  const setUserOfflineId = uuidv4();

  // Log the start of the set user offline process
  // logExecution('setUserOffline', setUserOfflineId, 'INFO', 'Set user offline process started');

  const userCheckQuery = 'SELECT * FROM tms_users WHERE UserID = ?';

  db.query(userCheckQuery, [UserId], (error, userCheckResult) => {
    try {
      if (error) {
        throw new Error('Error during device check');
      }

      if (userCheckResult.length === 0) {
        // Log the user not found error
        // logExecution('setUserOffline', setUserOfflineId, 'ERROR', 'User not found');
        return res.status(400).json({ message: 'User not found!' });
      }

      const onlineQuery = 'UPDATE tms_users SET is_online = ? WHERE UserID = ?';

      db.query(onlineQuery, ['0', UserId], (error, users) => {
        try {
          if (error) {
            throw new Error('Error updating user offline status');
          }

          // Log the status update success
          // logExecution('setUserOffline', setUserOfflineId, 'SUCCESS', 'User offline status updated successfully');
          res.json({ message: 'Status Updated Successfully' });
        } catch (error) {
          console.error(error);
          // Log the error
          // logExecution('setUserOffline', setUserOfflineId, 'ERROR', 'Error updating user offline status');
          res.status(500).json({ message: 'Internal server error' });
        }
      });
    } catch (error) {
      console.error(error);
      // Log the error
      // logExecution('setUserOffline', setUserOfflineId, 'ERROR', 'Error during device check');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}



// Helper function to generate a unique 10-digit user ID
function generateUserId() {
  const userIdLength = 10;
  let userId = '';

  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  for (let i = 0; i < userIdLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    userId += characters.charAt(randomIndex);
  }

  return userId;
}

function Block(req, res) {
  const { UserId } = req.user;
  const { action } = req.body;

  // Generate a UUID for the block/unblock process
  const blockId = uuidv4();

  // Log the start of the block/unblock process
  // logExecution('Block', blockId, 'INFO', `User ${action} process started for UserId: ${UserId}`);

  if (action !== 'block' && action !== 'unblock') {
    // Log the invalid action error
    // logExecution('Block', blockId, 'ERROR', 'Invalid action. Use "block" or "unblock".');
    return res.status(400).json({ message: 'Invalid action. Use "block" or "unblock".' });
  }

  const blockValue = action === 'block' ? 1 : 0;

  // Check if the user is already blocked or unblocked
  const checkQuery = 'SELECT block FROM tms_users WHERE UserId = ?';

  db.query(checkQuery, [UserId], (checkError, checkResult) => {
    if (checkError) {
      console.error(`Error checking user block status:`, checkError);
      // Log the error
      // logExecution('Block', blockId, 'ERROR', 'Error checking user block status');
      return res.status(500).json({ message: 'Error checking user block status' });
    }

    if (checkResult.length === 0) {
      // Log the user not found error
      // logExecution('Block', blockId, 'ERROR', 'User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    const currentBlockStatus = checkResult[0].block;

    if (currentBlockStatus === blockValue) {
      const statusMessage = blockValue === 1 ? 'already blocked' : 'already unblocked';
      // Log the user already blocked/unblocked message
      // logExecution('Block', blockId, 'INFO', `User is ${statusMessage}`);
      return res.status(200).json({ message: `User is ${statusMessage}` });
    }

    // User is not in the desired block state; update the block status
    const updateQuery = 'UPDATE tms_users SET block = ? WHERE UserId = ?';

    db.query(updateQuery, [blockValue, UserId], (updateError, updateResult) => {
      if (updateError) {
        console.error(`Error during user ${action}ing:`, updateError);
        // Log the error
        // logExecution('Block', blockId, 'ERROR', `Error ${action}ing user`);
        return res.status(500).json({ message: `Error ${action}ing user` });
      }

      if (updateResult.affectedRows === 0) {
        // Log the user not found error
        // logExecution('Block', blockId, 'ERROR', 'User not found');
        return res.status(404).json({ message: 'User not found' });
      }

      const successMessage = `User ${action}ed successfully`;
      // Log the success message
      // logExecution('Block', blockId, 'SUCCESS', successMessage);
      res.status(200).json({ message: successMessage });
    });
  });
}


async function registerUser(req, res) {
  try {
    const {
      companyName,
      companyEmail,
      contact,
      location,
      firstName,
      lastName,
      personalEmail,
      designation,
      password,
      userType
    } = req.body;

   
    

    // Check if personal email already exists
    const [personalEmailCheck] = await db.promise().query(
      "SELECT UserId FROM tms_users WHERE PersonalEmail = ?",
      [personalEmail]
    );
    if (personalEmailCheck.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate UUIDs for CompanyId and UserId
    let companyId = uuidv4();
    const userId = uuidv4();

    // Check if company already exists
    const [companyEmailCheck] = await db.promise().query(
      "SELECT CompanyId FROM tms_companies WHERE CompanyEmail = ?",
      [companyEmail]
    );

    if (companyEmailCheck.length > 0) {
      // Use existing companyId instead of creating a new entry
      companyId = companyEmailCheck[0].CompanyId;
    } else {
      // Insert new company record
      await db.promise().query(
        "INSERT INTO tms_companies (CompanyId, CompanyName, CompanyEmail, ContactNo, Location) VALUES (?, ?, ?, ?, ?)",
        [companyId, companyName, companyEmail, contact, location]
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a verification token
    const verificationToken = jwtUtils.generateToken({ companyId, userId, userType });

    // Insert user into tms_users
    await db.promise().query(
      `INSERT INTO tms_users 
      (UserId, Username, FirstName, LastName, CompanyId, UserType, PersonalEmail, Password, Designation, VerificationToken, Verified, is_online, block) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        personalEmail,
        firstName,
        lastName,
        companyId,
        userType,
        personalEmail,
        hashedPassword,
        designation,
        verificationToken,
        false, // Not verified yet
        false, // User is initially offline
        "0", // Not blocked
      ]
    );

    // Send verification token via email
    await sendTokenEmail(personalEmail, verificationToken, firstName, lastName);

    res.status(201).json({ message: "Registration successful. Check your email for the verification token." });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}



  async function loginUser (req, res) {
    try {
        const { Username, Password } = req.body;

        // Check if the user exists in the database
        const query = 'SELECT * FROM tms_users WHERE Username = ?';
        const [rows] = await db.promise().query(query, [Username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'User does not exist!' });
        }

        const user = rows[0];

        // Check verification status
        if (user.Verified === '0') {
            return res.status(401).json({ message: 'User is not verified. Please verify your account.' });
        }

        // Check if user is blocked
        if (user.block === 1) {
            return res.status(401).json({ message: 'User is blocked. Please contact support.' });
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(Password, user.Password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token
        const token = jwtUtils.generateToken({
            UserId: user.UserId,
            CompanyId: user.CompanyId, 
            userType: user.UserType
        });

        res.json({ token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}




module.exports = {
  registerUser,
  loginUser,
  sendTokenEmail,
  sendTokenDashboardEmail,
  sendResetTokenEmail,
  verifyToken,
  resendToken,
  getUserDetails,
  forgotPassword,
  resendResetToken,
  resetPassword,
  setUserOnline,
  setUserOffline,
  Block,
  register_dashboard
};