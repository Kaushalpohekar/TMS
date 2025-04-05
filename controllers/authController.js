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

// Password validation function
const isStrongPassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// Function to validate email format
const validateEmail = (email) => {
  return validator.isEmail(email);  // Checks for valid email
};

async function sendTokenEmail(email, token, firstName, lastName) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS, 
      },
    });

    // Generate a UUID for logging
    const emailId = uuidv4();
    console.log(`Email process started for: ${email}, Email ID: ${emailId}`);

    // Read and compile email template
    const templatePath = path.join(__dirname, '../mail-body/email-template.ejs');
    const templateData = await fs.readFile(templatePath, { encoding: 'utf8' });
    const compiledTemplate = ejs.compile(templateData);
    const html = compiledTemplate({ token, firstName, lastName });

    // Email options
    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Registration Token',
      html: html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Error sending email:', error.message);
      } else {
        console.log('✅ Email sent:', info.response);
      }
    });
    return { success: true, message: 'Email sent successfully' };

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, message: 'Error sending email' };
  }
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
      confirmPassword,
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
  loginUser
};