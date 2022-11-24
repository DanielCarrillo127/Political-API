const controller = {};
const mongoose = require('mongoose');
const userModel = require('../models/userModel');
const eventModel = require('../models/eventModel');
const auth = require('../config/auth')
const randomId = require('random-id');

controller.createEvent = async (req, res) => {

    if (!req.body.userCedula || !req.body.eventName || !req.body.description || !req.body.dateDevelopment || !req.body.address) return res.sendStatus(400)

    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    const eventid = 'EV' + randomId(4, '0')
    const event = await eventModel.findOne({ eventid: eventid })
    const CurrentDate = new Date()
    try {

        if (!event) {
            const EventInfo = {
                "eventid": eventid,
                "eventName": req.body.eventName,
                "description": req.body.description,
                "address": req.body.address,
                "creatorid": req.body.userCedula,
                "dateCreated": CurrentDate,
                "dateDevelopment": req.body.dateDevelopment,
                "transport": req.body.transport ? req.body.transport : "No",
                "refreshments": req.body.refreshments ? req.body.refreshments : "No",
            }

            await eventModel.create(EventInfo)
            return res.status(201).json({ message: "Event created sucefully!", info: EventInfo })
        } else {
            return res.status(208).json({ message: "Event already exist" })
        }
    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error })
    }

}

controller.getAllEvents = async (req, res) => {

    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }
    
    const events = await eventModel.find()
    res.status(200).json({ events })
}

controller.updateEvent = async (req, res) => {

    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }

    try {
        if (await auth.verifyToken(req, res)) {
            const event = await eventModel.findOne({ eventid: req.body.eventid })
            const newEvent = {
                "address": req.body.newAddress ? req.body.newAddress : event.address,
                "dateDevelopment": req.body.newDateDevelopment ? req.body.newDateDevelopment : event.dateDevelopment,
            }
            await eventModel.findOneAndUpdate({ eventid: req.body.eventid }, newEvent)
            return res.json({message: 'Event Update Sucefully'})
        } else {
            return res.sendStatus(403)
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ data: "Server internal error" })
    }
}

controller.deleteEvent = async (req, res) => {
    if (!req.body.userCedula || !req.body.eventid) return res.sendStatus(400)
    const cedula = req.body.userCedula;

    const user = await userModel.findOne({ cedula: cedula })
    if (!user) { return res.status(404).json({ message: 'User not found' }) }
    if (user.role === "VOTER" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }
    const event =  await eventModel.findOne({ eventid : req.body.eventid });
    try {
        if (event !== null) {
            await eventModel.deleteOne({ eventid : req.body.eventid });
            res.json("Delete sucefully")
        } else {
            res.json({ message: 'Event dont exist in database' })
        }

    } catch (error) {
        res.status(500).json({ data: "Server internal error" })
    }
}






module.exports = controller;