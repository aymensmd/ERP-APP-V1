<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Store a newly created payment.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'invoice_id' => 'required|exists:invoices,id',
                'amount' => 'required|numeric|min:0.01',
                'payment_date' => 'required|date',
                'payment_method' => 'nullable|in:cash,bank_transfer,credit_card,check,paypal,other',
                'reference_number' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }

            $invoice = Invoice::findOrFail($validated['invoice_id']);

            if ($validated['amount'] > $invoice->balance) {
                return response()->json([
                    'error' => 'Payment amount cannot exceed invoice balance'
                ], 422);
            }

            DB::beginTransaction();

            // Create payment
            $payment = Payment::create([
                'company_id' => $companyId,
                'invoice_id' => $validated['invoice_id'],
                'amount' => $validated['amount'],
                'payment_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'] ?? 'bank_transfer',
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'received_by' => auth()->id(),
            ]);

            // Update invoice
            $newPaidAmount = $invoice->paid_amount + $validated['amount'];
            $newBalance = $invoice->total_amount - $newPaidAmount;
            
            $invoice->update([
                'paid_amount' => $newPaidAmount,
                'balance' => $newBalance,
                'status' => $newBalance <= 0 ? 'paid' : ($invoice->status === 'draft' ? 'sent' : $invoice->status),
                'paid_at' => $newBalance <= 0 ? now() : $invoice->paid_at,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Payment recorded successfully',
                'payment' => $payment->load(['invoice', 'receivedBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to record payment: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified payment.
     */
    public function destroy($id)
    {
        try {
            $payment = Payment::with('invoice')->findOrFail($id);
            $invoice = $payment->invoice;

            DB::beginTransaction();

            // Recalculate invoice amounts
            $newPaidAmount = $invoice->paid_amount - $payment->amount;
            $newBalance = $invoice->total_amount - $newPaidAmount;

            $invoice->update([
                'paid_amount' => $newPaidAmount,
                'balance' => $newBalance,
                'status' => $newBalance > 0 ? 'sent' : 'paid',
                'paid_at' => $newBalance <= 0 ? $invoice->paid_at : null,
            ]);

            $payment->delete();

            DB::commit();

            return response()->json(['message' => 'Payment deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to delete payment'], 500);
        }
    }
}



