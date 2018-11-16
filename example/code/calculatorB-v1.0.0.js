"use strict";function _interopDefault(ex){return ex&&"object"==typeof ex&&"default"in ex?ex.default:ex}var Stream=_interopDefault(require("stream")),http=_interopDefault(require("http")),Url=_interopDefault(require("url")),https=_interopDefault(require("https")),zlib=_interopDefault(require("zlib")),commonjsGlobal="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function createCommonjsModule(fn,module){return fn(module={exports:{}},module.exports),module.exports}function getCjsExportFromNamespace(n){return n&&n.default||n}const BUFFER=Symbol("buffer"),TYPE=Symbol("type");class Blob{constructor(){this[TYPE]="";const blobParts=arguments[0],options=arguments[1],buffers=[];if(blobParts){const a=blobParts,length=Number(a.length);for(let i=0;i<length;i++){const element=a[i];let buffer;buffer=element instanceof Buffer?element:ArrayBuffer.isView(element)?Buffer.from(element.buffer,element.byteOffset,element.byteLength):element instanceof ArrayBuffer?Buffer.from(element):element instanceof Blob?element[BUFFER]:Buffer.from("string"==typeof element?element:String(element)),buffers.push(buffer)}}this[BUFFER]=Buffer.concat(buffers);let type=options&&void 0!==options.type&&String(options.type).toLowerCase();type&&!/[^\u0020-\u007E]/.test(type)&&(this[TYPE]=type)}get size(){return this[BUFFER].length}get type(){return this[TYPE]}slice(){const size=this.size,start=arguments[0],end=arguments[1];let relativeStart,relativeEnd;relativeStart=void 0===start?0:start<0?Math.max(size+start,0):Math.min(start,size),relativeEnd=void 0===end?size:end<0?Math.max(size+end,0):Math.min(end,size);const span=Math.max(relativeEnd-relativeStart,0),slicedBuffer=this[BUFFER].slice(relativeStart,relativeStart+span),blob=new Blob([],{type:arguments[2]});return blob[BUFFER]=slicedBuffer,blob}}function FetchError(message,type,systemError){Error.call(this,message),this.message=message,this.type=type,systemError&&(this.code=this.errno=systemError.code),Error.captureStackTrace(this,this.constructor)}let convert;Object.defineProperties(Blob.prototype,{size:{enumerable:!0},type:{enumerable:!0},slice:{enumerable:!0}}),Object.defineProperty(Blob.prototype,Symbol.toStringTag,{value:"Blob",writable:!1,enumerable:!1,configurable:!0}),FetchError.prototype=Object.create(Error.prototype),FetchError.prototype.constructor=FetchError,FetchError.prototype.name="FetchError";try{convert=require("encoding").convert}catch(e){}const INTERNALS=Symbol("Body internals"),PassThrough=Stream.PassThrough;function Body(body){var _this=this,_ref=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},_ref$size=_ref.size;let size=void 0===_ref$size?0:_ref$size;var _ref$timeout=_ref.timeout;let timeout=void 0===_ref$timeout?0:_ref$timeout;null==body?body=null:"string"==typeof body||isURLSearchParams(body)||body instanceof Blob||Buffer.isBuffer(body)||"[object ArrayBuffer]"===Object.prototype.toString.call(body)||ArrayBuffer.isView(body)||body instanceof Stream||(body=String(body)),this[INTERNALS]={body:body,disturbed:!1,error:null},this.size=size,this.timeout=timeout,body instanceof Stream&&body.on("error",function(err){const error="AbortError"===err.name?err:new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`,"system",err);_this[INTERNALS].error=error})}function consumeBody(){var _this4=this;if(this[INTERNALS].disturbed)return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));if(this[INTERNALS].disturbed=!0,this[INTERNALS].error)return Body.Promise.reject(this[INTERNALS].error);if(null===this.body)return Body.Promise.resolve(Buffer.alloc(0));if("string"==typeof this.body)return Body.Promise.resolve(Buffer.from(this.body));if(this.body instanceof Blob)return Body.Promise.resolve(this.body[BUFFER]);if(Buffer.isBuffer(this.body))return Body.Promise.resolve(this.body);if("[object ArrayBuffer]"===Object.prototype.toString.call(this.body))return Body.Promise.resolve(Buffer.from(this.body));if(ArrayBuffer.isView(this.body))return Body.Promise.resolve(Buffer.from(this.body.buffer,this.body.byteOffset,this.body.byteLength));if(!(this.body instanceof Stream))return Body.Promise.resolve(Buffer.alloc(0));let accum=[],accumBytes=0,abort=!1;return new Body.Promise(function(resolve,reject){let resTimeout;_this4.timeout&&(resTimeout=setTimeout(function(){abort=!0,reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`,"body-timeout"))},_this4.timeout)),_this4.body.on("error",function(err){"AbortError"===err.name?(abort=!0,reject(err)):reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`,"system",err))}),_this4.body.on("data",function(chunk){if(!abort&&null!==chunk){if(_this4.size&&accumBytes+chunk.length>_this4.size)return abort=!0,void reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`,"max-size"));accumBytes+=chunk.length,accum.push(chunk)}}),_this4.body.on("end",function(){if(!abort){clearTimeout(resTimeout);try{resolve(Buffer.concat(accum))}catch(err){reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`,"system",err))}}})})}function convertBody(buffer,headers){if("function"!=typeof convert)throw new Error("The package `encoding` must be installed to use the textConverted() function");const ct=headers.get("content-type");let res,str,charset="utf-8";return ct&&(res=/charset=([^;]*)/i.exec(ct)),str=buffer.slice(0,1024).toString(),!res&&str&&(res=/<meta.+?charset=(['"])(.+?)\1/i.exec(str)),!res&&str&&(res=/<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str))&&(res=/charset=(.*)/i.exec(res.pop())),!res&&str&&(res=/<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str)),res&&("gb2312"!==(charset=res.pop())&&"gbk"!==charset||(charset="gb18030")),convert(buffer,"UTF-8",charset).toString()}function isURLSearchParams(obj){return"object"==typeof obj&&"function"==typeof obj.append&&"function"==typeof obj.delete&&"function"==typeof obj.get&&"function"==typeof obj.getAll&&"function"==typeof obj.has&&"function"==typeof obj.set&&("URLSearchParams"===obj.constructor.name||"[object URLSearchParams]"===Object.prototype.toString.call(obj)||"function"==typeof obj.sort)}function clone(instance){let p1,p2,body=instance.body;if(instance.bodyUsed)throw new Error("cannot clone body after it is used");return body instanceof Stream&&"function"!=typeof body.getBoundary&&(p1=new PassThrough,p2=new PassThrough,body.pipe(p1),body.pipe(p2),instance[INTERNALS].body=p1,body=p2),body}function extractContentType(instance){const body=instance.body;return null===body?null:"string"==typeof body?"text/plain;charset=UTF-8":isURLSearchParams(body)?"application/x-www-form-urlencoded;charset=UTF-8":body instanceof Blob?body.type||null:Buffer.isBuffer(body)?null:"[object ArrayBuffer]"===Object.prototype.toString.call(body)?null:ArrayBuffer.isView(body)?null:"function"==typeof body.getBoundary?`multipart/form-data;boundary=${body.getBoundary()}`:null}function getTotalBytes(instance){const body=instance.body;return null===body?0:"string"==typeof body?Buffer.byteLength(body):isURLSearchParams(body)?Buffer.byteLength(String(body)):body instanceof Blob?body.size:Buffer.isBuffer(body)?body.length:"[object ArrayBuffer]"===Object.prototype.toString.call(body)?body.byteLength:ArrayBuffer.isView(body)?body.byteLength:body&&"function"==typeof body.getLengthSync&&(body._lengthRetrievers&&0==body._lengthRetrievers.length||body.hasKnownLength&&body.hasKnownLength())?body.getLengthSync():null}function writeToStream(dest,instance){const body=instance.body;null===body?dest.end():"string"==typeof body?(dest.write(body),dest.end()):isURLSearchParams(body)?(dest.write(Buffer.from(String(body))),dest.end()):body instanceof Blob?(dest.write(body[BUFFER]),dest.end()):Buffer.isBuffer(body)?(dest.write(body),dest.end()):"[object ArrayBuffer]"===Object.prototype.toString.call(body)?(dest.write(Buffer.from(body)),dest.end()):ArrayBuffer.isView(body)?(dest.write(Buffer.from(body.buffer,body.byteOffset,body.byteLength)),dest.end()):body.pipe(dest)}Body.prototype={get body(){return this[INTERNALS].body},get bodyUsed(){return this[INTERNALS].disturbed},arrayBuffer(){return consumeBody.call(this).then(function(buf){return buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)})},blob(){let ct=this.headers&&this.headers.get("content-type")||"";return consumeBody.call(this).then(function(buf){return Object.assign(new Blob([],{type:ct.toLowerCase()}),{[BUFFER]:buf})})},json(){var _this2=this;return consumeBody.call(this).then(function(buffer){try{return JSON.parse(buffer.toString())}catch(err){return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`,"invalid-json"))}})},text(){return consumeBody.call(this).then(function(buffer){return buffer.toString()})},buffer(){return consumeBody.call(this)},textConverted(){var _this3=this;return consumeBody.call(this).then(function(buffer){return convertBody(buffer,_this3.headers)})}},Object.defineProperties(Body.prototype,{body:{enumerable:!0},bodyUsed:{enumerable:!0},arrayBuffer:{enumerable:!0},blob:{enumerable:!0},json:{enumerable:!0},text:{enumerable:!0}}),Body.mixIn=function(proto){for(const name of Object.getOwnPropertyNames(Body.prototype))if(!(name in proto)){const desc=Object.getOwnPropertyDescriptor(Body.prototype,name);Object.defineProperty(proto,name,desc)}},Body.Promise=global.Promise;const invalidTokenRegex=/[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/,invalidHeaderCharRegex=/[^\t\x20-\x7e\x80-\xff]/;function validateName(name){if(name=`${name}`,invalidTokenRegex.test(name))throw new TypeError(`${name} is not a legal HTTP header name`)}function validateValue(value){if(value=`${value}`,invalidHeaderCharRegex.test(value))throw new TypeError(`${value} is not a legal HTTP header value`)}function find(map,name){name=name.toLowerCase();for(const key in map)if(key.toLowerCase()===name)return key}const MAP=Symbol("map");class Headers{constructor(){let init=arguments.length>0&&void 0!==arguments[0]?arguments[0]:void 0;if(this[MAP]=Object.create(null),init instanceof Headers){const rawHeaders=init.raw(),headerNames=Object.keys(rawHeaders);for(const headerName of headerNames)for(const value of rawHeaders[headerName])this.append(headerName,value)}else if(null==init);else{if("object"!=typeof init)throw new TypeError("Provided initializer must be an object");{const method=init[Symbol.iterator];if(null!=method){if("function"!=typeof method)throw new TypeError("Header pairs must be iterable");const pairs=[];for(const pair of init){if("object"!=typeof pair||"function"!=typeof pair[Symbol.iterator])throw new TypeError("Each header pair must be iterable");pairs.push(Array.from(pair))}for(const pair of pairs){if(2!==pair.length)throw new TypeError("Each header pair must be a name/value tuple");this.append(pair[0],pair[1])}}else for(const key of Object.keys(init)){const value=init[key];this.append(key,value)}}}}get(name){validateName(name=`${name}`);const key=find(this[MAP],name);return void 0===key?null:this[MAP][key].join(", ")}forEach(callback){let thisArg=arguments.length>1&&void 0!==arguments[1]?arguments[1]:void 0,pairs=getHeaders(this),i=0;for(;i<pairs.length;){var _pairs$i=pairs[i];const name=_pairs$i[0],value=_pairs$i[1];callback.call(thisArg,value,name,this),pairs=getHeaders(this),i++}}set(name,value){value=`${value}`,validateName(name=`${name}`),validateValue(value);const key=find(this[MAP],name);this[MAP][void 0!==key?key:name]=[value]}append(name,value){value=`${value}`,validateName(name=`${name}`),validateValue(value);const key=find(this[MAP],name);void 0!==key?this[MAP][key].push(value):this[MAP][name]=[value]}has(name){return validateName(name=`${name}`),void 0!==find(this[MAP],name)}delete(name){validateName(name=`${name}`);const key=find(this[MAP],name);void 0!==key&&delete this[MAP][key]}raw(){return this[MAP]}keys(){return createHeadersIterator(this,"key")}values(){return createHeadersIterator(this,"value")}[Symbol.iterator](){return createHeadersIterator(this,"key+value")}}function getHeaders(headers){let kind=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"key+value";return Object.keys(headers[MAP]).sort().map("key"===kind?function(k){return k.toLowerCase()}:"value"===kind?function(k){return headers[MAP][k].join(", ")}:function(k){return[k.toLowerCase(),headers[MAP][k].join(", ")]})}Headers.prototype.entries=Headers.prototype[Symbol.iterator],Object.defineProperty(Headers.prototype,Symbol.toStringTag,{value:"Headers",writable:!1,enumerable:!1,configurable:!0}),Object.defineProperties(Headers.prototype,{get:{enumerable:!0},forEach:{enumerable:!0},set:{enumerable:!0},append:{enumerable:!0},has:{enumerable:!0},delete:{enumerable:!0},keys:{enumerable:!0},values:{enumerable:!0},entries:{enumerable:!0}});const INTERNAL=Symbol("internal");function createHeadersIterator(target,kind){const iterator=Object.create(HeadersIteratorPrototype);return iterator[INTERNAL]={target:target,kind:kind,index:0},iterator}const HeadersIteratorPrototype=Object.setPrototypeOf({next(){if(!this||Object.getPrototypeOf(this)!==HeadersIteratorPrototype)throw new TypeError("Value of `this` is not a HeadersIterator");var _INTERNAL=this[INTERNAL];const target=_INTERNAL.target,kind=_INTERNAL.kind,index=_INTERNAL.index,values=getHeaders(target,kind);return index>=values.length?{value:void 0,done:!0}:(this[INTERNAL].index=index+1,{value:values[index],done:!1})}},Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));function exportNodeCompatibleHeaders(headers){const obj=Object.assign({__proto__:null},headers[MAP]),hostHeaderKey=find(headers[MAP],"Host");return void 0!==hostHeaderKey&&(obj[hostHeaderKey]=obj[hostHeaderKey][0]),obj}function createHeadersLenient(obj){const headers=new Headers;for(const name of Object.keys(obj))if(!invalidTokenRegex.test(name))if(Array.isArray(obj[name]))for(const val of obj[name])invalidHeaderCharRegex.test(val)||(void 0===headers[MAP][name]?headers[MAP][name]=[val]:headers[MAP][name].push(val));else invalidHeaderCharRegex.test(obj[name])||(headers[MAP][name]=[obj[name]]);return headers}Object.defineProperty(HeadersIteratorPrototype,Symbol.toStringTag,{value:"HeadersIterator",writable:!1,enumerable:!1,configurable:!0});const INTERNALS$1=Symbol("Response internals"),STATUS_CODES=http.STATUS_CODES;class Response{constructor(){let body=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,opts=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};Body.call(this,body,opts);const status=opts.status||200;this[INTERNALS$1]={url:opts.url,status:status,statusText:opts.statusText||STATUS_CODES[status],headers:new Headers(opts.headers)}}get url(){return this[INTERNALS$1].url}get status(){return this[INTERNALS$1].status}get ok(){return this[INTERNALS$1].status>=200&&this[INTERNALS$1].status<300}get statusText(){return this[INTERNALS$1].statusText}get headers(){return this[INTERNALS$1].headers}clone(){return new Response(clone(this),{url:this.url,status:this.status,statusText:this.statusText,headers:this.headers,ok:this.ok})}}Body.mixIn(Response.prototype),Object.defineProperties(Response.prototype,{url:{enumerable:!0},status:{enumerable:!0},ok:{enumerable:!0},statusText:{enumerable:!0},headers:{enumerable:!0},clone:{enumerable:!0}}),Object.defineProperty(Response.prototype,Symbol.toStringTag,{value:"Response",writable:!1,enumerable:!1,configurable:!0});const INTERNALS$2=Symbol("Request internals"),parse_url=Url.parse,format_url=Url.format,streamDestructionSupported="destroy"in Stream.Readable.prototype;function isRequest(input){return"object"==typeof input&&"object"==typeof input[INTERNALS$2]}function isAbortSignal(signal){const proto=signal&&"object"==typeof signal&&Object.getPrototypeOf(signal);return!(!proto||"AbortSignal"!==proto.constructor.name)}class Request{constructor(input){let parsedURL,init=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};isRequest(input)?parsedURL=parse_url(input.url):(parsedURL=input&&input.href?parse_url(input.href):parse_url(`${input}`),input={});let method=init.method||input.method||"GET";if(method=method.toUpperCase(),(null!=init.body||isRequest(input)&&null!==input.body)&&("GET"===method||"HEAD"===method))throw new TypeError("Request with GET/HEAD method cannot have body");let inputBody=null!=init.body?init.body:isRequest(input)&&null!==input.body?clone(input):null;Body.call(this,inputBody,{timeout:init.timeout||input.timeout||0,size:init.size||input.size||0});const headers=new Headers(init.headers||input.headers||{});if(null!=init.body){const contentType=extractContentType(this);null===contentType||headers.has("Content-Type")||headers.append("Content-Type",contentType)}let signal=isRequest(input)?input.signal:null;if("signal"in init&&(signal=init.signal),null!=signal&&!isAbortSignal(signal))throw new TypeError("Expected signal to be an instanceof AbortSignal");this[INTERNALS$2]={method:method,redirect:init.redirect||input.redirect||"follow",headers:headers,parsedURL:parsedURL,signal:signal},this.follow=void 0!==init.follow?init.follow:void 0!==input.follow?input.follow:20,this.compress=void 0!==init.compress?init.compress:void 0===input.compress||input.compress,this.counter=init.counter||input.counter||0,this.agent=init.agent||input.agent}get method(){return this[INTERNALS$2].method}get url(){return format_url(this[INTERNALS$2].parsedURL)}get headers(){return this[INTERNALS$2].headers}get redirect(){return this[INTERNALS$2].redirect}get signal(){return this[INTERNALS$2].signal}clone(){return new Request(this)}}function getNodeRequestOptions(request){const parsedURL=request[INTERNALS$2].parsedURL,headers=new Headers(request[INTERNALS$2].headers);if(headers.has("Accept")||headers.set("Accept","*/*"),!parsedURL.protocol||!parsedURL.hostname)throw new TypeError("Only absolute URLs are supported");if(!/^https?:$/.test(parsedURL.protocol))throw new TypeError("Only HTTP(S) protocols are supported");if(request.signal&&request.body instanceof Stream.Readable&&!streamDestructionSupported)throw new Error("Cancellation of streamed requests with AbortSignal is not supported in node < 8");let contentLengthValue=null;if(null==request.body&&/^(POST|PUT)$/i.test(request.method)&&(contentLengthValue="0"),null!=request.body){const totalBytes=getTotalBytes(request);"number"==typeof totalBytes&&(contentLengthValue=String(totalBytes))}return contentLengthValue&&headers.set("Content-Length",contentLengthValue),headers.has("User-Agent")||headers.set("User-Agent","node-fetch/1.0 (+https://github.com/bitinn/node-fetch)"),request.compress&&!headers.has("Accept-Encoding")&&headers.set("Accept-Encoding","gzip,deflate"),headers.has("Connection")||request.agent||headers.set("Connection","close"),Object.assign({},parsedURL,{method:request.method,headers:exportNodeCompatibleHeaders(headers),agent:request.agent})}function AbortError(message){Error.call(this,message),this.type="aborted",this.message=message,Error.captureStackTrace(this,this.constructor)}Body.mixIn(Request.prototype),Object.defineProperty(Request.prototype,Symbol.toStringTag,{value:"Request",writable:!1,enumerable:!1,configurable:!0}),Object.defineProperties(Request.prototype,{method:{enumerable:!0},url:{enumerable:!0},headers:{enumerable:!0},redirect:{enumerable:!0},clone:{enumerable:!0},signal:{enumerable:!0}}),AbortError.prototype=Object.create(Error.prototype),AbortError.prototype.constructor=AbortError,AbortError.prototype.name="AbortError";const PassThrough$1=Stream.PassThrough,resolve_url=Url.resolve;function fetch(url,opts){if(!fetch.Promise)throw new Error("native promise missing, set fetch.Promise to your favorite alternative");return Body.Promise=fetch.Promise,new fetch.Promise(function(resolve,reject){const request=new Request(url,opts),options=getNodeRequestOptions(request),send=("https:"===options.protocol?https:http).request,signal=request.signal;let response=null;const abort=function abort(){let error=new AbortError("The user aborted a request.");reject(error),request.body&&request.body instanceof Stream.Readable&&request.body.destroy(error),response&&response.body&&response.body.emit("error",error)};if(signal&&signal.aborted)return void abort();const abortAndFinalize=function abortAndFinalize(){abort(),finalize()},req=send(options);let reqTimeout;function finalize(){req.abort(),signal&&signal.removeEventListener("abort",abortAndFinalize),clearTimeout(reqTimeout)}signal&&signal.addEventListener("abort",abortAndFinalize),request.timeout&&req.once("socket",function(socket){reqTimeout=setTimeout(function(){reject(new FetchError(`network timeout at: ${request.url}`,"request-timeout")),finalize()},request.timeout)}),req.on("error",function(err){reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`,"system",err)),finalize()}),req.on("response",function(res){clearTimeout(reqTimeout);const headers=createHeadersLenient(res.headers);if(fetch.isRedirect(res.statusCode)){const location=headers.get("Location"),locationURL=null===location?null:resolve_url(request.url,location);switch(request.redirect){case"error":return reject(new FetchError(`redirect mode is set to error: ${request.url}`,"no-redirect")),void finalize();case"manual":if(null!==locationURL)try{headers.set("Location",locationURL)}catch(err){reject(err)}break;case"follow":if(null===locationURL)break;if(request.counter>=request.follow)return reject(new FetchError(`maximum redirect reached at: ${request.url}`,"max-redirect")),void finalize();const requestOpts={headers:new Headers(request.headers),follow:request.follow,counter:request.counter+1,agent:request.agent,compress:request.compress,method:request.method,body:request.body,signal:request.signal};return 303!==res.statusCode&&request.body&&null===getTotalBytes(request)?(reject(new FetchError("Cannot follow redirect with body being a readable stream","unsupported-redirect")),void finalize()):(303!==res.statusCode&&(301!==res.statusCode&&302!==res.statusCode||"POST"!==request.method)||(requestOpts.method="GET",requestOpts.body=void 0,requestOpts.headers.delete("content-length")),resolve(fetch(new Request(locationURL,requestOpts))),void finalize())}}res.once("end",function(){signal&&signal.removeEventListener("abort",abortAndFinalize)});let body=res.pipe(new PassThrough$1);const response_options={url:request.url,status:res.statusCode,statusText:res.statusMessage,headers:headers,size:request.size,timeout:request.timeout},codings=headers.get("Content-Encoding");if(!request.compress||"HEAD"===request.method||null===codings||204===res.statusCode||304===res.statusCode)return response=new Response(body,response_options),void resolve(response);const zlibOptions={flush:zlib.Z_SYNC_FLUSH,finishFlush:zlib.Z_SYNC_FLUSH};if("gzip"==codings||"x-gzip"==codings)return body=body.pipe(zlib.createGunzip(zlibOptions)),response=new Response(body,response_options),void resolve(response);if("deflate"!=codings&&"x-deflate"!=codings)response=new Response(body,response_options),resolve(response);else{res.pipe(new PassThrough$1).once("data",function(chunk){body=8==(15&chunk[0])?body.pipe(zlib.createInflate()):body.pipe(zlib.createInflateRaw()),response=new Response(body,response_options),resolve(response)})}}),writeToStream(req,request)})}fetch.isRedirect=function(code){return 301===code||302===code||303===code||307===code||308===code},fetch.Promise=global.Promise;var lib=Object.freeze({default:fetch,Headers:Headers,Request:Request,Response:Response,FetchError:FetchError}),dayjs_min=createCommonjsModule(function(module,exports){module.exports=function(){var t="millisecond",e="second",n="minute",r="hour",s="day",i="week",a="month",u="year",c=/^(\d{4})-?(\d{1,2})-?(\d{0,2})(.*?(\d{1,2}):(\d{1,2}):(\d{1,2}))?.?(\d{1,3})?$/,o=/\[.*?\]|Y{2,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,h={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},d=function(t,e,n){var r=String(t);return!r||r.length>=e?t:""+Array(e+1-r.length).join(n)+t},f={padStart:d,padZoneStr:function(t){var e=Math.abs(t),n=Math.floor(e/60),r=e%60;return(t<=0?"+":"-")+d(n,2,"0")+":"+d(r,2,"0")},monthDiff:function(t,e){var n=12*(e.year()-t.year())+(e.month()-t.month()),r=t.clone().add(n,"months"),s=e-r<0,i=t.clone().add(n+(s?-1:1),"months");return Number(-(n+(e-r)/(s?r-i:i-r)))},absFloor:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},prettyUnit:function(c){return{M:a,y:u,w:i,d:s,h:r,m:n,s:e,ms:t}[c]||String(c||"").toLowerCase().replace(/s$/,"")},isUndefined:function(t){return void 0===t}},$="en",l={};l[$]=h;var m=function(t){return t instanceof D},y=function(t,e,n){var r;if(!t)return null;if("string"==typeof t)l[t]&&(r=t),e&&(l[t]=e,r=t);else{var s=t.name;l[s]=t,r=s}return n||($=r),r},M=function(t,e){if(m(t))return t.clone();var n=e||{};return n.date=t,new D(n)},S=function(t,e){return M(t,{locale:e.$L})},p=f;p.parseLocale=y,p.isDayjs=m,p.wrapper=S;var D=function(){function h(t){this.parse(t)}var d=h.prototype;return d.parse=function(t){var e,n;this.$d=null===(e=t.date)?new Date(NaN):p.isUndefined(e)?new Date:e instanceof Date?e:"string"==typeof e&&/.*[^Z]$/i.test(e)&&(n=e.match(c))?new Date(n[1],n[2]-1,n[3]||1,n[5]||0,n[6]||0,n[7]||0,n[8]||0):new Date(e),this.init(t)},d.init=function(t){this.$y=this.$d.getFullYear(),this.$M=this.$d.getMonth(),this.$D=this.$d.getDate(),this.$W=this.$d.getDay(),this.$H=this.$d.getHours(),this.$m=this.$d.getMinutes(),this.$s=this.$d.getSeconds(),this.$ms=this.$d.getMilliseconds(),this.$L=this.$L||y(t.locale,null,!0)||$},d.$utils=function(){return p},d.isValid=function(){return!("Invalid Date"===this.$d.toString())},d.$compare=function(t){return this.valueOf()-M(t).valueOf()},d.isSame=function(t){return 0===this.$compare(t)},d.isBefore=function(t){return this.$compare(t)<0},d.isAfter=function(t){return this.$compare(t)>0},d.year=function(){return this.$y},d.month=function(){return this.$M},d.day=function(){return this.$W},d.date=function(){return this.$D},d.hour=function(){return this.$H},d.minute=function(){return this.$m},d.second=function(){return this.$s},d.millisecond=function(){return this.$ms},d.unix=function(){return Math.floor(this.valueOf()/1e3)},d.valueOf=function(){return this.$d.getTime()},d.startOf=function(t,c){var o=this,h=!!p.isUndefined(c)||c,d=function(t,e){var n=S(new Date(o.$y,e,t),o);return h?n:n.endOf(s)},f=function(t,e){return S(o.toDate()[t].apply(o.toDate(),h?[0,0,0,0].slice(e):[23,59,59,999].slice(e)),o)};switch(p.prettyUnit(t)){case u:return h?d(1,0):d(31,11);case a:return h?d(1,this.$M):d(0,this.$M+1);case i:return d(h?this.$D-this.$W:this.$D+(6-this.$W),this.$M);case s:case"date":return f("setHours",0);case r:return f("setMinutes",1);case n:return f("setSeconds",2);case e:return f("setMilliseconds",3);default:return this.clone()}},d.endOf=function(t){return this.startOf(t,!1)},d.$set=function(i,c){switch(p.prettyUnit(i)){case s:this.$d.setDate(this.$D+(c-this.$W));break;case"date":this.$d.setDate(c);break;case a:this.$d.setMonth(c);break;case u:this.$d.setFullYear(c);break;case r:this.$d.setHours(c);break;case n:this.$d.setMinutes(c);break;case e:this.$d.setSeconds(c);break;case t:this.$d.setMilliseconds(c)}return this.init(),this},d.set=function(t,e){return this.clone().$set(t,e)},d.add=function(t,c){var o=this;t=Number(t);var h,d=p.prettyUnit(c),f=function(e,n){var r=o.set("date",1).set(e,n+t);return r.set("date",Math.min(o.$D,r.daysInMonth()))},$=function(e){var n=new Date(o.$d);return n.setDate(n.getDate()+e*t),S(n,o)};if(d===a)return f(a,this.$M);if(d===u)return f(u,this.$y);if(d===s)return $(1);if(d===i)return $(7);switch(d){case n:h=6e4;break;case r:h=36e5;break;case e:h=1e3;break;default:h=1}var l=this.valueOf()+t*h;return S(l,this)},d.subtract=function(t,e){return this.add(-1*t,e)},d.format=function(t){var e=this,n=t||"YYYY-MM-DDTHH:mm:ssZ",r=p.padZoneStr(this.$d.getTimezoneOffset()),s=this.$locale(),i=s.weekdays,a=s.months,u=function(t,e,n,r){return t&&t[e]||n[e].substr(0,r)};return n.replace(o,function(t){if(t.indexOf("[")>-1)return t.replace(/\[|\]/g,"");switch(t){case"YY":return String(e.$y).slice(-2);case"YYYY":return String(e.$y);case"M":return String(e.$M+1);case"MM":return p.padStart(e.$M+1,2,"0");case"MMM":return u(s.monthsShort,e.$M,a,3);case"MMMM":return a[e.$M];case"D":return String(e.$D);case"DD":return p.padStart(e.$D,2,"0");case"d":return String(e.$W);case"dd":return u(s.weekdaysMin,e.$W,i,2);case"ddd":return u(s.weekdaysShort,e.$W,i,3);case"dddd":return i[e.$W];case"H":return String(e.$H);case"HH":return p.padStart(e.$H,2,"0");case"h":case"hh":return 0===e.$H?12:p.padStart(e.$H<13?e.$H:e.$H-12,"hh"===t?2:1,"0");case"a":return e.$H<12?"am":"pm";case"A":return e.$H<12?"AM":"PM";case"m":return String(e.$m);case"mm":return p.padStart(e.$m,2,"0");case"s":return String(e.$s);case"ss":return p.padStart(e.$s,2,"0");case"SSS":return p.padStart(e.$ms,3,"0");case"Z":return r;default:return r.replace(":","")}})},d.diff=function(t,c,o){var h=p.prettyUnit(c),d=M(t),f=this-d,$=p.monthDiff(this,d);switch(h){case u:$/=12;break;case a:break;case"quarter":$/=3;break;case i:$=f/6048e5;break;case s:$=f/864e5;break;case r:$=f/36e5;break;case n:$=f/6e4;break;case e:$=f/1e3;break;default:$=f}return o?$:p.absFloor($)},d.daysInMonth=function(){return this.endOf(a).$D},d.$locale=function(){return l[this.$L]},d.locale=function(t,e){var n=this.clone();return n.$L=y(t,e,!0),n},d.clone=function(){return S(this.toDate(),this)},d.toDate=function(){return new Date(this.$d)},d.toArray=function(){return[this.$y,this.$M,this.$D,this.$H,this.$m,this.$s,this.$ms]},d.toJSON=function(){return this.toISOString()},d.toISOString=function(){return this.toDate().toISOString()},d.toObject=function(){return{years:this.$y,months:this.$M,date:this.$D,hours:this.$H,minutes:this.$m,seconds:this.$s,milliseconds:this.$ms}},d.toString=function(){return this.$d.toUTCString()},h}();return M.extend=function(t,e){return t(e,D,M),M},M.locale=y,M.isDayjs=m,M.unix=function(t){return M(1e3*t)},M.en=l[$],M}()}),fetch$1=getCjsExportFromNamespace(lib),calculatorV1_0_0Raw=createCommonjsModule(function(module){const calculator=module.exports={};calculator.add=async function(payload){const res=await fetch$1(`http://localhost:3000/add?a=${payload.a}&b=${payload.b}`),json=await res.json(),today=dayjs_min().format("s")/1;return await(ms=>new Promise((resolve,reject)=>{setTimeout(resolve,ms)}))(today),json.sum}});module.exports=calculatorV1_0_0Raw;
