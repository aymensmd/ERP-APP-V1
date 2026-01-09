<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    /**
     * Boot the trait.
     */
    protected static function bootAuditable()
    {
        static::created(function ($model) {
            static::createAuditLog($model, 'created');
        });

        static::updated(function ($model) {
            static::createAuditLog($model, 'updated');
        });

        static::deleted(function ($model) {
            static::createAuditLog($model, 'deleted');
        });
    }

    /**
     * Create an audit log entry.
     */
    protected static function createAuditLog($model, $action)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return; // Skip if no company context
            }

            $user = Auth::user();
            $oldValues = null;
            $newValues = null;
            $changes = null;

            if ($action === 'updated' && $model->isDirty()) {
                $oldValues = $model->getOriginal();
                $newValues = $model->getDirty();
                
                // Calculate changes (only changed fields)
                $changes = [];
                foreach ($newValues as $key => $newValue) {
                    $changes[$key] = [
                        'old' => $oldValues[$key] ?? null,
                        'new' => $newValue
                    ];
                }
            } elseif ($action === 'created') {
                $newValues = $model->getAttributes();
            } elseif ($action === 'deleted') {
                $oldValues = $model->getAttributes();
            }

            AuditLog::create([
                'company_id' => $companyId,
                'user_id' => $user?->id,
                'model_type' => get_class($model),
                'model_id' => $model->id,
                'action' => $action,
                'old_values' => $oldValues ? json_encode($oldValues) : null,
                'new_values' => $newValues ? json_encode($newValues) : null,
                'changes' => $changes ? json_encode($changes) : null,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'url' => request()->fullUrl(),
                'method' => request()->method(),
            ]);
        } catch (\Exception $e) {
            // Log error but don't break the application
            \Log::error('Failed to create audit log: ' . $e->getMessage());
        }
    }

    /**
     * Get audit logs for this model.
     */
    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'model', 'model_type', 'model_id');
    }
}




