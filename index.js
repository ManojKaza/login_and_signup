const express = require('express');
const bodyParser = require('body-parser');
const {Client} = require('pg');
const uuidv4 = require('uuid').v4;
const cookieParser = require('cookie-parser');
const app = express();

const client = new Client({
  host: 'localhost',
  user: 'manoj',
  database: 'Login',
  password: 'Admin',
  port: 5432,
})
const sessions = {}

client.connect();

function servehtml (pagepath,filepath){
	app.get(pagepath,(req,res) => {res.sendFile(__dirname + '/public/' + filepath + '.html')});
}

//body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
//cookie parser middleware
app.use(cookieParser());

//Serving index page
 servehtml('/','index');

//serving login page
 servehtml('/login','login');

//serving register page
 servehtml('/register','register');

//fetching the details from the user and returning output.
app.post('/login',(req,res) => {
	var username = req.body.username;
	var password = req.body.password;
	var userid = 0;
	client.query('select * from login_credentials where user_name = $1', [username], (err,result) =>{
		if (result.rowCount == 0){
			res.json({"result" : "Invalid username,Please try again"});
		}else{
			if(result.rows[0].password != password){
				res.json({"result": "You have entered invalid password, Please try again with correct password."});
			}else if(result.rows[0].password === password){
				  if(req.cookies.session === undefined || !sessions[req.cookies.session]){
			    userid = result.rows[0].user_id;
				  const sessionID = uuidv4();
	      	sessions[sessionID] = {username, userid};
	      	res.cookie(`session`,sessionID,{
	      		          maxAge: 10000 * 1000,
	      		          secure: true,
	      		          httpOnly: true,
	      		          sameSite: 'lax'
	      		        });
	      	console.log("cookie set succesfully");
	        }else{
	        	console.log("cookie is already present");
	        }
			  res.redirect('/home');
			}
		}
	})
})

//serving home page
 //servehtml('/home','home')
app.get('/home',(req,res) => {
	console.log(req.cookies);
	const sessionID = req.cookies.session;
	const usersession = sessions[sessionID];
	if (usersession){
		res.sendFile(__dirname + '/public/home.html');
	}else{
		res.json({"result":"Invalid session or session expired"});
	}
});

//logout of user
app.get('/logout',(req,res) => {
  res.clearCookie();
  res.redirect('/')
})

//inputing new user details into database from the user side
app.post('/register',(req,res) => {
	var username = req.body.username;
	var firstname = req.body.firstname;
	var lastname = req.body.lastname;
	var password = req.body.password;
	var cpassword = req.body.cpassword;
	if (password === cpassword){
		/* Here i have some doubt about where not exists and all other where i searched the net but didnt get the desired result so
		i split into two qureies and made use of it  */
		client.query('SELECT * FROM login_credentials WHERE user_name = $1',[username], (err,result) => {
    console.log(result);
    if (result.rowCount == 0){
     client.query('INSERT INTO login_credentials VALUES ($1, $2, $3, $4)',[username,password,firstname,lastname],(err1,result1) => {
      res.json({"result":"Details registerd succesfully."})
      console.log(result1)
      })
    }else{
    	res.json({"result":"username already exits"})
    }})
	}else{
		res.json({"result":"Please enter the same character in Password and confirm password."});
	}
})

app.listen(3000);