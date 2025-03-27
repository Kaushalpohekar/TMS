const express = require('express');
const dashController = require('../controllers/dashboardController');
const router = express.Router();
const {authenticateUser} = require('../token/jwtUtils');

router.get('/userdevices', authenticateUser, dashController.userDevices);
router.post('/addDevice', authenticateUser, dashController.addDevice);
router.put('/editDevice/:deviceId', authenticateUser, dashController.editDevice);
router.put('/editCompanyDetails', authenticateUser, dashController.editCompanyDetails);
router.put('/updatePersonalDetails', authenticateUser, dashController.updatePersonalDetails);
router.put('/updatePassword', authenticateUser, dashController.updatePassword);
router.post('/addDeviceTrigger', authenticateUser, dashController.addDeviceTrigger);
router.put('/editDeviceTrigger/:deviceId', authenticateUser, dashController.editDeviceTrigger);

router.get('/live-device-detail/:deviceId', authenticateUser, dashController.getDeviceDetails);

router.get('/user-data', authenticateUser, dashController.getUserData);
router.put('/UpdateMail/:deviceId', authenticateUser, dashController.UpdateMail);
router.put('/UpdateWhatsapp/:deviceId', authenticateUser, dashController.UpdateWhatsapp);
router.get('/getTriggerDataForAlert', authenticateUser, dashController.getTriggerData);
router.put('/updateTrigger/:deviceId', authenticateUser, dashController.updateTrigger);

router.put('/deletetrigger/:deviceId', authenticateUser, dashController.deletetriggeruser);

router.get('/device-trigger/:deviceId', authenticateUser, dashController.fetchDeviceTrigger);

router.get('/All-device-trigger', authenticateUser, dashController.fetchAllDeviceTrigger);
router.get('/data/:deviceId/intervals', authenticateUser, dashController.getDataByTimeInterval);

router.get('/avginterval/:deviceUID/:interval', authenticateUser, dashController.avg_interval);
router.get('/data/:deviceUID', authenticateUser, dashController.getDataByCustomDate);
router.get('/live-device-status/:deviceUID', authenticateUser, dashController.getLiveStatusDetails);
router.get('/company-users', authenticateUser, dashController.fetchCompanyUser);
router.post('/barChartCustom/:deviceUID', authenticateUser, dashController.barChartCustom);
router.get('/Total-Volume-Month', authenticateUser, dashController.getTotalVolumeForMonth);
router.get('/Total-Volume-Today', authenticateUser, dashController.getTotalVolumeForToday);
router.get('/ConsuptionByIntervalBar/:deviceUID', authenticateUser, dashController.getTotalVolumeForDuration);
router.get('/ConsuptionByCustomBar/:deviceId/:startDate/:endDate', authenticateUser, dashController.getWaterConsumptionForDateRange);
router.delete('/delete-device/:deviceUID', authenticateUser, dashController.deleteDevice);
router.put('/edit-User', authenticateUser, dashController.editUser);
router.get('/fetchLatestEntry', authenticateUser, dashController.fetchLatestEntry);
router.get('/FetchTodayConsumption/:deviceUID', authenticateUser, dashController.fetchDeviceTotal);
router.put('/editDeviceFromSetting/:deviceUID', authenticateUser, dashController.editDeviceFromSetting);
router.get('/lastalerts/:deviceUID', authenticateUser, dashController.last5alerts);



module.exports = router;