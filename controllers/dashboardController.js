const bcrypt = require('bcrypt');
const db = require('../config/db');
const moment = require('moment');



async function userDevices(req, res) {
  try {
    console.log(req.user);
    const CompanyId = req.user.CompanyId;
    const UserId = req.user.UserId;

    // Check if user exists
    const userCheckQuery = 'SELECT * FROM tms_users WHERE UserId = ?';
    const [userCheckResult] = await db.promise().query(userCheckQuery, [UserId]);

    if (userCheckResult.length === 0) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Fetch devices 
    const devicesQuery = 'SELECT * FROM tms_devices WHERE CompanyId = ? ';
    const [devices] = await db.promise().query(devicesQuery, [CompanyId, UserId]);

    return res.json({ devices });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}




// async function addDevice(req, res) {
  
//   const { DeviceUID, DeviceLocation, DeviceName,CompanyEmail, SMS, email, type, DeviceType } = req.body;
//   const [companyResult] = await db.promise().query(getCompanyIdQuery, [CompanyEmail]);

//   if (companyResult.length === 0) {
//     return res.status(404).json({ message: 'Company not found with the given email' });
//   }

//   const CompanyId = companyResult[0].CompanyId;

//   console.log(req.user);
//   try {
//     // Check if device already exists
//     const checkDeviceQuery = 'SELECT * FROM tms_devices WHERE DeviceUID = ? AND CompanyId = ?';
//     const [checkResult] = await db.promise().query(checkDeviceQuery, [DeviceUID, CompanyId]);

//     if (checkResult.length > 0) {
//       return res.status(400).json({ message: 'Device already added' });
//     }

//     // Insert new device
//     const insertDeviceQuery = `
//             INSERT INTO tms_devices 
//             (DeviceUID, DeviceLocation, DeviceName, CompanyId, IssueDate, SMS, email, type, DeviceType, endDate) 
//             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 365 DAY))`;

//     await db.promise().query(insertDeviceQuery, [DeviceUID, DeviceLocation, DeviceName, CompanyId, SMS, email, type, DeviceType]);

//     return res.json({ message: 'Device added successfully!' });

//   } catch (error) {
//     console.error('Database error:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// }


async function addDevice(req, res) {
  const { DeviceUID, DeviceLocation, DeviceName, DeviceTrigger, DeviceType } = req.body;

 
  const CompanyId = req.user.CompanyId; // from logged-in user
  const UserId = req.user.UserId;       // assumed from req.user
  const CompanyEmail = req.user.CompanyEmail; // assumed from req.user
  const ContactNo = req.user.ContactNo || null; // optional from user object

  try {
    // Check if device already exists
    const checkDeviceQuery = 'SELECT * FROM tms_devices WHERE DeviceUID = ? AND CompanyId = ?';
    const [checkResult] = await db.promise().query(checkDeviceQuery, [DeviceUID, CompanyId]);

    if (checkResult.length > 0) {
      return res.status(400).json({ message: 'Device already added' });
    }

    // Insert new device
    const insertDeviceQuery = `
      INSERT INTO tms_devices 
      (DeviceUID, DeviceLocation, DeviceName, CompanyId, DeviceType, IssueDate, endDate) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 365 DAY))`;

    await db.promise().query(insertDeviceQuery, [
      DeviceUID, DeviceLocation, DeviceName, CompanyId, DeviceTrigger, DeviceType
    ]);

    // Insert trigger info into tms_trigger
    const insertTriggerQuery = `
      INSERT INTO tms_trigger 
      (DeviceUID, TriggerValue, UserId, CompanyEmail, ContactNo) 
      VALUES (?, ?, ?, ?, ?)`;

    await db.promise().query(insertTriggerQuery, [
      DeviceUID, DeviceTrigger, UserId, CompanyEmail, ContactNo
    ]);

    return res.json({ message: 'Device and trigger added successfully!' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


async function editDevice(req, res) {
  try {
    
    const deviceId = req.params.deviceId;
    const { CompanyId, userType } = req.user; // Extracting user data from request

    const { DeviceLocation, DeviceName } = req.body;

    // Ensure the user is an admin
    if (userType.toLowerCase() !== 'admin') {
      return res.status(401).json({ message: "Unauthorized: Only Admins can edit devices." });
    }

    // Check if the device exists and is linked to the same CompanyId
    const deviceCheckQuery = "SELECT * FROM tms_devices WHERE DeviceUID = ? AND CompanyId = ?";
    const [deviceCheckResult] = await db.promise().query(deviceCheckQuery, [deviceId, CompanyId]);

    if (deviceCheckResult.length === 0) {
      return res.status(404).json({ message: "Device not found ." });
    }

    const updateDeviceQuery = `
    UPDATE tms_devices 
    SET DeviceLocation = ?, DeviceName = ?
    WHERE DeviceUID = ? AND CompanyId = ?
`;


    await db.promise().query(updateDeviceQuery, [DeviceLocation, DeviceName, deviceId, CompanyId]);

    res.json({ message: "Device updated successfully!" });
  } catch (error) {
    console.error("Error updating device:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function editCompanyDetails(req, res) {
  try {
    const { UserId, CompanyId, userType } = req.user;

    const { CompanyName, CompanyEmail, ContactNo, Location ,Designation} = req.body;
    console.log("User Data:", req.user);

    // ✅ Check if user is connected to the company and is an admin
    const userCheckQuery = `SELECT * FROM tms_users WHERE UserId = ? AND CompanyId = ?`;
    const [userCheckResult] = await db.promise().query(userCheckQuery, [UserId, CompanyId]);

    if (userCheckResult.length === 0) {
      return res.status(401).json({ message: "Unauthorized: User is not associated with the company." });
    }

    if (userType.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only Admins can edit company details." });
    }


    const updateUserQuery = `
    UPDATE tms_users 
    SET Designation = ?
    WHERE UserId = ?
  `;
  await db.promise().query(updateUserQuery, [Designation, UserId]);

    // ✅ Update the company details in the correct table (tms_companies)
    const updateCompanyQuery = `
      UPDATE tms_companies 
      SET ContactNo = ?, Location = ?
      WHERE CompanyId = ?
    `;
    await db.promise().query(updateCompanyQuery, [ContactNo, Location, CompanyId]);

    res.json({ message: "Company details updated successfully!" });

  } catch (error) {
    console.error("Error updating company details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


const updatePersonalDetails = async (req, res) => {
  try {
      const { UserId } = req.user; // Extract UserId from token
      const updates = req.body; // Get only the fields the user wants to update

      if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: "No fields provided for update" });
      }

      // Dynamically create SQL query and values based on provided fields
      const fields = Object.keys(updates).map(field => `${field} = ?`).join(", ");
      const values = Object.values(updates);
      values.push(UserId); // Add UserId at the end for WHERE condition

      // Execute update query
      const [result] = await db.promise().query(
          `UPDATE tms_users SET ${fields} WHERE UserId = ?`,
          values
      );

      if (result.affectedRows === 0) {
          return res.status(404).json({ error: "User not found or no changes made" });
      }

      res.json({ message: "User details updated successfully" });
  } catch (error) {
      console.error("Error updating user details:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
};





async function updatePassword(req, res) {
  try {

    const UserId = req.user.UserId;
    const { Password } = req.body;

    

    // ✅ Check if the user exists in the database
    const userCheckQuery = "SELECT * FROM tms_users WHERE UserId = ?";
    const [userCheckResult] = await db.promise().query(userCheckQuery, [UserId]);

    if (userCheckResult.length === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    // ✅ Hash the new password securely
    const hashedPassword = await bcrypt.hash(Password, 10);

    // ✅ Update the user's password in the database
    const updatePasswordQuery = "UPDATE tms_users SET Password = ? WHERE UserId = ?";
    await db.promise().query(updatePasswordQuery, [hashedPassword, UserId]);

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}



async function addDeviceTrigger(req, res) {
  
  const UserId = req.user.UserId;
  const { DeviceUID, TriggerValue, CompanyEmail } = req.body;

  try {
    const insertTriggerQuery = 'INSERT INTO tms_trigger (DeviceUID, TriggerValue, CompanyEmail, UserId) VALUES (?,?,?,?)';

    // Use promise-based query
    const [insertResult] = await db.promise().query(insertTriggerQuery, [DeviceUID, TriggerValue, CompanyEmail, ContactNo, UserId]);

    return res.json({ message: 'Device Trigger added successfully!' });

  } catch (error) {
    console.error('Error in device check:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


function editDeviceTrigger(req, res) {

  const deviceId = req.params.deviceId;
  const { TriggerValue, CompanyEmail } = req.body;
  const deviceCheckQuery = 'SELECT * FROM tms_trigger WHERE DeviceUID = ?';

  db.query(deviceCheckQuery, [deviceId], (error, deviceCheckResult) => {
    if (error) {
      console.error('Error during device check:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (deviceCheckResult.length === 0) {
        const insertTriggerQuery = 'INSERT INTO tms_trigger (DeviceUID, TriggerValue, CompanyEmail) VALUES (?,?,?)';

        db.query(insertTriggerQuery, [deviceId, TriggerValue, CompanyEmail], (error, insertResult) => {
          if (error) {
            console.error('Error while inserting device:', error);
            return res.status(500).json({ message: 'Internal server error' });
          }

          return res.json({ message: 'Device added successfully!' });
        });
      } else {

       
        const updateDeviceTriggerQuery = 'UPDATE tms_trigger SET TriggerValue = ?, CompanyEmail = ? WHERE DeviceUID = ? ';

        db.query(updateDeviceTriggerQuery, [TriggerValue, CompanyEmail, deviceId], (error, updateResult) => {
          if (error) {
            console.error('Error updating device trigger:', error);
            return res.status(500).json({ message: 'Internal server error' });
          }

          return res.json({ message: 'Device updated successfully' });
        });
      }
    } catch (error) {
      console.error('Error in device check:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

function getDeviceDetails(req, res) {
  try {
    const deviceId = req.params.deviceId;
    const CompanyId = req.user.CompanyId;

    // Validate the deviceId parameter if necessary

    const deviceDetailsQuery = `
      SELECT 
        d.*, 
        c.CompanyEmail, 
        c.CompanyName 
      FROM 
        tms_devices d
      JOIN 
        tms_companies c ON d.CompanyId = c.CompanyId
      WHERE 
        d.DeviceUID = ? AND d.CompanyId = ?
    `;

    db.query(deviceDetailsQuery, [deviceId, CompanyId], (error, deviceDetail) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: ' Internal server error' });
      }

      if (deviceDetail.length === 0) {
        // Handle the case when no device details are found
        return res.status(404).json({ message: 'Device details not found' });
      }

      res.status(200).json(deviceDetail);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getUserData(req, res) {
  try {
    
    const UserId = req.user.UserId;
    const CompanyId = req.user.CompanyId;



    const userDetailsQuery = `
        SELECT UserId, Username, FirstName, LastName,  UserType, 
               PersonalEmail, Designation, Verified, is_online, block 
        FROM tms_users 
        WHERE UserId = ?`;

    const userCompanyQuery = `
        SELECT CompanyName, CompanyEmail, ContactNo ,Location
        FROM tms_companies 
        WHERE CompanyId = ?`;

    // Fetch user details
    const [userDetail] = await db.promise().query(userDetailsQuery, [UserId]);

    if (userDetail.length === 0) {
      return res.status(404).json({ message: 'User details not found' });
    }

    let userData = userDetail[0]; // Get the user object

    // If user has a company, fetch and merge company details
    if (CompanyId) {
      const [companyDetail] = await db.promise().query(userCompanyQuery, [CompanyId]);
      if (companyDetail.length > 0) {
        userData = { ...userData, ...companyDetail[0] }; // Merge company details into userData
      }
    }

    res.status(200).json([userData]);

  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


async function UpdateMail(req, res) {
  try {
    const DeviceUID = req.params.DeviceUID;
    const { Mail } = req.body;
    const CompanyId = req.user.CompanyId;

    // Step 1: Verify if the device exists and belongs to the company
    const [deviceResult] = await db.promise().query(
      'SELECT CompanyId FROM tms_devices WHERE DeviceUID = ? AND CompanyId = ?',
      [DeviceUID, CompanyId]
    );

    // If no device found
    if (deviceResult.length === 0) {
      return res.status(404).json({ message: "Device not found or not linked to your company" });
    }

    // Step 2: Update Mail in the database
    const [updateResult] = await db.promise().query(
      'UPDATE tms_trigger SET Mail = ? WHERE DeviceUID = ?',
      [Mail, DeviceUID]
    );

    return res.status(200).json({ message: "Mail Updated Successfully" });

  } catch (error) {
    console.error("Error updating mail:", error);

    // Handle connection reset error
    if (error.code === "ECONNRESET") {
      return res.status(500).json({ message: "Database connection lost", error });
    }

    return res.status(500).json({ message: "Internal server error", error });
  }
}



async function UpdateWhatsapp(req, res) {
  try {
    const DeviceUID = req.params.DeviceUID;
    const { Whatsapp } = req.body;
    const CompanyId = req.user.CompanyId;
    
    console.log("updating whatsapp");
    // Step 1: Verify if the device exists and belongs to the company
    const [deviceResult] = await db.promise().query(
      'SELECT CompanyId FROM tms_devices WHERE DeviceUID = ? AND CompanyId = ?',
      [DeviceUID, CompanyId]
    );

    if (deviceResult.length === 0) {
      return res.status(404).json({ message: "Device not found or not linked to your company" });
    }

    // Step 2: Update the Whatsapp field in the database
    const [updateResult] = await db.promise().query(
      'UPDATE tms_trigger SET Whatsapp = ? WHERE DeviceUID = ?',
      [Whatsapp, DeviceUID]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(400).json({ message: "No records updated, possibly invalid DeviceUID" });
    }

    return res.status(200).json({ message: "Whatsapp Updated Successfully" });

  } catch (error) {
    console.error("Error updating Whatsapp:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
}


function getTriggerData(req, res) {
  const CompanyId = req.user.CompanyId;

  // Join tms_trigger with companies table to fetch data using CompanyId
  
  const joinQuery = `
  SELECT 
    t.TriggerId,
    t.DeviceUID,
    t.TriggerValue,
    t.UserId,
    t.CompanyEmail,
    t.ContactNo,
    t.timestamp,
    t.interval,
    t.Whatsapp,
    t.Mail,
    t.interval_start,
    t.interval_end,
    u.personalemail,
    c.CompanyName,
    d.deviceName
  FROM 
    tms_trigger t
  JOIN 
    tms_companies c ON t.CompanyEmail = c.CompanyEmail
  LEFT JOIN 
    tms_users u ON t.UserId = u.UserId
  LEFT JOIN 
  tms_devices d ON t.DeviceUID = d.DeviceUID 
  WHERE 
    c.CompanyId = ?
`;

  db.query(joinQuery, [CompanyId], (error, result) => {
    if (error) {
      console.error('Error executing join query:', error);
      return res.status(500).json({ message: 'Error fetching trigger data' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'No trigger data found for this company' });
    }

    // Format the result to match required key names and structure
    const formattedResult = result.map(row => ({
      DeviceUID: row.DeviceUID,
      TriggerValue: row.TriggerValue,
      CompanyEmail: row.CompanyEmail,
      ContactNO: row.ContactNo,
      PersonalEmail: row.personalemail,
      timestamp: row.timestamp,  // ISO format is preserved
      company_name: row.CompanyName,
      DeviceName: row.deviceName,
      interval: row.interval,
      Whatsapp: String(row.Whatsapp),
      Mail: String(row.Mail),
      interval_start: row.interval_start,
      interval_end: row.interval_end
    }));

    res.status(200).json(formattedResult);
  });
}



async function updateTrigger(req, res) {
  try {
    const { DeviceUID } = req.params;
    const { PersonalEmail, TriggerValue, ContactNO, DeviceName, interval } = req.body;

    // 1. Check if DeviceUID exists in tms_trigger
    const [triggerResult] = await db.promise().query(
      "SELECT * FROM tms_trigger WHERE DeviceUID = ?",
      [DeviceUID]
    );

    if (triggerResult.length > 0) {
      const trigger = triggerResult[0];
      
      const [UserResult] = await db.promise().query(
        "SELECT * FROM tms_users WHERE PersonalEmail = ?",
        [PersonalEmail]
      );

      if (UserResult.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }


      const UserId = UserResult[0].UserId;

      // 3. Update trigger info
      const updateTriggerQuery = `
        UPDATE tms_trigger 
        SET UserId=? , TriggerValue = ?, ContactNo = ?, \`interval\` = ?
        WHERE DeviceUID = ?
      `;
      await db.promise().query(updateTriggerQuery, [
        UserId,
        TriggerValue,
        ContactNO,
        interval,
        DeviceUID
      ]);

      return res.status(200).json({ message: "Trigger and user's email updated successfully." });

    } else {
      // 4. Fallback: update tms_devices if trigger not found
      const updateDeviceQuery = `
        UPDATE tms_devices 
        SET DeviceName = ?
        WHERE DeviceUID = ?
      `;
      await db.promise().query(updateDeviceQuery, [
        DeviceName,
        DeviceUID
      ]);

      return res.status(200).json({ message: "Device updated in tms_devices (fallback)." });
    }

  } catch (error) {
    console.error("Error in updateTrigger:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
}



async function deletetriggeruser(req, res) {
  const DeviceUID = req.params.DeviceUID;
  const CompanyId = req.user.CompanyId; // Ensure `req.user` is set properly

  try {
    // 1️⃣ Check if the device exists and belongs to the company
    const [deviceResult] = await db.promise().query(
      "SELECT * FROM tms_devices WHERE DeviceUID = ? AND CompanyId = ?",
      [DeviceUID, CompanyId]
    );

    if (deviceResult.length === 0) {
      return res.status(404).json({ message: "Device not found or not linked to your company" });
    }

    // 2️⃣ Delete from `tms_trigger`
    const deleteQuery = "DELETE FROM tms_trigger WHERE DeviceUID = ?";
    const [deleteResult] = await db.promise().query(deleteQuery, [DeviceUID]);

    if (deleteResult.affectedRows === 0) {
      return res.status(400).json({ message: "No trigger found for the given device" });
    }

    res.status(200).json({ message: "Device trigger deleted successfully" });

  } catch (error) {
    console.error("Error deleting trigger:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


function fetchDeviceTrigger(req, res) {
  const deviceId = req.params.deviceId;
  
  
  const query = `
    SELECT 
      trg.DeviceUID,
      trg.TriggerValue,
      trg.CompanyEmail,
      trg.ContactNo,
      usr.PersonalEmail,
      trg.timestamp,
      cmp.CompanyName AS company_name,
      dev.DeviceName,
      trg.interval,
      trg.Whatsapp,
      trg.Mail,
      trg.interval_start,
      trg.interval_end
    FROM tms_v2.tms_trigger trg
    LEFT JOIN tms_v2.tms_devices dev ON trg.DeviceUID = dev.DeviceUID
    LEFT JOIN tms_v2.tms_users usr ON trg.UserId = usr.UserId
    LEFT JOIN tms_v2.tms_companies cmp ON dev.CompanyId = cmp.CompanyId
    WHERE trg.DeviceUID = ?
    LIMIT 1
  `;
  
  try {
    db.query(query, [deviceId], (error, devicetriggerkResult) => {
      if (error) {
        console.error('Error during device check:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      res.status(200).json(devicetriggerkResult);
    });
  } catch (error) {
    console.error('Error in device check:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}



function fetchAllDeviceTrigger(req, res) {

  
  const companyEmail = req.user.companyEmail;
  
  const deviceTriggerQuery = 'select * from tms_trigger where CompanyEmail = ?';

  try {
    db.query(deviceTriggerQuery, [companyEmail], (error, triggers) => {
      if (error) {
        console.error('Error during device check:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      res.status(200).json({ triggers });
    });
  } catch (error) {
    console.error('Error in device check:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getDataByTimeInterval(req, res) {
  try {
    const deviceId = req.params.deviceId;
    const intervalKey = req.query.interval;

    if (!intervalKey) {
      return res.status(400).json({ message: 'Invalid time interval' });
    }

    // Configuration Map
    const intervalConfig = {
      '1hour': { table: 'actual_data', duration: '1 HOUR', bucket: 60 },
      '12hour': { table: 'actual_data', duration: '12 HOUR', bucket: 120 },
      '1day': { table: 'actual_data', duration: '1 DAY', bucket: 120 },
      '7day': { table: 'actual_data', duration: '7 DAY', bucket: 600 },
      '30day': { table: 'clean_data', duration: '30 DAY', bucket: 1800 },
      '6month': { table: 'clean_data', duration: '6 MONTH', bucket: 3600 },
      '12month': { table: 'clean_data', duration: '12 MONTH', bucket: 7200 }
    };

    const config = intervalConfig[intervalKey];

    if (!config) {
      return res.status(400).json({ message: 'Invalid time interval' });
    }

    const sql = `
  SELECT
    DeviceUID,
    bucket_time AS bucket_start_time,
    IFNULL(ROUND(AVG(Temperature), 1), 0) AS Temperature,
    IFNULL(ROUND(AVG(Humidity), 1), 0) AS Humidity,
    IFNULL(ROUND(AVG(flowRate), 1), 0) AS flowRate,
    IFNULL(ROUND(AVG(TemperatureR), 1), 0) AS TemperatureR,
    IFNULL(ROUND(AVG(TemperatureB), 1), 0) AS TemperatureB,
    IFNULL(ROUND(AVG(TemperatureY), 1), 0) AS TemperatureY,
    IFNULL(ROUND(AVG(Pressure), 1), 0) AS Pressure
  FROM (
    SELECT *,
      FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(TimeStamp) / ?) * ?) AS bucket_time
    FROM ${config.table}
    WHERE DeviceUID = ? AND TimeStamp >= DATE_SUB(NOW(), INTERVAL ${config.duration})
  ) AS sub
  GROUP BY DeviceUID, bucket_time
  ORDER BY DeviceUID, bucket_time;
`;


    // Execute with parameters: bucket_interval, bucket_interval, deviceId
    db.query(sql, [config.bucket, config.bucket, deviceId], (error, results) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.json({ data: results });
    });

  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}





function avg_interval(req, res) {
  const deviceUID = req.params.deviceUID;
  const timeInterval = req.params.interval;
  if (!timeInterval) {
    return res.status(400).json({ message: 'Invalid time interval' });
  }
  let duration;
  switch (timeInterval) {

    case '1hour':
      duration = 'INTERVAL 1 HOUR';
      break;
    case '12hour':
      duration = 'INTERVAL 12 HOUR';
      break;
    case '24hour':
      duration = 'INTERVAL 24 HOUR';
      break;
    case '1day':
      duration = 'INTERVAL 1 DAY';
      break;
    case '7day':
      duration = 'INTERVAL 7 DAY';
      break;
    case '30day':
      duration = 'INTERVAL 30 DAY';
      break;
    default:
      res.status(400).json({ message: 'Invalid time interval' });
  }
  const fetchbucketavgquery = `SELECT
    CONCAT(SUBSTR(DATE_FORMAT(TimeStamp, '%y-%m-%d %H.%i'), 1, 13), '0.00') AS bucket_start,
    CONCAT(SUBSTR(DATE_FORMAT(TimeStamp, '%y-%m-%d %H.%i'), 1, 13), '9.59') AS bucket_end,
    COUNT(*) AS count_bucket,
    AVG(TemperatureR) as avg_temp_R,
    AVG(TemperatureY) as avg_temp_Y,
    AVG(TemperatureB) as avg_temp_B
  FROM
    actual_data
  WHERE
    DeviceUID=? AND TimeStamp >= DATE_SUB(NOW(), ${duration})
  GROUP BY
    bucket_start,bucket_end
  ORDER BY
    bucket_start`;

  try {
    db.query(fetchbucketavgquery, [deviceUID], (fetchavgError, fetchavgResult) => {
      if (fetchavgError) {
        return res.status(401).json({ message: 'Unable to fetch bucket', fetchavgError });
      }
      return res.status(200).json({ fetchavgResult });
    })
  }
  catch (error) {
    return res.status(500).send('Internal Server Error');
  }
}


function getDataByCustomDate(req, res) {
  try {
    const deviceUID = req.params.deviceId;
    const startDate = req.query.start;
    const endDate = req.query.end;

    

    const sql = `SELECT
  DeviceUID,
  bucket_start_time,
  AVG(Temperature) AS Temperature,
  AVG(Humidity) AS Humidity,
  AVG(flowRate) AS flowRate,
  AVG(TemperatureR) AS TemperatureR,
  AVG(TemperatureB) AS TemperatureB,
  AVG(TemperatureY) AS TemperatureY,
  ROUND(AVG(Pressure), 1) AS Pressure,
  MAX(totalVolume) AS Totalizer,
  MAX(totalVolume) - MIN(totalVolume) AS totalVolume
FROM (
  SELECT
    DeviceUID,
    FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(TimeStamp) / (30 * 60)) * (30 * 60)) AS bucket_start_time,
    Temperature,
    Humidity,
    flowRate,
    TemperatureR,
    TemperatureB,
    TemperatureY,
    Pressure,
    totalVolume
  FROM actual_data
  WHERE DeviceUID = ? AND TimeStamp BETWEEN ? AND ?
) AS sub
GROUP BY DeviceUID, bucket_start_time
ORDER BY DeviceUID, bucket_start_time;
`;
    //const sql2 = `SELECT * FROM actual_data WHERE DeviceUID = ? AND TimeStamp >= ? AND TimeStamp <= ?`;
    db.query(sql, [deviceUID,startDate + ' 00:00:00', endDate + ' 23:59:59']
      , (fetchError, results) => {
      if (fetchError) {
        // console.error('Error fetching data:', error);
        return res.status(401).json({ message: 'Error while fetching data', fetchError });
      }

      res.json({ data: results });
    });
  } catch (error) {
    // console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
}

function getLiveStatusDetails(req, res) {
  try {
    const deviceUID = req.params.deviceId;

    // Validate the deviceId parameter if necessary
    const CompanyId = req.user.CompanyId; // Ensure `req.user` is set properly

   
      // 1️⃣ Check if the device exists and belongs to the company
      const [deviceResult] =db.promise().query(
        "SELECT * FROM tms_devices WHERE DeviceUID = ? AND CompanyId = ?",
        [deviceUID, CompanyId]
      );
  
      if (deviceResult.length === 0) {
        return res.status(404).json({ message: "Unauthorized user" });
      }
  

    const liveStatusQuery = 'SELECT * FROM actual_data WHERE DeviceUID = ? ORDER BY TimeStamp DESC LIMIT 1';
    db.query(liveStatusQuery, [deviceUID], (error, liveStatus) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
     

      if (liveStatus.length === 0) {
        // Handle the case when no live status details are found
        return res.status(404).json({ message: 'Live status details not found' });
      }

      res.status(200).json(liveStatus);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function fetchCompanyUser(req, res) {
  const CompanyId = req.user.CompanyId;
  console.log(CompanyId);
  try {
    const query = `
    SELECT 
      u.UserId, u.FirstName, u.LastName, u.UserType,
      u.PersonalEmail, u.Designation, u.is_online,
      c.ContactNo, c.Location
    FROM tms_users u
    JOIN tms_companies c ON u.CompanyId = c.CompanyId
    WHERE u.CompanyId = ?
  `;
    db.query(query, [CompanyId], (error, users) => {
      if (error) {
        throw new Error('Error fetching users');
      }

      res.status(200).json(users);
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function barChartCustom(req, res) {
  const deviceUID = req.params.deviceUID;
  const startDate = req.query.start;
  const endDate = req.query.end;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Invalid parameters' });
  }


  // Fetch data for the given date range
  const queryRange = `
    SELECT DATE(TimeStamp) AS date,
           MAX(totalVolume) AS endVolume,
           MIN(totalVolume) AS startVolume
    FROM actual_data
    WHERE DeviceUID = ? AND TimeStamp BETWEEN ? AND ?
    GROUP BY DATE(TimeStamp)
    ORDER BY date ASC
  `;

  db.query(queryRange, [deviceUID, startDate, endDate], (err, resultRange) => {
    

    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    // Calculate total consumption for each date
    const datewiseConsumption = resultRange.map((row) => ({
      date: row.date,
      totalConsumption: row.endVolume - row.startVolume,
    }));

    return res.json(datewiseConsumption);
  });
}

async function getTotalVolumeForToday(req, res) {
  const CompanyId = req.user.CompanyId;

  // Helper function to execute database queries with promises
  const executeQuery = (query, params) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  };

  try {
    // SQL query to fetch total volumes for today and yesterday
    const fetchVolumeQuery = `
      SELECT 
        d.DeviceUID,
        MAX(CASE WHEN DATE(c.TimeStamp) = CURDATE() THEN c.totalVolume ELSE NULL END) - 
        MIN(CASE WHEN DATE(c.TimeStamp) = CURDATE() THEN c.totalVolume ELSE NULL END) AS todayVolume,
        MAX(CASE WHEN DATE(c.TimeStamp) = CURDATE() - INTERVAL 1 DAY THEN c.totalVolume ELSE NULL END) - 
        MIN(CASE WHEN DATE(c.TimeStamp) = CURDATE() - INTERVAL 1 DAY THEN c.totalVolume ELSE NULL END) AS yesterdayVolume
      FROM 
        tms_devices d
      LEFT JOIN 
        clean_data c ON d.DeviceUID = c.DeviceUID
      WHERE 
        d.CompanyId = ? 
        AND d.DeviceType IN ('ws', 'fs', 'ts','Transformer')
      GROUP BY 
        d.DeviceUID;
    `;

    // Execute the query
    const results = await executeQuery(fetchVolumeQuery, [CompanyId]);

    // Format the data to match the required response structure
    const formattedData = results.map((row) => ({
      [row.DeviceUID]: [
        {
          today: row.todayVolume || 0,
          yesterday: row.yesterdayVolume || 0,
        },
      ],
    }));

    // Send the formatted data as the response
    res.json(formattedData);
  } catch (error) {
    console.error('Error while fetching total volume data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}




async function getTotalVolumeForMonth(req, res) {

  const CompanyId  = req.user.CompanyId;
  console.log(CompanyId);

  

  // Helper function to execute database queries with promises
  const executeQuery = (query, params) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  };

  try {

    // Fetch DeviceUIDs for the given CompanyId
  const fetchDevicesQuery = `SELECT DeviceUID FROM tms_devices WHERE CompanyId = ?`;
  const devices =  await executeQuery(fetchDevicesQuery, [CompanyId]);

  console.log("Devices for CompanyId:", devices);
    // SQL query to fetch total volumes for the current and previous months
    const fetchVolumeQuery = `
      SELECT 
        d.DeviceUID,
        MAX(CASE WHEN MONTH(c.TimeStamp) = MONTH(CURDATE()) THEN c.totalVolume ELSE NULL END) - 
        MIN(CASE WHEN MONTH(c.TimeStamp) = MONTH(CURDATE()) THEN c.totalVolume ELSE NULL END) AS thisMonthVolume,
        MAX(CASE WHEN MONTH(c.TimeStamp) = MONTH(CURDATE() - INTERVAL 1 MONTH) THEN c.totalVolume ELSE NULL END) - 
        MIN(CASE WHEN MONTH(c.TimeStamp) = MONTH(CURDATE() - INTERVAL 1 MONTH) THEN c.totalVolume ELSE NULL END) AS lastMonthVolume
      FROM 
        tms_devices d
      LEFT JOIN 
        clean_data c ON d.DeviceUID = c.DeviceUID
      WHERE 
        d.CompanyId = ? 
        AND d.DeviceType IN ('ws', 'fs', 'Transformer','ts')
      GROUP BY 
        d.DeviceUID;
    `;

    // Execute the query
    const results = await executeQuery(fetchVolumeQuery, [CompanyId]);

    console.log(results);
    // Format the data to match the required response structure
    const formattedData = results.map((row) => ({
      [row.DeviceUID]: [
        {
          thisMonth: row.thisMonthVolume || 0,
          lastMonth: row.lastMonthVolume || 0,
        },
      ],
    }));



    // Send the formatted data as the response
    res.json(formattedData);
  } catch (error) {
    console.error('Error while fetching total volume data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getTotalVolumeForDuration(req, res) {
  const { deviceUID } = req.params;
  const { interval } = req.query;

  console.log(deviceUID);
  console.log(interval);
  try {
    let sql;
    switch (interval) {
      case '1hour':
        sql = `
        SELECT
          DeviceUID,
          FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(TimeStamp) / 3600) * 3600) AS TimeStamp,
          MAX(totalVolume) - MIN(totalVolume) AS totalVolume
        FROM
          actual_data
        WHERE
          DeviceUID = ? AND TimeStamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        GROUP BY
          DeviceUID,
          FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(TimeStamp) / 3600) * 3600)
        ORDER BY
          DeviceUID,
          TimeStamp;`;
        break;
      case '12hour':
        sql = `
        SELECT
          DeviceUID,
          FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(TimeStamp) / 3600) * 3600) AS TimeStamp,
          MAX(totalVolume) - MIN(totalVolume) AS totalVolume
        FROM
          actual_data
        WHERE
          DeviceUID = ? AND TimeStamp >= DATE_SUB(NOW(), INTERVAL 12 HOUR)
        GROUP BY
          DeviceUID,
          FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(TimeStamp) / 3600) * 3600)
        ORDER BY
          DeviceUID,
          TimeStamp;`
        break;
      case '1day':
        sql = `
        SELECT
          DeviceUID,
          FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(TimeStamp) / 3600) * 3600) AS TimeStamp,
          MAX(totalVolume) - MIN(totalVolume) AS totalVolume
        FROM
          actual_data
        WHERE
          DeviceUID = ? AND TimeStamp >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        GROUP BY
          DeviceUID,
          FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(TimeStamp) / 3600) * 3600)
        ORDER BY
          DeviceUID,
          TimeStamp;`
        break;
      case '7day':
        sql = `
        SELECT
          DeviceUID,
          DATE(FROM_UNIXTIME(UNIX_TIMESTAMP(TimeStamp))) AS TimeStamp,
          MAX(totalVolume) - MIN(totalVolume) AS totalVolume
        FROM
          actual_data
        WHERE
          DeviceUID = ? AND TimeStamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY
          DeviceUID,
          DATE(FROM_UNIXTIME(UNIX_TIMESTAMP(TimeStamp)))
        ORDER BY
          DeviceUID,
          TimeStamp;`
        break;
      case '30day':
        sql = `
        SELECT
          DeviceUID,
          DATE(FROM_UNIXTIME(UNIX_TIMESTAMP(TimeStamp))) AS TimeStamp,
          MAX(totalVolume) - MIN(totalVolume) AS totalVolume
        FROM
          actual_data
        WHERE
          DeviceUID = ? AND TimeStamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY
          DeviceUID,
          DATE(FROM_UNIXTIME(UNIX_TIMESTAMP(TimeStamp)))
        ORDER BY
          DeviceUID,
          TimeStamp;`
        break;
      case '6month':
        sql = `
        SELECT
          DeviceUID,
          DATE_FORMAT(TimeStamp, '%Y-%m') AS TimeStamp,
          MAX(totalVolume) - MIN(totalVolume) AS totalVolume
        FROM
          actual_data
        WHERE
          DeviceUID = ? AND TimeStamp >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY
          DeviceUID,
          DATE_FORMAT(TimeStamp, '%Y-%m')
        ORDER BY
          DeviceUID,
          TimeStamp;`
        break;
      case '12month':
        sql = `
        SELECT
          DeviceUID,
          DATE_FORMAT(TimeStamp, '%Y-%m') AS TimeStamp,
          MAX(totalVolume) - MIN(totalVolume) AS totalVolume
        FROM
          actual_data
        WHERE
          DeviceUID = ? AND TimeStamp >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY
          DeviceUID,
          DATE_FORMAT(TimeStamp, '%Y-%m')
        ORDER BY
          DeviceUID,
          TimeStamp;`
        break;
      default:
        return res.status(400).json({ message: 'Invalid time interval' });
    }

    db.query(sql, [deviceUID], (error, results) => {
      if (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.json({ data: results });
      console.log(results);
    });
  } catch (error) {
    console.error('Error in device retrieval:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getWaterConsumptionForDateRange(req, res) {
  const { deviceId, startDate, endDate } = req.params;

  try {
    // Fetch entries within the specified date range
    const fetchEntriesQuery = 'SELECT DeviceUID, DATE(FROM_UNIXTIME(UNIX_TIMESTAMP(TimeStamp))) AS TimeStamp, MAX(totalVolume) - MIN(totalVolume) AS totalVolume FROM actual_data WHERE DeviceUID = ? AND TimeStamp >= ? AND TimeStamp <= ? GROUP BY DeviceUID, DATE(FROM_UNIXTIME(UNIX_TIMESTAMP(TimeStamp))) ORDER BY DeviceUID, TimeStamp;';

    db.query(fetchEntriesQuery, [deviceId, startDate + ' 00:00:00', endDate + ' 23:59:59'], (fetchError, fetchResult) => {
      if (fetchError) {
        console.error('Error while fetching entries:', fetchError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      return res.json({ data: fetchResult });
    });
  } catch (error) {
    console.error('Error in device retrieval:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function deleteDevice(req, res) {
  try {
    const deviceUID = req.params.deviceUID;
    const companyId = req.user.CompanyId;
    console.log(deviceUID);
    console.log(companyId);

    // Step 1: Check if the device belongs to the given company
    const checkDeviceQuery = 'SELECT CompanyId FROM tms_devices WHERE DeviceUID = ?';

    db.query(checkDeviceQuery, [deviceUID], (error, result) => {
      if (error) {
        console.error('Error checking device:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: 'Device not found' });
      }

      if (result[0].CompanyId !== companyId) {
        return res.status(403).json({ message: 'Device does not belong to your company' });
      }

      // Step 2: Delete related records from tms_triggers table first
      const deleteTriggersQuery = 'DELETE FROM tms_trigger WHERE DeviceUID = ?';
      db.query(deleteTriggersQuery, [deviceUID], (triggersError) => {
        if (triggersError) {
          console.error('Error deleting triggers:', triggersError);
          return res.status(500).json({ message: 'Internal server error' });
        }

        // Step 3: Delete device from tms_devices table
        const deleteDeviceQuery = 'DELETE FROM tms_devices WHERE DeviceUID = ?';
        db.query(deleteDeviceQuery, [deviceUID], (deleteError, deleteResult) => {
          if (deleteError) {
            console.error('Error deleting device:', deleteError);
            return res.status(500).json({ message: 'Internal server error' });
          }

          if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Device not found' });
          }

          res.json({ message: 'Device and related triggers deleted successfully' });
        });
      });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function editUser(req, res) {
  const UserId = req.params.userId;
  const { FirstName, LastName, PersonalEmail,ContactNo, Location,  Designation, UserType } = req.body;

  try {
    const usersQuery = `
      UPDATE tms_users 
      SET FirstName = ?, LastName = ?, PersonalEmail = ?, Designation = ?, UserType = ?
      WHERE UserId = ?`;

    db.query(usersQuery, [FirstName, LastName, PersonalEmail, Designation, UserType, UserId], (error, result) => {
      if (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      res.json({ message: 'User Updated Successfully' });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}




//test
function fetchDeviceTotal(req, res) {
  const deviceUID = req.params.deviceUID;
  const CompanyId = req.user.CompanyId;

  // Step 1: Check if the device belongs to the given company
  const checkDeviceQuery = 'SELECT CompanyId FROM tms_devices WHERE DeviceUID = ?';

  console.log(CompanyId);


  db.query(checkDeviceQuery, [deviceUID], (error, deviceResult) => {
    if (error) {
      console.error('Error checking device:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    console.log(deviceResult);

    if (deviceResult.length === 0) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (deviceResult[0].CompanyId !== CompanyId) {
      return res.status(403).json({ message: 'Device does not belong to your company' });
    }

    // Step 2: Fetch the total consumption for the device on the current date
    const consumptionQuery = `
      SELECT * FROM tms_day_consumptions
      WHERE DeviceUID = ? 
      AND DATE(TimeStamp) = CURDATE()
    `;

    db.query(consumptionQuery, [deviceUID], (consumptionError, consumptionResult) => {
      if (consumptionError) {
        console.error('Error fetching device data:', consumptionError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      res.status(200).json(consumptionResult);
    });
  });
}

function editDeviceFromSetting(req, res) {
  const deviceUID = req.params.deviceID;
  const companyId = req.user.CompanyId;

  const { DeviceLocation, DeviceName,  DeviceType } = req.body;

 
  // Step 1: Check if the device belongs to the given company
  const checkDeviceQuery = 'SELECT CompanyId FROM tms_devices WHERE DeviceUID = ?';

  db.query(checkDeviceQuery, [deviceUID], (error, deviceResult) => {
    if (error) {
      console.error('Error checking device:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (deviceResult.length === 0) {
      return res.status(404).json({ message: 'Device not found!' });
    }

    if (deviceResult[0].CompanyId !== companyId) {
      return res.status(403).json({ message: 'Device does not belong to your company' });
    }

    // Step 2: Update device details in tms_devices table
    const updateDeviceQuery = `
      UPDATE tms_devices 
      SET DeviceLocation = ?, DeviceName = ?, DeviceType = ? 
      WHERE DeviceUID = ?
    `;

    db.query(updateDeviceQuery, [DeviceLocation, DeviceName, DeviceType, deviceUID], (updateError) => {
      if (updateError) {
        console.error('Error updating device:', updateError);
        return res.status(500).json({ message: 'Internal server error' });
      }

     
      res.json({ message: 'Device Updated Successfully' });
    });
  });
}

function last5alerts(req, res) {
  const deviceUID = req.params.deviceUID;
  const UserId = req.user.UserId;

  const CompanyId = req.user.CompanyId; // Ensure `req.user` is set properly

   
      // 1️⃣ Check if the device exists and belongs to the company
      const [deviceResult] =db.promise().query(
        "SELECT * FROM tms_devices WHERE DeviceUID = ? AND CompanyId = ?",
        [deviceUID, CompanyId]
      );
  
      if (deviceResult.length === 0) {
        return res.status(404).json({ message: "Unauthorized user" });
      }
  // check connection
  const triggerValueQuery = `SELECT TriggerValue FROM tms_trigger WHERE DeviceUID = ?;`;

  // Fetch the trigger value first
  db.query(triggerValueQuery, [deviceUID], (err, triggerValueResult) => {
    if (err) {
      console.error('Error fetching trigger value', err);
      return res.status(500).send('Error occurred');
    }
    

    if (triggerValueResult.length === 0) {
      return res.status(404).send('Trigger value not found');
    }

    
    const TriggerValue = triggerValueResult[0].TriggerValue;

   
    // Combine the four temperature parameters into the WHERE clause
    const query = `
      SELECT TimeStamp, Temperature, TemperatureR, TemperatureY, TemperatureB
      FROM actual_data 
      WHERE DeviceUID = ? AND (Temperature >= ? OR TemperatureR >= ? OR TemperatureY >= ? OR TemperatureB >= ?)
      ORDER BY TimeStamp 
      LIMIT 5;`;

    db.query(query, [deviceUID, TriggerValue, TriggerValue, TriggerValue, TriggerValue], (err, results) => {
      if (err) {
        console.error('Error fetching data', err);
        return res.status(500).send('Error occurred');
      }
      // Send the results back as JSON
      res.status(200).json(results);
    });
  });
}


// API to get total volume data for today and yesterday
async function getTotalVolumeForTodayEmail(req, res) {
  const { CompanyId } = req.user; // Assumed set by authentication middleware

  console.log(CompanyId);
  const executeQuery = (query, params) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
  };

  try {
    // // Step 1: Get CompanyEmail using CompanyID
    // const emailQuery = `SELECT CompanyEmail FROM tms_companies WHERE CompanyID = ?`;
    // const emailResult = await executeQuery(emailQuery, [CompanyId]);

    // if (emailResult.length === 0) {
    //   return res.status(404).json({ message: 'Company not found' });
    // }

    // const CompanyEmail = emailResult[0].CompanyEmail;

    // Step 2: Get total volume data for today and yesterday
    const fetchVolumeQuery = `
      SELECT 
        d.DeviceUID,
        MAX(CASE WHEN DATE(c.TimeStamp) = CURDATE() THEN c.totalVolume ELSE NULL END) - 
        MIN(CASE WHEN DATE(c.TimeStamp) = CURDATE() THEN c.totalVolume ELSE NULL END) AS todayVolume,
        MAX(CASE WHEN DATE(c.TimeStamp) = CURDATE() - INTERVAL 1 DAY THEN c.totalVolume ELSE NULL END) - 
        MIN(CASE WHEN DATE(c.TimeStamp) = CURDATE() - INTERVAL 1 DAY THEN c.totalVolume ELSE NULL END) AS yesterdayVolume
      FROM 
        tms_devices d
      LEFT JOIN 
        clean_data c ON d.DeviceUID = c.DeviceUID
      WHERE 
        d.CompanyId = ?
        AND d.DeviceType IN ('ws', 'fs', 'ts')
      GROUP BY 
        d.DeviceUID;
    `;

    const results = await executeQuery(fetchVolumeQuery, [CompanyId]);

    // Step 3: Format the result
    const formattedData = {};
    results.forEach((row) => {
      formattedData[row.DeviceUID] = {
        today: row.todayVolume || 0,
        yesterday: row.yesterdayVolume || 0,
      };
    });

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error while fetching total volume data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

const fetchLatestEntry = async (req, res) => {
  console.log(req.user);
  const  CompanyId = req.user.CompanyId;

  console.log(CompanyId);
  const executeQuery = (query, params) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
  };

  try {
    
    // Step 2: Query for latest actual_data entry per DeviceUID
    const optimizedQuery = `
  WITH LatestEntries AS (
      SELECT ad.DeviceUID, MAX(ad.TimeStamp) AS LatestTimeStamp
      FROM actual_data ad FORCE INDEX (idx_device_timestamp)
      WHERE ad.TimeStamp >= NOW() - INTERVAL 7 DAY
      GROUP BY ad.DeviceUID
  )
  SELECT d.DeviceUID, ad.EntryID, ad.Temperature, ad.TemperatureR, ad.TemperatureY, ad.TemperatureB,
         ad.Humidity, ad.flowRate, ad.totalVolume, ad.TimeStamp, ad.ip_address, ad.status
  FROM tms_devices d
  LEFT JOIN LatestEntries le ON d.DeviceUID = le.DeviceUID
  LEFT JOIN actual_data ad FORCE INDEX (idx_device_timestamp)
         ON ad.DeviceUID = le.DeviceUID AND ad.TimeStamp = le.LatestTimeStamp
  WHERE d.CompanyId = ?;
`;

    const results = await executeQuery(optimizedQuery, [CompanyId]);

    const defaultEntry = {
      EntryID: 0,
      DeviceUID: null,
      Temperature: null,
      TemperatureR: null,
      TemperatureY: null,
      TemperatureB: null,
      Humidity: null,
      flowRate: null,
      totalVolume: null,
      TimeStamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ip_address: "0.0.0.0",
      status: null
    };

    if (results.length === 0) {
      return res.status(404).json({ message: 'No devices found for the user' });
    }

    const latestEntries = results.map(result => {
      if (!result.TimeStamp) {
        return { [result.DeviceUID]: { entry: [defaultEntry] } };
      }
      return { [result.DeviceUID]: { entry: [result] } };
    });

    res.json({ latestEntry: latestEntries });

  } catch (error) {
    console.error('Error while fetching latest entry:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

function removeUser(req, res) {
  const userId = req.params.userId; 
  const getUserQuery = 'SELECT * FROM tms_users WHERE UserId = ?';
  db.query(getUserQuery, [userId], (error, userResult) => {
    if (error) {
      console.error('Error during user retrieval:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    try {
      if (userResult.length === 0) {
        console.log('User not found');
        return res.status(404).json({ message: 'User not found' });
      }
      const deleteUserQuery = 'DELETE FROM tms_users WHERE UserId = ?';
      db.query(deleteUserQuery, [userId], (error, deleteResult) => {
        if (error) {
          console.error('Error during user deletion:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }

        try {
          console.log('User deleted successfully');
          res.json({ message: 'User deleted successfully' });
        } catch (error) {
          console.error('Error responding to user deletion:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      });
    } catch (error) {
      console.error('Error during user removal:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


module.exports = {
  userDevices,
  addDevice,
  editDevice,
  editCompanyDetails,
  updatePersonalDetails,
  updatePassword,
  addDeviceTrigger,
  editDeviceTrigger,
  getDeviceDetails,
  getUserData,
  UpdateMail,
  UpdateWhatsapp,
  getTriggerData,
  updateTrigger,
  deletetriggeruser,
  fetchDeviceTrigger,
  fetchAllDeviceTrigger,
  getDataByTimeInterval,
  avg_interval,
  getDataByCustomDate,
  getLiveStatusDetails,
  fetchCompanyUser,
  barChartCustom,
  getTotalVolumeForMonth,
  getTotalVolumeForToday,
  getTotalVolumeForDuration,
  getWaterConsumptionForDateRange,
  deleteDevice,
  editUser,
  fetchLatestEntry,
  fetchDeviceTotal,
  editDeviceFromSetting,
  last5alerts,
  getTotalVolumeForTodayEmail,
  removeUser

}


