<?php

namespace App\Policies;

use Illuminate\Auth\Access\HandlesAuthorization;
use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any invoices.
     */
    public function viewAny(User $user)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        return $user->hasPermissionInCompany('invoices.view', $companyId) || 
               $user->isAdminInCompany($companyId);
    }

    /**
     * Determine whether the user can view the invoice.
     */
    public function view(User $user, Invoice $invoice)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        // Must be same company
        if ($invoice->company_id !== $companyId) {
            return false;
        }

        if ($user->isAdminInCompany($companyId)) {
            return true;
        }

        $scope = $user->getPermissionScope('invoices.view', $companyId);

        return match($scope) {
            'company' => true,
            'department' => $this->isInSameDepartment($user, $invoice),
            'self' => $invoice->created_by === $user->id,
            default => false,
        };
    }

    /**
     * Determine whether the user can create invoices.
     */
    public function create(User $user)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        return $user->hasPermissionInCompany('invoices.create', $companyId) || 
               $user->isAdminInCompany($companyId);
    }

    /**
     * Determine whether the user can update the invoice.
     */
    public function update(User $user, Invoice $invoice)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($invoice->company_id !== $companyId) {
            return false;
        }

        if ($user->isAdminInCompany($companyId)) {
            return true;
        }

        $scope = $user->getPermissionScope('invoices.update', $companyId);

        return match($scope) {
            'company' => true,
            'department' => $this->isInSameDepartment($user, $invoice),
            'self' => $invoice->created_by === $user->id,
            default => false,
        };
    }

    /**
     * Determine whether the user can delete the invoice.
     */
    public function delete(User $user, Invoice $invoice)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($invoice->company_id !== $companyId) {
            return false;
        }

        return $user->hasPermissionInCompany('invoices.delete', $companyId) || 
               $user->isAdminInCompany($companyId);
    }

    /**
     * Check if invoice creator is in same department as user.
     */
    private function isInSameDepartment(User $user, Invoice $invoice): bool
    {
        if (!$invoice->created_by) {
            return false;
        }

        $creator = User::find($invoice->created_by);
        return $creator && $creator->department_id === $user->department_id;
    }
}
