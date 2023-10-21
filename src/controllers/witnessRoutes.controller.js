const controller = {};
const mongoose = require('mongoose');
const witnessModel = require('../models/witnessModel');
const votesModel = require('../models/votesModel');
const userModel = require('../models/userModel');
const votesCounterModel = require('../models/votesCounterModel');
const auth = require('../config/auth');


controller.registerVote = async (req, res) => {


    if (!req.body.cedula || !req.body.table || !req.body.votingBooth || !req.body.votersData || !req.body.img) return res.sendStatus(400)
    const witness = await witnessModel.findOne({ cedula: req.body.cedula })
    try {
        if (witness) {

            if (!witness?.isCoordinator && (witness.tableInCharge !== req.body.table || witness.votingBoothInCharge !== req.body.votingBooth)) {
                return res.status(400).json({ message: "Error, the table or place not match" })
            }

            const duplicate = await votesModel.findOne({ table: req.body.table, votingBooth: req.body.votingBooth })

            const voteInfo = {
                witnessId: witness._id,
                table: req.body.table,
                votingBooth: req.body.votingBooth,
                votersData: req.body.votersData,
                img: req.body.img,
                status: "PENDIENTE",
            }

            if (duplicate) {
                await votesModel.updateOne({ table: req.body.table, votingBooth: req.body.votingBooth }, voteInfo)
            } else {
                await votesModel.create(voteInfo)
            }
            return res.status(201).json({ message: "vote add successfully!" })
        } else {
            return res.status(208).json({ message: "Error, User not exist" })
        }
    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error })
    }
}


controller.validateWitness = async (req, res) => {
    if (!req.body.cedula) return res.sendStatus(400)
    const witness = await witnessModel.findOne({ cedula: req.body.cedula })
    try {
        if (witness) {
            return res.status(200).json({ message: "The user is valid", isValid: true })
        } else {
            return res.status(208).json({ message: "Error, User not exist", isValid: false })
        }

    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error })
    }
}

function countStatusTypes(array) {
    // Define an initial object to store the counts
    const statusCounts = {
        APROBADO: 0,
        PENDIENTE: 0,
        RECHAZADA: 0
    };

    // Use the reduce method to count status types
    array.reduce((accumulator, item) => {
        if (item.status in statusCounts) {
            accumulator[item.status]++;
        }
        return accumulator;
    }, statusCounts);

    return statusCounts;
}

function countVotes(array) {
    let generalTotal = 0;
    let totalVotes = 0;
    let nullVotes = 0;
    let whiteVotes = 0;
    let unmarkedVotes = 0;

    array.map(register => {
        if (register.votersData) {
            for (const [key, value] of Object.entries(register.votersData)) {
                if (value?.isPrincipal === true && register.status === "APROBADO") totalVotes += Number(value.votes) || 0;
                if (value?.votes) generalTotal += Number(value.votes) || 0;
                if (key === "nullVotes") nullVotes += Number(value) || 0;
                if (key === "whiteVotes") whiteVotes += Number(value) || 0;
                if (key === "unmarkedVotes") unmarkedVotes += Number(value) || 0;
            }
        }
    })
    return {
        totalVotes: totalVotes,
        nullVotes: nullVotes,
        whiteVotes: whiteVotes,
        unmarkedVotes: unmarkedVotes,
        generalTotal: generalTotal + nullVotes + whiteVotes + unmarkedVotes
    };
    // }
}

function totalVotesByCandidate(array) {
    const voteCounts = [];

    array.forEach(obj => {
        const votersData = obj.votersData;
        for (const key in votersData) {
            if (votersData.hasOwnProperty(key) && !isNaN(parseInt(key))) {
                const index = votersData[key].index;
                const votes = parseInt(votersData[key].votes);
                const name = votersData[key].name;
                const existingEntry = voteCounts.find(entry => entry.index === index);

                if (existingEntry) {
                    existingEntry.votes += votes;
                } else {
                    voteCounts.push({ index, name, votes });
                }
            }
        }
    });

    return voteCounts;
}

function countPartialVotes(array) {
    let votesAt12 = 0;
    let votesAt4 = 0;

    array.map(register => {
        votesAt12 += Number(register?.votesAt12) || 0;
        votesAt4 += Number(register?.votesAt4) || 0;
    })
    return {
        votesAt12: votesAt12,
        votesAt4: votesAt4,
    }
}

function countGeneralStatus(array, parcialCount) {
    const conutGeneralVotes = countVotes(array);
    const total = totalVotesByCandidate(array);
    const partialVotes = countPartialVotes(parcialCount);

    const data = {
        nullVotes: conutGeneralVotes.nullVotes,
        whiteVotes: conutGeneralVotes.whiteVotes,
        unmarkedVotes: conutGeneralVotes.unmarkedVotes,
        totalTables: array.length,
        totalVotes: conutGeneralVotes.generalTotal,
        VotesByCandidate: total,
        partialVotesAt12: partialVotes.votesAt12,
        partialVotesAt4: partialVotes.votesAt4
    }
    return data
}

//get all pending and decline votes
controller.getVotes = async (req, res) => {
    if (!req.body.status) return res.sendStatus(400); //["APROBADO","PENDIENTE","RECHAZADA"]
    try {

        const votes = await votesModel.find({}, '-img') //, '-img'
            .populate("witnessId")
            .exec()

        const votesFilter = await votesModel.find({ status: { $in: req.body.status } }) //, '-img'
            .populate("witnessId")
            .exec()

        if (votes && votesFilter) {
            const countStatus = countStatusTypes(votes);
            const countPrincipal = countVotes(votes);
            return res.status(200).json({ votes: votesFilter, countStatus: countStatus, totalvotesPrincipal: countPrincipal.totalVotes, totalNullVotes: countPrincipal.nullVotes, totalWhiteVotes: countPrincipal.whiteVotes, totalUnmarkedVotes: countPrincipal.unmarkedVotes });
        }
    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error });
    }
}

controller.getGeneralStatus = async (req, res) => {

    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (user.role === "VOTER" || user.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    try {

        const votes = await votesModel.find({}, '-img')
            .populate("witnessId")
            .exec()
        const countPartialVotes = await votesCounterModel.find()


        if (votes && countPartialVotes) {
            const countGeneral = countGeneralStatus(votes, countPartialVotes);
            return res.status(200).json(countGeneral);
        }
    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error });
    }
}


//update status
controller.updateVoteStatus = async (req, res) => {

    const { newStatus, voteId } = req.body;

    if (!newStatus || !voteId) return res.sendStatus(400);
    try {
        const updatedVote = await votesModel.findByIdAndUpdate(voteId, { status: newStatus }, { new: true }).exec();
        if (!updatedVote) {
            return res.status(404).json({ error: 'Vote not found' });
        }
        res.status(200).json({ message: "vote update successfully" });
    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error });
    }
}


controller.registerPartialCount = async (req, res) => {
    if (!req.body.cedula || !req.body.table || !req.body.votingBooth) return res.sendStatus(400)
    const witness = await witnessModel.findOne({ cedula: req.body.cedula })
    try {
        if (witness) {

            if (!witness?.isCoordinator && (witness.tableInCharge !== req.body.table || witness.votingBoothInCharge !== req.body.votingBooth)) {
                return res.status(400).json({ message: "Error, the table or place not match" })
            }

            //manage duplicity
            const duplicate = await votesCounterModel.findOne({ table: req.body.table, votingBooth: req.body.votingBooth })

            const voteInfo = {
                witnessId: witness._id,
                table: req.body.table,
                votingBooth: req.body.votingBooth,
                votesAt12: req.body.votesAt12 !== "" ? req.body.votesAt12 : duplicate.votesAt12,
                votesAt4: req.body.votesAt4 !== "" ? req.body.votesAt4 : duplicate?.votesAt4 ? duplicate?.votesAt4 : 0
            }

            if (duplicate) {
                await votesCounterModel.updateOne({ table: req.body.table, votingBooth: req.body.votingBooth }, voteInfo)
            } else {
                await votesCounterModel.create(voteInfo)
            }

            return res.status(201).json({ message: "vote add successfully!" })
        } else {
            return res.status(208).json({ message: "Error, User not exist" })
        }
    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error })
    }
}


module.exports = controller;