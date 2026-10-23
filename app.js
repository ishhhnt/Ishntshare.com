import{initializeApp}from"https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import{getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,GoogleAuthProvider,signInWithPopup,signOut,sendEmailVerification,sendPasswordResetEmail,updatePassword,EmailAuthProvider,reauthenticateWithCredential}from"https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import{getFirestore,doc,getDoc,setDoc,updateDoc,deleteDoc,collection,query,where,onSnapshot,addDoc,orderBy,limit,documentId,serverTimestamp,arrayUnion}from"https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const app=initializeApp({apiKey:"AIzaSyCJkg8OOu3szJmBnvbbND6BJYT_9aQVExg",authDomain:"ishntt-f8b74.firebaseapp.com",projectId:"ishntt-f8b74",storageBucket:"ishntt-f8b74.firebasestorage.app",messagingSenderId:"1002308007099",appId:"1:1002308007099:web:ed0f89596a74f522bba59e"});
const auth=getAuth(app),db=getFirestore(app),W="https://ishntbot.ishantgiri2004g.workers.dev";

const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cid=(a,b)=>[a,b].sort().join("_"),imgUrl=id=>W+"/image/"+id,ms=t=>t?.toMillis?t.toMillis():(t||Date.now());

let me=null,guest=false,posts=[],mode="login",signing=false,ready=false,panelOpen=false,curChat=null,unsubMsgs=null;
const profiles=new Map(),chats=new Map(),watching=new Set(),T0=Date.now();

const seen=()=>JSON.parse(localStorage.getItem("seen_"+me.uid)||"{}"),setSeen=(id,t)=>{const s=seen();s[id]=t;localStorage.setItem("seen_"+me.uid,JSON.stringify(s))};
const av=(n,p,c="")=>p?`<img class="av ${c}" src="${esc(p)}" alt="" data-l="${esc((n||"?")[0].toUpperCase())}" onerror="avErr(this)">`:`<span class="av ${c}">${esc((n||"?")[0].toUpperCase())}</span>`;
let tt;function toast(html,fn){const t=$("toast");t.innerHTML=html;t.onclick=fn||null;t.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("show"),3500)}
const say=m=>toast(esc(m));
async function busy(b,fn){b.classList.add("spin");try{return await fn()}catch(e){console.error(e);say(errMsg(e))}finally{b.classList.remove("spin")}}
function errMsg(e){const c=e.code||"";return({"auth/invalid-credential":"Incorrect email or password.","auth/email-already-in-use":"This email is already registered.","auth/invalid-email":"Enter the email in a valid format.","auth/popup-closed-by-user":"Google sign-in was cancelled.","auth/user-not-found":"This email isn't registered.","auth/wrong-password":"Incorrect password.","auth/too-many-requests":"Too many attempts. Wait 5 minutes and try again.","auth/weak-password":"Choose a stronger password (min 6 characters).","auth/requires-recent-login":"Log in again and retry.","auth/network-request-failed":"Network error. Check your connection."})[c]||(navigator.onLine?"Something went wrong. Try again.":"You're offline.")}
function dlg(title,body,ok,onOk){const o=document.createElement("div");o.className="ov";o.innerHTML=`<div class="sheet g"><h3>${title}</h3>${body}<div class="row" style="justify-content:flex-end"><button class="btn" data-x>Cancel</button>${ok?`<button class="btn pri" data-ok>${ok}</button>`:""}</div></div>`;document.body.appendChild(o);const close=()=>o.remove();o.onclick=e=>{if(e.target===o||e.target.dataset.x!==undefined)close()};const b=o.querySelector("[data-ok]");if(b)b.onclick=()=>busy(b,async()=>{if(await onOk(o)!==false)close()});return o}
async function getUserProfile(uid,force){if(!uid||uid.startsWith("g_"))return null;if(!force&&profiles.has(uid))return profiles.get(uid);try{const s=await getDoc(doc(db,"users",uid));const d=s.exists()?{uid,...s.data()}:null;profiles.set(uid,d);return d}catch{return profiles.get(uid)||null}}
async function upload(file,extra){const f=new FormData();f.append("file",file);f.append("username",extra.username||me.username);f.append("uid",me.uid);f.append("caption",extra.caption||"");f.append("tags",extra.tags||"");const r=await fetch(W+"/upload",{method:"POST",body:f});if(!r.ok)throw Error("upload");return(await r.json()).id}

/* AUTH */
const setMode=m=>{mode=m;$("aForgot").classList.toggle("hide",m!="login");$("aUser").classList.toggle("hide",m!="sign");$("aGoT").textContent=m=="sign"?"Create account":"Log in";$("tLogin").classList.toggle("pri",m=="login");$("tSign").classList.toggle("pri",m=="sign");$("aErr").textContent=""};
$("tLogin").onclick=()=>setMode("login");$("tSign").onclick=()=>setMode("sign");
const okName=n=>/^[a-z0-9_.]{3,20}$/.test(n);
async function nameFree(n){return!(await getDoc(doc(db,"usernames",n))).exists()}
async function makeProfile(u,name,pic){await setDoc(doc(db,"usernames",name),{uid:u.uid,email:u.email||"",createdAt:serverTimestamp()});await setDoc(doc(db,"users",u.uid),{username:name,email:u.email||"",profilePic:pic||"",createdAt:serverTimestamp()})}
$("aGo").onclick=()=>busy($("aGo"),async()=>{const e=$("aMail").value.trim(),p=$("aPass").value,n=$("aUser").value.trim().toLowerCase(),er=$("aErr");er.textContent="";
 if(!e||!p){er.textContent="Enter both email and password.";return}
 if(mode=="login"){await signInWithEmailAndPassword(auth,e,p);return}
 if(!okName(n)){er.textContent="Username must be 3-20 characters: a-z, 0-9, _ or .";return}
 if(!(await nameFree(n))){er.textContent="That username is taken. Choose another.";return}
 let sent=false;signing=true;try{const c=await createUserWithEmailAndPassword(auth,e,p);await makeProfile(c.user,n,"");try{await sendEmailVerification(c.user);sent=true}catch{}}finally{signing=false}await init(auth.currentUser);sent?mailSent("verify"):say("Account created, but the verification email failed. Tap Resend in the banner.")});
$("aGoogle").onclick=()=>busy($("aGoogle"),async()=>{await signInWithPopup(auth,new GoogleAuthProvider())});
$("aSkip").onclick=()=>{let g=localStorage.getItem("guestId");if(!g){g="g_"+Math.random().toString(36).slice(2,10);localStorage.setItem("guestId",g)}guest=true;me={uid:g,username:"guest_"+g.slice(2,6),guest:true};start()};
$("aForgot").onclick=()=>dlg("Reset password",`<input class="in" id="fe" type="email" placeholder="Your account email" value="${esc($("aMail").value.trim())}">`,"Send link",async o=>{const e=o.querySelector("#fe").value.trim();if(!e){say("Enter your email.");return false}await sendPasswordResetEmail(auth,e);mailSent("reset")});
function mailSent(k){const v=k=="verify";dlg(v?"📧 Verification email sent!":"📧 Password reset email sent!",`<div>From: <b>noreply@ishntt-f8b74.firebaseapp.com</b></div><div>Check your Inbox and your <b>Spam</b> folder.</div><div style="color:var(--m)">${v?"After tapping the link, press “I’ve verified” in the banner or refresh the page.":"Open the link, set a new password, then log in."}</div>`,"Got it",()=>{})}
const canAct=()=>{if(guest||me?.verified)return true;say("Verify your email first. Use Resend in the banner.");return false};
onAuthStateChanged(auth,u=>{if(signing)return;if(u)init(u);else if(!guest){ready=false;syncHeaderLogo();$("auth").classList.remove("hide");$("app").classList.add("hide")}});
async function init(u){guest=false;try{await u.reload()}catch{}let p=await getUserProfile(u.uid,true);
 if(!p){await new Promise(res=>{const d=dlg("Choose a username",`<input class="in" id="nn" placeholder="username" autocapitalize="none"><div id="ne" style="color:var(--rd);font-size:13px"></div>`,"Save",async o=>{const n=o.querySelector("#nn").value.trim().toLowerCase();if(!okName(n)){o.querySelector("#ne").textContent="3-20 characters: a-z, 0-9, _ .";return false}if(!(await nameFree(n))){o.querySelector("#ne").textContent="That username is taken.";return false}await makeProfile(u,n,u.photoURL);res()});d.onclick=null;d.querySelector("[data-x]").remove()});p=await getUserProfile(u.uid,true)}
 me={uid:u.uid,username:p.username,email:u.email,profilePic:p.profilePic,contacts:p.contacts||[],verified:u.emailVerified,pw:u.providerData.some(x=>x.providerId=="password")};start();if(!me.verified)say("Verify your email to post, comment and chat.")}
let headerLogoTimer;
function syncHeaderLogo(){
 clearTimeout(headerLogoTimer);
 const logo=$("headerLogo"),username=!guest&&me?.username;
 logo.classList.remove("fading");
 if(!username){logo.textContent="ISHNTTCHAT";return}
 let showingUsername=true;
 logo.textContent=username;
 const transition=()=>{
  logo.classList.add("fading");
  headerLogoTimer=setTimeout(()=>{
   showingUsername=!showingUsername;
   logo.textContent=showingUsername?username:"ISHNTTCHAT";
   logo.classList.remove("fading");
   headerLogoTimer=setTimeout(transition,5000)
  },350)
 };
 headerLogoTimer=setTimeout(transition,5000)
}
function start(){$("auth").classList.add("hide");$("app").classList.remove("hide");syncHeaderLogo();ready=true;updVerify();nav("home");loadImages();if(!guest){startNotif()}}

/* GALLERY */
async function loadImages() {
  const el = $("grid");
  if (el) el.innerHTML = '<div class="sp" style="grid-column:1/-1"></div>';
  
  try {
    const r = await fetch(W + "/list");
    const j = await r.json();
    posts = (j.images || [])
      .filter(p => !/__(dp|chat)__/.test(p.tags || p.caption || ""))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (e) {
    if (!posts.length && el) {
      el.innerHTML = '<div class="empty" style="grid-column:1/-1">Couldn\'t load posts. Check connection.</div>';
      return;
    }
  }
  renderGallery();
}

function filtered(){const q=$("q").value.trim().toLowerCase();if(!q)return posts;return posts.filter(p=>q[0]=="#"?(p.tags||"").toLowerCase().includes(q):[p.username,p.caption,p.tags].join(" ").toLowerCase().includes(q))}
function renderGallery(list=filtered(),el=$("grid")){el.innerHTML="";if(!list.length){el.innerHTML='<div class="empty" style="grid-column:1/-1">Nothing here yet 🌙<br>Be the first to post!</div>';return}list.forEach(p=>el.appendChild(makeCard(p)))}
function makeCard(p){const c=document.createElement("div");c.className="card g";c.innerHTML=`<img class="pic" loading="lazy" src="${imgUrl(p.id)}" alt=""><div class="meta"><span data-a>${av(p.username)}</span><b>${esc(p.username)}</b></div>`;c.onclick=()=>openPostView(p);getUserProfile(p.uid).then(u=>{if(u)c.querySelector("[data-a]").innerHTML=av(u.username,u.profilePic);if(u)c.querySelector("b").textContent=u.username});return c}
function fullView(p){const v=document.createElement("div");v.className="fv";v.innerHTML=`<img src="${imgUrl(p.id)}" alt=""><button class="ib" aria-label="Close">${IC.x}</button><div class="fvc"><b>${esc(p.username)}</b>${p.caption?`<span>${esc(p.caption)}</span>`:""}</div>`;v.onclick=()=>{v.classList.add("out");setTimeout(()=>v.remove(),180)};document.body.appendChild(v)}
function openPostView(p){const own=!guest&&me.uid===p.uid;const o=document.createElement("div");o.className="ov pv";
 const tags=(p.tags||"").split(/[\s,]+/).filter(Boolean).map(t=>`<span class="tag">${esc(t)}</span>`).join("");
 o.innerHTML=`<div class="sheet g pvs"><div class="grab"></div><div class="row"><span data-a>${av(p.username,"","m")}</span><div style="flex:1;min-width:0"><b>${esc(p.username)}</b>${p.date&&!isNaN(new Date(p.date))?`<small>${new Date(p.date).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}</small>`:""}</div><button class="ib" data-x aria-label="Close">${IC.x}</button></div><div class="pvi"><img class="big" src="${imgUrl(p.id)}" alt=""></div><div id="cap">${esc(p.caption)}</div><div id="tg">${tags}</div>
 <div class="row pva"><button class="btn pri" id="vw">${IC.expand} View image</button><button class="btn sq" id="dl" aria-label="Download">${IC.dl}</button>${own?`<button class="btn sq" id="ed" aria-label="Edit post">${IC.edit}</button><button class="btn sq dng" id="de" aria-label="Delete post">${IC.trash}</button>`:""}</div>
 <div id="cms" style="display:flex;flex-direction:column;gap:6px"></div>
 <div class="row"><input class="in" id="ci" placeholder="${guest?"Log in to comment":"Write a comment…"}" ${guest?"disabled":""}><button class="btn pri" id="cs" ${guest?"disabled":""}>Send</button></div></div>`;
 document.body.appendChild(o);const $$=s=>o.querySelector(s);
 getUserProfile(p.uid).then(u=>{if(u){$$("[data-a]").innerHTML=av(u.username,u.profilePic,"m");$$("b").textContent=u.username}});
 const cm=l=>{$$("#cms").innerHTML=(l||[]).length?l.map(c=>`<div class="cm"><b>${esc(c.username)}</b> ${esc(c.text)}</div>`).join(""):'<div class="empty" style="padding:10px">No comments yet. Start the conversation.</div>'};cm(p.comments);
 o.onclick=e=>{if(e.target===o||e.target.dataset.x!==undefined)o.remove();if(e.target.classList.contains("tag")){$("q").value=e.target.textContent;nav("home");renderGallery();o.remove()}};
 $$("#dl").onclick=e=>busy(e.target,async()=>{const b=await(await fetch(imgUrl(p.id))).blob();const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=(p.username||"post")+"_"+p.id+".jpg";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)});
 $$("#vw").onclick=$$(".pvi").onclick=()=>fullView(p);
 $$("#cs").onclick=e=>busy(e.target,async()=>{if(!canAct())return;const t=$$("#ci").value.trim();if(!t)return;const r=await fetch(W+"/comment/"+p.id,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:t,username:me.username})});const j=await r.json();if(!j.success)throw Error();p.comments=j.comments;cm(j.comments);$$("#ci").value=""});
 if(own){$$("#de").onclick=e=>{if(!confirm("Delete this post?"))return;busy(e.target,async()=>{const r=await fetch(W+"/delete/"+p.id,{method:"DELETE"});if(!(await r.json()).success)throw Error();posts=posts.filter(x=>x.id!=p.id);o.remove();renderGallery();if(!$("profile").classList.contains("hide"))openProfile();say("Post deleted.")})};
 $$("#ed").onclick=()=>dlg("Edit post",`<input class="in" id="ec" value="${esc(p.caption)}" placeholder="Caption"><input class="in" id="et" value="${esc(p.tags)}" placeholder="#tags">`,"Save",async d=>{const caption=d.querySelector("#ec").value.trim(),tags=normTags(d.querySelector("#et").value);const r=await fetch(W+"/edit/"+p.id,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({caption,tags})});if(!(await r.json()).success)throw Error();p.caption=caption;p.tags=tags;$$("#cap").textContent=caption;$$("#tg").innerHTML=tags.split(" ").filter(Boolean).map(t=>`<span class="tag">${esc(t)}</span>`).join("");renderGallery()})}}
const normTags=s=>s.split(/[\s,]+/).filter(Boolean).map(t=>t[0]=="#"?t:"#"+t).join(" ");

function openUpload(){
  if(guest){say("Guest mode: You can only view and download images. Log in to post.");return}
  if(!canAct())return;
  
  dlg("New post",`<input class="in" id="uf" type="file" accept="image/*"><input class="in" id="uc" placeholder="Write a caption"><input class="in" id="ut" placeholder="#anime #nature #cars">`,"Upload",async d=>{
    const f=d.querySelector("#uf").files[0];
    if(!f){say("Choose an image first.");return false}
    if(f.size>15e6){say("Image must be under 15MB.");return false}
    await upload(f,{caption:d.querySelector("#uc").value.trim(),tags:normTags(d.querySelector("#ut").value)});
    say("Post uploaded ✓");await loadImages();
  })
}

/* PROFILE */
async function openProfile(){const el=$("profile");
 if(guest){el.innerHTML=`<div class="card g" style="padding:20px;gap:12px;cursor:default;align-items:center;text-align:center">${av(me.username,"","l")}<h3>${esc(me.username)}</h3><div style="color:var(--m)">Guest mode — log in to use chat and profile.</div><button class="btn pri" id="gl">Login / Signup</button></div>`;$("gl").onclick=()=>{guest=false;me=null;ready=false;$("app").classList.add("hide");$("auth").classList.remove("hide")};return}
 const mine=posts.filter(p=>p.uid==me.uid);
 el.innerHTML=`<div class="card g" style="padding:20px;gap:14px;cursor:default"><div class="row">${av(me.username,me.profilePic,"l")}<div style="min-width:0"><h3>@${esc(me.username)}</h3><div style="color:var(--m);overflow:hidden;text-overflow:ellipsis">${esc(me.email)}</div></div></div>
 <div class="stats"><div><b>${mine.length}</b><span>Posts</span></div><div><b>${chats.size}</b><span>Chats</span></div></div>
 <div class="row" style="flex-wrap:wrap"><button class="btn" id="cu">Change username</button><button class="btn" id="cp">Change photo</button>${me.pw?'<button class="btn" id="cw">Change password</button>':""}</div><button class="btn pri wide" id="lo"><span>Logout</span><i>${IC.out}</i></button></div>
 <h3 style="margin:18px 4px 10px">My posts</h3><div class="grid p3" id="mg"></div>`;
 renderGallery(mine,$("mg"));
 $("lo").onclick=async()=>{await signOut(auth);me=null;watching.clear();chats.clear();$("panel").classList.remove("open")};
 $("cp").onclick=()=>$("fDp").click();
 $("cw")&&($("cw").onclick=()=>dlg("Change password",`<input class="in" id="p0" type="password" placeholder="Current password"><input class="in" id="p1" type="password" placeholder="New password (min 6 characters)"><input class="in" id="p2" type="password" placeholder="Confirm new password">`,"Update",async o=>{const a=o.querySelector("#p0").value,b=o.querySelector("#p1").value,c=o.querySelector("#p2").value,u=auth.currentUser;if(!a||!b){say("Fill in all fields.");return false}if(b.length<6){say("New password must be at least 6 characters.");return false}if(b!==c){say("Passwords don't match.");return false}if(a===b){say("New password must be different.");return false}
try{await reauthenticateWithCredential(u,EmailAuthProvider.credential(u.email,a))}catch(e){if(/invalid-credential|wrong-password/.test(e.code||"")){say("Current password is incorrect.");return false}throw e}
await updatePassword(u,b);say("Password changed!")}));
 $("cu").onclick=()=>dlg("Change username",`<input class="in" id="nn" placeholder="new username" autocapitalize="none"><div id="ne" style="color:var(--rd);font-size:13px"></div>`,"Change",async o=>{const n=o.querySelector("#nn").value.trim().toLowerCase(),er=o.querySelector("#ne");if(!okName(n)){er.textContent="3-20 characters: a-z, 0-9, _ .";return false}if(n==me.username)return;if(!(await nameFree(n))){er.textContent="That username is taken.";return false}
 await setDoc(doc(db,"usernames",n),{uid:me.uid,email:me.email||"",createdAt:serverTimestamp()});try{await deleteDoc(doc(db,"usernames",me.username))}catch{}await updateDoc(doc(db,"users",me.uid),{username:n});me.username=n;await getUserProfile(me.uid,true);say("Username updated ✓");openProfile()})}
$("fDp").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(!f||guest||!canAct())return;say("Uploading photo…");try{const id=await upload(f,{caption:"__dp__",tags:"__dp__"});me.profilePic=imgUrl(id);await updateDoc(doc(db,"users",me.uid),{profilePic:me.profilePic});await getUserProfile(me.uid,true);say("Photo updated ✓");openProfile()}catch(x){say(errMsg(x))}};

/* CHAT */
function panelList(){curChat=null;unsubMsgs?.();$("panel").innerHTML=`<div class="ph"><b style="flex:1;font-size:18px">Chats</b><button class="ib" id="px" aria-label="Close">${IC.x}</button></div><div style="padding:10px"><input class="in" id="us" placeholder="Search users by username…" autocapitalize="none"></div><div id="ur" style="padding:0 10px"></div><div id="cl" style="flex:1;overflow:auto;padding:6px"></div>`;
 $("px").onclick=closePanel;let t;$("us").oninput=e=>{clearTimeout(t);t=setTimeout(()=>searchUsers(e.target.value.trim().toLowerCase()),300)};renderChatList()}
async function searchUsers(q){const r=$("ur");if(!q){r.innerHTML="";return}try{const s=await onceDocs(query(collection(db,"usernames"),where(documentId(),">=",q),where(documentId(),"<=",q+"\uf8ff"),limit(8)));r.innerHTML="";const rows=s.filter(d=>d.data.uid!=me.uid);if(!rows.length)r.innerHTML='<div class="empty" style="padding:14px">No users found.</div>';
 for(const d of rows){const p=await getUserProfile(d.data.uid);const row=document.createElement("div");row.className="crow";row.innerHTML=`${av(d.id,p?.profilePic,"m")}<div class="tx"><div>@${esc(d.id)}</div></div>`;row.onclick=()=>openConv(d.data.uid);r.appendChild(row)}}catch{say("Search failed. Try again.")}}
const onceDocs=q=>new Promise((res,rej)=>{const u=onSnapshot(q,s=>{u();res(s.docs.map(d=>({id:d.id,data:d.data()})))},e=>{u();rej(e)})});
function renderChatList(){const el=$("cl");if(!el)return;const arr=[...chats.entries()].sort((a,b)=>ms(b[1].lastMessageTime)-ms(a[1].lastMessageTime));if(!arr.length){el.innerHTML='<div class="empty">No chats yet 💬<br>Search a username above to start chatting.</div>';return}
 el.innerHTML="";const s=seen();arr.forEach(([id,c])=>{const o=c.users.find(x=>x!=me.uid),row=document.createElement("div");row.className="crow";const unread=c.lastSender&&c.lastSender!=me.uid&&ms(c.lastMessageTime)>(s[id]||0);
 row.innerHTML=`<span data-a>${av(c.usernames?.[o],c.profilePics?.[o],"m")}</span><div class="tx"><div><b>${esc(c.usernames?.[o]||"user")}</b></div><div><small>${esc(c.lastMessage||"New chat")}</small></div></div>${unread?'<span class="ud"></span>':""}`;row.onclick=()=>openConv(o);el.appendChild(row);
 getUserProfile(o).then(u=>{if(u){row.querySelector("[data-a]").innerHTML=av(u.username,u.profilePic,"m");row.querySelector("b").textContent=u.username}})});}
function updBadge(){const s=seen(),unread=[...chats].some(([id,c])=>c.lastSender&&c.lastSender!=me.uid&&ms(c.lastMessageTime)>(s[id]||0));$("badge").classList.toggle("hide",!unread);$("deskBadge").classList.toggle("hide",!unread)}
function openPanel(){if(guest){say("Log in to use chat.");return}if(!canAct())return;panelOpen=true;$("panel").classList.add("open");curChat?openConv(curChat.other):panelList()}
function closePanel(){panelOpen=false;$("panel").classList.remove("open");unsubMsgs?.()}
function watchChat(id){if(watching.has(id))return;watching.add(id);onSnapshot(doc(db,"chats",id),s=>{if(!s.exists()||!me)return;const c=s.data(),first=!chats.has(id);chats.set(id,c);const t=ms(c.lastMessageTime);
 if(c.lastSender&&c.lastSender!=me.uid){if(curChat?.id==id&&panelOpen)setSeen(id,t);else if(t>T0&&!first||t>T0&&first){const o=c.users.find(x=>x!=me.uid);getUserProfile(o).then(u=>toast(`${av(u?.username||c.lastSenderName,u?.profilePic,"m")}<div><b>${esc(c.lastSenderName||"New message")}</b><div style="color:var(--m);font-size:13px">${esc(c.lastMessage)}</div></div>`,()=>{openPanel();openConv(o)}))}}
 renderChatList();updBadge()},()=>watching.delete(id))}
function startNotif(){me.contacts.forEach(u=>watchChat(cid(me.uid,u)));
 onSnapshot(query(collection(db,"chats"),where("users","array-contains",me.uid)),s=>s.docs.forEach(d=>watchChat(d.id)),()=>{})}
async function openConv(other){const id=cid(me.uid,other),op=await getUserProfile(other);if(!op){say("User not found.");return}
 try{const s=await getDoc(doc(db,"chats",id));if(!s.exists())await setDoc(doc(db,"chats",id),{users:[me.uid,other],usernames:{[me.uid]:me.username,[other]:op.username},profilePics:{[me.uid]:me.profilePic||"",[other]:op.profilePic||""},createdAt:serverTimestamp()});
 if(!me.contacts.includes(other)){me.contacts.push(other);await updateDoc(doc(db,"users",me.uid),{contacts:arrayUnion(other)})}}catch{say("Couldn't open chat.");return}
 watchChat(id);curChat={id,other};panelOpen=true;$("panel").classList.add("open");const el=$("panel");
 el.innerHTML=`<div class="ph"><button class="ib" id="bk" aria-label="Back">${IC.back}</button>${av(op.username,op.profilePic,"m")}<b style="flex:1">@${esc(op.username)}</b><button class="ib" id="px" aria-label="Close">${IC.x}</button></div><div id="msgs"></div><div class="cb"><button class="ib" id="at" aria-label="Attach image">${IC.clip}</button><input class="in" id="mi" placeholder="Write a message…" style="flex:1"><button class="btn pri" id="sd">Send</button></div>`;
 $("bk").onclick=panelList;$("px").onclick=closePanel;$("at").onclick=()=>$("fChat").click();$("sd").onclick=()=>sendMsg();$("mi").onkeydown=e=>{if(e.key=="Enter")sendMsg()};loadMsgs(id);$("mi").focus()}
function loadMsgs(id){unsubMsgs?.();unsubMsgs=onSnapshot(query(collection(db,"chats",id,"messages"),orderBy("createdAt")),s=>{const el=$("msgs");if(!el||curChat?.id!=id)return;el.innerHTML="";if(s.empty)el.innerHTML='<div class="empty">Send the first message 👋</div>';
 s.docs.forEach(d=>{const m=d.data(),own=m.from==me.uid,b=document.createElement("div");b.className="b"+(own?" me":"");const tm=m.createdAt?new Date(ms(m.createdAt)).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"…";
 b.innerHTML=(m.imageUrl?`<img src="${esc(m.imageUrl)}" alt="">`:"")+(m.text?`<span>${esc(m.text)}</span>`:"")+`<small>${tm}${m.edited?" · edited":""}</small>`+(own?'<button class="mm" aria-label="Message options">'+IC.more+'</button>':"");
 if(own)b.querySelector(".mm").onclick=()=>msgMenu(id,d.id,m);el.appendChild(b)});el.scrollTop=el.scrollHeight;setSeen(id,Date.now());updBadge();renderChatList()},()=>say("Couldn't load messages."))}
function msgMenu(id,mid,m){const o=dlg("Message",`<button class="btn" data-ed ${m.text?"":"disabled"}>${IC.edit} Edit</button><button class="btn dng" data-del>${IC.trash} Delete</button>`,null);o.querySelector("[data-ed]").onclick=()=>{o.remove();dlg("Edit message",`<input class="in" id="et" value="${esc(m.text)}">`,"Save",async d=>{const t=d.querySelector("#et").value.trim();if(!t)return false;await updateDoc(doc(db,"chats",id,"messages",mid),{text:t,edited:true})})};
 o.querySelector("[data-del]").onclick=async()=>{o.remove();if(!confirm("Delete this message?"))return;try{await deleteDoc(doc(db,"chats",id,"messages",mid))}catch{say("Couldn't delete.")}}}
async function sendMsg(file){const inp=$("mi");if(!inp||!curChat||!canAct())return;const text=inp.value.trim();if(!text&&!file)return;const{id,other}=curChat;inp.value="";const btn=$("sd");
 try{let imageUrl="";if(file){say("Sending image…");imageUrl=imgUrl(await upload(file,{caption:"__chat__",tags:"__chat__"}))}
 const msg={text,from:me.uid,fromName:me.username,createdAt:serverTimestamp(),edited:false};if(imageUrl)msg.imageUrl=imageUrl;await addDoc(collection(db,"chats",id,"messages"),msg);
 const op=await getUserProfile(other);await setDoc(doc(db,"chats",id),{users:[me.uid,other],usernames:{[me.uid]:me.username,[other]:op?.username||""},profilePics:{[me.uid]:me.profilePic||"",[other]:op?.profilePic||""},lastMessage:text||"📷 Photo",lastMessageTime:serverTimestamp(),lastSender:me.uid,lastSenderName:me.username},{merge:true})}
 catch(e){inp.value=text;say(navigator.onLine?"Message not sent. Try again.":"You're offline — message not sent.")}}
$("fChat").onchange=e=>{const f=e.target.files[0];e.target.value="";if(f)sendMsg(f)};
function updVerify(){$("vb").classList.toggle("hide",guest||!me||me.verified!==false)}
$("vRe").onclick=()=>busy($("vRe"),async()=>{await sendEmailVerification(auth.currentUser);mailSent("verify")});
$("vOk").onclick=()=>busy($("vOk"),async()=>{await auth.currentUser.reload();me.verified=auth.currentUser.emailVerified;updVerify();say(me.verified?"Email verified ✓":"Not verified yet. Open the link in your email first.")});

/* NAV */
function nav(v){["Home","Search","Chat","Prof"].forEach(k=>$("n"+k).classList.remove("on"));$("home").classList.toggle("hide",v=="profile");$("profile").classList.toggle("hide",v!="profile");document.querySelectorAll(".desk-link").forEach(b=>b.classList.remove("active"));if(v=="profile"){$("nProf").classList.add("on");$("deskProf").classList.add("active");openProfile()}else{$("nHome").classList.add("on");$("deskHome").classList.add("active");if(v=="search"){$("nHome").classList.remove("on");$("nSearch").classList.add("on");$("deskHome").classList.remove("active");$("deskSearch").classList.add("active");$("main").scrollTop=0;$("q").focus()}}}
$("nHome").onclick=()=>{$("q").value="";nav("home");renderGallery()};$("nSearch").onclick=()=>nav("search");$("nPost").onclick=openUpload;$("nChat").onclick=()=>{document.querySelectorAll(".desk-link").forEach(b=>b.classList.remove("active"));$("deskChat").classList.add("active");openPanel()};$("chatBtn").onclick=()=>$("nChat").click();$("nProf").onclick=()=>nav("profile");
$("deskHome").onclick=()=>$("nHome").click();$("deskSearch").onclick=()=>$("nSearch").click();$("deskChat").onclick=()=>$("nChat").click();$("deskPost").onclick=()=>$("nPost").click();$("deskProf").onclick=()=>$("nProf").click();
$("q").oninput=()=>{nav("home");renderGallery()};
addEventListener("online",()=>{$("off").classList.add("hide");if(ready)loadImages()});addEventListener("offline",()=>$("off").classList.remove("hide"));if(!navigator.onLine)$("off").classList.remove("hide");
