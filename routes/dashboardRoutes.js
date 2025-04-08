const express = require('express');
const dashController = require('../controllers/dashboardController');
const router = express.Router();
const {authenticateUser} = require('../token/jwtUtils');

router.get('/userdevices/:companyEmail', authenticateUser, dashController.userDevices);
router.post('/addDevice', authenticateUser, dashController.addDevice);
router.put('/editDevice/:deviceId', authenticateUser, dashController.editDevice);
router.put('/companyDetails/:UserId', authenticateUser, dashController.editCompanyDetails);
router.put('/personalDetails/:UserId', authenticateUser, dashController.updatePersonalDetails);
router.put('/updatePassword/:UserId', authenticateUser, dashController.updatePassword);
router.post('/addDeviceTrigger', authenticateUser, dashController.addDeviceTrigger);
router.put('/editDeviceTrigger/:deviceId', authenticateUser, dashController.editDeviceTrigger);

router.get('/live-device-detail/:deviceId', authenticateUser, dashController.getDeviceDetails);

router.get('/user-data/:userId', authenticateUser, dashController.getUserData);
router.put('/UpdateMail/:DeviceUID', authenticateUser, dashController.UpdateMail);
router.put('/UpdateWhatsapp/:DeviceUID', authenticateUser, dashController.UpdateWhatsapp);
router.get('/getTriggerDataForAlert/:CompanyEmail', authenticateUser, dashController.getTriggerData);//test
router.put('/updateTrigger/:DeviceUID', authenticateUser, dashController.updateTrigger);

router.put('/deletetrigger/:DeviceUID', authenticateUser, dashController.deletetriggeruser);

router.get('/device-trigger/:deviceId', authenticateUser, dashController.fetchDeviceTrigger);

router.get('/user-devices-trigger/:CompanyEmail', authenticateUser, dashController.fetchAllDeviceTrigger);
router.get('/data/:deviceId/intervals', authenticateUser, dashController.getDataByTimeInterval);//

router.get('/avginterval/:id/:interval', authenticateUser, dashController.avg_interval);//
router.get('/data/:deviceId', authenticateUser, dashController.getDataByCustomDate);//
router.get('/live-device-status/:deviceId', authenticateUser, dashController.getLiveStatusDetails);//
router.get('/Company-users/:CompanyEmail', authenticateUser, dashController.fetchCompanyUser);
router.post('/barChartCustom/:deviceId', authenticateUser, dashController.barChartCustom);
router.get('/Total-Volume-Month/:deviceId', authenticateUser, dashController.getTotalVolumeForMonth);
router.get('/Total-Volume-Today/:deviceId', authenticateUser, dashController.getTotalVolumeForToday);
router.get('/Total-Volume-Today-Email/:CompanyEmail', authenticateUser, dashController.getTotalVolumeForTodayEmail);
router.get('/ConsuptionByIntervalBar/:deviceId', authenticateUser, dashController.getTotalVolumeForDuration);
router.get('/ConsuptionByCustomBar/:deviceId/:startDate/:endDate', authenticateUser, dashController.getWaterConsumptionForDateRange);
router.delete('/delete-device/:deviceUID', authenticateUser, dashController.deleteDevice);
router.put('/edit-User/:userId', authenticateUser, dashController.editUser);//use updatePersonalDetails instead
router.get('/fetchLatestEntry/:companyEmail', authenticateUser, dashController.fetchLatestEntry);
router.get('/FetchTodayConsumption/:deviceID', authenticateUser, dashController.fetchDeviceTotal);
router.put('/editDeviceFromSetting/:deviceID', authenticateUser, dashController.editDeviceFromSetting);
router.get('/lastalerts/:deviceUID', authenticateUser, dashController.last5alerts);



module.exports = router;