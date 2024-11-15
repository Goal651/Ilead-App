const express = require('express')
const router = express.Router();
const controller = require('../controllers/app')


router.get('/events', controller.handleEvents)
router.get('/', controller.createFacilitators)
router.get('/api/checkRoundTable/:roundTableName/:className', controller.checkRoundTable)
router.get('/api/members/:roundTableName/:className', controller.getMembers)
router.get('/api/membersAndAttendance/:roundTableName/:className', controller.getMembersAndAttendance)
router.get('/api/overview', controller.getOverview)
router.get('/api/findRoundTable/:roundTableName', controller.findRoundTable)


router.post('/api/addMembers', controller.addMembers)
router.post('/api/handle-attendance', controller.handleAttendance)
router.post('/api/login', controller.Login)
router.post('/api/changeAdminPassword', controller.changeAdminPassword)
router.post('/api/toggleAttendance', controller.toggleAttendance)
router.post('/api/toggleAttendanceForRoundTable', controller.toggleAttendanceForRoundTable)
router.post('/api/registerRoundTable', controller.registerRoundTable)
router.post('/api/checkUser',
    (req, res) => {
        res.status(200).json({ message: 'User exists' })
    }
)

router.get('*', (req, res) => res.sendStatus(404))


module.exports = router;