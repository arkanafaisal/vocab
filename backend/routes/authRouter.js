import express from 'express';
import authController from '../controller/auth.js';

const authRouter = express.Router();
authRouter.use('/', (req, res, next) => {
    console.log('auth endpoint hit');
    next();
});
    
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.post('/refresh', authController.refreshToken)
    
export default authRouter
