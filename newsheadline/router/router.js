let express = require("express");
let router = express.Router();
let query = require("../model.js");
let controller = require("../controller.js");
let multer = require("multer");

//指定上传文件的目录
let upload = multer({
    //如果没有uploads目录，它会自动创建
    dest:"./public/uploads/"
})
//ajax上传文章
router.post("/uploadFeature",upload.single('feature'),controller.uploadFeature);

router.get('/postAdd',controller.addPost);

//登录页面
router.get('/login',controller.login);

//文章列表页
router.get("/posts",controller.posts);

// //显示所有文章
// router.get("/postsShow",controller.postsShow);

//获取文章总页数
let pageSize = 10;
router.get("/getPostsPageCount",controller.getPostsPageCount);

//获取文章分页的数据
router.get("/getPageData",controller.getPageData);

//首页
router.get("/",controller.index);

//删除posts数据
router.post("/del",controller.del);

// 展示添加文字的模板
router.get("/addPost",controller.addPost);

//编辑文章回显数据
router.get("/editpost/:post_id",controller.editpost);

//编辑文章数据入库
router.post("/updPost/",controller.updPost);

//保存文章数据入库
router.post("/savePost",controller.savePost);

//ajax用户登录逻辑
router.post("/login",controller.insystem);

router.get("/logout",controller.logout);

//展示用户的个人信息
router.get("/profile",controller.profile);

//修改个人密码界面
router.get("/updPwd",controller.updPwd);

//修改密码
router.post("/resetPwd",controller.resetPwd);

//修改个人中心信息
router.post("/saveprofile",controller.saveprofile);

//展示轮播图
router.get("/getSlides",controller.slides);
//添加轮播图入库
// router.post("/slides",upload.single(file),controller.addSlides)

module.exports=router;