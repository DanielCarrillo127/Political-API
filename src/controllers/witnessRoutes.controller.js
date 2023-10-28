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
            } else if (witness?.isCoordinator && (witness.votingBoothInCharge !== req.body.votingBooth)) {
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
                if (value?.isPrincipal === true && register.status === "APROBADO") totalVotes += Number(value?.votes) || 0;
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
        votesByCandidate: total,
        partialVotesAt12: partialVotes.votesAt12,
        partialVotesAt4: partialVotes.votesAt4
    }
    return data
}

const options = {

    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    // timeZoneName: 'short',

}
function complianceReport(votes, countPartialVotes, witness) {
    const result = [];
    witness.forEach(witness => {
        const voteRegister = votes.filter(vote => vote.witnessId.toString() === witness._id.toString())
        if (voteRegister.length > 1) {
            voteRegister.map(voteRegister => {
                const parcialCountRegister = countPartialVotes.find(item => (item.witnessId.toString() === voteRegister.witnessId.toString() && item.table === voteRegister.table && item.votingBooth === voteRegister.votingBooth))
                const register = {
                    Nombre_testigo: witness?.name + " " + witness?.surnames,
                    Telefono: witness?.phoneNumber,
                    Cedula: witness?.cedula,
                    Puesto_votacion: voteRegister?.votingBooth,
                    Mesa: voteRegister?.table,
                    Es_coordinador: witness?.isCoordinator ? "Si" : "No",
                    Envio_Resgistro_12pm: parcialCountRegister?.votesAt12 && (parcialCountRegister?.votesAt12 !== 0 || parcialCountRegister?.votesAt12 !== undefined || parcialCountRegister?.votesAt12 !== "") ? "Si" : "No",
                    Envio_Resgistro_4pm: parcialCountRegister?.votesAt4 && (parcialCountRegister?.votesAt4 !== 0 || parcialCountRegister?.votesAt4 !== undefined || parcialCountRegister?.votesAt4 !== "") ? "Si" : "No",
                    Envio_Resgistro_E14: voteRegister ? `Si, Estado: ${voteRegister.status}` : "No",
                    Fecha_envio_Resgistro_E14: voteRegister ? new Date(voteRegister.updated_at).toLocaleString(undefined, options) : "",
                }
                result.push(register)
            })
        } else {
            const parcialCountRegister = countPartialVotes.find(item => (item.witnessId.toString() === witness._id.toString() && item.table === witness.tableInCharge && item.votingBooth === witness.votingBoothInCharge))
            const register = {
                Nombre_testigo: witness?.name + " " + witness?.surnames,
                Telefono: witness?.phoneNumber,
                Cedula: witness?.cedula,
                Puesto_votacion: witness?.votingBoothInCharge,
                Mesa: witness?.tableInCharge,
                Es_coordinador: witness?.isCoordinator ? "Si" : "No",
                Envio_Resgistro_12pm: parcialCountRegister?.votesAt12 && (parcialCountRegister?.votesAt12 !== 0 || parcialCountRegister?.votesAt12 !== undefined || parcialCountRegister?.votesAt12 !== "") ? "Si" : "No",
                Envio_Resgistro_4pm: parcialCountRegister?.votesAt4 && (parcialCountRegister?.votesAt4 !== 0 || parcialCountRegister?.votesAt4 !== undefined || parcialCountRegister?.votesAt4 !== "") ? "Si" : "No",
                Envio_Resgistro_E14: voteRegister[0] ? `Si, Estado: ${voteRegister[0].status}` : "No",
                Fecha_envio_Resgistro_E14: voteRegister[0] ? new Date(voteRegister[0].updated_at).toLocaleString(undefined, options) : "",
            }
            result.push(register)
        }
        const parcialCountRegister = countPartialVotes.filter(item => (item.witnessId.toString() === witness._id.toString()))
        if (parcialCountRegister.length > 1) {
            parcialCountRegister.map(countRegister => {
                if (!result.find(item => item.Mesa === countRegister.table && item.Cedula === witness.cedula)) {
                    const register = {
                        Nombre_testigo: witness?.name + " " + witness?.surnames,
                        Telefono: witness?.phoneNumber,
                        Cedula: witness?.cedula,
                        Puesto_votacion: countRegister?.votingBooth,
                        Mesa: countRegister?.table,
                        Es_coordinador: witness?.isCoordinator ? "Si" : "No",
                        Envio_Resgistro_12pm: countRegister?.votesAt12 && (countRegister?.votesAt12 !== 0 || countRegister?.votesAt12 !== undefined || countRegister?.votesAt12 !== "") ? "Si" : "No",
                        Envio_Resgistro_4pm: countRegister?.votesAt4 && (countRegister?.votesAt4 !== 0 || countRegister?.votesAt4 !== undefined || countRegister?.votesAt4 !== "") ? "Si" : "No",
                        Envio_Resgistro_E14: "No",
                        Fecha_envio_Resgistro_E14: "",
                    }
                    result.push(register)
                }
            })
        }
    })
    return result
}

function missingTablesReport(votes, witnesses, votingBooths) {
    const result = [];
    votingBooths.forEach(votingBooth => {
        for (let index = 1; index <= votingBooth.mesas; index++) {
            const voteRegister = votes.find((vote) => vote.votingBooth === votingBooth.puesto && vote.table === index.toString())

            const witnessRegister = witnesses.find((witness) => witness.votingBoothInCharge === votingBooth.puesto && witness.tableInCharge === index.toString())

            if (!voteRegister) {
                const register = {
                    Puesto_votacion: votingBooth.puesto,
                    Mesa_Faltante: index,
                    Testigo_reponsable: witnessRegister ? witnessRegister.name + " " + witnessRegister.surnames : "Sin testigo asignado",
                    Cedula: witnessRegister ? witnessRegister.cedula : " ",
                    Telefono: witnessRegister ? witnessRegister.phoneNumber : " ",
                }
                result.push(register)
            }

        }
    })
    return result
}

function votesPerCandidatePerRegister(votersData) {
    const voteCounts = [];
    //votos por candidato
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
    return voteCounts
}

function generalReport(votes) {
    const result = [];
    votes.forEach(vote => {
        const witness = vote.witnessId
        //votos por candidato
        const counterPerCandidates = votesPerCandidatePerRegister(vote.votersData)
        const resultDistinct = counterPerCandidates.reduce((acc, item) => {
            acc.totalVotes += item.votes;
            acc.votesByCandidate[item.name] = item.votes.toString();
            return acc;
        }, { totalVotes: 0, votesByCandidate: {} });

        const register = {
            Puesto_votacion: vote.votingBooth,
            Mesa_votacion: vote.table,
            Testigo_reponsable: witness?.name + " " + witness?.surnames,
            Cedula: witness?.cedula,
            Telefono: witness?.phoneNumber,
            ...resultDistinct.votesByCandidate,
            Votos_nulos: vote.votersData?.nullVotes,
            Votos_en_blancos: vote.votersData?.whiteVotes,
            Votos_no_marcados: vote.votersData?.unmarkedVotes,
            Total: (resultDistinct.totalVotes + Number(vote.votersData?.nullVotes) + Number(vote.votersData?.whiteVotes) + Number(vote.votersData?.unmarkedVotes)).toString(),
            Estado: vote.status,
            Url_evidencia: vote.img
        }
        result.push(register)
    })
    return result
}

//reports
controller.getComplianceReport = async (req, res) => {
    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (user?.role === "VOTER" || user?.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    try {
        const witness = await witnessModel.find()
        const votes = await votesModel.find()
            .exec()
        const countPartialVotes = await votesCounterModel.find()


        if (votes && countPartialVotes && witness) {
            const compliance = complianceReport(votes, countPartialVotes, witness);
            return res.status(200).json(compliance);
        }
    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error });
    }
}

controller.getMissingTablesReport = async (req, res) => {
    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (user?.role === "VOTER" || user?.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    if (!req.body.votingBooth) return res.sendStatus(400);

    try {
        const witness = await witnessModel.find()
        const votes = await votesModel.find()
            // .populate("witnessId")
            .exec()

        if (votes && witness) {
            const compliance = missingTablesReport(votes, witness, req.body.votingBooth);
            return res.status(200).json(compliance);
        }
    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error });
    }
}
controller.getGeneralReport = async (req, res) => {
    const user = await userModel.findOne({ cedula: req.body.userCedula })
    if (user?.role === "VOTER" || user?.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    try {
        const votes = await votesModel.find()
            .populate("witnessId")
            .exec()

        if (votes) {
            const compliance = generalReport(votes);
            return res.status(200).json(compliance);
        }
    } catch (error) {
        return res.status(500).json({ data: "Server internal error", error: error });
    }
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
    if (user?.role === "VOTER" || user?.role === "LEADER") { return res.status(403).send({ message: 'Action not allowed' }) }
    if (!await auth.verifyToken(req, res)) { return res.sendStatus(401) }

    try {

        const votes = await votesModel.find({ status: { $in: ["APROBADO"] } }, '-img')
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
                // votesAt12: req.body.votesAt12 !== "" ? req.body.votesAt12 : duplicate?.votesAt12 ? duplicate?.votesAt12 : null,
                // votesAt4: req.body.votesAt4 !== "" ? req.body.votesAt4 : duplicate?.votesAt4 ? duplicate?.votesAt4 : null
            }

            if (req.body?.votesAt12 !== "") {
                voteInfo['votesAt12'] = req.body.votesAt12
            } else if (duplicate?.votesAt12) {
                voteInfo['votesAt12'] = duplicate?.votesAt12
            }

            if (req.body?.votesAt4 !== "") {
                voteInfo['votesAt4'] = req.body.votesAt4
            } else if (duplicate?.votesAt4) {
                voteInfo['votesAt4'] = duplicate?.votesAt4
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