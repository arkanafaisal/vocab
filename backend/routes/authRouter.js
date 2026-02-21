import express from 'express';

import rateLimiting from '../middleware/rateLimiting.js';

import authController from '../controller/auth-controller.js';

const authRouter = express.Router()
    
authRouter.post('/register',    rateLimiting('register', 10, 15),        authController.register);
authRouter.post('/login',       rateLimiting('login', 2, 10),            authController.login);
authRouter.delete('/logout',    rateLimiting('logout', 1, 15),          authController.logout);
authRouter.post('/refresh',     rateLimiting('refreshToken', 1, 30),    authController.refreshToken)
    
export default authRouter
