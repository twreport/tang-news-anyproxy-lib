'use strict';


module.exports = {

  summary: 'the default rule for AnyProxy',

  /**
   *
   *
   * @param {object} requestDetail
   * @param {string} requestDetail.protocol
   * @param {object} requestDetail.requestOptions
   * @param {object} requestDetail.requestData
   * @param {object} requestDetail.response
   * @param {number} requestDetail.response.statusCode
   * @param {object} requestDetail.response.header
   * @param {buffer} requestDetail.response.body
   * @returns
   */
  *beforeSendRequest(requestDetail) {

    // 屏蔽指定网站，避免手机宕机
    const localResponse = {
      statusCode: 200,
      header: { 'Content-Type': 'application/json' },
      body: '{"hello": "this is local response"}'
    };
    if (requestDetail.url.indexOf('hicloud.com') != -1
        || requestDetail.url.indexOf('dbankcloud') != -1)
    {
      return {
        response: localResponse
      };
    }


    if (requestDetail.url.indexOf('https://mp.weixin.qq.com/mp/profile_ext?action=home') != -1) {

      const MongoClient = require("mongodb").MongoClient;
      const url = "mongodb://10.168.1.100:27017/";

      const str = requestDetail.url;
      const sub_str = str.match(/__biz=(\S*)==/);
      const biz = sub_str[1] + '==';

      const t1 = new Date().getTime();
      let headers = requestDetail.requestOptions.headers;

      //安卓和ios返回的header不太一样！
      let x_wechat_uin = '';
      if(headers.hasOwnProperty('x-wechat-uin')){
        x_wechat_uin = headers['x-wechat-uin'];
      }else if(headers.hasOwnProperty('X-WECHAT-UIN')){
        console.log(headers['X-WECHAT-UIN'])
        x_wechat_uin = headers['X-WECHAT-UIN'];
      }else{
        return null;
      }

      const myobj = { 'url': requestDetail.url, 'biz': biz, 'headers': headers,
        'add_time': t1, 'update_time': t1, 'x-wechat-uin':x_wechat_uin,
        'type': 'app' };

      const query = {'x-wechat-uin':x_wechat_uin, 'biz':biz};
      console.log("x_wechat_uin:",x_wechat_uin);
      console.log("biz:",biz);

      async function dataOperate() {
        let conn = null;
        try {
          conn = await MongoClient.connect(url);
          console.log("数据库已连接");
          const url_db = conn.db("weixin").collection("url");
          const url_doc = await url_db.findOne(query);
          console.log("url_doc：", url_doc);
          if(url_doc == null){
            console.log('数据库中没有相应数据，新建ing......');
            await url_db.insertOne(myobj);
          }else{
            headers['Cookie'] = url_doc.headers['Cookie'];
            console.log("cookie:", url_doc.headers['Cookie']);
            await url_db.updateOne(query, {$set: {'headers': headers, 'update_time': t1}});
          }
        } catch (err) {
          console.log("错误：" + err.message);
        } finally {
          if (conn != null) conn.close();
        }
      }

      dataOperate().then(r => {
        console.log('异步程序已经执行');
      });

      return new Promise((resolve, reject) => {
        /*********通信代码块G，，向eggjs框架发送get，
         *返回下一个将要爬取的微信公众号__biz，通过js注入，让手机微信在延时随机时间之后，继续爬取下一个公众号
         *************/
        var httpd = require('http');

        var options = {
          hostname: '10.168.1.98',
          port: 7001,
          path: '/link',
          method: 'GET'
        };
        console.log(options)
        var reqd = httpd.request(options, function (resd) {
          // console.log('STATUS: ' + resd.statusCode);
          // console.log('HEADERS: ' + JSON.stringify(resd.headers));
          resd.setEncoding('utf8');
          resd.on('data', function (chunk) {
            console.log('TEXT: ' + chunk);
            setTimeout(() => { 
              resolve({ response: {
                statusCode: 200,
                header: { 'content-type': 'text/html' },
                body: chunk
              } });
            }, 1000);
          });
        });
        reqd.on('error', function (e) {
          console.log('problem with request: ' + e.message);
        });
        reqd.end();
      });
    }

    return null;
  },


  /**
   *
   *
   * @param {object} requestDetail
   * @param {object} responseDetail
   */
  *beforeSendResponse(requestDetail, responseDetail) {

    if (requestDetail.url.indexOf('https://mp.weixin.qq.com/mp/profile_ext?action=home') != -1) {
      let newResponse = responseDetail.response;
      return new Promise((resolve, reject) => {

        /*********通信代码块G，，向tp5框架中的cli模块中的分析函数发送get，
         *返回下一个将要爬取的微信公众号__biz，通过js注入，让手机微信在延时随机时间之后，继续爬取下一个公众号
         */
        var httpd = require('http');

        var options = {
          hostname: '10.168.1.98',
          port: 7001,
          path: '/link',
          method: 'GET'
        };
        console.log(options)
        var reqd = httpd.request(options, function (resd) {
          // console.log('STATUS: ' + resd.statusCode);
          // console.log('HEADERS: ' + JSON.stringify(resd.headers));
          resd.setEncoding('utf8');
          resd.on('data', function (chunk) {
            console.log('TEXT: ' + chunk);

            newResponse.body = chunk + newResponse.body;

            setTimeout(() => {
              resolve({ response: {
                statusCode: 200,
                header: { 'content-type': 'text/html' },
                body: '<h1>AnyProxy is OUT!</h1>'
              } });
            }, 1000);
          });
        });
        reqd.on('error', function (e) {
          console.log('problem with request: ' + e.message);
        });
        reqd.end();

      });
    }
    return null;
  },


  /**
   * default to return null
   * the user MUST return a boolean when they do implement the interface in rule
   *
   * @param {any} requestDetail
   * @returns
   */
  *beforeDealHttpsRequest(requestDetail) {
    return null;
  },

  /**
   *
   *
   * @param {any} requestDetail
   * @param {any} error
   * @returns
   */
  *onError(requestDetail, error) {
    return null;
  },


  /**
   *
   *
   * @param {any} requestDetail
   * @param {any} error
   * @returns
   */
  *onConnectError(requestDetail, error) {
    return null;
  },


  /**
   *
   *
   * @param {any} requestDetail
   * @param {any} error
   * @returns
   */
  *onClientSocketError(requestDetail, error) {
    return null;
  },
};
