//引入mysql模板
let mysql = require("mysql");
let fs = require("fs");
let moment = require('moment');
const  query = require("./model.js");



//连接mysql数据库
let connection = mysql.createConnection({
    host:"localhost",           //主机
    port:"3306",                //端口   
    user:"root",                //用户
    password:"123456",          //密码
    database:"newheadline"      //数据库
    
})
//判断是否连接成功
connection.connect(function(err,data){
    if(err){
        throw err;
    }
    console.log("连接数据库成功！");
})
//每条显示的页数
let pageSize = 10;

let controller = {
    "login":(req,res)=>{
        res.render("login.html");
    },
    "posts":async (req,res)=>{
        var resdata = {}
        resdata.nickname = req.session.nickname;
        resdata.photo = req.session.photo;
        let status =[
            {"key":"drafted","text":"草稿"},
            {"key":"published","text":"已发布"},
            {"key":"trashed","text":"已废弃"}
        ]
        let sql = "select * from category";
        var catData = await query(sql);
        // console.log(catData);
        res.render("posts.html",{
            status:status,
            catData:catData
        });
    },
    // "postsShow":(req,res)=>{
    //     res.render("posts.html",{
    //         photo:req.session.photo
    //     });
    // },
    "getPostsPageCount":async(req,res)=>{
        let{cat_id,status}=req.query;
        console.log(req.query);
        //待会为了方便拼接
        //where 1=1 代表查询条件为真，主要为了防止后面没有查询条件而出现报错
        var where = `1=1`        //判断
        if(cat_id){
            where+=` and cat_id = ${cat_id}`;
        }
        if(status){
            where+=` and status = '${status}'`;
        }
        let sql = `select count(*) as pageCount from posts
         where ${where} `;
         console.log(sql);
            var data = await query(sql);
            //总页数=总记录数/每页显示的条数
            var totalpages = Math.ceil(data[0].pageCount/pageSize);
            res.json({totalpages});
    },
    "getPageData":async (req,res)=>{
        let{cat_id,status}=req.query;
        console.log(req.query);
        //待会为了方便拼接
        //where 1=1 代表查询条件为真，主要为了防止后面没有查询条件而出现报错
        var where = `1=1`
        //判断
        //记得加表的别名，不然识别不出来
        //拼接字符也要空格，不然拼起来的时候会连在一起
        if(cat_id){
            where+=` and t1.cat_id=${cat_id}`;
        }
        if(status){
            where+=` and t1.status='${status}'`;
        }
        //获取请求的页数,因为req.query传进来的是对象，所以需要转成整数.
        let page = parseInt(req.query.page); 
        //offset是显示条数，pagesize是页码      
        let offset = (page-1)*pageSize;
        //左连接是左表作为主表连接右表
        //条件之后才去排序
        let sql = 
        `select t1.*,t2.nickname,t3.cat_name
        from posts t1 left join users t2 on t1.user_id=t2.user_id
        left join category t3 on t1.cat_id = t3.cat_id
        where ${where}
        order by post_id desc
        limit ${offset},${pageSize}
        `;
        console.log(sql);
        var data = await query(sql);
        res.json(data);    
    },
    "index":async (req,res)=>{
        //获取文章总数
        var sql1 = "select count(*) as postsCount from posts ";
        //获取草稿总数
        var sql2 = "select count(*) as draftCount from posts";
        //获取分类个数
        var sql3 = "select count(*) as cateCount from category";
        //获取评论总数和待审核总数
        var sql4 = "select count(*) as comment_id from comments";
        var sql5="select count(*) as status from comments where status = 'held'";
        //connection.query异步执行
        // console.time('query');
        var promiseArr = [query(sql1),query(sql2),query(sql3),query(sql4),query(sql5)];
        // console.log(resdata);
        //把所有的promise对象执行成功的结果保存在一个数组中返回。通常用于获取多个异步任务的执行结果
        var data = await Promise.all(promiseArr)
            var resdata = {}
            data.map((v)=>{
                // v=>[{}]
                // v[0]=>{}
                Object.assign(resdata,v[0]);//合并对象v[0]到resdata身上
            })
            resdata.nickname = req.session.nickname;
            resdata.photo = req.session.photo;
            res.render("index.html",resdata);
       
        // console.log(resdata);
        // console.timeEnd('query');
    },
    "del":async (req,res)=>{
        let id = req.body.postId;
        console.log(id);
        let sql = 'delete from posts where post_id = '+id;
        var data = await query(sql);
        let{affectedRows} = data;
        if(affectedRows > 0){
            res.json({"code":200,"message":"delete succeed","icon":1});
        }else{
            res.json({"code":-1,"message":"delete failed","icon":2});
        }
    },
    "addPost":async(req,res)=>{
        let status =[
            {"key":"drafted","text":"草稿"},
            {"key":"published","text":"已发布"},
            {"key":"trashed","text":"已废弃"}
        ]
        let sql = "select * from category";
        var catData = await query(sql);
        // console.log(catData);
        res.render("post-add.html",{
            status:status,
            catData:catData
        })
            
    },
    "savePost":async (req,res)=>{
        console.log(req.body);
        let {title,content,category,created,status,feature} = req.body;
        let sql = `insert into posts (title,content,cat_id,created,status,feature,user_id)
        values('${title}','${content}','${category}','${created}','${status}','${feature}',1)`
        var data = await query(sql);
        let{affectedRows} = data;
        if(affectedRows>0){
            res.json({"code":200,"message":"添加成功！"});
        }else{
            res.json({"code":-1,"message":"添加失败"})
        }
    },
    "uploadFeature":(req,res)=>{
        console.log(req.file);
        let{filename,originalname,destination} = req.file;
        //找到原文件的.下标，从indexof.开始分割字符（substring）
        var ext = originalname.substring(originalname.indexOf("."));//=>.jpg
        let oldpath = `${destination}${filename}`;
        let newpath = `${destination}${filename}${ext}`;
        console.log(newpath);
        let fullpath = ``;
        //fs.rename("旧路径","新路径") 修改文件名
        fs.rename(oldpath,newpath,err=>{
            if(err){throw err};
            //返回完整的路径给前端，用于图片的src回显
            res.json({fullpath:newpath});
        })
    },
    "updPost":async (req,res)=>{
        let {post_id,title,content,category,created,status,feature} = req.body;
        let sql = `update posts set
                    title = '${title}',
                    content='${content}',
                    category='${cat_id}',
                    created='${created}',
                    status='${status}',
                    feature='${feature}'
                    where post_id = '${post_id}';
        `
        var result = await query(sql);
        let{affectedRows} = result;
        if(affectedRows){
            res.json({code:200,message:"修改成功"});
        }else{
            res.json({code:-1,message:"修改失败"});
        }
    },
    //编辑文章回显数据
    "editpost":async (req,res)=>{
        //接收路由参数
        let post_id = req.params.post_id;
        //取出文章分类和文章状态
        let status=[
            {"key":"published","text":"发布"},
            {"key":"trashed","text":"已废弃"},
            {"key":"drafted","text":"草稿"}
        ]
        //查询当前文章的数据，分配数据到模板中
        let sql = "select * from category";
        var catData = await query(sql);//[{},{}]
        let sql2 = `select * from posts where post_id = '${post_id}'`;
        var rows = await query(sql2);//[{}]
        console.log(rows[0]);
        rows[0].feature = rows[0].feature.replace("./","/");
        console.log(rows[0].feature);
        rows[0].created = moment(rows[0].created).format("YYYY-MM-DD HH:mm:ss");
        console.log(rows[0]);
        res.render("post-edit.html",{
            data:rows[0],
            status:status,
            catData:catData
        })
    },
    "insystem":async (req,res)=>{
        let {email,password} = req.body;
        let sql = `select * from users where email = '${email}' and password = '${password}'`;
        var rows = await query(sql);
        if(rows[0] === undefined){
            res.json({
                code:-1,
                message:"没有此用户",
            })
        }else{
            //把用户信息存储到session中
            req.session.user_id = rows[0].user_id;
            req.session.email = rows[0].email;
            req.session.nickname = rows[0].nickname;
            req.session.photo = rows[0].photo.replace("./","/");
            res.json({
                code:200,
                message:"登陆成功"
            })
        }      
    },
    "logout":(req,res)=>{
        //清楚登录设置的session信息即可
        req.session.destroty(function(err){
            if(err){
                throw err;
            }
        })
        //打回到登录页面
        res.redirect("/login");
    },
    "profile":(req,res) =>{
        //取出个人信息数据，分配到模板中进行展示
        console.log(req.session.photo);
        res.render("profile.html",{
            nickname:req.session.nickname,
            photo:req.session.photo,
            email:req.session.email,
            intro:req.session.intro
        })
    },
    //点击修改密码，渲染修改密码页面
    "updPwd":(req,res)=>{
        res.render("password-reset.html");
    },
    //修改密码
    "resetPwd":async (req,res) =>{
        console.log("sadsakjsaa");
        let{oldPwd,newPwd,confirmPwd}=req.body;
        let user_id = req.session.user_id;
        
        //先验证旧密码是否正确
        let sql = `select * from users where password = '${oldPwd}' and user_id = '${user_id}'`;
        var rows = await query(sql);
        if(rows[0] === undefined){
            //没有找到 -》 旧密码输入不正确
            res.json({code:-2,message:"旧密码输入错误"});
        }else{
            //旧密码输入正确，修改真正的新密码
            let sql2=`update users set password = '${newPwd}' where user_id = '${user_id}'`;
            var result = await query(sql2);
            if(result.affectedRows){
                //修改成功
                res.json({code:200,message:"密码修改成功."});
            }else{
                res.json({code:-1,message:"密码修改失败。"});
            }
        }
    },
    //更新用户信息
    "saveprofile":async (req,res)=>{
        let{nickname,intro,avator} = req.body;
        let user_id = req.session.user_id;
        let sql=`update users set nickname = '${nickname}',intro = ${intro}
        photo=${avator} where user_id = '${user_id}'`;
        var result = await query(sql);
        if(result.affectedRows){
            req.session.nickname=nickname;
            req.session.photo = avator.replace('./','/');
            req.session.intro = intro;
            res.json({code:200,message:"更新用户信息成功"});
        }else{
            res.json({code:-1,message:"更新用户信息失败"});
        }
    },
    "slides":(req,res)=>{
        res.render('slides.html');
    },
    "addSlides":async (req,res)=>{
        //req.body接收文本数据
        console.log(req.body);
        //req.file 接收二进制数据
        console.log(req.file);
        let{text,link}=req.body;
        if(req.file){
            let{filename,originalname,destination}=req.file;
            var ext = originalname.substring(originalname.indexOf('.'));//=> .jpg
            let oldPath = `${destination}${filename}`
            newPath=`${destination}${filename}${ext}`;
            fs.renameSync(oldpath,newpath);
        }
        let sql=`insert into swipe(img,text,link) values('${newPath}','${text}','${link}') `
        let{affectedRows} = await query(sql);
        if(affectedRows){
            res.send("<script>alert('添加成功');location.href='./slides';</script>");
        }else{
            res.send("<script>alert('添加失败');location.href='./slides';</script>")
        }
    },
    "getSlides":async(req,res)=>{
        let sql = "select * from swipe";
        let row = await query(sql);
        row.map(v=>{
            v.img = v.img.replace('./','http://127.0.0.1:5000/');
        })
        res.json({swiperData:row});
    }

}

module.exports=controller;