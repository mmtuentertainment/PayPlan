export default function Privacy() {
  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="space-y-6 text-sm">
        <section>
          <h2 className="text-xl font-semibold mb-3">Data Storage</h2>
          <p className="text-muted-foreground">
            <strong>We do not store your payment data.</strong> All processing happens in-memory on our servers and your data is discarded immediately after generating your plan.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">How It Works</h2>
          <p className="text-muted-foreground">
            When you submit your CSV data, it is sent to our serverless API endpoint via HTTPS. The data is processed in-memory to generate your payment plan, risk analysis, and calendar file. Once the response is sent back to your browser, all your data is immediately deleted from our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Cookies & Tracking</h2>
          <p className="text-muted-foreground">
            We do not use cookies or tracking scripts. We do not collect personal information. Basic hosting metrics (page views, bandwidth) are collected by Vercel, our hosting provider, but these do not include your payment data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
          <p className="text-muted-foreground">
            PayPlan is hosted on Vercel. All data stays in your browser's localStorage. We do not integrate with banks or any third-party data services. No server-side storage required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Data Security</h2>
          <p className="text-muted-foreground">
            All connections use HTTPS encryption. Your payment data is never logged, stored in databases, or transmitted to third parties. The serverless architecture ensures each request is isolated and stateless.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p className="text-muted-foreground">
            PayPlan is open source. For questions or concerns, please open an issue on our GitHub repository.
          </p>
        </section>

        <div className="mt-8 pt-8 border-t text-xs text-muted-foreground">
          <p>Last updated: September 30, 2025</p>
          <p>PayPlan v0.1.0</p>
        </div>
      </div>
    </div>
  );
}