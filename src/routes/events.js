const { Router } = require('express');
const router = Router();
const { createEvent, getAllEvents, deleteEvent, updateEvent } = require('../controllers/eventRoutes.controller');


//CREATE
router.route('/newEvent')
    .post(createEvent)

// //READ
router.route('/getAllEvents')
    .get(getAllEvents)

// //UPDATE date and address
router.route('/updateEvent')
    .post(updateEvent)

// //DELETE
router.route('/deleteEvent').delete(deleteEvent)

module.exports = router;
