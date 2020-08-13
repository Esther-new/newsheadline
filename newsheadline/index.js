let express = require("express");
let path = require('path')
let artTemplate = require('art-template')
let expressTemplate = require('express-art-template')
let query = require('./model.js')
let express_session = require("express-session");
let cors = require('cors')

let adminRouter = require('./router/router.js');
let apiRouter = require("./router/apiRouter.js")



let app = express();
app.use(cors())
//初始化session
//使用session中间件
//通过app.use中间件设置session的参数
app.use(express_session({
    name:'SESSIONID',  // session会话名称在cookie中的值
    secret:'%#%￥#……%￥', // 必填项，用户session会话加密（防止用户篡改cookie）
    cookie:{  //设置session在cookie中的其他选项配置
      path:'/',
      secure:false,  //默认为false, true 只针对于域名https协议
      maxAge:60000*30,  //设置有效期为30分钟
    }
}));

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded



// 托管静态资源
app.use('/public',express.static(__dirname + '/public/'));

//允许跨域

// app.use(function(req,res,next){
//     // 设置响应头
//     res.setHeader("Access-Control-Allow-Origin","*");
//     next();
// })

// 使用api路由中间件。挂载路由
// api接口这一块的路由不需要做权限session验证，
// 所有要写在验证session中间件的前面。
app.use('/api',apiRouter); 


//设置中间件，判断用户是否有session信息
app.use(function(req,res,next){
    // 不需要做session验证的路由
    var noCheckSession =  ['/login','/logout'];
    var path = req.path.toLowerCase();
    //是否在数组中存在
    if(noCheckSession.includes(path)){
        // 在 =》放行
        next();
    }else {
        // 不在 =》 session检测
        if(req.session.user_id){
            next();
        }else{
            res.redirect('/login')
        }
    }
})

// 设置后台路由中间件
app.use(adminRouter);

// 配置模板引擎为art-template
// 配置模板的路径
app.set('views', __dirname + '/views/');
// 设置express_template模板后缀为.html的文件
app.engine('html', expressTemplate); 
// 设置视图引擎为上面的html
app.set('view engine', 'html');

app.listen(5000,()=>{
    console.log("服务器已经启动 at port 5000")
})