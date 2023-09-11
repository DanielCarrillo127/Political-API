const controller = {};
const mongoose = require('mongoose');
const userModel = require('../models/userModel');
const auth = require('../config/auth')
const bcrypt = require('bcrypt')

//Create User
controller.createUser = async (req, res) => {
    if (!req.body.name || !req.body.cedula || !req.body.surnames || !req.body.password || !req.body.phoneNumber || !req.body.sex || !req.body.age || !req.body.leaderid) return res.sendStatus(400)
    const user = await userModel.findOne({ cedula: req.body.cedula })

    try {
        if (!user) {
            const salt = await bcrypt.genSalt(10)
            let sexEnum = ""
            req.body.password = await bcrypt.hash(req.body.password, salt)
            if (req.body.sex == "1") {
                sexEnum = "MALE"
            } else if (req.body.sex == "2") {
                sexEnum = "WOMEN"
            } else {
                sexEnum = "OTHERS"
            }
            const userInfo = {
                "name": req.body.name,
                "surnames": req.body.surnames,
                "password": req.body.password,
                "cedula": req.body.cedula,
                "phoneNumber": req.body.phoneNumber,
                "address": req.body.address,
                "sex": sexEnum,
                "age": req.body.age,
                "leaderid": req.body.leaderid ? req.body.leaderid : null,
                "votingBooth": req.body.votingBooth ? req.body.votingBooth : null,
                "table": req.body.table ? req.body.table : null,
                "productiveSection": req.body.productiveSection ? req.body.productiveSection : "other",
            }
            await userModel.create(userInfo)
            const payload = {
                'cedula': req.body.cedula,
                'password': req.body.password
            }

            const accesToken = auth.createToken(payload)
            return res.status(201).json({ message: "User created sucefully!", token: accesToken })

        } else {
            return res.status(208).json({ message: "User already exist" })
        }

    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error })
    }
}

controller.registerVoter = async (req, res) => {
    if (!req.body.name || !req.body.cedula || !req.body.surnames || !req.body.phoneNumber || !req.body.sex || !req.body.age || !req.body.leaderid) return res.sendStatus(400)
    const user = await userModel.findOne({ cedula: req.body.cedula })

    try {
        if (!user) {

            const userLeader = await userModel.findOne({ cedula: req.body.leaderid })
            if (!userLeader) { return res.status(404).json({ message: 'Leader cedula not found' }) }
            else {
                if (userLeader.role === "VOTER") {
                    const salt = await bcrypt.genSalt(10)
                    const userUpdatepassword = await bcrypt.hash(userLeader.cedula, salt)
                    userLeader.role = "LEADER"
                    userLeader.password = userUpdatepassword
                    await userLeader.save()
                }
            }

            let sexEnum = ""
            if (req.body.sex == "1") {
                sexEnum = "MALE"
            } else if (req.body.sex == "2") {
                sexEnum = "WOMEN"
            } else {
                sexEnum = "OTHERS"
            }
            const userInfo = {
                "name": req.body.name,
                "surnames": req.body.surnames,
                "cedula": req.body.cedula,
                "password": "null",
                "phoneNumber": req.body.phoneNumber,
                "address": req.body.address,
                "sex": sexEnum,
                "age": req.body.age,
                "leaderid": req.body.leaderid ? req.body.leaderid : null,
                "votingBooth": req.body.votingBooth ? req.body.votingBooth : null,
                "table": req.body.table ? req.body.table : null,
                "productiveSection": req.body.productiveSection ? req.body.productiveSection : "other",
            }
            await userModel.create(userInfo)
            return res.status(201).json({ message: "User created sucefully!" })

        } else {
            return res.status(208).json({ message: "User already exist" })
        }

    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error })
    }
}

//logimUser
controller.loginUser = async (req, res) => {
    try {
        if (!req.body.cedula || !req.body.password) return res.sendStatus(400)
        const user = await userModel.findOne({ cedula: req.body.cedula }, '-_id -__v')
        if (!user) { return res.status(404).json({ message: 'User not found' }) }
        if (user.role === "VOTER") { return res.status(403).send({ message: 'Action not allowed' }) }

        if (user) {
            const payload = {
                'cedula': user.cedula,
                'password': user.password
            }
            const validPassword = await bcrypt.compare(req.body.password, payload.password);
            const accesToken = auth.createToken(payload)

            if (validPassword) {
                res.status(200).json({ message: 'Login sucefully!', accesToken: accesToken, info: user })
            } else {
                res.status(404).json({ message: "Password incorrect" })
            }
        } else {
            res.status(404).json({ message: "Username incorrect" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server internal error" })
    }
}

//getAllUsers
controller.getAllUsers = async (req, res) => {

    const user = await userModel.findOne({ cedula: req.body.userCedula })

    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "COORDINATOR" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    const users = await userModel.find()
    const result = []
    users.forEach((user) => {
        if (user.role === "VOTER" || user.role === "COORDINATOR" || user.role === "LEADER") {
            result.push(user)
        }
    });

    res.status(200).json({ result })
}
//getAllVotersByLeader
controller.getAllVotersByLeader = async (req, res) => {

    const leaderReqId = req.body.LeaderCedula
    const user = await userModel.findOne({ cedula: req.body.userCedula })

    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    const users = await userModel.find()
    const result = []
    users.forEach((user) => {
        if (user.role === "VOTER" && user.leaderid === leaderReqId) {
            result.push(user)
        }
    });
    res.status(200).json({ result })
}
//getAllVotersByCoordinator
controller.getAllVotersByCoordinator = async (req, res) => {

    const leaderReqId = req.body.CoordinatorCedula
    const user = await userModel.findOne({ cedula: req.body.CoordinatorCedula })

    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    const users = await userModel.find()
    const leaders = []
    const result = []

    users.forEach((user) => {
        if ((user.role === "LEADER" || user.role === "COORDINATOR") && user.leaderid === leaderReqId) {
            leaders.push(user.cedula)
            result.push(user)
        }
    });
    users.forEach((user) => {
        const found = leaders.find(leader => leader === user.leaderid);
        if ((user.role === "VOTER" || user.role === "LEADER") && found !== null && !result.includes(user)) {
            result.push(user)
        }
    });

    res.status(200).json({ result })
}
//getAllCoordinators
controller.getAllCoordinators = async (req, res) => {

    const user = await userModel.findOne({ cedula: req.body.userCedula })

    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "LEADER" || user.role === "COORDINATOR") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    const users = await userModel.find()
    const result = []
    users.forEach((user) => {
        if (user.role === "COORDINATOR") {
            result.push(user)
        }
    });
    res.status(200).json({ result })
}
//getAllLeaders
controller.getAllLeaders = async (req, res) => {

    const user = await userModel.findOne({ cedula: req.body.userCedula })

    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    const users = await userModel.find()
    const result = []
    users.forEach((user) => {
        if (user.role === "LEADER") {
            result.push(user)
        }
    });
    res.status(200).json({ result })
}
//getAllLeadersByCoordinators
controller.getAllLeadersByCoordinators = async (req, res) => {

    const leaderReqId = req.body.CoordinatorCedula
    const user = await userModel.findOne({ cedula: req.body.CoordinatorCedula })

    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    const users = await userModel.find()
    const result = []
    users.forEach((user) => {
        if (user.role === "LEADER" && user.leaderid === leaderReqId) {
            result.push(user)
        }
    });

    res.status(200).json({ result })
}

//setRole
controller.setRole = async (req, res) => {

    if (!req.body.userCedula) return res.sendStatus(400)

    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "COORDINATOR" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    const userUpdateCedula = req.body.userUpdateCedula;
    const newRole = req.body.newRole;

    try {
        if (user !== null) {
            if (newRole === "COORDINATOR" || newRole === "LEADER") {
                const salt = await bcrypt.genSalt(10)
                const userUpdatepassword = await bcrypt.hash(userUpdateCedula, salt)
                await userModel.findOneAndUpdate({ cedula: userUpdateCedula }, { role: newRole, password: userUpdatepassword })
            } else {
                await userModel.findOneAndUpdate({ cedula: userUpdateCedula }, { role: newRole })
            }
            res.json("Update sucefully")
        } else {
            res.json({ message: 'id Missing in database' })
        }
    } catch (error) {
        res.status(500).json({ data: "Server internal error" })
    }
}
//updateUser
controller.updateUser = async (req, res) => {

    //sent userCedula for the userifself or the voter
    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }

    try {
        //token verification for users
        if (await auth.verifyToken(req, res)) {

            const userData = await userModel.findOne({ cedula: req.body.currentCedula })
            if (!userData) { return res.status(404).json({ message: 'User not found' }) }

            if (req.body.newPassword) {
                const salt = await bcrypt.genSalt(10)
                req.body.newPassword = await bcrypt.hash(req.body.newPassword, salt)
            }

            let sexEnum = ""
            if (req.body.newSex == "1") {
                sexEnum = "MALE"
            } else if (req.body.newSex == "2") {
                sexEnum = "WOMEN"
            } else {
                sexEnum = "OTHERS"
            }

            const newUser = {
                "name": req.body.newName ? req.body.newName : userData.name,
                "surnames": req.body.newSurname ? req.body.newSurname : userData.surnames,
                "password": req.body.newPassword ? req.body.newPassword : userData.password,
                "cedula": req.body.newCedula ? req.body.newCedula : userData.cedula,
                "sex": req.body.newSex ? sexEnum : userData.sex,
                "age": req.body.newAge ? req.body.newAge : userData.age,
                "phoneNumber": req.body.newPhoneNumber ? req.body.newPhoneNumber : userData.phoneNumber,
                "leaderid": req.body.newLeaderid ? req.body.newLeaderid : userData.leaderid,
                "address": req.body.newAddress ? req.body.newAddress : userData.address,
                "votingBooth": req.body.newVotingBooth ? req.body.newVotingBooth : userData.votingBooth,
                "table": req.body.newTable ? req.body.newTable : userData.table,
                "productiveSection": req.body.newProductiveSection ? req.body.newProductiveSection : userData.productiveSection,
            }
            await userModel.findOneAndUpdate({ cedula: req.body.currentCedula }, newUser)
            return res.json({ message: 'User Update Sucefully' })
        } else {
            return res.sendStatus(403)
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ data: "Server internal error" })
    }
}

//deleteUser
controller.deleteUser = async (req, res) => {
    if (!req.query.cedula) return res.sendStatus(400)
    const cedula = req.query.cedula;
    try {
        const user = await userModel.findOne({ "cedula": cedula })
        if (user !== null) {
            await userModel.deleteOne({ 'cedula': cedula });
            res.json("Delete sucefully")
        } else {
            res.json({ message: 'id Missing in database' })
        }

    } catch (error) {
        res.status(500).json({ data: "Server internal error" })
    }
}

controller.getCountVoters = async (req, res) => {

    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    const result = {
        voters: 0,
        activeLeaders: 0,
        activeCoordinators: 0,
    }

    const users = await userModel.find()
    users.forEach((user) => {
        if (user.role === "VOTER" || user.role === "COORDINATOR" || user.role === "LEADER") {
            result.voters += 1
        }
        if (user.role === "LEADER") {
            result.activeLeaders += 1
        }
        if (user.role === "COORDINATOR") {
            result.activeCoordinators += 1
        }
    });

    res.status(200).json({ result })

}
// controller.GetCountVotersByUser = async (req, res) => {
//     //[cedulaLeader, Nombre, role, totalVotantes]
// }


controller.updateUserPassword = async (req, res) => {
    // userCedula,updateUserCedula,oldPassword,newPassword --> /updateUserPassword
    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    try {
        //token verification for users
        if (await auth.verifyToken(req, res)) {
            const userData = await userModel.findOne({ cedula: req.body.updateUserCedula })
            if (!userData) { return res.status(404).json({ message: 'User update not found' }) }
            let newPassword;
            const validOldPassword = await bcrypt.compare(req.body.oldPassword,userData.password);
            if (validOldPassword) {
                const salt = await bcrypt.genSalt(10)
                newPassword = await bcrypt.hash(req.body.newPassword, salt)
                await userModel.findOneAndUpdate({ cedula: userData.cedula }, { "password": newPassword })
                return res.json({ message: 'User Password Update Sucefully' })
            } else {
                return res.status(404).json({ message: 'Tu contraseña actual es incorrecta.' })
            }
        } else {
            return res.sendStatus(403)
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ data: "Server internal error" })
    }
}


module.exports = controller;