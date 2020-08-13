//定义一个函数，返回一个promise，异步操作写在promise函数中
let mysql = require("mysql");

//({})是因为mysql传的是一个对象
connection = mysql.createConnection({
    host:"localhost",
    port:"3306",
    user:"root",
    password:"123456",
    database:"newheadline"
})
//判断是否连接成功

connection.connect(function(err){
    if(err){
        throw err;
    }
    console.log('mysql连接成功');
});

module.exports = function query(sql){
    //TODO
    return new Promise((resolve,reject)=>{
        connection.query(sql,function(err,rows,fields){
            if(err){reject(err)}
            resolve(rows);
            // console.log(rows);//select rows =>[{},{}],insert update delete => rows.affected
        })
    })
}