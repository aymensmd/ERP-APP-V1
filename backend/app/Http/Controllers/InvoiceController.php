<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Customer;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    /**
     * Generate unique invoice number.
     */
    private function generateInvoiceNumber($companyId)
    {
        $prefix = 'INV-' . date('Y') . '-';
        $lastInvoice = Invoice::where('company_id', $companyId)
            ->where('invoice_number', 'like', $prefix . '%')
            ->orderBy('invoice_number', 'desc')
            ->first();
        
        if ($lastInvoice) {
            $lastNumber = (int) substr($lastInvoice->invoice_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Display a listing of invoices.
     */
    public function index(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $query = Invoice::where('company_id', $companyId)
                ->with(['customer', 'lead', 'createdBy', 'items', 'payments']);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            // Filter by customer
            if ($request->has('customer_id')) {
                $query->where('customer_id', $request->input('customer_id'));
            }

            // Search
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                      ->orWhereHas('customer', function($q) use ($search) {
                          $q->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                      });
                });
            }

            $query->orderBy('created_at', 'desc');

            $perPage = $request->input('per_page', 15);
            $invoices = $query->paginate($perPage);

            return response()->json($invoices);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch invoices: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created invoice.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'customer_id' => 'nullable|exists:customers,id',
                'lead_id' => 'nullable|exists:leads,id',
                'issue_date' => 'required|date',
                'due_date' => 'required|date|after_or_equal:issue_date',
                'currency' => 'nullable|in:USD,EUR,GBP,MAD,AED',
                'items' => 'required|array|min:1',
                'items.*.description' => 'required|string',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
                'items.*.discount_rate' => 'nullable|numeric|min:0|max:100',
                'notes' => 'nullable|string',
                'terms' => 'nullable|string',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }

            DB::beginTransaction();

            // Calculate totals
            $subtotal = 0;
            $taxAmount = 0;
            $discountAmount = 0;

            foreach ($validated['items'] as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscount = $lineSubtotal * ($item['discount_rate'] ?? 0) / 100;
                $lineAfterDiscount = $lineSubtotal - $lineDiscount;
                $lineTax = $lineAfterDiscount * ($item['tax_rate'] ?? 0) / 100;
                
                $subtotal += $lineSubtotal;
                $discountAmount += $lineDiscount;
                $taxAmount += $lineTax;
            }

            $totalAmount = $subtotal - $discountAmount + $taxAmount;

            // Create invoice
            $invoice = Invoice::create([
                'company_id' => $companyId,
                'invoice_number' => $this->generateInvoiceNumber($companyId),
                'customer_id' => $validated['customer_id'] ?? null,
                'lead_id' => $validated['lead_id'] ?? null,
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'currency' => $validated['currency'] ?? 'USD',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
                'balance' => $totalAmount,
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
                'created_by' => auth()->id(),
                'status' => 'draft',
            ]);

            // Create invoice items
            foreach ($validated['items'] as $index => $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscount = $lineSubtotal * ($item['discount_rate'] ?? 0) / 100;
                $lineAfterDiscount = $lineSubtotal - $lineDiscount;
                $lineTax = $lineAfterDiscount * ($item['tax_rate'] ?? 0) / 100;
                $lineTotal = $lineAfterDiscount + $lineTax;

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'discount_rate' => $item['discount_rate'] ?? 0,
                    'line_total' => $lineTotal,
                    'position' => $index,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Invoice created successfully',
                'invoice' => $invoice->load(['customer', 'lead', 'items', 'createdBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Invoice creation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([
                'error' => 'Failed to create invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified invoice.
     */
    public function show($id)
    {
        try {
            $invoice = Invoice::with([
                'customer',
                'lead',
                'items',
                'payments.receivedBy',
                'createdBy'
            ])->findOrFail($id);
            
            return response()->json($invoice);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invoice not found'], 404);
        }
    }

    /**
     * Update the specified invoice.
     */
    public function update(Request $request, $id)
    {
        try {
            $invoice = Invoice::findOrFail($id);

            $validated = $request->validate([
                'status' => 'sometimes|in:draft,sent,paid,overdue,cancelled',
                'notes' => 'nullable|string',
                'terms' => 'nullable|string',
            ]);

            // Update status
            if (isset($validated['status'])) {
                if ($validated['status'] === 'sent' && $invoice->status !== 'sent') {
                    $validated['sent_at'] = now();
                }
                if ($validated['status'] === 'paid' && $invoice->status !== 'paid') {
                    $validated['paid_at'] = now();
                }
            }

            $invoice->update($validated);

            return response()->json([
                'message' => 'Invoice updated successfully',
                'invoice' => $invoice->load(['customer', 'items', 'payments'])
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update invoice'], 500);
        }
    }

    /**
     * Remove the specified invoice.
     */
    public function destroy($id)
    {
        try {
            $invoice = Invoice::findOrFail($id);
            $invoice->delete(); // Will cascade delete items

            return response()->json(['message' => 'Invoice deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete invoice'], 500);
        }
    }

    /**
     * Generate PDF for invoice.
     */
    public function generatePdf($id)
    {
        try {
            $invoice = Invoice::with(['customer', 'items', 'payments', 'company'])->findOrFail($id);
            
            $pdf = Pdf::loadView('invoices.pdf', compact('invoice'));
            
            return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
        } catch (\Exception $e) {
            \Log::error('PDF Generation Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF'], 500);
        }
    }
}


