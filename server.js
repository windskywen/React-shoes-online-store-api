const path = require('path');
const fs = require('fs');
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middleWares = jsonServer.defaults();
server.use(jsonServer.bodyParser);
server.use(middleWares);

const getUsersDb = () => {
    return JSON.parse(
        fs.readFileSync(path.join(__dirname, 'users.json'), 'UTF-8'))
}

const isAuthenticated = ({email, password}) => {
    return (
        getUsersDb().users.findIndex(user => user.email === email && user.password === password) !== -1
    )
}

const SECRET = '12a3sd564689asd321'
const expiresIn = '1h'
const createToken = payload => {
    return jwt.sign(payload, SECRET, { expiresIn })
}

server.post('/auth/login', (req, res) => {
    const { email, password } = req.body;

    if(isAuthenticated({email, password})){
        const user = getUsersDb().users.find(u => u.email === email && u.password === password);
        const { nickname, type } = user
        // jwt
        const jwToken = createToken({ nickname, type, email })
        return res.status(200).json(jwToken)
    } else {
        const status = 401;
        const message = "Incorrect email or password";
        return res.status(status).json({status, message});
    }

    console.log('Login Success')
    return res.status(200).json('Login Success---')
})

// register new user
server.post('/auth/register', (req, res) => {
    const { email, password, nickname, type } = req.body;
    
    // step 1
    if(isAuthenticated({ email, password })){
        const status = 401;
        const message = "Email and password already exist";
        return res.status(status).json({ status, message });
    }

    // step 2
    fs.readFile(path.join(__dirname, 'users.json'), (err, _data) => {
        if(err){
            const status = 401;
            const message = err;
            return res.status(status).json({ status, message });
        }
        // get current users data
        const data = JSON.parse(_data.toString());
        // get the id of last user
        const last_item_id = data.users[data.users.length - 1 ].id;
        // add new array
        data.users.push({ id: last_item_id + 1, email, password, nickname, type });
        fs.writeFile(
            path.join(__dirname, 'users.json'),
            JSON.stringify(data),
            (err, result) => {
                // wirte 
                if (err) {
                    const status = 401;
                    const message = err;
                    res.status(status).json({ status, message });
                    return;
                }
            }
        )
    })

    // create token for new user
    const jwToken = createToken({ nickname, type, email});
    res.status(200).json(jwToken);
});

server.use(router)
server.listen(3001, () => {
  console.log('JSON Server is running')
})