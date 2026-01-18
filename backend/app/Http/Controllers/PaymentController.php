<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class PaymentController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(env('STRIPE_SECRET'));
    }

    /**
     * Create a Payment Intent for an invoice.
     */
    public function createIntent(Request $request)
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
        ]);

        $invoice = Invoice::findOrFail($request->invoice_id);

        try {
            $paymentIntent = PaymentIntent::create([
                'amount' => (int) ($invoice->balance * 100), // Amount in cents
                'currency' => strtolower($invoice->currency),
                'metadata' => [
                    'invoice_id' => $invoice->id,
                    'company_id' => $invoice->company_id,
                ],
            ]);

            return response()->json([
                'clientSecret' => $paymentIntent->client_secret,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a payment record (manual or successful stripe callback).
     */
    public function store(Request $request)
    {
        // Existing store logic or updated for Stripe webhook
        // For now, assume this is manually called or called after frontend confirmation
        
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'reference_number' => 'nullable|string',
            'payment_date' => 'required|date',
        ]);

        $invoice = Invoice::findOrFail($validated['invoice_id']);
        
        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'reference_number' => $validated['reference_number'],
            'payment_date' => $validated['payment_date'],
            'received_by' => auth()->id(),
            'notes' => $request->input('notes'),
        ]);

        // Update invoice balance and status
        $newBalance = $invoice->balance - $payment->amount;
        $invoice->update([
            'balance' => $newBalance,
            'status' => $newBalance <= 0 ? 'paid' : 'partially_paid',
            'paid_amount' => $invoice->paid_amount + $payment->amount
        ]);

        return response()->json($payment, 201);
    }
}
