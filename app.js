const express = require('express'),
    mysql = require('mysql'),
    crypto = require('crypto'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    app = express(),
    port = 3000,
    server = app.listen(port),
    io = require('socket.io')(server),
    connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database : 'chat'
    });

let onlineUsers = {};

app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'MySuperSecretKey12345',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

function authenticationMiddleware () {
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            return next()
        }
        res.send(401);
    }
}

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        connection.query(
            'SELECT * FROM `users` WHERE `username`=? AND `password`=? LIMIT 1',
            [username, crypto.createHash('md5').update(password).digest("hex")],
            (error, results) => {
                if (error) throw error;
                if (results.length) { // Username and password matched
                    return done(null, { username });
                } else {
                    connection.query(
                        'SELECT * FROM `users` WHERE `username`=? LIMIT 1',
                        [username],
                        (error, results) => {
                            if (error) throw error;
                            if (results.length) { // Password incorrect
                                return done(null, false);
                            } else { // Register new user
                                connection.query(
                                    'INSERT INTO `users` SET ?',
                                    {
                                        username,
                                        password: crypto.createHash('md5').update(password).digest("hex")
                                    },
                                    (error, results) => {
                                        if (error) throw error;
                                        return done(null, { username });
                                });
                            }
                    });
                }
        });
    }
));

io.on('connection', (socket) => {
    socket.on('message', (text) => {
        const time = Date.now(),
            username = onlineUsers[socket.id];

        // Send message to users
        io.sockets.emit('messages', {
            time,
            username,
            text
        });

        // Insert message into DB
        connection.query(
            'INSERT INTO `messages`(`user_id`, `text`, `time`)' +
            '   VALUES ((SELECT id FROM `users` WHERE `username` = ? LIMIT 1), ?, ?)',
            [username, text, time],
            () => { });
    });

    socket.on('add-user', (user) => {
        onlineUsers[socket.id] = user;
        io.sockets.emit('users-list', Object.values(onlineUsers));
    });

    socket.on('disconnect', () => {
        delete onlineUsers[socket.id];
        io.sockets.emit('users-list', Object.values(onlineUsers));
    });
});

app.post('/api/login', passport.authenticate('local'), (req, res) => {
    res.json({ success: true });
});

app.get('/api/isAuthorized', (req, res) => {
    res.json({ authorized: !!req.user });
});

app.get('/api/getOldMessages', authenticationMiddleware(), (req, res) => {
    connection.query(
        'SELECT `users`.`username`,' +
            '   `messages`.`text`,' +
            '   `messages`.`time`' +
            'FROM `messages`' +
            '   LEFT JOIN `users`' +
            '   ON `messages`.`user_id` = `users`.`id`' +
            '   ORDER BY `time` DESC' +
            '   LIMIT 0, 20', // Max 20 messages on screen
        (error, results) => {
        if (error) throw error;
        res.json(results);
    });
});

console.log(`Listening on http://localhost:${port}`);
