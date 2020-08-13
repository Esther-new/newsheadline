let express = require("express");
let query = require("../model.js");
let moment = require("moment");
let fs = require("fs");
const controller = require("../controller.js");

let router = express.Router();
// api接口
router.get('/getCategory',async (req,res)=>{
    let sql = "select * from category where cat_id > 1";
    var rows = await query(sql);
    res.json(rows); // [{},{}]
})

router.get('/getArticles',async (req,res)=>{
    let sql = `SELECT t1.*, t2.cat_name,t3.nickname FROM posts t1
         LEFT JOIN category t2 ON t1.cat_id = t2.cat_id
         left join users t3 on t1.user_id = t3.user_id
         order by post_id desc
         LIMIT 0,5`;
    var rows = await query(sql);
    // console.log(rows)
    rows.map(v=>{
        if(v.feature){
            v.feature = "http://127.0.0.1:5000" + v.feature.replace('./','/')
        }
        
    })
    res.json(rows); // [{},{}]
})

router.get('/getCatArticle',async (req,res) => {
    let {cat_id,page,pageSize} = req.query;
    let offset = (page-1)*pageSize;
    let sql = `select t1.*,t2.nickname from posts t1 left join users t2 
                    on t1.user_id = t2.user_id where cat_id = ${cat_id} limit ${offset},${pageSize}`;
    let rows = await query(sql);

    let sql2 = `select cat_name from category where cat_id = ${cat_id}`;
    let catData = await query(sql2)
    rows.map(v=>{
        if(v.feature){
            v.feature = v.feature.replace('./','/');
        }
        v.created = moment(v.created).format("YYYY-MM-DD");
    })
    res.json({
        artData: rows,
        cat_name: catData[0].cat_name
    })
})

router.get('/getArticle/:post_id',async (req,res)=>{
    let {post_id} = req.params;
    let sql = `select t1.*,t2.cat_name,t3.nickname from posts 
            t1 left join category t2 on t1.cat_id = t2.cat_id
            left join users t3 on t1.user_id = t3.user_id
            where t1.post_id = ${post_id}`;
    let sql2 = `select count(*) as commentCount from comments where post_id = ${post_id}`;

    // let rows = await query(sql);
    // let commentCountRows = await query(sql2);
    let p1 = query(sql);
    let p2 = query(sql2);
    let result = await Promise.all([p1,p2]); // [[{}],[{}]]
    obj = result[0][0];
    obj.commentCount = result[1][0].commentCount
    
    // console.log(obj);
    
    // rows[0].commentCount = commentCountRows[0].commentCount
    res.json(obj);
})

router.get('/getSlides',controller.getSlides)


module.exports = router