db.users.findOne({ "instagram.connected": true }, { instagram: 1, email: 1 })
