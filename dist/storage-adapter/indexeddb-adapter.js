var K=Object.defineProperty;var g=(h,t)=>K(h,"name",{value:t,configurable:!0});var A=typeof window!="undefined"&&!!window.__loki_idb_debug;A&&console.log("DEBUG: Running indexeddb-adapter in DEBUG mode");var d=class{constructor(t,o){if(this.app="loki",this.options=o||{},typeof t!="undefined"&&(this.app=t),this.catalog=null,!this.checkAvailability())throw new Error("IndexedDB does not seem to be supported for your environment")}closeDatabase(){this.catalog&&this.catalog.db&&(this.catalog.db.close(),this.catalog.db=null)}checkAvailability(){return!!(typeof indexedDB!="undefined"&&indexedDB)}loadDatabase(t,o){let a=this.app,s=this;if(this.catalog===null||this.catalog.db===null){this.catalog=new y(n=>{s.catalog=n,s.loadDatabase(t,o)});return}this.catalog.getAppKey(a,t,({id:n,val:e})=>{if(typeof o=="function"){if(n===0){o(null);return}o(e)}else console.log(e)})}saveDatabase(t,o,a){let s=this.app,n=this;function e(r){r&&r.success===!0?a(null):a(new Error("Error saving database")),n.options.closeAfterSave&&n.closeDatabase()}if(g(e,"saveCallback"),this.catalog===null||this.catalog.db===null){this.catalog=new y(()=>{n.saveDatabase(t,o,e)});return}this.catalog.setAppKey(s,t,o,e)}deleteDatabase(t,o){let a=this.app,s=this;if(this.catalog===null||this.catalog.db===null){this.catalog=new y(n=>{s.catalog=n,s.deleteDatabase(t,o)});return}this.catalog.getAppKey(a,t,n=>{let e=n.id;e!==0?s.catalog.deleteAppKey(e,o):typeof o=="function"&&o({success:!0})})}deleteDatabasePartitions(t){let o=this;this.getDatabaseList(a=>{a.forEach(s=>{s.startsWith(t)&&o.deleteDatabase(s)})})}getDatabaseList(t){let o=this.app,a=this;if(this.catalog===null||this.catalog.db===null){this.catalog=new y(s=>{a.catalog=s,a.getDatabaseList(t)});return}this.catalog.getAppKeys(o,s=>{let n=[];for(let e=0;e<s.length;e++)n.push(s[e].key);typeof t=="function"?t(n):n.forEach(e=>{console.log(e)})})}getCatalogSummary(t){let o=this.app,a=this;if(this.catalog===null||this.catalog.db===null){this.catalog=new y(s=>{a.catalog=s,a.getCatalogSummary(t)});return}this.catalog.getAllKeys(s=>{let n=[],e,r,p,i,l;for(let c=0;c<s.length;c++)e=s[c],p=e.app||"",i=e.key||"",l=e.val||"",r=p.length*2+i.length*2+l.length+1,n.push({app:e.app,key:e.key,size:r});typeof t=="function"?t(n):n.forEach(c=>{console.log(c)})})}};g(d,"IndexedDBAdapter");d.prototype.loadKey=d.prototype.loadDatabase;d.prototype.saveKey=d.prototype.saveDatabase;d.prototype.deleteKey=d.prototype.deleteDatabase;d.prototype.getKeyList=d.prototype.getDatabaseList;var y=class{constructor(t){this.db=null,this.initializeLokiCatalog(t)}initializeLokiCatalog(t){let o=indexedDB.open("SylvieCatalog",1),a=this;o.onupgradeneeded=({target:s})=>{let n=s.result;if(n.objectStoreNames.contains("SylvieAKV")&&n.deleteObjectStore("SylvieAKV"),!n.objectStoreNames.contains("SylvieAKV")){let e=n.createObjectStore("SylvieAKV",{keyPath:"id",autoIncrement:!0});e.createIndex("app","app",{unique:!1}),e.createIndex("key","key",{unique:!1}),e.createIndex("appkey","appkey",{unique:!0})}},o.onsuccess=({target:s})=>{a.db=s.result,typeof t=="function"&&t(a)},o.onerror=s=>{throw s}}getAppKey(t,o,a){let e=this.db.transaction(["SylvieAKV"],"readonly").objectStore("SylvieAKV").index("appkey"),r=`${t},${o}`,p=e.get(r);p.onsuccess=(i=>({target:l})=>{let c=l.result;(c===null||typeof c=="undefined")&&(c={id:0,success:!1}),typeof i=="function"?i(c):console.log(c)})(a),p.onerror=(i=>l=>{if(typeof i=="function")i({id:0,success:!1});else throw l})(a)}getAppKeyById(t,o,a){let e=this.db.transaction(["SylvieAKV"],"readonly").objectStore("SylvieAKV").get(t);e.onsuccess=((r,p)=>({target:i})=>{typeof p=="function"?p(i.result,r):console.log(i.result)})(a,o)}setAppKey(t,o,a,s){let e=this.db.transaction(["SylvieAKV"],"readwrite").objectStore("SylvieAKV"),r=e.index("appkey"),p=`${t},${o}`,i=r.get(p);i.onsuccess=({target:l})=>{let c=l.result;c==null?c={app:t,key:o,appkey:`${t},${o}`,val:a}:c.val=a;let f=e.put(c);f.onerror=(u=>v=>{typeof u=="function"?u({success:!1}):(console.error("SylvieCatalog.setAppKey (set) onerror"),console.error(i.error))})(s),f.onsuccess=(u=>v=>{typeof u=="function"&&u({success:!0})})(s)},i.onerror=(l=>c=>{typeof l=="function"?l({success:!1}):(console.error("SylvieCatalog.setAppKey (get) onerror"),console.error(i.error))})(s)}deleteAppKey(t,o){let n=this.db.transaction(["SylvieAKV"],"readwrite").objectStore("SylvieAKV").delete(t);n.onsuccess=(e=>r=>{typeof e=="function"&&e({success:!0})})(o),n.onerror=(e=>r=>{typeof e=="function"?e({success:!1}):(console.error("SylvieCatalog.deleteAppKey raised onerror"),console.error(n.error))})(o)}getAppKeys(t,o){let n=this.db.transaction(["SylvieAKV"],"readonly").objectStore("SylvieAKV").index("app"),e=IDBKeyRange.only(t),r=n.openCursor(e),p=[];r.onsuccess=((i,l)=>({target:c})=>{let f=c.result;if(f){let u=f.value;i.push(u),f.continue()}else typeof l=="function"?l(i):console.log(i)})(p,o),r.onerror=(i=>l=>{typeof i=="function"?i(null):(console.error("SylvieCatalog.getAppKeys raised onerror"),console.error(l))})(o)}getAllKeys(t){let s=this.db.transaction(["SylvieAKV"],"readonly").objectStore("SylvieAKV").openCursor(),n=[];s.onsuccess=((e,r)=>({target:p})=>{let i=p.result;if(i){let l=i.value;e.push(l),i.continue()}else typeof r=="function"?r(e):console.log(e)})(n,t),s.onerror=(e=>r=>{typeof e=="function"&&e(null)})(t)}};g(y,"SylvieCatalog");typeof window!="undefined"&&Object.assign(window,{IndexedDBAdapter:d});
//# sourceMappingURL=indexeddb-adapter.js.map
