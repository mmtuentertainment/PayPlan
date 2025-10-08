export interface DemoFixture { id: string; provider: string; emailText: string; }
const d = [
  ['klarna-1','Klarna','$25.00','October 15, 2025','2 of 4','enabled'],
  ['klarna-2','Klarna','$30.00','October 15, 2025','1 of 4','not enabled'],
  ['klarna-3','Klarna','$45.00','October 18, 2025','3 of 4','enabled'],
  ['affirm-1','Affirm','$50.00','October 22, 2025','2 of 6','No'],
  ['affirm-2','Affirm','$50.00','November 5, 2025','3 of 6','Yes'],
  ['afterpay-1','Afterpay','$37.50','October 20, 2025','1 of 4','No'],
  ['afterpay-2','Afterpay','$37.50','November 3, 2025','2 of 4','Yes'],
  ['paypal-1','PayPal','$62.50','October 28, 2025','3 of 4','Enabled'],
  ['zip-1','Zip','$40.00','October 25, 2025','1 of 4','turned off'],
  ['sezzle-1','Sezzle','$35.00','November 1, 2025','2/4','Off']
] as const;
const t = (id: string, p: string, amt: string, dt: string, inst: string, ap: string) => ({
  id, provider: p,
  emailText: `From: noreply@${p.toLowerCase()}.com
Subject: Payment Reminder
Hi there,
Your payment of ${amt} USD is due on ${dt}.
Installment ${inst}.
Autopay is ${ap}.
Thank you for using ${p}!`
});
export const FIXTURES: DemoFixture[] = d.map(([id,p,amt,dt,inst,ap]) => t(id,p,amt,dt,inst,ap));
