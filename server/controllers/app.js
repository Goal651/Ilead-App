const { Admin, RoundTable2, RoundTable3, RoundTable1, Facilitator } = require('../models/models');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { type } = require('os');
const clients = [];

const getRoundTableClass = (className) => {
    if (className.toUpperCase() === 'Y1') {
        return RoundTable1
    } else if (className.toUpperCase() === 'Y2') {
        return RoundTable2
    } else {
        return RoundTable3
    }
}
const broadcast = (data) => {
    clients.forEach(client => client.write(`data: ${JSON.stringify(data)}\n\n`));
};

const handleEvents = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    clients.push(res);

    res.write(`data: ${JSON.stringify({ message: 'Connected to SSE' })}\n\n`);
    req.on('close', () => {
        clients.splice(clients.indexOf(res), 1);
    });
};

const registerRoundTable = async (req, res) => {
    try {
        const { roundtable, facilitator, className } = req.body;
        if (!roundtable || !facilitator || !className) return res.status(400).json({ message: 'Missing required fields' })
        const roundTableClass = getRoundTableClass(className);
        const roundTable = new roundTableClass({
            name: roundtable,
            facilitator
        });
        await roundTable.save();
        res.status(200).json({ roundTableName: roundTable.name, className });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


const addMembers = async (req, res) => {
    const { members, roundTableName, facilitator } = req.body;
    try {
        let roundTable = await RoundTable3.findOne({ name: roundTableName });
        if (!roundTable) {
            roundTable = new RoundTable3({ name: roundTableName, facilitator, members: [] });
            await roundTable.save();
        }
        for (const member of members) {
            const { name } = member;
            const existingMember = roundTable.members.find(m => m.name === name);
            if (!existingMember) roundTable.members.push({ name, attendance: [] });
        }
        const savedRoundTable = await roundTable.save();
        res.status(200).json({ message: 'Members added successfully', savedRoundTable });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getMembers = async (req, res) => {
    const { roundTableName, className } = req.params;
    let allowedToEdit = false;
    try {
        const roundTableClass = getRoundTableClass(className);
        const roundTable = await roundTableClass.findOne(
            { name: { $regex: `^${roundTableName}$`, $options: 'i' } }
        );
        if (!roundTable) return res.status(404).json({ message: 404 });
        const members = roundTable.members
        res.status(200).json({ members, allowedToEdit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const getMembersAndAttendance = async (req, res) => {
    const { roundTableName, className } = req.params;
    try {
        const roundTableClass = getRoundTableClass(className);
        const roundTable = await roundTableClass.findOne(
            { name: roundTableName },
        );
        if (!roundTable) return res.status(404).json({ message: 'Round Table not found' });
        res.status(200).json({ members: roundTable.members, allowedToEdit: roundTable.allowedToEdit, roundTableName, className });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const handleAttendance = async (req, res) => {
    const { roundTableName, attendanceData, className } = req.body;
    console.log(req.body)
    try {
        const roundTableClass = getRoundTableClass(className);
        const roundTable = await roundTableClass.findOne(
            { name: roundTableName },
        );
        if (!roundTable) return res.status(404).json({ message: 'Round Table not found' })
        attendanceData.forEach(({ memberId, date, status, reason }) => {
            const member = roundTable.members.id(memberId);
            if (member) {
                member.attendance.push({ date, status, reason });
            }
        });
        await roundTable.save();
        return res.status(200).json({ message: 'Attendance updated successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const getOverview = async (req, res) => {
    try {
        const result = await Admin.findOne()
        const [result1, result2, result3] = await Promise.all([
            RoundTable1.find(),
            RoundTable2.find(),
            RoundTable3.find()
        ]);
        const Y1 = result1.map(result => {
            return { ...result._doc, class: "Y1" }
        })

        const Y2 = result2.map(result => {
            return { ...result._doc, class: "Y2" }
        })

        const Y3 = result3.map(result => {
            return { ...result._doc, class: "Y3" }
        })

        const combinedResults = [...Y1, ...Y2, ...Y3];
        const attendanceMode = result.attendanceMode
        res.status(200).json({ roundTables: combinedResults, attendanceMode });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching overview' });
    }
};



const Login = async (req, res) => {
    try {
        const names = req.body.names.toLowerCase().trim() || '';
        const password = req.body.password || ''
        if (!names || !password) return res.status(400).json({ message: 'Enter full name and password' })
        const facilitator = await Facilitator
            .findOne({ names })
            .populate('roundTable')
            .exec();

        const admin = await Admin.findOne({ names })
        if (!facilitator && !admin) return res.status(404).json({ message: 'Facilitator not found' })
        const passwordToBeUsed = admin ? admin.password : facilitator.password
        const isRealPassword = await bcrypt.compare(password, passwordToBeUsed)
        if (!isRealPassword) return res.status(400).json({ message: 'Invalid password' })
        const token = jwt.sign({ id: facilitator?._id || admin?._id }, process.env.JWT_SECRET, { expiresIn: '1d' })
        const response = {
            token,
            role: admin ? 'admin' : 'facilitator',
            roundTableName: facilitator?.roundTable?.name,
            className: facilitator?.roundTableModel
        }
        res.status(200).json(response)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal server error' })
    }
};

const changeAdminPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await Admin.findById(req.userId);
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const checkRoundTable = async (req, res) => {
    try {
        const { roundTableName, className } = req.params
        if (!roundTableName || !className) return res.sendStatus(400)
        const roundTableClass = getRoundTableClass(className);
        const result = await roundTableClass.findOne(
            { name: { $regex: `^${roundTableName}$`, $options: 'i' } }
        )
        if (!result) return res.status(404).json({ message: 'Round Table not found' })
        res.status(200).json({ message: result })
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}




const findRoundTable = async (req, res) => {
    try {
        const roundTableName = req.params.roundTableName
        if (!roundTableName) return res.sendStatus(404)
        res.status(200).json({ message: 'Round table found' })
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

const toggleAttendance = async (req, res) => {
    try {
        const { attendanceMode } = req.body
        console.log(typeof attendanceMode)
        if (typeof attendanceMode !== 'boolean' || attendanceMode === undefined || attendanceMode === null || attendanceMode === empt) return res.status(400).json({ message: 'Bad request' })
        await Admin.updateMany({}, { attendanceMode: attendanceMode });
        const [y1RoundTables, y2RoundTables, y3RoundTables] = await Promise.all([
            RoundTable1.find(),
            RoundTable2.find(),
            RoundTable3.find()
        ]);

        const allRoundTables = [...y1RoundTables, ...y2RoundTables, ...y3RoundTables];

        for (const roundTable of allRoundTables) {
            if (attendanceMode) roundTable.allowedToEdit = true;
            else roundTable.allowedToEdit = false
            await roundTable.save();
        }
        broadcast({ message: attendanceMode, forAll: true });
        res.status(200).json({ message: 'allowedToEdit set to true for all roundtables' });
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal server error' + error });
    }
}

const toggleAttendanceForRoundTable = async (req, res) => {
    try {
        const { className, roundTableName, allowedToEdit } = req.body
        const roundTableClass = getRoundTableClass(className);
        const roundTable = await roundTableClass.findOne({ name: roundTableName });
        if (!roundTable) return res.status(404).json({ message: 'Round Table not found' });
        roundTable.allowedToEdit = !allowedToEdit;
        await roundTable.save();
        broadcast({ roundTableName, className, message: !allowedToEdit, forAll: false })
        res.status(200).json(!allowedToEdit);
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal server error', error });
    }
}

// Function to get the correct roundTable model based on the collection name
const getRoundTableModel = (roundTableType) => {
    let roundTable;
    switch (roundTableType) {
        case 'y1':
            roundTable = RoundTable1;
            break;
        case 'y2':
            roundTable = RoundTable2;
            break;
        case 'y3':
            roundTable = RoundTable3;
            break;
        default:
            throw new Error('Invalid roundTable type');
    }
    return roundTable;
};


const createFacilitators = async () => {
    try {
        const collectionNames = ['y1', 'y2', 'y3']; // Add your collection names here

        const defaultPassword = await bcrypt.hash('1234', 10);

        for (const collectionName of collectionNames) {
            const RoundTableModel = getRoundTableModel(collectionName); // Dynamically get the model

            const roundTables = await RoundTableModel.find();

            for (const table of roundTables) {
                const { facilitator } = table;
                const names = facilitator.toLowerCase().trim();

                const newFacilitator = new Facilitator({
                    roundTable: table._id,
                    roundTableModel: collectionName, // Specify the collection
                    names,
                    password: defaultPassword,
                    className: collectionName
                });

                await newFacilitator.save();
                console.log(`Facilitator ${names} created successfully for RoundTable ${collectionName}.`);
            }
        }
        console.log('\nFacilitator creation process completed.');
    } catch (error) {
        console.error('Error creating facilitators:', error);
    }
};

const getFacilitatorWithRoundTable = async (req, res) => {
    try {
        const { name } = req.body
        const facilitator = await Facilitator.findOne({ names: name })
            .populate('roundTable')
            .exec();
        res.status(200).json(facilitator);
    } catch (err) {
        console.error('Error fetching facilitator with round table:', err);
        return null;
    }
};

module.exports = {
    addMembers,
    getMembersAndAttendance,
    getMembers,
    handleAttendance,
    getOverview,
    Login,
    changeAdminPassword,
    checkRoundTable,
    findRoundTable,
    toggleAttendance,
    toggleAttendanceForRoundTable,
    handleEvents,
    registerRoundTable,
    createFacilitators,
    getFacilitatorWithRoundTable
};
