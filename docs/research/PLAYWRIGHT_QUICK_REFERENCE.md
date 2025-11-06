# Playwright Architecture: Quick Reference Guide

**For building a custom manual testing assistant tool**

---

## The Three-Layer Architecture

### Layer 1: Client (User Code)
```typescript
// What you write
const page = await browser.newPage();
await page.screenshot();
```

### Layer 2: Protocol (Message Passing)
```typescript
// What happens under the hood (JSON)
{ id: 1, method: "Page.screenshot", params: {...} }
{ id: 1, result: Buffer.from(...) }
```

### Layer 3: Server (Browser Control)
```typescript
// What actually runs in the browser
const buffer = await chromium.send('Page.captureScreenshot');
```

---

## Key Classes You Should Know

| Class | What It Does | Extract? |
|-------|-------------|----------|
| `ChannelOwner<T>` | Base for all client objects | YES |
| `Connection` | RPC message routing | YES |
| `EventEmitter` | Async event system | YES |
| `Dispatcher<T>` | Server request handler | YES |
| `Page` | Page automation API | PARTIAL |
| `Browser` | Browser session | PARTIAL |
| `ConsoleMessage` | Console event wrapper | YES |

---

## Five Features You Can Extract Easily

### 1. Screenshot Capture (60 LoC)
```typescript
class ScreenshotCapture {
  async capture(options?: { format?: 'png' | 'jpeg', quality?: number }): Promise<Buffer> {
    const result = await this.cdp.send('Page.captureScreenshot', {
      format: options?.format || 'png',
      quality: options?.quality || 90,
    });
    return Buffer.from(result.data, 'base64');
  }
}
```

### 2. Console Monitoring (80 LoC)
```typescript
class ConsoleMonitor {
  private messages: ConsoleMessage[] = [];
  
  constructor(private cdp: CDPSession) {
    this.cdp.on('Runtime.consoleAPICalled', (event) => {
      this.messages.push({
        type: event.type,
        text: event.args[0]?.value || '',
        timestamp: Date.now(),
      });
    });
    this.cdp.send('Runtime.enable', {});
  }
}
```

### 3. localStorage Access (100 LoC)
```typescript
class StorageAccessor {
  async getLocalStorage(): Promise<Record<string, string>> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `Object.fromEntries(
        Array.from({ length: localStorage.length }, (_, i) => 
          [localStorage.key(i), localStorage.getItem(localStorage.key(i))]
        )
      )`,
      returnByValue: true,
    });
    return result.result?.value || {};
  }
}
```

### 4. Network Monitoring (120 LoC)
```typescript
class NetworkMonitor {
  private requests: NetworkRequest[] = [];
  
  constructor(private cdp: CDPSession) {
    this.cdp.send('Network.enable', { maxPostDataLength: -1 });
    
    this.cdp.on('Network.requestWillBeSent', (event) => {
      this.requests.push({
        id: event.requestId,
        url: event.request.url,
        status: 'pending',
      });
    });
    
    this.cdp.on('Network.responseReceived', (event) => {
      const req = this.requests.find(r => r.id === event.requestId);
      if (req) req.status = event.response.status;
    });
  }
}
```

### 5. DOM Inspection (100 LoC)
```typescript
class DOMInspector {
  async querySelector(selector: string): Promise<RemoteObject> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('${CSS.escape(selector)}')`,
      returnByValue: false,
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
}
```

---

## File Locations You Should Know

### Core Infrastructure
- `/playwright-core/src/client/connection.ts` - RPC message routing
- `/playwright-core/src/client/channelOwner.ts` - Object lifecycle
- `/playwright-core/src/client/eventEmitter.ts` - Event system
- `/playwright-core/src/client/consoleMessage.ts` - Console wrapper

### Server Implementation
- `/playwright-core/src/server/dispatchers/dispatcher.ts` - Request handler base
- `/playwright-core/src/server/chromium/crPage.ts` - Screenshot + console logic
- `/playwright-core/src/server/chromium/crNetworkManager.ts` - Network events

### Protocol Definitions
- `@protocol/channels.d.ts` - Auto-generated channel types
- `/playwright-core/src/protocol/serializers.ts` - Message serialization

---

## CDP Methods You'll Use Most

### Screenshots
- `Page.captureScreenshot()` - Take a screenshot
- `Page.getLayoutMetrics()` - Get viewport size

### Console
- `Runtime.enable()` - Enable console events
- `Runtime.consoleAPICalled` - Console event
- `Runtime.exceptionThrown` - Exception event

### JavaScript
- `Runtime.evaluate()` - Run JavaScript, get result
- `Runtime.callFunctionOn()` - Call function on object
- `Runtime.getProperties()` - Get object properties

### Network
- `Network.enable()` - Enable network events
- `Network.requestWillBeSent` - Request event
- `Network.responseReceived` - Response event
- `Network.setRequestInterception()` - Block requests

### DOM
- `DOM.getDocument()` - Get DOM tree
- `DOM.querySelector()` - Find elements
- `DOM.resolveNode()` - Get node details

---

## Design Patterns You Should Copy

### 1. ChannelOwner Pattern
```typescript
// Every client object wraps a remote resource
export abstract class ChannelOwner<T extends Channel> extends EventEmitter {
  readonly _connection: Connection;  // Back to server
  readonly _guid: string;            // Unique ID
  readonly _channel: T;              // RPC stub
  
  constructor(parent: ChannelOwner | Connection, type: string, guid: string) {
    this._connection._objects.set(guid, this);
    this._channel = this._createChannel(...);
  }
}
```

### 2. Connection (RPC) Pattern
```typescript
// Correlated request/response with IDs
async sendMessage(guid: string, method: string, params: any) {
  const id = ++this._lastId;
  const promise = new Promise((resolve, reject) => {
    this._callbacks.set(id, { resolve, reject });
  });
  this.onmessage({ id, guid, method, params });
  return promise;
}
```

### 3. Dispatcher Pattern
```typescript
// Server wraps real objects, translates requests
export class PageDispatcher extends Dispatcher<Page, PageChannel> {
  async screenshot(params: ScreenshotParams): Promise<Buffer> {
    return await this._object.screenshot(params);
  }
  
  onConsoleMessage(msg: ConsoleMessage) {
    this.sendEvent('console', { message: msg });
  }
}
```

### 4. EventEmitter Pattern
```typescript
// Lazy subscription - only subscribe when listener added
override on(event: string, listener: Listener): this {
  if (!this.listenerCount(event))
    this._updateSubscription(event, true);  // Tell server
  super.on(event, listener);
  return this;
}
```

---

## Size Estimates

| Component | Lines | Complexity |
|-----------|-------|-----------|
| ChannelOwner | 243 | Low |
| Connection | 345 | Medium |
| EventEmitter | 398 | Low |
| Screenshot | 60 | Low |
| Console | 80 | Low |
| Storage | 100 | Low |
| Network | 120 | Medium |
| DOM | 100 | Medium |
| **Total** | **1,446** | **Medium** |

**vs. Full Playwright**: 50,000+ LoC

---

## Common Mistakes to Avoid

1. **❌ Trying to create your own protocol**
   - Just reuse the Channel message format

2. **❌ Not using the ChannelOwner pattern**
   - Leads to garbage collection issues

3. **❌ Direct CDP calls instead of wrapped objects**
   - Hard to debug and maintain

4. **❌ Synchronous operations**
   - Everything is async in Chrome DevTools Protocol

5. **❌ Not handling error messages properly**
   - Protocol includes stack traces, use them!

---

## Implementation Checklist

### Phase 1: Core (3-4 hours)
- [ ] Extract EventEmitter
- [ ] Extract Connection
- [ ] Extract ChannelOwner
- [ ] Create simple Page wrapper
- [ ] Test RPC message flow

### Phase 2: Features (4-6 hours)
- [ ] Screenshot capture
- [ ] Console monitoring
- [ ] localStorage access
- [ ] Network interception
- [ ] DOM inspection

### Phase 3: CLI (2-4 hours)
- [ ] Command interface
- [ ] Error handling
- [ ] Report generation
- [ ] Test with real page

### Phase 4: Polish (2-3 hours)
- [ ] Documentation
- [ ] Type safety
- [ ] Edge cases
- [ ] Performance

**Total: 11-17 hours (1-2 days for one engineer)**

---

## Resources

1. **Full Analysis**: `docs/research/playwright-architecture-analysis.md` (994 lines)
2. **Chrome DevTools Protocol**: https://chromedevtools.github.io/devtools-protocol/
3. **Playwright Source**: `/tmp/playwright` (Microsoft GitHub)
4. **Protocol Types**: `/playwright-core/src/protocol/` (type definitions)

---

## Key Insight

> **The magic is not in Playwright's code—it's in the Chrome DevTools Protocol.** Playwright is just a well-designed wrapper. You can build your own version in 2,000-3,000 LoC if you focus on what you actually need.

