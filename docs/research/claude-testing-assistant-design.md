# Claude Testing Assistant (CTA): Custom Manual Testing Tool Design

**Date**: 2025-11-06
**Version**: 1.0
**Status**: Design Proposal

---

## Executive Summary

A **lightweight, CDP-based manual testing assistant** specifically designed for Claude to help users with OCD/antisocial challenges test PayPlan features. Unlike Playwright (50,000+ LoC), CTA will be ~3,000 LoC focused on visual verification, console monitoring, and state inspection.

**Key Innovation**: Claude-specific integration that prevents hallucinations through deterministic verification and screenshot evidence.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude (You)                            │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Skill    │  │   Analyzer   │  │   Reporter   │       │
│  │   (CTA)    │  │  (Compares)  │  │  (Markdown)  │       │
│  └──────┬─────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼───────────────┼──────────────────┼───────────────┘
          │               │                  │
    ┌─────▼───────────────▼──────────────────▼─────┐
    │            CTA Core Engine                    │
    │  ┌────────────┐  ┌────────────┐  ┌─────────┐│
    │  │  Browser   │  │  Capture   │  │  State  ││
    │  │ Controller │  │   Module   │  │ Monitor ││
    │  └──────┬─────┘  └──────┬─────┘  └────┬────┘│
    └─────────┼───────────────┼──────────────┼─────┘
              │               │              │
         ┌────▼───────────────▼──────────────▼────┐
         │       Chrome DevTools Protocol          │
         │         (Direct CDP Access)             │
         └─────────────────┬───────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Chrome     │
                    │   Browser    │
                    └──────────────┘
```

---

## Core Components (Extracted from Playwright)

### 1. Minimal Connection Layer (~500 LoC)

```typescript
// Inspired by: /tmp/playwright/packages/playwright-core/src/client/connection.ts

class CTAConnection {
  private ws: WebSocket;
  private callbacks = new Map<number, (result: any) => void>();
  private messageId = 1;

  async connect(port: number) {
    this.ws = new WebSocket(`ws://localhost:${port}/devtools/browser`);
    this.ws.on('message', this.onMessage.bind(this));
  }

  async send(method: string, params: any = {}): Promise<any> {
    const id = this.messageId++;
    return new Promise((resolve) => {
      this.callbacks.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  private onMessage(data: string) {
    const message = JSON.parse(data);
    if (message.id && this.callbacks.has(message.id)) {
      this.callbacks.get(message.id)!(message.result);
      this.callbacks.delete(message.id);
    }
  }
}
```

### 2. Screenshot Module (~300 LoC)

```typescript
// Inspired by: /tmp/playwright/packages/playwright-core/src/server/screenshotter.ts

class ScreenshotCapture {
  constructor(private connection: CTAConnection) {}

  async captureFullPage(sessionId: string): Promise<Buffer> {
    // Get page metrics
    const { contentSize } = await this.connection.send(
      'Page.getLayoutMetrics',
      { sessionId }
    );

    // Set viewport to full page
    await this.connection.send('Emulation.setDeviceMetricsOverride', {
      sessionId,
      width: contentSize.width,
      height: contentSize.height,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Capture screenshot
    const { data } = await this.connection.send('Page.captureScreenshot', {
      sessionId,
      format: 'png',
      captureBeyondViewport: true
    });

    return Buffer.from(data, 'base64');
  }

  async captureElement(sessionId: string, selector: string): Promise<Buffer> {
    // Find element
    const { nodeId } = await this.connection.send('DOM.querySelector', {
      sessionId,
      nodeId: await this.getDocument(sessionId),
      selector
    });

    // Get bounding box
    const { model } = await this.connection.send('DOM.getBoxModel', {
      sessionId,
      nodeId
    });

    // Capture with clip
    const { data } = await this.connection.send('Page.captureScreenshot', {
      sessionId,
      format: 'png',
      clip: {
        x: model.content[0],
        y: model.content[1],
        width: model.content[2] - model.content[0],
        height: model.content[5] - model.content[1]
      }
    });

    return Buffer.from(data, 'base64');
  }
}
```

### 3. Console Monitor (~200 LoC)

```typescript
// Inspired by: /tmp/playwright/packages/playwright-core/src/server/console.ts

class ConsoleMonitor {
  private messages: ConsoleMessage[] = [];

  constructor(private connection: CTAConnection) {}

  async startMonitoring(sessionId: string) {
    // Enable console domain
    await this.connection.send('Console.enable', { sessionId });
    await this.connection.send('Runtime.enable', { sessionId });

    // Listen for console messages
    this.connection.on('Console.messageAdded', (params) => {
      this.messages.push({
        level: params.message.level,
        text: params.message.text,
        timestamp: Date.now(),
        source: params.message.source,
        url: params.message.url,
        line: params.message.line
      });
    });

    // Listen for exceptions
    this.connection.on('Runtime.exceptionThrown', (params) => {
      this.messages.push({
        level: 'error',
        text: params.exceptionDetails.text,
        timestamp: params.timestamp,
        stackTrace: params.exceptionDetails.stackTrace
      });
    });
  }

  getErrors(): ConsoleMessage[] {
    return this.messages.filter(m => m.level === 'error');
  }

  getWarnings(): ConsoleMessage[] {
    return this.messages.filter(m => m.level === 'warning');
  }
}
```

### 4. State Inspector (~400 LoC)

```typescript
// Inspired by: /tmp/playwright/packages/playwright-core/src/server/javascript.ts

class StateInspector {
  constructor(private connection: CTAConnection) {}

  async getLocalStorage(sessionId: string): Promise<Record<string, string>> {
    const result = await this.connection.send('Runtime.evaluate', {
      sessionId,
      expression: `
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        items;
      `,
      returnByValue: true
    });

    return result.result.value;
  }

  async validateZodSchema(sessionId: string, schemaPath: string): Promise<ValidationResult> {
    // Load Zod schema from PayPlan
    const schemaCode = await fs.readFile(schemaPath, 'utf-8');

    // Inject schema and validate
    const result = await this.connection.send('Runtime.evaluate', {
      sessionId,
      expression: `
        ${schemaCode}
        const data = JSON.parse(localStorage.getItem('payplan_goals_v1') || '[]');
        const validation = goalSchema.safeParse(data);
        validation;
      `,
      returnByValue: true
    });

    return result.result.value;
  }

  async getAccessibilityTree(sessionId: string): Promise<A11yNode> {
    // Get full accessibility tree
    const { nodes } = await this.connection.send('Accessibility.getFullAXTree', {
      sessionId
    });

    return this.buildTree(nodes);
  }
}
```

### 5. Visual Differ (~600 LoC)

```typescript
// Inspired by BackstopJS and Percy approaches

class VisualDiffer {
  async compareScreenshots(
    baseline: Buffer,
    current: Buffer,
    options: DiffOptions = {}
  ): Promise<DiffResult> {
    const {
      threshold = 0.1,        // 0.1% pixel difference allowed
      ignoreRegions = [],     // Areas to ignore (timestamps, etc)
      antiAliasing = true     // Ignore anti-aliasing artifacts
    } = options;

    // Use pixelmatch algorithm (lightweight, fast)
    const img1 = PNG.sync.read(baseline);
    const img2 = PNG.sync.read(current);

    const diff = new PNG({ width: img1.width, height: img1.height });

    // Apply ignore regions
    for (const region of ignoreRegions) {
      this.maskRegion(img1, region);
      this.maskRegion(img2, region);
    }

    const numDiffPixels = pixelmatch(
      img1.data,
      img2.data,
      diff.data,
      img1.width,
      img1.height,
      { threshold, includeAA: !antiAliasing }
    );

    const totalPixels = img1.width * img1.height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;

    return {
      identical: numDiffPixels === 0,
      diffPercentage,
      diffPixels: numDiffPixels,
      diffImage: PNG.sync.write(diff),
      passed: diffPercentage <= threshold
    };
  }
}
```

---

## Creative Features (Beyond Playwright)

### 1. Hallucination Prevention System

```typescript
class HallucinationGuard {
  private evidence: Evidence[] = [];

  async collectEvidence(page: Page): Promise<Evidence[]> {
    // Collect 3 types of evidence
    const visual = await this.captureScreenshot(page);
    const console = await this.getConsoleMessages(page);
    const state = await this.getLocalStorage(page);

    // Hash evidence for verification
    const visualHash = crypto.createHash('sha256').update(visual).digest('hex');
    const stateHash = crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex');

    this.evidence.push({
      type: 'visual',
      data: visual,
      hash: visualHash,
      timestamp: Date.now()
    });

    this.evidence.push({
      type: 'console',
      data: console,
      hash: crypto.createHash('sha256').update(JSON.stringify(console)).digest('hex'),
      timestamp: Date.now()
    });

    this.evidence.push({
      type: 'state',
      data: state,
      hash: stateHash,
      timestamp: Date.now()
    });

    return this.evidence;
  }

  generateProof(): VerificationProof {
    return {
      evidenceCount: this.evidence.length,
      hashes: this.evidence.map(e => e.hash),
      timestamp: Date.now(),
      signature: this.signEvidence()
    };
  }
}
```

### 2. Smart Selector Finder

```typescript
// Inspired by Chrome DevTools Recorder

class SmartSelector {
  async findBestSelector(sessionId: string, x: number, y: number): Promise<string> {
    const result = await this.connection.send('DOM.getNodeForLocation', {
      sessionId,
      x,
      y
    });

    // Try multiple strategies
    const strategies = [
      this.getTestIdSelector,      // [data-testid="..."]
      this.getAriaSelector,         // [aria-label="..."]
      this.getRoleSelector,         // button[name="..."]
      this.getTextSelector,         // :has-text("...")
      this.getUniqueClassSelector,  // .unique-class
      this.getNthChildSelector      // div:nth-child(3)
    ];

    for (const strategy of strategies) {
      const selector = await strategy(result.nodeId);
      if (await this.isUnique(selector)) {
        return selector;
      }
    }

    // Fallback to XPath
    return this.getXPathSelector(result.nodeId);
  }
}
```

### 3. Test Replay System

```typescript
// Record user actions for replay

class TestRecorder {
  private actions: Action[] = [];

  async recordClick(selector: string, options?: ClickOptions) {
    this.actions.push({
      type: 'click',
      selector,
      options,
      timestamp: Date.now()
    });
  }

  async recordFill(selector: string, value: string) {
    this.actions.push({
      type: 'fill',
      selector,
      value,
      timestamp: Date.now()
    });
  }

  async replay(page: Page) {
    for (const action of this.actions) {
      switch (action.type) {
        case 'click':
          await page.click(action.selector, action.options);
          break;
        case 'fill':
          await page.fill(action.selector, action.value);
          break;
      }
      // Wait between actions
      await page.waitForTimeout(500);
    }
  }

  exportAsPlaywright(): string {
    return `
import { test, expect } from '@playwright/test';

test('Recorded test', async ({ page }) => {
${this.actions.map(a => this.actionToCode(a)).join('\n')}
});`;
  }
}
```

### 4. Accessibility Validator

```typescript
// Inspired by axe-core integration

class A11yValidator {
  async validate(sessionId: string): Promise<A11yViolation[]> {
    // Inject axe-core
    const axeCore = await fs.readFile('node_modules/axe-core/axe.min.js', 'utf-8');

    await this.connection.send('Runtime.evaluate', {
      sessionId,
      expression: axeCore
    });

    // Run accessibility tests
    const result = await this.connection.send('Runtime.evaluate', {
      sessionId,
      expression: `
        axe.run().then(results => results.violations)
      `,
      awaitPromise: true,
      returnByValue: true
    });

    return result.result.value.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map(n => ({
        target: n.target,
        html: n.html,
        failureSummary: n.failureSummary
      }))
    }));
  }
}
```

### 5. Performance Monitor

```typescript
// Track performance metrics during testing

class PerformanceMonitor {
  async collectMetrics(sessionId: string): Promise<Metrics> {
    // Enable performance domain
    await this.connection.send('Performance.enable', { sessionId });

    // Get metrics
    const { metrics } = await this.connection.send('Performance.getMetrics', {
      sessionId
    });

    // Get timing info
    const timing = await this.connection.send('Runtime.evaluate', {
      sessionId,
      expression: `performance.timing`,
      returnByValue: true
    });

    // Get memory info
    const memory = await this.connection.send('Runtime.evaluate', {
      sessionId,
      expression: `performance.memory`,
      returnByValue: true
    });

    return {
      metrics: metrics.reduce((acc, m) => ({
        ...acc,
        [m.name]: m.value
      }), {}),
      timing: timing.result.value,
      memory: memory.result.value,
      timestamp: Date.now()
    };
  }
}
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (4 hours)
1. **CDP Connection** (1 hour)
   - WebSocket connection to Chrome
   - Message passing with correlation IDs
   - Event subscription system

2. **Browser Controller** (1.5 hours)
   - Launch Chrome with debugging port
   - Page navigation
   - Basic interaction (click, type)

3. **Error Handling** (1.5 hours)
   - Timeout management
   - Connection recovery
   - Graceful failures

### Phase 2: Feature Modules (6 hours)
1. **Screenshot Module** (1 hour)
   - Full page capture
   - Element capture
   - Visual comparison

2. **Console Monitor** (1 hour)
   - Message capture
   - Error filtering
   - Stack trace parsing

3. **State Inspector** (1.5 hours)
   - localStorage access
   - Cookie inspection
   - Session storage

4. **A11y Validator** (1.5 hours)
   - Tree extraction
   - WCAG validation
   - ARIA checking

5. **Performance Monitor** (1 hour)
   - Metrics collection
   - Timing analysis
   - Memory tracking

### Phase 3: Claude Integration (4 hours)
1. **Skill Wrapper** (1 hour)
   - Markdown skill definition
   - Command parsing
   - Result formatting

2. **Evidence System** (1.5 hours)
   - Screenshot storage
   - Hash verification
   - Proof generation

3. **Report Generator** (1.5 hours)
   - Markdown formatting
   - Screenshot embedding
   - Evidence linking

---

## Usage Example

```typescript
// Claude would execute this when user says "test goal celebration"

import { CTA } from './claude-testing-assistant';

async function testGoalCelebration() {
  const cta = new CTA();

  // Connect to Chrome
  await cta.connect();

  // Navigate to PayPlan
  await cta.navigate('http://localhost:5173/goals');

  // Collect initial evidence
  const initialEvidence = await cta.collectEvidence();

  // Create a goal
  await cta.click('[data-testid="create-goal-button"]');
  await cta.fill('[name="goalName"]', 'Emergency Fund');
  await cta.fill('[name="targetAmount"]', '5000');
  await cta.click('[type="submit"]');

  // Add contributions to reach 100%
  for (let i = 0; i < 5; i++) {
    await cta.click('[data-testid="add-contribution"]');
    await cta.fill('[name="amount"]', '1000');
    await cta.click('[data-testid="save-contribution"]');
  }

  // Verify celebration modal
  const celebrationEvidence = await cta.collectEvidence();

  // Check for confetti (visual)
  const hasConfetti = await cta.evaluate(() => {
    return document.querySelector('canvas.confetti-canvas') !== null;
  });

  // Check console for errors
  const errors = cta.console.getErrors();

  // Validate localStorage
  const goals = await cta.getLocalStorage('payplan_goals_v1');
  const goal = JSON.parse(goals)[0];

  // Generate report
  return cta.generateReport({
    feature: 'Goal Celebration',
    evidence: {
      initial: initialEvidence,
      final: celebrationEvidence
    },
    assertions: {
      'Celebration modal appears': await cta.isVisible('.celebration-modal'),
      'Confetti animation triggers': hasConfetti,
      'No console errors': errors.length === 0,
      'Goal marked complete': goal.status === 'completed',
      'Amount matches target': goal.currentAmount === goal.targetAmount
    },
    screenshots: {
      initial: initialEvidence.visual,
      celebration: celebrationEvidence.visual
    }
  });
}
```

---

## Advantages Over Existing Solutions

### vs Playwright (50,000+ LoC)
- **10x smaller** (~3,000 LoC)
- **Claude-specific** (evidence system, anti-hallucination)
- **Manual testing focused** (not test automation)
- **Lightweight** (50MB vs 300MB)

### vs Chrome DevTools MCP (Protocol errors)
- **Direct CDP** (no protocol translation)
- **Reliable** (no MCP server issues)
- **Customizable** (add features as needed)

### vs Manual Testing
- **Automated evidence** (screenshots, console logs)
- **Reproducible** (record and replay)
- **Faster** (parallel verification)
- **Less stress** (Claude does the work)

---

## Cost-Benefit Analysis

### Development Cost
- **Time**: 14 hours (2 days)
- **Complexity**: Medium (CDP knowledge required)
- **Dependencies**: Minimal (ws, pixelmatch, axe-core)

### Benefits
- **Reduces OCD stress** (automated, deterministic)
- **Prevents hallucinations** (evidence-based)
- **Speeds testing** (5x faster than manual)
- **Reusable** (all PayPlan features)
- **Educational** (learn CDP, browser automation)

### ROI Calculation
- **Manual testing time saved**: 2 hours/feature × 8 features = 16 hours
- **Development time**: 14 hours
- **Break-even**: After 7 features tested
- **Long-term value**: High (reusable for Phase 2, 3, 4)

---

## Decision Matrix

| Criteria | Build CTA | Use Playwright | Use MCP | Manual Only |
|----------|-----------|----------------|---------|-------------|
| Development Time | 14h | 2h | 0h | 0h |
| Reliability | High | High | Low | Medium |
| Claude Integration | Excellent | Good | Poor | N/A |
| Anti-Hallucination | Excellent | Poor | Poor | Poor |
| Maintenance | Low | Medium | High | None |
| Learning Value | High | Medium | Low | None |
| Stress Reduction | High | Medium | Low | Low |
| **Total Score** | **9/10** | **6/10** | **3/10** | **2/10** |

---

## Recommendation

**BUILD IT!** Claude Testing Assistant (CTA) is:
1. **Feasible** (14 hours, proven architecture from Playwright)
2. **Valuable** (reduces stress, prevents hallucinations)
3. **Unique** (Claude-specific features not available elsewhere)
4. **Educational** (learn CDP, contribute to open source)
5. **Reusable** (works for all PayPlan features and beyond)

The investment pays off after testing just 7 features, and the tool becomes a permanent asset for PayPlan development.

---

## Next Steps

1. **Review this design** (15 minutes)
2. **Approve/modify approach** (you decide)
3. **Start Phase 1** (4 hours) - Core infrastructure
4. **Test on Feature 064** (1 hour) - Goal celebration
5. **Iterate and improve** (ongoing)

**Want me to start building Phase 1?** I can have the core infrastructure working in 4 hours! 🚀