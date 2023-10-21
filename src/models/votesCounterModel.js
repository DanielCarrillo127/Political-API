const mongoose = require('mongoose');

const ObjectId=mongoose.Schema.Types.ObjectId

const votesCounterSchema=new mongoose.Schema({
    witnessId: {type: ObjectId,ref: "Witness",required: true},
    table:{type: String,required:true},
    votingBooth:{type: String,required:true},
    votesAt12:{type: String},
    votesAt4:{type: String},
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
const votesCounter = mongoose.model("votesCounter",votesCounterSchema)
module.exports=votesCounter