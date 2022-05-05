
//Requires
const express = require("express");
const session = require("express-session");
const app = express();
app.use(express.json());
const fs = require("fs");
const mysql = require("mysql2");

//Mapping system paths to app's virtual paths
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));
app.use("/html", express.static("./app/html"));

app.use(session(
    {
        secret: "abc123bby16project",
        name: "weCoolSessionID",
        resave: false,
        saveUninitialized: true
    })
);

//Root route//
app.get("/", function (req, res) {
    if (req.session.loggedIn) {
        res.redirect("/home");
    } else {
        let doc = fs.readFileSync("./app/html/login.html", "utf8");
        res.set("Server", "Wazubi Engine");
        res.set("X-Powered-By", "Wazubi");
        res.send(doc);
    }
});

//creates a user table for database//
app.get("/tryLogin", function (req, res){
// Let's build the DB if it doesn't exist
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    const createDBAndTables = `CREATE DATABASE IF NOT EXISTS db;
        use db;
        CREATE TABLE IF NOT EXISTS user (
        userID int NOT NULL AUTO_INCREMENT,
        fname VARCHAR(30) NOT NULL,
        lname VARCHAR(30) NOT NULL,
        email VARCHAR(30) NOT NULL UNIQUE,
        displayName VARCHAR(30) NOT NULL UNIQUE,
        password VARCHAR(30) NOT NULL,
        admin TINYINT NOT NULL DEFAULT 0,
        PRIMARY KEY (userID));`;
    connection.connect();
    connection.query(createDBAndTables, function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        console.log(results);
  
      });
      connection.end();
    console.log("try login passed");
});

//inputs into the user database table//
app.post("/tryInsert", function (req, res){
    res.setHeader('Content-Type', 'application/json');

    let connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'db'
      });
      connection.connect();
      connection.query('INSERT INTO user(fname, lname, email, displayName, password) VALUES (?, ?, ?, ?, ?)',
            [req.body.fname, req.body.lname, req.body.email, req.body.displayName, req.body.password],
            function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        console.log('Rows returned are: ', results);
        res.send({ status: "success", msg: "Record added." });
      });
    //   console.log("finished tryLogin");
      connection.end();
});

//loads the profile page//
app.get("/profile", function (req, res) {
    if (req.session.loggedIn) {
        let profile = fs.readFileSync("./app/html/profile.html", "utf8");
        console.log("Logged in by: " + req.session.email);
        res.send(profile);
    } else {
        res.redirect("/");
    }
});

//loads the admin page//
app.get("/admin", function (req, res) {
    if (req.session.loggedIn) {
        let admin = fs.readFileSync("./app/html/admin.html", "utf8");
        console.log("Logged in by: " + req.session.email);
        res.send(admin);
    } else {
        res.redirect("/");
    }
});

//loads the signup page//
app.get("/signUp", function (req, res) {
        let doc = fs.readFileSync("./app/html/signup.html", "utf8");
        res.send(doc);
});

//loads the home page//
app.get("/home", function (req, res) {
    if (req.session.loggedIn) {
        res.send(fs.readFileSync("./app/html/home.html", "utf8"));
    } else {
        res.redirect("/");
    }
});

//user login verification//
app.use(express.urlencoded({ extended: true }));

//Verifies user credentials exist within db. 
//If credentials are correct, user is logged in.
app.post("/login", function (req, res) {

    console.log("What was sent: ", req.body.email, req.body.password);
    const connection = mysql.createConnection(
        {
            host: "localhost",
            user: "root",
            password: "",
            database: "db"
        }
    );

    //select statement for all tuples matching both provided email AND password. Should return 0-1 results.
    connection.query(`SELECT * FROM user WHERE email = "${req.body.email}" AND password = "${req.body.password}";`, function (error, results, fields) {
        if (results.length == 1) {
            console.log(results);
            req.session.loggedIn = true;
            req.session.displayName = results[0].displayName;
            req.session.email = results[0].email;
            req.session.name = results[0].fname + " " + results[0].lname;
            req.session.admin = results[0].admin;
            res.send({
                status: "success",
                msg: "Logged in.",
                admin: req.session.admin
                // admin: 0
            });
            console.log(req.session.admin);
            console.log("login success");

        } else {
            res.send({ status: "fail", msg: "User account not found." });
        }
    })
})

//user logout code//
app.get("/logout", function (req, res) {
    if (req.session) {
        req.session.destroy(function (error) {
            if (error) {
                res.status(400).send("Unable to log out.");
            } else {
                console.log("logged out of session.");
                res.redirect("/");
            }
        });
    }
});

//returns a navbar and footer to the page//
app.get("/getNavbarFooter", function (req, res) {
    const navbar = fs.readFileSync("./app/html/components/navbar.html", "utf8");
    const footer = fs.readFileSync("./app/html/components/footer.html", "utf8");
<<<<<<< HEAD
    const components = {
        "navbar": navbar,
        "footer": footer,
        "displayName": req.session.displayName,
        "email": req.session.email,
        "name": req.session.name
    };
=======
    const components = {"navbar": navbar, "footer": footer,};
>>>>>>> b6926cd69cc679b2d25141f488f6aa81bd546566
    res.send(JSON.stringify(components));
});

//returns the info for all users to be sent to admin//
app.get("/getUserTable", function (req, res) {

    //should have a check to make sure user is admin before executing the next code//

    const connection = mysql.createConnection(
        {
            host: "localhost",
            user: "root",
            password: "",
            database: "db"
        }
    );
    
    connection.query(`SELECT * FROM user;`, function (error, results, fields) {
        if (results.length > 0) {
            console.log(results);
            console.log("User info success");
            res.send(JSON.stringify(results));

        } else {
            res.send({ status: "fail", msg: "User account not found." });
        }
    })

});

let port = 8000;
app.listen(port, console.log("Server is running!"));
