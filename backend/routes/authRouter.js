import express from 'express';
import authController from '../controller/auth.js';
import rateLimiting from '../middleware/rateLimiting.js';

const authRouter = express.Router();
// authRouter.use('/', (req, res, next) => {
//     console.log('auth endpoint hit');
//     next();
// });
console.log('rateLimiting type:', typeof rateLimiting)
    
authRouter.post('/register',    rateLimiting('register', 15, 3),        authController.register);
authRouter.post('/login',       rateLimiting('login', 1, 5),            authController.login);
authRouter.delete('/logout',    rateLimiting('logout', 1, 5),          authController.logout);
authRouter.post('/refresh',     rateLimiting('refreshToken', 10, 3),    authController.refreshToken)
    
export default authRouter
