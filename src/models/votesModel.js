const mongoose = require('mongoose');

const ObjectId=mongoose.Schema.Types.ObjectId
const statusTypes=["APROBADO","PENDIENTE","RECHAZADA"]

const votesSchema=new mongoose.Schema({
    witnessId: {type: ObjectId,ref: "Witness",required: true},
    table:{type: String,required:true},
    votingBooth:{type: String,required:true},
    votersData: {type: Object,required: true},
	img: {type: String,required: true},
	status: {type: String,enum:statusTypes},
},{
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
		toObject: {
        virtuals: true,
        getters: true,
    },
    toJSON: {
        virtuals: true,
        getters: true,
    }
})
const Votes=mongoose.model("Votes",votesSchema)
module.exports=Votes