const controller = {};
const mongoose = require('mongoose');
const userModel = require('../models/userModel');
const eventModel = require('../models/eventModel');
const attendanceModel = require('../models/attendanceModel');
const auth = require('../config/auth')


controller.newAttendance = async (req, res) => {

     if (!req.body.userCedula || !req.body.eventid || !req.body.attendantCedula) return res.sendStatus(400)

     const user = await userModel.findOne({ cedula: req.body.userCedula })
     if (!user) { return res.status(404).json({ message: 'User not found' }) }
     if (user.role === "VOTER") { return res.status(403).send({ message: 'Action not allowed' }) }
     if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    const event = await eventModel.findOne({ eventid: req.body.eventid })
    if (!event) { return res.status(404).json({ message: 'event not found'}) }

    
    const find = await findUserAttendant(req.body.attendantCedula)
    if (find === "not registered" && !req.body.attendantNumber) { return res.json({ message: 'More information required'}) }

    // //eliminate duplicity 
    const attendants = await attendanceModel.find({eventid: req.body.eventid}).lean()
    if(find === "not registered"){
        const findAttendant = attendants.find(a => a.attendant.cedula === req.body.attendantCedula)
        if(findAttendant){return res.json({ message: 'attendant already register'})}
     }else{
        const findAttendant = attendants.find(a => a.attendant.cedula === find.cedula)        
        if(findAttendant){return res.json({ message: 'attendant already register'})}
     }

    try {
        if (event) {
            const atendanceInfo = {
                "eventid": req.body.eventid,
                "attendant": req.body.attendantNumber ? {"phoneNumber" : req.body.attendantNumber, "cedula" : req.body.attendantCedula } : find,
                "type": find === "not registered" ? "NEW" : 'OLD'
            }
            await attendanceModel.create(atendanceInfo)
            return res.json({ message: "attendant sucefully register!", info: atendanceInfo })
        } 
    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error })
    }

}

const findUserAttendant = async (attendantCedula) =>{
     const attendant = await userModel.findOne({ cedula: attendantCedula }, "-password").lean()
     if(attendant){
        return attendant
     }else{
        return "not registered"
     }
}

controller.getAllAttendance = async (req, res) => {
    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }
    
    const attendance = await attendanceModel.find({ eventid: req.body.eventid })
    res.status(200).json({ attendance })

}

controller.deleteAttendance = async (req, res) => {
     if (!req.body.userCedula || !req.body.eventid || !req.body.attendantCedula) return res.sendStatus(400)

    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }
    
    //find and assign to variable
    const attendants = await attendanceModel.find({eventid: req.body.eventid}).lean()
    const findAttendant = attendants.find(a => a.attendant.cedula === req.body.attendantCedula)  
    try {
        if (findAttendant) {
            await attendanceModel.deleteOne({ eventid : req.body.eventid, _id: findAttendant._id });
            res.json("Delete sucefully")
        } else {
            res.json({ message: 'attendant dont exist in database for this event' })
        }

    } catch (error) {
        res.status(500).json({ data: "Server internal error" })
    }
}


module.exports = controller;