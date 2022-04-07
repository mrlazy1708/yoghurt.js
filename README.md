# yoghurt.js

🎨 Tidy & lightweight in-place HTML editor. 



## Quick hack

1. Open Web page. Bring up the console (`⌘ + ⌥ + C` on Mac): 

2. Load Scripts

```js
Object.assign(document.head.appendChild(document.createElement(`script`)), { type: `text/javascript`, src: `https://js.little-yoghurt.com/yoghurt.js` })
Object.assign(document.head.appendChild(document.createElement(`link`)), { rel: `stylesheet`, href: `https://js.little-yoghurt.com/yoghurt.css` })
```
3. Take Control

```js
yoghurt.enter() // pass the element as subtree root. default to `document.body`
```



## Functionality

- Copy, paste and delete
- Drag & drop to move elements around
- Resize (With magnetic attaching and auxiliary lines)
- Edit text content with double-click
