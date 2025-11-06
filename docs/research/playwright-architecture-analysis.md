# Playwright Architecture Analysis: Building a Custom Testing Assistant Tool

**Analysis Date**: November 6, 2025
**Repository**: Microsoft Playwright (`/tmp/playwright`)
**Focus**: Understanding core architecture for custom tool development

---

## EXECUTIVE SUMMARY

Playwright uses a **client-server architecture with message-passing protocol (channels)** to control browsers via the Chrome DevTools Protocol (CDP). The system is highly modular with clean separation of concerns:

- **Client Layer** (Browser automation API) → **Channel Protocol** (JSON message passing) → **Server Layer** (Browser interaction)
- **EventEmitter-based** event system for async communication
- **ChannelOwner pattern** for object lifecycle management
- **Dispatcher pattern** on server side to handle client requests

### Key Finding: Minimal Tool Design is POSSIBLE
You can extract:
1. **Screenshot capture** - Direct CDP call through `Page.captureScreenshot()`
2. **Console messages** - Event listeners on `Runtime.consoleAPICalled`
3. **localStorage access** - JavaScript evaluation via `Runtime.evaluate()`
4. **Network interception** - Built-in network manager
5. **DOM inspection** - Injected script utilities

**Estimated size**: A lightweight tool using these components would be ~2,000-5,000 LoC vs Playwright's 50,000+ LoC.

---

## PART 1: ARCHITECTURE OVERVIEW

### 1.1 The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER JAVASCRIPT CODE                         │
│  (page.goto(), page.screenshot(), page.evaluate(), etc.)       │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              CLIENT LAYER (playwright-core/client)              │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│ │   Browser    │    Page      │   Frame      │  ElementH.   │  │
│ └──────────────┴──────────────┴──────────────┴──────────────┘  │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│ │  Locator     │  ConsoleMsg  │   Dialog     │   Download   │  │
│ └──────────────┴──────────────┴──────────────┴──────────────┘  │
│                                                                  │
│  All extend: ChannelOwner<T extends Channel>                   │
│  All rely on: Connection class for RPC                         │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│          PROTOCOL LAYER (JSON-based message passing)            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Channel Protocol (@protocol/channels.d.ts)              │  │
│  │ - RPC request/response messages                         │  │
│  │ - Typed interfaces (PageChannel, BrowserChannel, etc.)  │  │
│  │ - Event subscriptions/unsubscriptions                   │  │
│  │ - Binary blob handling for screenshots/videos           │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERVER LAYER (playwright-core/server)              │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ DISPATCHERS (Handle client requests)                      │ │
│ │ ┌──────────┬──────────┬──────────┬──────────┬──────────┐ │ │
│ │ │ Browser  │ Context  │ Page     │ Frame    │ Element  │ │ │
│ │ └──────────┴──────────┴──────────┴──────────┴──────────┘ │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ BROWSER ADAPTERS (Chromium, Firefox, WebKit)             │ │
│ │ ┌──────────────────────────────────────────────────────┐ │ │
│ │ │ Chromium: crConnection, crBrowser, crPage, crInput │ │ │
│ │ │ - Direct CDP protocol handling                      │ │ │
│ │ │ - Screenshot via CDP.Page.captureScreenshot()      │ │ │
│ │ │ - Network interception via CDP                     │ │ │
│ │ │ - Console monitoring via Runtime.consoleAPICalled │ │ │
│ │ └──────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ UTILITIES                                                │ │
│ │ - JavaScript execution context                          │ │
│ │ - DOM utilities & injected scripts                      │ │
│ │ - File upload/download handling                        │ │
│ │ - Accessibility tree generation                        │ │
│ └────────────────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│         CHROME DEVTOOLS PROTOCOL (CDP)                          │
│  - Session-based communication over WebSocket                   │
│  - JSON-RPC request/response model                             │
│  - Event streaming (console, network, etc.)                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Three Core Concepts

#### A. The ChannelOwner Pattern (Client-Side)

All client objects inherit from `ChannelOwner<T extends Channel>`:

```typescript
// From: playwright-core/src/client/channelOwner.ts

export abstract class ChannelOwner<T extends channels.Channel> extends EventEmitter {
  readonly _connection: Connection;
  readonly _type: string;                    // e.g., "Page", "Browser"
  readonly _guid: string;                    // Unique object ID
  readonly _channel: T;                      // Typed RPC stub
  readonly _initializer: channels.InitializerTraits<T>;
  
  constructor(parent: ChannelOwner | Connection, type: string, guid: string, initializer) {
    // Registration with parent connection
    this._connection._objects.set(guid, this);
    
    // Create channel (RPC stub)
    this._channel = this._createChannel(new EventEmitter());
  }
  
  // Event subscription management
  override on(event: string | symbol, listener: Listener): this {
    if (!this.listenerCount(event))
      this._updateSubscription(event, true);  // Tell server to send events
    super.on(event, listener);
    return this;
  }
}
```

**Why it's elegant**:
- Single responsibility: each object manages one remote resource
- Automatic garbage collection through parent tracking
- Event subscription is lazy (only subscribe when listener added)
- Typed channels prevent runtime errors

#### B. The Connection Class (Message Protocol)

```typescript
// From: playwright-core/src/client/connection.ts

export class Connection extends EventEmitter {
  readonly _objects = new Map<string, ChannelOwner>();
  private _callbacks = new Map<number, { resolve, reject, title, type, method }>();
  private _lastId = 0;
  
  async sendMessage(guid: string, method: string, params: any): Promise<any> {
    const id = ++this._lastId;
    const message = { id, guid, method, params };
    
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, { resolve, reject, method, title: ... });
      this.onmessage(message);  // Send to server
    });
  }
  
  async receiveMessage(message: any) {
    if (message.id) {  // Response to a request
      const callback = this._callbacks.get(message.id);
      if (message.error)
        callback.reject(parseError(message.error));
      else
        callback.resolve(message.result);
    } else if (message.method) {  // Event from server
      const object = this._objects.get(message.guid);
      object._channel.emit(message.method, message.params);
    }
  }
}
```

**Why it's powerful**:
- Decoupled from transport mechanism (WebSocket, stdin/stdout, IPC)
- Automatic RPC with request/response correlation via IDs
- Event multiplexing (many objects on one connection)
- Clean error handling with stack traces

#### C. The Dispatcher Pattern (Server-Side)

```typescript
// From: playwright-core/src/server/dispatchers/dispatcher.ts

export class Dispatcher<
  Type extends SdkObject,      // The real object (Page, Browser, etc.)
  ChannelType,                 // The protocol type
  ParentScopeType              // Parent object in hierarchy
> extends EventEmitter implements channels.Channel {
  
  private _object: Type;
  private _scope: DispatcherScope;
  
  async [method: string](params: any): Promise<any> {
    // Route request to real object
    const result = await this._object[method](params);
    
    // Wrap result objects in dispatchers for client access
    return wrapResult(result);
  }
  
  sendEvent(method: string, params: any) {
    // Send event to client
    this._scope.sendMessageToClient({ method, guid: this._guid, params });
  }
}

// Example: PageDispatcher
export class PageDispatcher extends Dispatcher<Page, channels.PageChannel, ...> {
  async screenshot(params: channels.PageScreenshotParams): Promise<Buffer> {
    return await this._object.screenshot(params);
  }
  
  onConsoleMessage(consoleMessage: ConsoleMessage) {
    this.sendEvent('console', { message: consoleMessage });
  }
}
```

**Why it's modular**:
- Server objects are independent of protocol
- Dispatchers act as thin translation layer
- Events sent to client automatically via `sendEvent()`
- Type-safe (implements channels.Channel)

---

## PART 2: KEY COMPONENTS FOR YOUR TOOL

### 2.1 Screenshot Capture

**Location**: `playwright-core/src/server/chromium/crPage.ts` (lines 260-300)

```typescript
// Server side: How Playwright takes screenshots
async screenshot(options: ScreenshotOptions): Promise<Buffer> {
  // 1. Direct CDP call
  const result = await this._client.send('Page.captureScreenshot', {
    format: options.type || 'png',
    quality: options.quality,
    clip: options.clip,
  });
  
  // 2. Return binary data (base64 encoded in protocol, decoded here)
  return Buffer.from(result.data, 'base64');
}
```

**For your custom tool**:
```typescript
// Minimal implementation (60 lines)
class ScreenshotCapture {
  constructor(private cdp: CDPSession) {}
  
  async capture(options?: { format?: 'png' | 'jpeg', quality?: number }): Promise<Buffer> {
    const result = await this.cdp.send('Page.captureScreenshot', {
      format: options?.format || 'png',
      quality: options?.quality || 90,
    });
    return Buffer.from(result.data, 'base64');
  }
}
```

**Key CDP methods**:
- `Page.captureScreenshot()` - Full page screenshot
- `Page.getLayoutMetrics()` - Viewport + layout info
- `DOM.getDocument()` - DOM tree (for element selectors)

---

### 2.2 Console Message Monitoring

**Location**: `playwright-core/src/server/chromium/crPage.ts` (lines 805-830)

**Server implementation**:
```typescript
private _onConsoleAPI(event: Protocol.Runtime.consoleAPICalledPayload) {
  const type = event.type;
  const location = toConsoleMessageLocation(event.stackTrace);
  const args = event.args.map(arg => createHandle(executionContext, arg));
  
  // Send to client
  this._page.addConsoleMessage(type, args, location);
}

// Setup listener during page initialization
eventsHelper.addEventListener(this._client, 'Runtime.consoleAPICalled', 
  event => this._onConsoleAPI(event)
);
```

**Client implementation** (`playwright-core/src/client/page.ts`):
```typescript
// Listen to console events
this._channel.on('console', ({ message }) => {
  this.emit(Events.Page.Console, ConsoleMessage.from(message));
});

// User code
page.on('console', msg => {
  console.log(`[${msg.type()}] ${msg.text()}`);
  msg.args().forEach(arg => console.log(arg));
});
```

**For your custom tool**:
```typescript
class ConsoleMonitor {
  private messages: ConsoleMessage[] = [];
  
  constructor(private cdp: CDPSession) {
    this.cdp.on('Runtime.consoleAPICalled', (event) => {
      this.messages.push({
        type: event.type,
        text: event.args[0]?.value || '',
        location: event.stackTrace,
        timestamp: Date.now(),
      });
    });
    
    // Enable console monitoring
    this.cdp.send('Runtime.enable', {});
  }
  
  getMessages(): ConsoleMessage[] {
    return this.messages;
  }
  
  clear() {
    this.messages = [];
  }
}
```

**Key CDP methods**:
- `Runtime.enable()` - Enable console event streaming
- `Runtime.consoleAPICalled` - Event for console.log/warn/error
- `Runtime.exceptionThrown` - Uncaught exceptions

---

### 2.3 localStorage Access

**Location**: `playwright-core/src/server/browserContext.ts` (lines 1400-1450)

Playwright accesses localStorage via **JavaScript evaluation**:

```typescript
// Server side: Evaluate script in page context
const value = await executionContext.evaluate(() => {
  const data = window.localStorage;
  return JSON.stringify(Object.fromEntries(
    Array.from({ length: data.length }, (_, i) => 
      [data.key(i), data.getItem(data.key(i)!)]
    )
  ));
});
```

**For your custom tool**:
```typescript
class StorageAccessor {
  constructor(private cdp: CDPSession) {}
  
  async getLocalStorage(): Promise<Record<string, string>> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const data = window.localStorage;
        return Object.fromEntries(
          Array.from({ length: data.length }, (_, i) => 
            [data.key(i), data.getItem(data.key(i))]
          )
        );
      })()`,
      returnByValue: true,
    });
    return result.result?.value || {};
  }
  
  async setItem(key: string, value: string): Promise<void> {
    await this.cdp.send('Runtime.evaluate', {
      expression: `window.localStorage.setItem('${JSON.stringify(key)}', '${JSON.stringify(value)}')`,
    });
  }
  
  async clear(): Promise<void> {
    await this.cdp.send('Runtime.evaluate', {
      expression: `window.localStorage.clear()`,
    });
  }
}
```

**Key CDP methods**:
- `Runtime.evaluate()` - Execute JavaScript in page context
- `Storage.getStorageKeyForFrame()` - Get storage origin
- `Storage.clearDataForOrigin()` - Clear storage (requires SecurityAgent in newer Chrome)

---

### 2.4 Network Interception & Inspection

**Location**: `playwright-core/src/server/chromium/crNetworkManager.ts` (entire file)

```typescript
// Server side network management
class CRNetworkManager {
  private _requestsById = new Map<string, CRRequest>();
  
  constructor(private _page: Page) {
    this._client.on('Network.requestWillBeSent', event => {
      const request = new CRRequest(...);
      this._requestsById.set(event.requestId, request);
      this._page.frameWillNavigate(request);
    });
    
    this._client.on('Network.responseReceived', event => {
      const request = this._requestsById.get(event.requestId);
      request._responseReceived(event.response);
      this._page.dispatchResponse(request._response!);
    });
  }
}
```

**For your custom tool**:
```typescript
class NetworkMonitor {
  private requests: NetworkRequest[] = [];
  
  constructor(private cdp: CDPSession) {
    // Enable network tracking
    this.cdp.send('Network.enable', { maxPostDataLength: -1 });
    
    this.cdp.on('Network.requestWillBeSent', (event) => {
      this.requests.push({
        id: event.requestId,
        url: event.request.url,
        method: event.request.method,
        headers: event.request.headers,
        status: 'pending',
        timestamp: Date.now(),
      });
    });
    
    this.cdp.on('Network.responseReceived', (event) => {
      const req = this.requests.find(r => r.id === event.requestId);
      if (req) {
        req.status = event.response.status;
        req.statusText = event.response.statusText;
        req.headers = event.response.headers;
      }
    });
  }
  
  getRequests(): NetworkRequest[] {
    return this.requests;
  }
}
```

**Key CDP methods**:
- `Network.enable()` - Start network event streaming
- `Network.requestWillBeSent` - Before request sent
- `Network.responseReceived` - Response received
- `Network.setRequestInterception()` - Block/modify requests

---

### 2.5 DOM Inspection & Querying

**Location**: `playwright-core/src/server/dom.ts` (injected script utilities)

Playwright injects utility scripts into every page to enable:
- Element selection (CSS, XPath, text content)
- DOM traversal
- Element visibility checking
- bounding box calculations

```typescript
// Client: Simple element selection
const element = await page.$('css=button');
const text = await element?.textContent();

// Server: This is translated to injected script evaluation
const elementHandle = await executionContext.evaluateHandle(
  (selector) => document.querySelector(selector),
  'button'
);
```

**For your custom tool**:
```typescript
class DOMInspector {
  constructor(private cdp: CDPSession) {}
  
  async querySelector(selector: string): Promise<RemoteObject> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('${CSS.escape(selector)}')`,
      returnByValue: false,  // Return handle, not value
    });
    return result.result;
  }
  
  async getHTML(objectId: string): Promise<string> {
    const result = await this.cdp.send('Runtime.callFunctionOn', {
      objectId,
      functionDeclaration: `function() { return this.outerHTML; }`,
      returnByValue: true,
    });
    return result.result.value;
  }
  
  async getVisibleRect(objectId: string): Promise<DOMRect> {
    const result = await this.cdp.send('Runtime.callFunctionOn', {
      objectId,
      functionDeclaration: `function() { 
        const rect = this.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          visible: rect.width > 0 && rect.height > 0
        };
      }`,
      returnByValue: true,
    });
    return result.result.value;
  }
}
```

**Key CDP methods**:
- `Runtime.evaluate()` - Execute JavaScript, get result
- `Runtime.callFunctionOn()` - Call function on object handle
- `Runtime.getProperties()` - Get object properties
- `DOM.getDocument()` - Get DOM tree as JSON

---

## PART 3: REUSABLE COMPONENTS

### 3.1 Client-Side ChannelOwner Classes (Most Reusable)

| Class | File | LoC | Purpose | Reusability |
|-------|------|-----|---------|-------------|
| `ChannelOwner` | `client/channelOwner.ts` | 243 | Base class for all client objects | 🟢 **EXTRACT** |
| `Connection` | `client/connection.ts` | 345 | Message passing & RPC | 🟢 **EXTRACT** |
| `EventEmitter` | `client/eventEmitter.ts` | 398 | Async-friendly event system | 🟢 **EXTRACT** |
| `Page` | `client/page.ts` | 889 | Full page API wrapper | 🟡 **USE PARTS** |
| `Frame` | `client/frame.ts` | 485 | Frame (iframe) handling | 🟡 **USE PARTS** |
| `ConsoleMessage` | `client/consoleMessage.ts` | 62 | Console event wrapper | 🟢 **EXTRACT** |
| `ElementHandle` | `client/elementHandle.ts` | 330 | DOM element wrapper | 🟡 **USE PARTS** |
| `JSHandle` | `client/jsHandle.ts` | ~250 | JavaScript value wrapper | 🟡 **USE PARTS** |
| `Browser` | `client/browser.ts` | 189 | Browser session wrapper | 🟡 **USE PARTS** |
| `BrowserContext` | `client/browserContext.ts` | 591 | Context (cookies, storage) | 🟡 **USE PARTS** |

### 3.2 Server-Side Dispatcher Classes (Useful Pattern)

| Class | File | Purpose | Reusability |
|-------|------|---------|-------------|
| `Dispatcher<T, C, P>` | `dispatchers/dispatcher.ts` | Base dispatcher | 🟢 **EXTRACT** |
| `PageDispatcher` | `dispatchers/pageDispatcher.ts` | Page request handler | 🟡 **STUDY PATTERN** |
| `FrameDispatcher` | `dispatchers/frameDispatcher.ts` | Frame request handler | 🟡 **STUDY PATTERN** |
| `CDPSessionDispatcher` | `dispatchers/cdpSessionDispatcher.ts` | CDP passthrough | 🟢 **EXTRACT** |

### 3.3 Protocol & Type Definitions

| File | Purpose | Size |
|------|---------|------|
| `@protocol/channels.d.ts` | Auto-generated channel types | ~20KB |
| `protocol/serializers.ts` | Protocol message serialization | ~200 LoC |
| `protocol/validator.ts` | Type validation | ~400 LoC |

### 3.4 Utility Functions (Highly Reusable)

```typescript
// From: src/utils/isomorphic/
- assert.ts              // Type-safe assertions
- rtti.ts               // Runtime type checking
- urlMatch.ts           // URL pattern matching
- stackTrace.ts         // Stack trace parsing
- stringUtils.ts        // String manipulation
- utilityScriptSerializers.ts  // JS serialization (for evaluation)
```

---

## PART 4: MINIMAL TOOL DESIGN

### 4.1 Lightweight Browser Controller Architecture

```typescript
/**
 * Custom Manual Testing Assistant
 * ~2,500 LoC including all features
 */

// 1. Core Connection Layer (600 LoC)
class ToolConnection {
  // Reuse Playwright's Connection class logic
  private _callbacks = new Map<number, { resolve, reject }>();
  private _objects = new Map<string, ToolObject>();
  
  async sendMessage(method: string, params: any): Promise<any> {
    // RPC over WebSocket to local Playwright server
    const id = generateId();
    const response = await this._sendWire({ id, method, params });
    if (response.error) throw new Error(response.error);
    return response.result;
  }
}

// 2. Minimal Object Model (600 LoC)
abstract class ToolObject {
  constructor(
    protected connection: ToolConnection,
    protected guid: string,
    protected type: string
  ) {}
  
  protected async call(method: string, params?: any) {
    return this.connection.sendMessage(
      `${this.type}.${method}`,
      { ...params, __guid: this.guid }
    );
  }
}

class ToolPage extends ToolObject {
  async goto(url: string) { return this.call('goto', { url }); }
  async screenshot() { return this.call('screenshot'); }
  async evaluate(script: string) { return this.call('evaluate', { script }); }
  async $(selector: string) { return this.call('$', { selector }); }
}

class ToolBrowser extends ToolObject {
  async newPage(): Promise<ToolPage> {
    const guid = await this.call('newPage');
    return new ToolPage(this.connection, guid, 'Page');
  }
}

// 3. Feature Modules (600 LoC each)
class ScreenshotAssistant {
  constructor(private page: ToolPage) {}
  
  async captureWithDiagnostics() {
    const screenshot = await this.page.screenshot();
    const viewport = await this.page.evaluate(`({
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    })`);
    return { screenshot, viewport };
  }
}

class ConsoleDebugger {
  private messages: ConsoleMessage[] = [];
  
  subscribe(page: ToolPage) {
    page.on('console', msg => {
      this.messages.push({
        type: msg.type,
        text: msg.text,
        timestamp: Date.now(),
      });
    });
  }
  
  getReport() {
    return {
      errors: this.messages.filter(m => m.type === 'error'),
      warnings: this.messages.filter(m => m.type === 'warn'),
      logs: this.messages.filter(m => m.type === 'log'),
    };
  }
}

class StorageMonitor {
  private initial: any = {};
  private current: any = {};
  
  async captureInitial(page: ToolPage) {
    this.initial = await page.evaluate(`
      Object.fromEntries(
        Array.from({ length: localStorage.length }, (_, i) => [
          localStorage.key(i),
          localStorage.getItem(localStorage.key(i))
        ])
      )
    `);
  }
  
  async getDiff(page: ToolPage) {
    this.current = await page.evaluate(`/* same as above */`);
    return {
      added: Object.keys(this.current).filter(k => !this.initial[k]),
      modified: Object.keys(this.current).filter(
        k => this.current[k] !== this.initial[k]
      ),
      removed: Object.keys(this.initial).filter(k => !this.current[k]),
    };
  }
}

// 4. CLI Interface (600 LoC)
async function main() {
  const browser = await connectBrowser();
  const page = await browser.newPage();
  
  // Register assistants
  const screenshot = new ScreenshotAssistant(page);
  const console = new ConsoleDebugger();
  const storage = new StorageMonitor();
  
  console.subscribe(page);
  
  // Test workflow
  await page.goto('https://example.com');
  await storage.captureInitial(page);
  
  await page.click('button');
  
  const report = {
    screenshot: await screenshot.captureWithDiagnostics(),
    console: console.getReport(),
    storage: await storage.getDiff(page),
    timestamp: new Date().toISOString(),
  };
  
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
```

### 4.2 Total Size Estimate

```
Core Communication Layer:  ~600 LoC
Object Model:             ~600 LoC
Screenshot Assistant:     ~300 LoC
Console Debugger:         ~250 LoC
Storage Monitor:          ~300 LoC
Network Inspector:        ~400 LoC
DOM Inspector:            ~350 LoC
CLI Interface:            ~600 LoC
─────────────────────────────────
TOTAL:                  ~3,400 LoC
```

**vs. Playwright Core**: 50,000+ LoC (14x more code for general automation)

---

## PART 5: CREATIVE IDEAS FOR CUSTOM TOOLS

### Idea 1: **Interactive Browser Debugger**
A REPL-style tool where you can:
- Type JavaScript and evaluate it
- Take screenshots
- Inspect DOM elements
- Monitor localStorage/sessionStorage
- Watch network requests real-time
- Navigate with history

```typescript
async function runREPL(page: ToolPage) {
  const readline = createInterface({ input, output });
  
  while (true) {
    const cmd = await prompt('> ');
    
    try {
      if (cmd.startsWith('screenshot')) {
        const buffer = await page.screenshot();
        fs.writeFileSync('screenshot.png', buffer);
        console.log('Screenshot saved');
      } else if (cmd.startsWith('eval ')) {
        const result = await page.evaluate(cmd.slice(5));
        console.log(result);
      } else if (cmd.startsWith('goto ')) {
        await page.goto(cmd.slice(5));
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}
```

### Idea 2: **Visual Test Report Generator**
Automatically create rich HTML reports showing:
- Screenshot before/after
- Console logs/errors
- Network timeline
- Storage state changes
- Performance metrics

### Idea 3: **Accessibility Compliance Checker**
Wrap CDP's accessibility features:
- ARIA tree inspection
- Color contrast checking
- Keyboard navigation testing
- Screen reader simulation
- WCAG 2.1 AA compliance report

```typescript
class A11yChecker {
  async check(page: ToolPage): Promise<A11yReport> {
    // Use Playwright's accessibility tree (built-in)
    const tree = await page.evaluate(`/* CDP accessibility API */`);
    
    const issues = [];
    // Check ARIA attributes
    // Check color contrast
    // Check keyboard navigation
    
    return { issues, score: 0.95 };
  }
}
```

### Idea 4: **Automated Screenshot Diffing**
Compare screenshots across test runs:
- Visual regression detection
- Diff highlighting
- Failure report generation
- Baseline management

### Idea 5: **Performance Timeline Inspector**
Real-time visualization of:
- Core Web Vitals (LCP, FID, CLS)
- Network waterfall
- CPU/Memory usage
- JavaScript execution time
- Asset loading timeline

---

## PART 6: KEY ARCHITECTURAL INSIGHTS

### 6.1 Why Playwright's Design is Elegant

1. **Separation of Concerns**
   - Client: "What user wants to do"
   - Protocol: "How to communicate"
   - Server: "How to actually do it"
   - Each layer is independent and testable

2. **Message-Based, Not RPC-Based**
   - Not tight coupling like direct function calls
   - Enables local + remote execution
   - Easy to add logging/debugging
   - Transport-agnostic (WebSocket, stdio, IPC)

3. **ChannelOwner Hierarchy**
   - Mirrors JavaScript object hierarchy
   - Parent manages cleanup of children
   - Automatic garbage collection
   - Thread-safe resource management

4. **EventEmitter for Async Operations**
   - Better than callbacks for multiple events
   - Type-safe with TypeScript enums
   - Works with async/await via promises
   - Supports many listeners on one event

### 6.2 Common Patterns You'll See

| Pattern | Location | Purpose |
|---------|----------|---------|
| Factory Method | `Browser.newContext()` | Create child objects |
| Observer | `page.on('console', ...)` | Event streaming |
| Strategy | Browser adapters (Chromium/Firefox/WebKit) | Swap implementations |
| Adapter | Dispatcher classes | Translate between client and server |
| Proxy | JSHandle/ElementHandle | Lazy evaluation |
| Template Method | ChannelOwner | Standard object lifecycle |

### 6.3 Protocol Design Choices

**Why JSON-based messages?**
- Debuggable (human-readable)
- Platform-agnostic (not Node-specific)
- Easy to log and replay
- Works over WebSocket/stdio/IPC

**Why request/response IDs?**
- Responses can arrive out-of-order
- Enables pipelining requests
- Works with multiplexed channels
- Each callback tied to specific request

**Why async subscription model?**
- Client only gets events it cares about
- Saves bandwidth (no unused events)
- Server knows which clients are listening
- Easy to add new event types

---

## PART 7: RECOMMENDED EXTRACTION CHECKLIST

If building your custom tool, extract in this order:

### Phase 1: Core Infrastructure (Must Have)
- [ ] `EventEmitter` class (client/eventEmitter.ts)
- [ ] `Connection` class (client/connection.ts)
- [ ] `ChannelOwner` base class (client/channelOwner.ts)
- [ ] Protocol message types (@protocol/channels.d.ts - auto-generate or extract)
- [ ] Error handling utilities (client/errors.ts)

### Phase 2: CDP Integration (Essential)
- [ ] CDP Session wrapper (client/cdpSession.ts)
- [ ] Screenshot capture (logic from crPage.ts)
- [ ] Console monitoring (logic from crNetworkManager + Page)
- [ ] JavaScript evaluation (logic from ExecutionContext)
- [ ] Network interception (logic from CRNetworkManager)

### Phase 3: Object Model (Nice to Have)
- [ ] Browser wrapper (logic from client/browser.ts)
- [ ] BrowserContext wrapper (logic from client/browserContext.ts)
- [ ] Page wrapper (logic from client/page.ts)
- [ ] Frame wrapper (logic from client/frame.ts)
- [ ] ElementHandle wrapper (logic from client/elementHandle.ts)

### Phase 4: Helper Utilities (Optional)
- [ ] DOM utilities (from dom.ts)
- [ ] Locator utilities (from locator.ts)
- [ ] Network utilities (from network.ts)
- [ ] File utilities (from various)

---

## CONCLUSIONS & RECOMMENDATIONS

### Key Takeaways

1. **Playwright's architecture is HIGHLY modular** - You can extract pieces without the whole
2. **The protocol is clean and minimal** - Understanding channels.d.ts is 80% of learning Playwright
3. **CDP is the real power** - Everything else is convenience wrappers around CDP
4. **EventEmitter + ChannelOwner = composable** - This pattern scales beautifully

### For Your Custom Tool

**Build along these lines**:
```
Your CLI Tool
├── Connection Layer (reuse/adapt Playwright's Connection)
├── CDP Wrapper (thin layer over Chrome DevTools Protocol)
├── Feature Modules (screenshot, console, storage, network)
└── CLI Interface (Oclif or Commander.js)
```

**Don't reimplement**:
- Protocol serialization/deserialization
- Error handling and stack traces
- Event subscription/unsubscription
- Browser launch logic

**Do customize**:
- Feature set (only screenshot + console? or full browser API?)
- Output format (JSON, HTML reports, terminal UI?)
- Performance (cache screenshots? stream data?)
- Error handling (specific recovery strategies)

### Estimated Effort

| Component | Extract Time | Customize Time | Total |
|-----------|--------------|----------------|-------|
| ChannelOwner pattern | 2 hours | 1 hour | 3h |
| Connection/Protocol | 3 hours | 2 hours | 5h |
| Screenshot/Console | 2 hours | 3 hours | 5h |
| Storage/Network | 2 hours | 3 hours | 5h |
| CLI Interface | 2 hours | 5 hours | 7h |
| Testing/Polish | - | 8 hours | 8h |
| **TOTAL** | **11 hours** | **22 hours** | **33 hours** |

**TL;DR**: One senior engineer could build a working tool in 1-2 weeks.

---

**END OF ANALYSIS**

