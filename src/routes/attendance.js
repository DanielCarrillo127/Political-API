const { Router } = require('express');
const router = Router();
const { newAttendance, getAllAttendance, deleteAttendance } = require('../controllers/attendanceRoutes.controller');


//CREATE
router.route('/newAttendance')
    .post(newAttendance)

// //READ
router.route('/getAllAttendance')
    .post(getAllAttendance)

// //DELETE
router.route('/deleteAttendance').delete(deleteAttendance)

module.exports = router;