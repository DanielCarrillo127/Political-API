const { Router } = require('express');
const router = Router();
const { registerVote, validateWitness, getVotes, updateVoteStatus, registerPartialCount, getGeneralStatus } = require('../controllers/witnessRoutes.controller');
// const multer = require('multer');

// const path = require('path');

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, path.join(__dirname, '../uploads/'));
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.originalname);
//     },
// });
// const upload = multer({ storage: storage });


//CREATE
// router.post('/registerVote', upload.single("image"), registerVote)
router.route('/registerVote')
    .post(registerVote)

router.route('/registerPartialCount')
    .post(registerPartialCount)

// //READ
router.route('/getVotes')
    .post(getVotes)
router.route('/validateWitness')
    .post(validateWitness)
router.route("/getGeneralStatus")
    .post(getGeneralStatus)

// //UPDATE date and address
router.route('/updateVoteStatus')
    .post(updateVoteStatus)

// // //DELETE
// router.route('/deleteVote').delete(deleteVote)

module.exports = router;
