export default function Privacy() {
  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="space-y-6 text-sm">
        <section>
          <h2 className="text-xl font-semibold mb-3">Data Storage</h2>
          <p className="text-muted-foreground">
            <strong>All your data stays on your device.</strong> PayPlan stores all budgets, transactions, categories, and goals in your browser's localStorage. We do not have servers that store your financial data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">How It Works</h2>
          <p className="text-muted-foreground">
            When you use PayPlan, all data processing happens entirely in your browser. Categories, budgets, transactions, and dashboard calculations are performed client-side using JavaScript. Your financial data never leaves your device unless you explicitly export it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Cookies & Tracking</h2>
          <p className="text-muted-foreground">
            We do not use cookies or tracking scripts. We do not collect analytics. We do not track your usage. The only data stored is what you enter, and it stays in your browser's localStorage.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
          <p className="text-muted-foreground">
            PayPlan is hosted on Vercel for static file delivery only. We do not integrate with banks, financial institutions, or any third-party data services. All data processing is local to your browser.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Data Security</h2>
          <p className="text-muted-foreground">
            Your data is as secure as your device. Since everything stays in localStorage, you control access through your device's security (passwords, biometrics). The website is served over HTTPS. We have no servers to hack because we don't store your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Data Export & Deletion</h2>
          <p className="text-muted-foreground">
            You can export your data at any time using the CSV export feature. To delete all data, clear your browser's localStorage or use your browser's "Clear Site Data" feature.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p className="text-muted-foreground">
            PayPlan is open source. For questions or concerns, please open an issue on our GitHub repository.
          </p>
        </section>

        <div className="mt-8 pt-8 border-t text-xs text-muted-foreground">
          <p>Last updated: October 31, 2025</p>
          <p>PayPlan v0.2.0 - Pure Budget App</p>
        </div>
      </div>
    </div>
  );
}
