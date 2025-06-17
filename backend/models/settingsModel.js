const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    notifications: {
        type: Boolean,
        default: true
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    }
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;