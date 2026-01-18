<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        body { font-family: sans-serif; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 16px; line-height: 24px; color: #555; }
        .invoice-box table { width: 100%; line-height: inherit; text-align: left; }
        .invoice-box table td { padding: 5px; vertical-align: top; }
        .invoice-box table tr td:nth-child(2) { text-align: right; }
        .top table td.title { font-size: 45px; line-height: 45px; color: #333; }
        .information table td { padding-bottom: 40px; }
        .heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
        .item td { border-bottom: 1px solid #eee; }
        .item.last td { border-bottom: none; }
        .total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
    </style>
</head>
<body>
    <div class="invoice-box">
        <table cellpadding="0" cellspacing="0">
            <tr class="top">
                <td colspan="2">
                    <table>
                        <tr>
                            <td class="title">
                                {{ $invoice->company->name ?? 'Company Name' }}
                            </td>
                            <td>
                                Invoice #: {{ $invoice->invoice_number }}<br>
                                Created: {{ $invoice->issue_date->format('M d, Y') }}<br>
                                Due: {{ $invoice->due_date->format('M d, Y') }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr class="information">
                <td colspan="2">
                    <table>
                        <tr>
                            <td>
                                {{ $invoice->company->address ?? 'Address' }}<br>
                                {{ $invoice->company->city ?? 'City' }}
                            </td>
                            <td>
                                {{ $invoice->customer->first_name ?? '' }} {{ $invoice->customer->last_name ?? '' }}<br>
                                {{ $invoice->customer->email ?? '' }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr class="heading">
                <td>Item</td>
                <td>Price</td>
            </tr>
            @foreach($invoice->items as $item)
            <tr class="item">
                <td>{{ $item->description }} (x{{ $item->quantity }})</td>
                <td>{{ $invoice->currency }} {{ number_format($item->line_total, 2) }}</td>
            </tr>
            @endforeach
            <tr class="total">
                <td></td>
                <td>Total: {{ $invoice->currency }} {{ number_format($invoice->total_amount, 2) }}</td>
            </tr>
        </table>
    </div>
</body>
</html>