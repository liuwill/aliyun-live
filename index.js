import moment from "moment"
import * as urllib from 'urllib'
import * as utility from 'utility'
import * as crypto from 'crypto'

export class AliLive {
    constructor(basicConfig){
        this.url = ApiConfig.GateWay;
        this.publicParam = ApiPublicParam;

        if(!basicConfig || !basicConfig.accessKeyId || !basicConfig.accessKeySecret){
            console.log(basicConfig);
            throw new Error("参数不完整，没有设置参数");
        }
        this.accessKeyId = basicConfig.accessKeyId;
        this.accessKeySecret = basicConfig.accessKeySecret;
        installAPI();
    }
}

export class AliVod {
    constructor(basicConfig){
        this.url = ApiConfig.MtsGateWay;
        this.publicParam = MtsPublicParam;

        if(!basicConfig || !basicConfig.accessKeyId || !basicConfig.accessKeySecret){
            console.log(basicConfig);
            throw new Error("参数不完整，没有设置参数");
        }
        this.accessKeyId = basicConfig.accessKeyId;
        this.accessKeySecret = basicConfig.accessKeySecret;
        installMtsAPI();
    }
}

/**
 * requestData = {
 *  accessKeyId:"",
 *  accessKeySecret:"",
 *  Action:'DescribeLiveStreamOnlineUserNum',
 *  DomainName:'app.rtmp.domian.com',
 *  AppName:'appname',
 *  StreamName:'streamName',
 * }
 */
async function requestCDNResource(requestData){
    let accessKeyId= this.accessKeyId;
    let accessKeySecret= this.accessKeySecret;
    let timestamp = moment().utc().format()
    let signatureNonce = (new Date()).getTime() + "" + Math.round(Math.random()*100);
    let basicParams = Object.assign({
        AccessKeyId: accessKeyId,
        SignatureNonce: signatureNonce,
        Timestamp:timestamp
    },this.publicParam);

    let appParams = requestData;
    let query = Object.assign({},basicParams,appParams);
    
    let sortQuery = {}
    let pureSortQuery = []
    for(let key of Object.keys(query).sort()){
        let valueStr = query[key]+''
        valueStr = valueStr.replace(/:/g,'%3A');
        valueStr = valueStr.replace(/\//g,'%2F');
        valueStr = valueStr.replace(/{/g,'%7B');
        valueStr = valueStr.replace(/}/g,'%7D');
        let value = utility.encodeURIComponent(valueStr);
        key = utility.encodeURIComponent(key);
        sortQuery[key] = value

        pureSortQuery.push(key+"="+value);
    }
    
    let queryStr = pureSortQuery.join("&");
    let stringToSign = 'POST&%2F&' + queryStr.replace(/=/g,"%3D").replace(/&/g,"%26");

    let signature = crypto.createHmac('sha1', accessKeySecret+'&');
    let signatureStr = signature.update(new Buffer(stringToSign, 'utf8')).digest('base64');

    let aliUrl = this.url;

    let fullParam = Object.assign(query,{
        Signature: utility.encodeURIComponent(signatureStr),
        Timestamp: timestamp
    })

    let paramList = [];
    for(let key of Object.keys(fullParam)){
        let value = fullParam[key] + "";
        if(value.match(/:/g)){
          value = value.replace(/:/g,'%3A');
        }else if(value.match(/\//g) || value.match(/{/g)){
          value = utility.encodeURIComponent(value);
        }
        //value = value.replace(/:/g,'%3A');
        //value = value.replace(/\//g,'%2F');
        paramList.push(key+"="+value);
    }
    let paramStr = paramList.join('&');
    let realUrl = aliUrl + '?' + paramStr

    var aliResult = await urllib.request(realUrl, {
        method: 'POST',
        dataType: 'json',
    });

    return {status:aliResult.status,data:aliResult.data};
}

AliLive.prototype.requestCDNResource = requestCDNResource;
AliVod.prototype.requestCDNResource = requestCDNResource;

/**
 * 动态根据Json格式配置文件的规则生成函数，并且加到AliLive类的原型中
 */
function installAPI(){
    for(let name in ApiOperationConfig){
        let funcData = ApiOperationConfig[name];
        
        AliLive.prototype[name] = async function(requestData){
            if(!requestData){
                requestData = {};
            }

            if(!requestData['Action']){
                requestData['Action'] = funcData['input']['members']['Action']['default'];
            }

            for(let paramName in funcData['input']['members']){
                let paramInfo = funcData['input']['members'][paramName];

                if(paramInfo.required && !requestData[paramName]){
                    return {status:500,msg:`参数${paramName}是必填字段，现在没有填写`};
                }
            }
            return await this.requestCDNResource(requestData);
        };
    }
}

function installMtsAPI(){
    for(let name in MtsOperationConfig){
        let funcData = MtsOperationConfig[name];
        
        AliVod.prototype[name] = async function(requestData){
            if(!requestData){
                requestData = {};
            }

            if(!requestData['Action']){
                requestData['Action'] = funcData['input']['members']['Action']['default'];
            }

            for(let paramName in funcData['input']['members']){
                let paramInfo = funcData['input']['members'][paramName];

                if(paramInfo.required && !requestData[paramName]){
                    return {status:500,msg:`参数${paramName}是必填字段，现在没有填写`};
                }
            }
            return await this.requestCDNResource(requestData);
        };
    }
}

let ApiConfig = {
    GateWay: 'https://cdn.aliyuncs.com/',
    MtsGateWay: 'https://mts.aliyuncs.com/',
}

let MtsPublicParam = {
    Format: 'JSON', 
    Version: '2014-06-18',
    SignatureMethod:'HMAC-SHA1',
    SignatureVersion:'1.0',
};
let ApiPublicParam = {
    Format: 'JSON', 
    Version: '2014-11-11',
    SignatureMethod:'HMAC-SHA1',
    SignatureVersion:'1.0',
};
let ApiOperationConfig = {
    "describeLiveStreamsPublishList": {
      "name": "DescribeLiveStreamsPublishList",
      "http": {
        "method": "POST",
        "uri": "/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeLiveStreamsPublishList"
          },
          "AppName":{
            "required": true,
            "type": "string"
          },
          "DomainName": {
            "required": true,
            "type": "string"
          },
          "StartTime": {
            "type": "string"
          },
          "EndTime": {
            "type": "string"
          }
        }
      }
    },
    "describeLiveStreamsOnlineList": {
      "name": "DescribeLiveStreamsOnlineList",
      "http": {
        "method": "POST",
        "uri": "/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeLiveStreamsOnlineList"
          },
          "AppName":{
            "required": true,
            "type": "string"
          },
          "DomainName": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "describeLiveStreamOnlineUserNum": {
      "name": "DescribeLiveStreamOnlineUserNum",
      "http": {
        "method": "POST",
        "uri": "/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeLiveStreamOnlineUserNum"
          },
          "AppName":{
            "required": true,
            "type": "string"
          },
          "StreamName":{
            "required": true,
            "type": "string"
          },
          "DomainName": {
            "required": true,
            "type": "string"
          },
          "StartTime": {
            "type": "string"
          },
          "EndTime": {
            "type": "string"
          }
        }
      }
    },
    "describeLiveStreamRecordContent": {
      "name": "DescribeLiveStreamRecordContent",
      "http": {
        "method": "POST",
        "uri": "/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeLiveStreamRecordContent"
          },
          "AppName":{
            "required": true,
            "type": "string"
          },
          "StreamName":{
            "required": true,
            "type": "string"
          },
          "DomainName": {
            "required": true,
            "type": "string"
          },
          "StartTime": {
            "required": true,
            "type": "string"
          },
          "EndTime": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "describeLiveStreamRecordIndexFile": {
      "name": "DescribeLiveStreamRecordIndexFile",
      "http": {
        "method": "POST",
        "uri": "/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeLiveStreamRecordIndexFile"
          },
          "AppName":{
            "required": true,
            "type": "string"
          },
          "StreamName":{
            "required": true,
            "type": "string"
          },
          "DomainName": {
            "required": true,
            "type": "string"
          },
          "RecordId": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "describeLiveStreamRecordIndexFiles": {
      "name": "DescribeLiveStreamRecordIndexFiles",
      "http": {
        "method": "POST",
        "uri": "/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeLiveStreamRecordIndexFiles"
          },
          "AppName":{
            "required": true,
            "type": "string"
          },
          "StreamName":{
            "required": true,
            "type": "string"
          },
          "DomainName": {
            "required": true,
            "type": "string"
          },
          "StartTime": {
            "required": true,
            "type": "string"
          },
          "EndTime": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "describeLiveStreamSnapshotInfo": {
      "name": "DescribeLiveStreamSnapshotInfo",
      "http": {
        "method": "POST",
        "uri": "/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DescribeLiveStreamSnapshotInfo"
          },
          "AppName":{
            "required": true,
            "type": "string"
          },
          "StreamName":{
            "required": true,
            "type": "string"
          },
          "DomainName": {
            "required": true,
            "type": "string"
          },
          "StartTime": {
            "required": true,
            "type": "string"
          },
          "EndTime": {
            "required": true,
            "type": "string"
          },
          "Limit": {
            "type": "integer"
          }
        }
      }
    },
    "createLiveStreamRecordIndexFiles": {
      "name": "CreateLiveStreamRecordIndexFiles",
      "http": {
        "method": "POST",
        "uri": "/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "CreateLiveStreamRecordIndexFiles"
          },
          "AppName":{
            "required": true,
            "type": "string"
          },
          "StreamName":{
            "required": true,
            "type": "string"
          },
          "DomainName": {
            "required": true,
            "type": "string"
          },
          "OssEndpoint":{
            "required": false,
            "type": "string"
          },
          "OssBucket": {
            "required": false,
            "type": "string"
          },
          "OssObject": {
            "required": false,
            "type": "string"
          },
          "StartTime": {
            "required": true,
            "type": "string"
          },
          "EndTime": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "addLiveAppRecordConfig": {
      "name": "AddLiveAppRecordConfig",
      "http": {
        "method": "POST",
        "uri": "/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "AddLiveAppRecordConfig"
          },
          "AppName":{
            "required": true,
            "type": "string"
          },
          "DomainName": {
            "required": true,
            "type": "string"
          },
          "OssEndpoint":{
            "required": true,
            "type": "string"
          },
          "OssBucket": {
            "required": true,
            "type": "string"
          },
          "OssObjectPrefix": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
    "deleteLiveAppRecordConfig": {
      "name": "DeleteLiveAppRecordConfig",
      "http": {
        "method": "POST",
        "uri": "/"
      },
      "input": {
        "type": "structure",
        "members": {
          "Action": {
            "required": true,
            "default": "DeleteLiveAppRecordConfig"
          },
          "AppName":{
            "required": true,
            "type": "string"
          },
          "DomainName": {
            "required": true,
            "type": "string"
          }
        }
      }
    },
};

let MtsOperationConfig = {
  "queryMediaListByURL": {
    "name": "QueryMediaListByURL",
    "http": {
      "method": "POST",
      "uri": "/"
    },
    "input": {
      "type": "structure",
      "members": {
        "Action": {
          "required": true,
          "default": "QueryMediaListByURL"
        },
        "FileURLs":{
          "required": true,
          "type": "string"
        },
        "IncludePlayList":{
          "required": false,
          "type": "string"
        },
        "IncludeSnapshotList": {
          "required": false,
          "type": "string"
        },
        "IncludeMediaInfo": {
          "required": false,
          "type": "string"
        }
      }
    }
  },
  'queryMediaWorkflowExecutionList':{
    "name": "QueryMediaWorkflowExecutionList",
    "http": {
      "method": "POST",
      "uri": "/"
    },
    "input": {
      "type": "structure",
      "members": {
        "Action": {
          "required": true,
          "default": "QueryMediaWorkflowExecutionList"
        },
        "RunIds":{
          "required": true,
          "type": "string"
        },
      }
    }
  },
};