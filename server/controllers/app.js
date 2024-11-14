const { Admin, RoundTable2, RoundTable3, RoundTable1, Attendance } = require('../models/models'); // Adjust the import path accordingly
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
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
    const { roundTableName,className } = req.params;
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
            { collation: { locale: 'en', strength: 2 } }
        );
        if (!roundTable) return res.status(404).json({ message: 'Round Table not found' });
        const membersWithAttendance = roundTable.members
        res.status(200).json({ members: membersWithAttendance, allowedToEdit: roundTable.allowedToEdit, roundTableName, className });
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
            { collation: { locale: 'en', strength: 2 } }
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
        const { data } = req.body
        // Fetch all roundtables from Y1, Y2, and Y3
        await Admin.updateOne({ email: 'test1@gmail.com' }, { attendanceMode: data })
        const [y1RoundTables, y2RoundTables, y3RoundTables] = await Promise.all([
            RoundTable1.find(),
            RoundTable2.find(),
            RoundTable3.find()
        ]);

        const allRoundTables = [...y1RoundTables, ...y2RoundTables, ...y3RoundTables];

        for (const roundTable of allRoundTables) {
            if (data) roundTable.allowedToEdit = true;
            else roundTable.allowedToEdit = false
            await roundTable.save();
        }
        broadcast({ message: data, forAll: true });
        res.status(200).json({ message: 'allowedToEdit set to true for all roundtables' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
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
};
