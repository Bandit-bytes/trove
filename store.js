<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Trove — buy low, sell high</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Trove">
<meta name="theme-color" content="#f5ead8">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link href="https://fonts.googleapis.com/css2?family=Caprasimo&family=Figtree:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f5ead8; --surface:#ebddc5; --text:#201e1d;
  --accent:#c67139; --accent-100:#fff2eb; --accent-200:#ffe1d0; --accent-300:#ffc6a5;
  --accent-600:#b2622d; --accent-700:#8c491a; --accent-800:#643312; --accent-900:#402310;
  --sage-100:#f0fae1; --sage-200:#e1eecc; --sage-300:#ccdbb2; --sage-600:#728157; --sage-700:#56633f; --sage-800:#3d472b;
  --n-100:#f9f4ed; --n-200:#eee7db; --n-300:#dcd3c4; --n-400:#c0b6a5; --n-600:#82796a; --n-700:#645c50; --n-800:#474238;
  --divider:rgba(32,30,29,.16);
  --shadow-sm:0 1px 2px rgba(46,43,37,.14); --shadow-md:0 3px 10px rgba(46,43,37,.16); --shadow-lg:0 12px 32px rgba(46,43,37,.22);
  --font-h:"Caprasimo",Georgia,serif; --font-b:"Figtree",system-ui,sans-serif;
  --safe-top:env(safe-area-inset-top,0px); --safe-bot:env(safe-area-inset-bottom,0px);
}
*,*::before,*::after{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-b);font-size:15px;line-height:1.55;
  -webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;overscroll-behavior-y:none}
h1,h2,h3,h4{font-family:var(--font-h);font-weight:400;line-height:1.12;letter-spacing:-.015em;margin:0 0 8px}
h2{font-size:30px} h3{font-size:23px} h4{font-size:19px}
p{margin:0 0 12px}
a{color:var(--accent-700)} a:hover{color:var(--accent-800)}
button,input,select{font:inherit;color:inherit}
:focus{outline:none}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
::selection{background:rgba(198,113,57,.3)}
.hide{display:none!important}

#app{max-width:520px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;position:relative}
header.top{padding:calc(var(--safe-top) + 14px) 18px 10px;display:flex;align-items:flex-end;gap:10px}
.brand{font-family:var(--font-h);font-size:25px;line-height:1}
.kicker{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-700);margin-top:5px}
main{flex:1;overflow-y:auto;padding:0 18px calc(112px + var(--safe-bot));-webkit-overflow-scrolling:touch}
nav.tabs{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;gap:2px;padding:8px 10px calc(10px + var(--safe-bot));
  background:linear-gradient(to top,var(--bg) 64%,rgba(245,234,216,0));max-width:520px;margin:0 auto}
nav.tabs button{flex:1;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;gap:4px;
  padding:7px 0;color:var(--n-600);cursor:pointer;min-height:52px}
nav.tabs button[aria-current="page"]{color:var(--accent)}
nav.tabs span{font-size:9.5px}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;text-decoration:none;
  font-family:var(--font-h);font-size:14px;line-height:1.2;color:var(--text);background:transparent;
  border:1px solid transparent;padding:11px 16px;border-radius:999px;min-height:44px}
.btn-primary{background:var(--accent);color:var(--bg)}
.btn-primary:active{background:var(--accent-700)}
.btn-secondary{border-color:var(--divider)}
.btn-secondary:active{background:rgba(32,30,29,.1)}
.btn-ghost{color:var(--accent-700);padding:8px 10px;min-height:40px}
.btn-block{width:100%}
.btn:disabled{opacity:.45}
.icon-btn{width:44px;height:44px;padding:0;border-radius:999px;background:var(--surface);border:0;display:grid;place-items:center;cursor:pointer}
.tag{display:inline-flex;align-items:center;font-size:11px;padding:3px 10px;border-radius:999px;background:var(--n-100);color:var(--n-800)}
.tag-accent{background:var(--accent-100);color:var(--accent-800)}
.tag-sage{background:var(--sage-100);color:var(--sage-800)}
.card{background:var(--surface);border-radius:28px;padding:15px}
.mono{display:grid;place-items:center;border-radius:50%;font-family:var(--font-h);flex:none}
label.f{display:block;font-size:12px;margin-bottom:5px;color:var(--n-700)}
input.in,select.in{width:100%;min-height:44px;padding:8px 14px;background:var(--surface);border:1px solid var(--divider);
  border-radius:999px;caret-color:var(--accent);font-size:16px}
.seg{display:flex;background:var(--n-200);border-radius:999px;padding:0;overflow:hidden}
.seg button{flex:1;border:0;background:transparent;padding:10px 4px;font-size:12.5px;color:var(--n-700);cursor:pointer;border-radius:999px;min-height:42px}
.seg button[aria-pressed="true"]{background:var(--accent);color:var(--bg)}
.chips{display:flex;gap:7px;overflow-x:auto;padding:0 18px 14px;margin:0 -18px;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{flex:none;border:1px solid var(--n-400);background:transparent;color:var(--n-800);font-size:12px;
  padding:8px 14px;border-radius:999px;cursor:pointer;min-height:38px}
.chip[aria-pressed="true"]{background:var(--accent-800);color:var(--accent-100);border-color:var(--accent-800)}
.row{display:flex;align-items:center;gap:11px;width:100%;text-align:left;border:0;background:var(--surface);
  border-radius:24px;padding:11px 13px;cursor:pointer;min-height:64px}
.row:active{background:var(--n-300)}
.ellip{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.muted{color:var(--n-600)}
.up{color:var(--sage-700)} .down{color:var(--accent-700)}
.sheet-back{position:fixed;inset:0;z-index:60;background:rgba(32,30,29,.42);display:flex;flex-direction:column;justify-content:flex-end}
.sheet{background:var(--bg);border-radius:34px 34px 0 0;box-shadow:var(--shadow-lg);max-height:92%;display:flex;flex-direction:column;
  animation:up .25s cubic-bezier(.2,.9,.3,1);max-width:520px;width:100%;margin:0 auto}
.sheet-body{overflow-y:auto;padding:4px 20px 0}
.sheet-foot{padding:14px 20px calc(20px + var(--safe-bot));display:flex;gap:9px}
.grab{width:44px;height:5px;border-radius:999px;background:var(--n-400);margin:14px auto 12px}
@keyframes up{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fade{from{opacity:0}to{opacity:1}}
.screen{animation:fade .16s ease-out}
.toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + var(--safe-bot));z-index:80;
  background:rgba(32,30,29,.92);color:var(--n-100);padding:11px 18px;border-radius:999px;font-size:13px;box-shadow:var(--shadow-lg)}
.stat{flex:1;background:var(--bg);border-radius:18px;padding:11px}
.stat b{font-family:var(--font-h);font-weight:400;font-size:19px;display:block}
.stat span{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--n-600)}
.bar{height:8px;border-radius:999px;background:var(--n-300);overflow:hidden}
.bar>i{display:block;height:100%;border-radius:999px;background:var(--accent-600)}
.switch{width:46px;height:28px;border-radius:999px;border:0;padding:3px;display:flex;background:var(--n-400);cursor:pointer}
.switch[aria-checked="true"]{background:var(--accent);justify-content:flex-end}
.switch i{width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:var(--shadow-sm)}
.linkrow{display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;padding:7px 0;min-height:44px}
.sk{background:var(--n-200);border-radius:16px;animation:pulse 1.2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
</style>
</head>
<body>
<div id="app">
  <header class="top" id="top"></header>
  <main id="main"></main>
  <nav class="tabs" id="tabs"></nav>
</div>
<div id="overlay"></div>
<script src="config.js"></script>
<script src="data.js"></script>
<script src="store.js"></script>
<script src="app.js"></script>
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
</script>
</body>
</html>
