import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
}})

const root = process.env.NODE_ENV === "development"? "http://localhost:3000" : "https://vocab.arkanafaisal.my.id"

export const sendMail = {
    verifyEmail: async ({newEmail, token}) => {
        const link = `${root}/#verify-email?token=${token}`
        await transporter.sendMail({
            from: 'vocab <no-reply@arkanafaisal.my.id>',
            to: newEmail,
            subject: 'Verify your email',
            text: `Verify email:\n${link}`,
            html: `<p>Click to verify:</p><a href="${link}">Verify Email</a>`
        })
    },
    resetPassword: async ({email, token}) => {
        const link = `${root}/#reset-password?token=${token}`
        await transporter.sendMail({
            from: 'vocab <no-reply@arkanafaisal.my.id>',
            to: email,
            subject: 'Reset your password',
            text: `reset password:\n${link}`,
            html: `<p>Click to reset password:</p><a href="${link}">Reset Password</a>`
        })
    }
}

        