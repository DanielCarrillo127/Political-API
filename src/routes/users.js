const { Router } = require('express');
const router = Router();
const { createUser, getAllUsers, deleteUser, loginUser, getAllVotersByLeader, getAllVotersByCoordinator, getAllCoordinators, getAllLeaders, getAllLeadersByCoordinators, setRole, updateUser } = require('../controllers/userRoutes.controller');

router.route('/')
    .get((req, res) => {
        res.json(
            { message: 'API developed by Dcarrillo' })
    })

//CREATE
router.route('/newUser')
    .post(createUser)

router.route('/setRole')
    .post(setRole)

// //READ
router.route('/getAllUsers')
    .get(getAllUsers)

router.route('/loginUser')
    .post(loginUser)

router.route('/getAllVotersByLeader')
    .get(getAllVotersByLeader)

router.route('/getAllVotersByCoordinator')
    .get(getAllVotersByCoordinator)

router.route('/getAllCoordinators')
    .get(getAllCoordinators)

router.route('/getAllLeaders')
    .get(getAllLeaders)

router.route('/getAllLeadersByCoordinators')
    .get(getAllLeadersByCoordinators)

// //UPDATE
router.route('/updateUser')
    .post(updateUser)

// //DELETE
router.route('/deleteUser').delete(deleteUser)

module.exports = router;
