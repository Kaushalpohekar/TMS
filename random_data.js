require("dotenv").config();
const mqtt = require("mqtt");
const mysql = require("mysql2");

// MQTT Broker
const broker = "mqtt://test.mosquitto.org";
const topic = "sensor/data"; // MQTT topic to publish and receive data

// MySQL Database Connection (Using Pool for Efficient Handling)
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Connect to MQTT Broker
const mqttclient = mqtt.connect(broker, { connectTimeout: 10000 });

mqttclient.on("connect", () => {
  console.log("✅ Connected to MQTT Broker");

  // Subscribe to the topic
  mqttclient.subscribe(topic, (err) => {
    if (err) console.error("❌ Subscription error:", err);
    else console.log(`📡 Subscribed to topic: ${topic}`);
  });

  // Publish random data every 1 minute (for testing)
  setInterval(() => {
    const randomData = {
      DeviceUID: `device_${Math.floor(Math.random() * 1000)}`, // Random Device ID
      Temperature: (Math.random() * (40 - 20) + 20).toFixed(2), // 20°C - 40°C
      Humidity: (Math.random() * (100 - 30) + 30).toFixed(2), // 30% - 100%
      TemperatureR: (Math.random() * (45 - 25) + 25).toFixed(2),
      TemperatureY: (Math.random() * (35 - 15) + 15).toFixed(2),
      TemperatureB: (Math.random() * (30 - 10) + 10).toFixed(2),
      Pressure: (Math.random() * (1100 - 900) + 900).toFixed(2), // 900 - 1100 hPa
      flowRate: (Math.random() * (15 - 0) + 0).toFixed(2), // 0 - 15 L/min
      totalVolume: (Math.random() * (500 - 50) + 50).toFixed(2), // 50 - 500 L
      ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`, // Random IP
      status: Math.random() > 0.5 ? "online" : "offline", // Random status
    };

    const data = JSON.stringify(randomData);

    // Publish data to MQTT
    mqttclient.publish(topic, data, () => {
      console.log(`📤 Published: ${data}`);
    });
  }, 60 * 1000);
});

// Handle received data from MQTT
mqttclient.on("message", (topic, message) => {
  try {
    const receivedData = JSON.parse(message.toString());
    console.log(`📥 Received: ${message.toString()}`);

    // Ensure DeviceUID is present, or assign a random one
    const deviceUID = receivedData.DeviceUID || `device_${Math.floor(Math.random() * 1000)}`;

    // Function to ensure a valid numeric value
    const ensureValidNumber = (value, min, max) => {
      return isNaN(value) || value === null || value === undefined
        ? (Math.random() * (max - min) + min).toFixed(2)
        : value;
    };

    // Ensure all values are present
    const mappedData = {
      DeviceUID: deviceUID,
      Temperature: ensureValidNumber(receivedData.Temperature, 20, 40),
      Humidity: ensureValidNumber(receivedData.Humidity, 30, 100),
      TemperatureR: ensureValidNumber(receivedData.TemperatureR, 25, 45),
      TemperatureY: ensureValidNumber(receivedData.TemperatureY, 15, 35),
      TemperatureB: ensureValidNumber(receivedData.TemperatureB, 10, 30),
      Pressure: ensureValidNumber(receivedData.Pressure, 900, 1100),
      flowRate: ensureValidNumber(receivedData.flowRate, 0, 15),
      totalVolume: ensureValidNumber(receivedData.totalVolume, 50, 500),
      ip_address: receivedData.ip_address || `192.168.1.${Math.floor(Math.random() * 255)}`,
      status: receivedData.status || "offline",
    };

    // Insert data into MySQL
    const query = `
      INSERT INTO actual_data 
        (DeviceUID, Temperature, Humidity, TemperatureR, TemperatureY, TemperatureB, Pressure, flowRate, totalVolume, ip_address, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = Object.values(mappedData);

    mysqlPool.query(query, values, (err, result) => {
      if (err) console.error("❌ Error inserting received data:", err);
      else console.log("✅ Data inserted into MySQL, ID:", result.insertId);
    });
  } catch (error) {
    console.error("❌ Error parsing received data:", error);
  }
});


// Handle errors and connection events
mqttclient.on("error", (error) => {
  console.error("❌ MQTT error:", error);
});

mqttclient.on("offline", () => {
  console.log("⚠️ MQTT client is offline");
});

mqttclient.on("reconnect", () => {
  console.log("🔄 MQTT client is reconnecting...");
});
