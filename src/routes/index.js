const signupRouter = require('./SignUp');
const loginRouter = require('./Login');
const userRouter = require('./User');
const fileRouter = require('./File');

function route(app) {
    app.use('/create-user', signupRouter);
    app.use('/auth', loginRouter);
    app.use('/api', userRouter )
    app.use('/user-file', fileRouter )
}

module.exports = route;