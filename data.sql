CREATE TABLE tms_devices (
    EntryId INT AUTO_INCREMENT PRIMARY KEY,
    DeviceUID VARCHAR(255) UNIQUE NOT NULL,
    DeviceLocation VARCHAR(255),
    DeviceName VARCHAR(255),
    CompanyId INT NOT NULL,  
    IssueDate timestamp,
    status ENUM('online', 'offline') DEFAULT 'offline',
    DeviceType VARCHAR(255),
    SMS VARCHAR(255),
    email VARCHAR(255),
    type ENUM('Admin', 'Standard') DEFAULT 'Standard',
    endDate timestamp,
    FOREIGN KEY (CompanyId) REFERENCES tms_companies(CompanyId)  
);


CREATE TABLE tms_companies (
    CompanyId INT  PRIMARY KEY,
    CompanyName VARCHAR(255)  NOT NULL,
    CompanyEmail VARCHAR(100) UNIQUE NOT NULL,
    ContactNo VARCHAR(15),
    Location TEXT
);

CREATE TABLE tms_users (
    UserId INT  PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    CompanyId INT,  
    UserType ENUM('admin', 'standard') NOT NULL,
    PersonalEmail VARCHAR(100) UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Designation VARCHAR(100),
    VerificationToken VARCHAR(1024),
    Verified BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    block ENUM('0', '1') DEFAULT '0',
    FOREIGN KEY (CompanyId) REFERENCES tms_companies(CompanyId) 
);



CREATE TABLE tms_reset_token (
    id INT  PRIMARY KEY,
    UserId INT NOT NULL,
    token VARCHAR(1024) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES tms_users(UserId)
);



CREATE TABLE tms_trigger (
    TriggerId INT  PRIMARY KEY,
    DeviceUID VARCHAR(255) NOT NULL,
    CompanyId INT NOT NULL,   
    UserId INT NOT NULL,      
    TriggerValue VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    interval INT DEFAULT 0,
    Whatsapp VARCHAR(100),
    Mail VARCHAR(100),
    interval_start TIMESTAMP,
    interval_end TIMESTAMP,
    FOREIGN KEY (DeviceUID) REFERENCES tms_devices(DeviceUID) 
    FOREIGN KEY (CompanyId) REFERENCES tms_companies(CompanyId) 
    FOREIGN KEY (UserId) REFERENCES tms_users(UserId) 
);


CREATE TABLE tms_user_device_status (
    id INT  PRIMARY KEY,
    active_users_count INT DEFAULT 0,
    inactive_users_count INT DEFAULT 0,
    active_devices_count INT DEFAULT 0,
    deactive_devices_count INT DEFAULT 0,
    total_users INT DEFAULT 0,
    total_devices INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    organizations_count INT NOT NULL, 
    admin_users_count INT DEFAULT 0,
    standard_users_count INT DEFAULT 0
);


CREATE TABLE actual_data (
    EntryID INT  PRIMARY KEY,
    DeviceUID VARCHAR(255) NOT NULL,
    TimeStamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Temperature DECIMAL(5,2),
    Humidity DECIMAL(5,2),
    TemperatureR DECIMAL(5,2),
    TemperatureY DECIMAL(5,2),
    TemperatureB DECIMAL(5,2),
    Pressure DECIMAL(10,2),
    flowRate DECIMAL(10,2),
    totalVolume DECIMAL(10,2),
    ip_address VARCHAR(45),
    status ENUM('online', 'offline') DEFAULT 'offline',
    
);

CREATE TABLE tms_day_consumptions (
    EntryID INT  PRIMARY KEY,
    DeviceUID VARCHAR(255) NOT NULL,
    totalVolume DECIMAL(10,2) NOT NULL, -- Total volume consumed in a day
    TimeStamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DeviceUID) REFERENCES tms_devices(DeviceUID) ON DELETE CASCADE
);


