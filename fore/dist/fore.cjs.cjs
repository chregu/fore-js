"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var e=require("axios"),t=require("uuid"),r=require("humps"),s=require("dataframe-js");function n(e){return e&&"object"==typeof e&&"default"in e?e:{default:e}}var i=n(e),o=n(s);const a={GROUNDEDNESS:"GROUNDEDNESS",SIMILARITY:"SIMILARITY"};exports.Foresight=class{constructor({apiToken:e,apiUrl:t="https://foresight-gatewayservice-dev.azurewebsites.net",uiUrl:s="https://icy-sand.foreai.co",maxEntriesBeforeAutoFlush:n=10,logLevel:o="info",axiosInstance:a}){this.apiToken=e,this.apiUrl=t,this.uiUrl=s,this.maxEntriesBeforeAutoFlush=n,this.axiosInstance=a||i.default.create(),this.timeoutSeconds=60,this.logEntries=[],this.logging=console,this.logging.info("Foresight client initialized"),this.axiosInstance.interceptors.response.use((e=>{if(e.data)try{e.data=r.camelizeKeys(e.data)}catch(e){}return e}))}async _makeRequest({method:e,endpoint:t,params:r=null,inputJson:s=null}){try{return(await this.axiosInstance.request({method:e,url:`${this.apiUrl}${t}`,headers:{Authorization:`Bearer ${this.apiToken}`},params:r,data:s,timeout:1e3*this.timeoutSeconds})).data}catch(e){throw e.response&&this.logging.error("api:error:",`${e.response.status} : ${e.response.statusText}`),e}}async createSimpleEvalset({evalsetId:e,queries:r,referenceAnswers:s=null}){try{if(null==e||null==r)throw new Error("evalsetId and queries are required.");if(s&&r.length!==s.length)throw new Error("Number of queries and references must match.");const n={evalset_id:e,evalset_entries:r.map(((e,r)=>({query:e,reference_answer:s?s[r]:null,entry_id:t.v4()})))},i=await this._makeRequest({method:"post",endpoint:"/api/eval/set",inputJson:n});return this.logging.info(`Eval set with evalsetId ${e} created.`),i}catch(e){const t=e.message;throw this.logging.error("createSimpleEvalset:error:",t),new Error(t)}}async getEvalset({evalsetId:e}){try{return await this._makeRequest({method:"get",endpoint:"/api/eval/set",params:{evalset_id:e}})}catch(e){const t=e.message;throw this.logging.error("getEvalset:error:",t),new Error(t)}}async getEvalrunQueries({experimentId:e}){try{return await this._makeRequest({method:"get",endpoint:"/api/eval/run/queries",params:{experiment_id:e}})}catch(e){const t=e.message;throw this.logging.error("getEvalrunQueries:error:",t),new Error(t)}}async createEvalrun({runConfig:e}){try{const t=await this._makeRequest({method:"post",endpoint:"/api/eval/run",inputJson:{evalset_id:e.evalsetId,experiment_id:e.experimentId,metrics:e.metrics}});return this.logging.info(`Eval run with experimentId ${e.experimentId} created.`),t}catch(e){const t=e.message;throw this.logging.error("createEvalrun:error:",t),new Error(t)}}async generateAnswersAndRunEval({generateFn:e,runConfig:t}){try{await this.createEvalrun({runConfig:t});const r=t.experimentId,s=await this.getEvalrunQueries({experimentId:r}),n={};for(const[t,r]of Object.entries(s)){const{generatedResponse:s,contexts:i}=e(r);n[t]={generated_response:s,contexts:i}}const i={experiment_id:r,entry_id_to_inference_output:n},o=await this._makeRequest({method:"put",endpoint:"/api/eval/run/entries",inputJson:i});return this.logging.info("Eval run successful. Visit %s to view results.",this.uiUrl),o}catch(e){const t=e.message;throw this.logging.error("generateAnswersAndRunEval:error:",t),new Error(t)}}async flush(){try{if(0===this.logEntries.length)return void this.logging.info("No log entries to flush.");const e={log_entries:this.logEntries},t=await this._makeRequest({method:"put",endpoint:"/api/eval/log",inputJson:e});return this.logging.log("Log entries flushed successfully. Visit %s to view results.",this.uiUrl),this.logEntries=[],t}catch(e){const t=e.message;throw this.logging.error("flush:error:",t),new Error(t)}}async log({query:e,response:t,contexts:r}){try{const s={query:e,inference_output:{generated_response:t,contexts:r}};this.logEntries.push(s),this.logEntries.length>=this.maxEntriesBeforeAutoFlush&&await this.flush()}catch(e){const t=e.message;throw this.logging.error("log:error:",t),new Error(t)}}async _convertEvalRunDetailsToDataFrame(e){try{const s={query:[],reference_answer:[],generated_answer:[],source_docids:[],contexts:[]},n=[a.GROUNDEDNESS,a.SIMILARITY];for(const e of n)s[e.toLowerCase()]=[];for(const t of e.entries){s.query.push(t.input.query),s.reference_answer.push(t.input.reference_answer),s.generated_answer.push(t.output.generated_response),s.source_docids.push(t.output.source_docids),s.contexts.push(t.output.contexts);for(const e of n)e in t.metric_values?s[e.toLowerCase()].push(t.metric_values[e]):s[e.toLowerCase()].push(null)}return t=r.camelizeKeys(s),new o.default(t)}catch(e){throw e}var t}async getEvalrunDetails({experimentId:e,sortBy:t="input.query",limit:r=100,convertToDataframe:s=!0}){try{const n={experiment_id:e};null!==r&&null!==t&&(n.sort_field_name=t,n.limit=r.toString());const i=await this._makeRequest({method:"get",endpoint:"/api/eval/run/details",params:n});return s?await this._convertEvalRunDetailsToDataFrame(i):i}catch(e){const t=e.message;throw this.logging.error("getEvalrunDetails:error:",t),new Error(t)}}},exports.MetricType=a;
