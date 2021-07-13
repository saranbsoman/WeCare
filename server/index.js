// @author => Saran B Soman

const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const db = require('./db/db')
const jwt = require('jsonwebtoken')
const registerValidate = require('./validation/validate')
// const localStorage = require('node-localstorage')


const app = express()
app.use(cookieParser())



//mysql connection
db.connect((error) => {
    if(error) {
        console.log('Database not connected!!')
    } else {
        console.log('Database connected...')
    }
})

// app.use(cookieParser())
app.use(cors())
app.use(express.json())


//home page
app.get('/', (req, res) => {
    res.send('Hai Home page')
})

//patient registration
app.post('/patientinsert', (req, res) => {
    console.log('insertion...')
    const { error } = registerValidate.validate(req.body)
    if(error) {
        const msg = error.details[0].message
        return res.send({ message: msg })
    }
    const { name, email, password } = req.body
    console.log(name, email, password)
    const sqlInsert = 'INSERT INTO patient SET ?'
    db.query(sqlInsert, {name, email, password, status: 'offline'}, (error, results) => {
        if (error) res.send(error)
        else {
            if(results) res.send({ message : 'successfully registered', register: true })
            else res.send({ message: 'Registration failed', register: false })
        }
    })
})

//patient login
app.post('/patientlogin', async(req, res) => {
    console.log('login...')
    const { email, password, token } = req.body
    console.log( email, password)
    
    const sqlLogin = 'SELECT * FROM `patient` WHERE email = ? AND password = ?'
    db.query(sqlLogin, [email, password], async(error, results) => {
        if (error) {
            console.log(error)
            res.send(error)
        } 
        else {
            if(results.length > 0) {

                //jwt token
                const id = results[0].id

                const token = await jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                })

                // const user = await jwt.verify(token, process.env.JWT_SECRET)
                const sqlPatStatus = 'UPDATE patient SET status="online" WHERE id = ?'
                db.query(sqlPatStatus, [id], (error, results) => {
                    if(error) res.send(error)
                    else res.send({
                        message : 'successfully Logged in....',
                        loggedIn: true,
                        token: token 
                    })
                })

            }
            else res.send({ 
                message: 'Incorrect Username or password',
                loggedIn: false 
            })
        }
    })
})

//doctor registration
app.post('/doctorinsert', (req, res) => {
    console.log('insertion...')
    const { error } = registerValidate.validate(req.body)
    if(error) {
        const msg = error.details[0].message
        // console.log(msg)
        return res.send({ message: msg })
    }
    const { name, email, password } = req.body
    console.log(name, email, password)
    const sqlInsert = 'INSERT INTO doctor SET ?'
    db.query(sqlInsert, {name, email, password, status: 'offline'}, (error, results) => {
        if (error) res.send(error)
        else {
            if(results) res.send({ message : 'successfully registered', register: true })
            else res.send({ message: 'Registration failed', register: false })
        }
    })
})

//doctor login
app.post('/doctorlogin', async(req, res) => {
    console.log('login...')
    const { email, password, token } = req.body
    console.log( email, password)
    
    const sqlLogin = 'SELECT * FROM `doctor` WHERE email = ? AND password = ?'
    db.query(sqlLogin, [email, password], async(error, results) => {
        if (error) {
            console.log(error)
            res.send(error)
        } 
        else {
            if(results.length > 0) {

                //jwt token
                const id = results[0].id

                const token = await jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                })

                // const user = await jwt.verify(token, process.env.JWT_SECRET)
                console.log(`Id => ${id}`)
                const sqlDocStatus = 'UPDATE doctor SET status="online" WHERE id = ?'
                db.query(sqlDocStatus, [id], (error) => {
                    if(error) res.send({ message : 'Error' })
                    else res.send({
                        message : 'successfully Logged in....',
                        loggedIn: true ,
                        token: token
                    })
                })
                
            }

            else res.send({ 
                message: 'Incorrect Username or password',
                loggedIn: false 
            })
        }
    })
})

app.get('/patientview', async(req, res) => {
    
    const sqlDoctorList = 'SELECT * FROM doctor WHERE status = "in"'
    db.query(sqlDoctorList,  (error, results) => {
        if(error) res.send(error)
        else {
            if(results.length > 0) res.send(results)
            // else res.send({ 
            //     message: 'No Results', 
            // })
            return
        }
    })
})

app.get('/offlinedoctors', async(req, res) => {
    
    const sqlDoctorList = 'SELECT * FROM doctor WHERE status = "offline" OR status = "out"'
    db.query(sqlDoctorList,  (error, results) => {
        if(error) res.send(error)
        else {
            if(results.length > 0) res.send(results)
            // else res.send({ 
            //     message: 'No Results', 
            // })
            return
        }
    })
})

app.get('/alldoctors', async(req, res) => {
    
    const sqlDoctorList = 'SELECT * FROM doctor'
    db.query(sqlDoctorList,  (error, results) => {
        if(error) res.send(error)
        else {
            if(results.length > 0) res.send(results)
            // else res.send({ 
            //     message: 'No Results', 
            // })
            return
        }
    })
})

app.get('/doctorIn', async(req, res) => {
    const token = req.headers.authorization
    const user = await jwt.verify(token, process.env.JWT_SECRET)
    console.log(token)
    console.log(user.id)
    const sqlDoctorStatus = 'UPDATE doctor SET status = "in" WHERE id = ?'
    db.query(sqlDoctorStatus, [ user.id ], (error) => {
        if(error) console.log('error')
    })
    const sqlPatientList = 'SELECT * FROM `messages`, patient WHERE messages.patient_id = patient.id AND doctor_id = ? GROUP BY patient.id '
    db.query(sqlPatientList, [user.id], (error, results) => {
        if(error) res.send({ message : 'Something went wrong'})
        else {
            if(results.length>0){
                res.send(results)
            } else {
                //  res.send({ message: 'No new messages'})
            }
        }
    })
})

app.get('/doctorOut', async(req, res) => {
    const token = req.headers.authorization
    const user = await jwt.verify(token, process.env.JWT_SECRET)
    const sqlDoctorStatus = 'UPDATE doctor SET status = "out" WHERE id = ?'
    db.query(sqlDoctorStatus, [ user.id ], (error) => {
        if(error) res.send({ message : 'Something went wrong'})
    })
})

app.post('/messageToDoctor', async(req, res) => {
    const { docId, message, token } = req.body
    // console.log(token)
    const user = await jwt.verify(token, process.env.JWT_SECRET)
    console.log(user.id)
    // console.log(req.cookies.jwt)
    const sqlMessage = 'INSERT INTO messages SET ?'
    db.query(sqlMessage, {message, patient_id: user.id, doctor_id: docId, sender: 'patient'}, (error, results) => {
        if (error) res.send(error)
        else {
            if(results) res.send({ message : 'Message send' })
            else res.send({ message: 'Something went wrong' })
        }
    })
})

app.post('/messageToPatient', async(req, res) => {
    const { patId, message, token } = req.body
    // console.log(token)
    const user = await jwt.verify(token, process.env.JWT_SECRET)
    // console.log(user.id)
    // console.log(req.cookies.jwt)
    const sqlMessage = 'INSERT INTO messages SET ?'
    db.query(sqlMessage, {message, patient_id: patId, doctor_id: user.id, sender: 'doctor'}, (error, results) => {
        if (error) res.send(error)
        else {
            if(results) res.send({ message : 'Message send' })
            else res.send({ message: 'Something went wrong' })
        }
    })
})

app.post('/doctorlogout', async(req, res) => {
    try {
        const {token} = req.body
        const user = await jwt.verify(token, process.env.JWT_SECRET)
        const sqlDocStatus = 'UPDATE doctor SET status="offline" WHERE id = ?'
        db.query(sqlDocStatus, [user.id], (error, results) => {
        if(error) res.send(error)
        if(results){
            res.send({ message : 'Logged out' })
        } else{
            res.send({ message: 'Something went wrong' })
        }
    })
    } catch (JsonWebTokenError) {
        res.send({ loggedOut: true })
    }
    console.log('logout')
    
})

app.post('/patientlogout', async(req, res) => {
    try {
        const {token} = req.body
        const user = await jwt.verify(token, process.env.JWT_SECRET)
        const sqlPatStatus = 'UPDATE patient SET status="offline" WHERE id = ?'
        db.query(sqlPatStatus, [user.id], (error, results) => {
        if(error) res.send(error)
        if(results){
            res.send({ message : 'Logged out' })
        } else{
            res.send({ message: 'Something went wrong' })
        }
    })
    } catch (JsonWebTokenError) {
        res.send({ loggedOut: true })
    }
    console.log('logout')
    
})


app.get('/patientInbox/:docId', async(req, res) => {
    const token = req.headers.authorization
    const {docId} = req.params
    const user = await jwt.verify(token, process.env.JWT_SECRET)
    // console.log(docId, user.id)
    sqlGetMsg = 'SELECT * FROM messages WHERE patient_id = ? AND doctor_id = ?'
    db.query(sqlGetMsg, [user.id, docId], (error, results) => {
        if (error) res.send({message : 'No Messages '})
        else {
            // console.log(results)
            res.send(results)
        }
    })
})

app.get('/doctorInbox/:patId', async(req, res) => {
    const token = req.headers.authorization
    const {patId} = req.params
    // console.log('hellooo')
    // console.log(`Patient id ${patId}`)
    const user = await jwt.verify(token, process.env.JWT_SECRET)
    // console.log(patId, user.id)
    sqlGetMsg = 'SELECT * FROM messages WHERE patient_id = ? AND doctor_id = ?'
    db.query(sqlGetMsg, [patId, user.id], (error, results) => {
        if (error) res.send({message : 'No Messages '})
        else {
            // console.log(results)
            res.send(results)
        }
    })
})

app.get('/doctorDetails', async(req, res) => {
    const token = req.headers.authorization
    const user = await jwt.verify(token, process.env.JWT_SECRET)
    sqlGetMsg = 'SELECT * FROM doctor WHERE ?'
    db.query(sqlGetMsg, {id: user.id}, (error, results) => {
        if (error) res.send({message : 'No such user '})
        else {
            // console.log(results)
            res.send(results)
        }
    })
})

app.get('/patientDetails', async(req, res) => {
    const token = req.headers.authorization
    const user = await jwt.verify(token, process.env.JWT_SECRET)
    sqlGetMsg = 'SELECT * FROM patient WHERE ?'
    db.query(sqlGetMsg, {id: user.id}, (error, results) => {
        if (error) res.send({message : 'No such user '})
        else {
            // console.log(results)
            res.send(results)
        }
    })
})

app.listen(4000, console.log('Listening to port 4000...'))