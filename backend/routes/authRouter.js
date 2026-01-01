import express from 'express';
import authController from '../controller/auth.js';
import rateLimiting from '../middleware/rateLimiting.js';

const authRouter = express.Router();
// authRouter.use('/', (req, res, next) => {
//     console.log('auth endpoint hit');
//     next();
// });
    
authRouter.post('/register',    rateLimiting('register', 10, 20),        authController.register);
authRouter.post('/login',       rateLimiting('login', 5, 20),            authController.login);
authRouter.delete('/logout',    rateLimiting('logout', 1, 15),          authController.logout);
authRouter.post('/refresh',     rateLimiting('refreshToken', 1, 30),    authController.refreshToken)
    
export default authRouter
