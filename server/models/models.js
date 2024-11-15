const mongoose = require('mongoose');

const roundTableSchema = new mongoose.Schema({
    name: { type: String, required: true },
    facilitator: {
        type: String,
        required: true
    },
    members: [
        {
            name: { type: String, required: true },
            attendance: [
                {
                    date: { type: Date, required: true },
                    status: { type: Boolean, required: true },
                    reason: { type: String, default: "" }
                }
            ]
        }
    ],
    attendanceDate: { type: Date, default: Date.now },
    allowedToEdit: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

const attendanceSchema = mongoose.Schema({
    enabledForSpecificTable: { type: String, default: '' },
    enabledForAll: { type: Boolean, default: false },
})

const adminSchema = new mongoose.Schema({
    names: { type: String, required: true },
    password: { type: String, required: true },
    attendanceMode: { type: Boolean, default: false }
})

const facilitatorSchema = new mongoose.Schema({
    names: { type: String, required: true },
    password: { type: String, required: true },
})




const RoundTable1 = mongoose.model('y1', roundTableSchema);
const RoundTable2 = mongoose.model('y2', roundTableSchema);
const RoundTable3 = mongoose.model('y3', roundTableSchema);
const Facilitator = mongoose.model('facilitator', facilitatorSchema);
const Admin = mongoose.model('admin', adminSchema);
const Attendance = mongoose.model('attendance', attendanceSchema)
module.exports = { RoundTable1, RoundTable2, RoundTable3, Admin, Attendance, Facilitator };
