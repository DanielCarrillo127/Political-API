const { Router } = require('express');
const router = Router();
const { createUser, getAllUsers, deleteUser, loginUser, getAllVotersByLeader, getAllVotersByCoordinator, getAllCoordinators, getAllLeaders, getAllLeadersByCoordinators, setRole, updateUser, registerVoter,getCountVoters } = require('../controllers/userRoutes.controller');

router.route('/')
    .get((req, res) => {
        res.json(
            { message: 'API developed by Dcarrillo' })
    })

    // // GET
router.route('/stats').post(getCountVoters)

//CREATE
router.route('/newUser')
    .post(createUser)


    router.route('/registerVoter')
    .post(registerVoter)

router.route('/setRole')
    .post(setRole)

// //READ
router.route('/getAllUsers')
    .post(getAllUsers)

router.route('/loginUser')
    .post(loginUser)

router.route('/getAllVotersByLeader')
    .post(getAllVotersByLeader)

router.route('/getAllVotersByCoordinator')
    .post(getAllVotersByCoordinator)

router.route('/getAllCoordinators')
    .post(getAllCoordinators)

router.route('/getAllLeaders')
    .post(getAllLeaders)

router.route('/getAllLeadersByCoordinators')
    .post(getAllLeadersByCoordinators)

// //UPDATE
router.route('/updateUser')
    .post(updateUser)

// //DELETE
router.route('/deleteUser').delete(deleteUser)

module.exports = router;
